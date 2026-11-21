"""Property tests for Card_Status, completed_at, and the assignee rule (V6)."""
from datetime import datetime, timezone

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from sqlalchemy import select

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
STATUSES = ("NOT_STARTED", "IN_PROGRESS", "DONE")


def patch(client, headers, card_id, body):
    return client.patch(f"/api/cards/{card_id}", json=body, headers=headers)


def row(fetch, card_id):
    from app.blueprints.cards.schema import Card

    return fetch(Card, card_id)


@pytest.fixture
def notes(app):
    """`notes(user)` returns that user's notification rows (including soft-deleted ones)."""
    from app.blueprints.notifications.schema import Notification
    from app.extensions import db

    def fetch(user):
        with app.app_context():
            rows = db.session.execute(
                select(Notification).where(Notification.recipient_id == user.user_id)
            ).scalars().all()
            db.session.expunge_all()
            return rows

    return fetch


# --- property tests ---------------------------------------------------------------------------------------


# Feature: kano, Property 44: Status and completed_at transition rule (stateful PATCH sequences)
@DB_SETTINGS
@given(
    st.lists(
        st.one_of(st.none(), st.sampled_from(STATUSES)),
        min_size=1,
        max_size=12,
    )
)
def test_patch_sequences_follow_the_transition_rule(
    client, reset_database, make_board, make_column, make_card, auth_header, fetch, sequence
):
    reset_database()
    board = make_board()
    card = make_card(make_column(board))
    headers = auth_header(board.owner)
    status, completed_at = "NOT_STARTED", None
    for supplied in sequence:
        body = {"title": "x"} if supplied is None else {"status": supplied}
        data = assert_envelope(patch(client, headers, card.card_id, body), 200)
        stored = row(fetch, card.card_id)
        if supplied is None or supplied == status:
            expected = (status, completed_at)
        elif supplied == "DONE":
            assert stored.completed_at is not None and stored.completed_at != completed_at
            expected = ("DONE", stored.completed_at)
        else:
            expected = (supplied, None)
        status, completed_at = expected
        assert (stored.status, stored.completed_at) == expected
        assert (data["status"], data["completed_at"] is None) == (status, completed_at is None)
        assert (stored.completed_at is not None) == (stored.status == "DONE")


_done_spellings = st.tuples(*[st.booleans()] * 4).map(
    lambda flags: "".join(c.upper() if up else c for c, up in zip("done", flags))
)
_case_variants = st.text(alphabet="doneDONE_ INPROGRESStarted", max_size=14)
_status_values = st.one_of(st.none(), st.integers(), _case_variants, st.sampled_from(STATUSES))


# Feature: kano, Property 45: Status validation and position independence
@DB_SETTINGS
@given(_status_values)
def test_status_is_accepted_iff_it_is_exactly_one_of_the_three(
    client, reset_database, make_board, make_column, make_card, auth_header, fetch, value
):
    reset_database()
    board = make_board()
    card = make_card(make_column(board), title="Stable")
    expected = 200 if value in STATUSES else 400
    response = patch(client, auth_header(board.owner), card.card_id, {"title": "Changed", "status": value})
    assert_envelope(response, expected)
    stored = row(fetch, card.card_id)
    if expected == 400:
        assert (stored.title, stored.status, stored.completed_at) == ("Stable", "NOT_STARTED", None)
    else:
        assert (stored.title, stored.status) == ("Changed", value)

    created = client.post(
        f"/api/columns/{card.column_id}/cards",
        json={"title": "T", "status": value},
        headers=auth_header(board.owner),
    )
    assert_envelope(created, 400)  # status is never accepted on create, valid or not


@DB_SETTINGS
@given(
    st.sampled_from(STATUSES),
    _done_spellings,
)
def test_position_changes_never_touch_status_or_completed_at(
    client, reset_database, make_board, make_column, make_card, auth_header, fetch, status, column_name
):
    reset_database()
    board = make_board()
    source, target = make_column(board), make_column(board, column_name)
    stamp = datetime(2026, 3, 2, 10, 0, tzinfo=timezone.utc) if status == "DONE" else None
    card = make_card(source, status=status, completed_at=stamp)
    body = {"column_id": str(target.column_id), "order": 3.25}
    data = assert_envelope(
        client.patch(f"/api/cards/{card.card_id}/position", json=body, headers=auth_header(board.owner)), 200
    )
    stored = row(fetch, card.card_id)
    assert (stored.status, stored.completed_at, stored.column_id) == (status, stamp, target.column_id)
    assert data["status"] == status


_ROLES = st.sampled_from(["admin", "member", "guest", "removed", "outsider"])


# Feature: kano, Property 48: Assignee must be admin or member, guests are never notified
@DB_SETTINGS
@given(_ROLES, st.booleans())
def test_assignee_is_accepted_iff_admin_or_member_and_guests_get_no_notification(
    client, reset_database, make_board, make_member, make_column, make_card, make_user,
    auth_header, notes, role, on_update,
):
    reset_database()
    board = make_board()
    column = make_column(board)
    other = make_user()
    if role in ("member", "guest", "removed"):
        make_member(board, other, role="member" if role == "removed" else role)
    if role == "removed":
        assert_envelope(
            client.delete(f"/api/boards/{board.board_id}/members/{other.user_id}", headers=auth_header(board.owner)), 200
        )
    candidate = board.owner if role == "admin" else other
    allowed = role in ("admin", "member")
    headers = auth_header(board.owner)
    if on_update:
        card = make_card(column)
        response = patch(client, headers, card.card_id, {"assignee_id": str(candidate.user_id)})
        assert_envelope(response, 200 if allowed else 400)
    else:
        response = client.post(
            f"/api/columns/{column.column_id}/cards",
            json={"title": "T", "assignee_id": str(candidate.user_id)},
            headers=headers,
        )
        assert_envelope(response, 201 if allowed else 400)
    if role in ("guest", "removed", "outsider"):
        assert notes(other) == []


# Feature: kano, Property 17: Partial update (card part: a status change also moves completed_at)
@DB_SETTINGS
@given(
    st.one_of(st.none(), st.text(alphabet="abcdef", min_size=1, max_size=30)),
    st.one_of(st.none(), st.sampled_from(STATUSES)),
)
def test_partial_update_changes_only_supplied_fields_plus_completed_at(
    client, reset_database, make_board, make_column, make_card, auth_header, fetch, title, status
):
    reset_database()
    board = make_board()
    card = make_card(make_column(board), title="Original", description="Kept", labels=["a"])
    body = {k: v for k, v in (("title", title), ("status", status)) if v is not None}
    if not body:
        body = {"description": "Kept"}
    assert_envelope(patch(client, auth_header(board.owner), card.card_id, body), 200)
    stored = row(fetch, card.card_id)
    assert stored.title == (title if title is not None else "Original")
    assert stored.status == (status if status is not None else "NOT_STARTED")
    assert (stored.description, stored.labels, stored.assignee_id) == ("Kept", ["a"], None)
    assert (stored.completed_at is not None) == (stored.status == "DONE")
