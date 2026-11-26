"""pytest tests for Card_Status, completed_at, and the writer-only assignee rule (V11: four statuses).

Property tests are in test_card_status_properties.py."""
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

STATUSES = ("NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE")


@pytest.fixture
def setup(make_board, make_member, make_column):
    """A board with an admin, a member, and one column."""
    board = make_board()
    return board, board.owner, make_member(board).member, make_column(board)


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


# --- create ---------------------------------------------------------------------------------------


def test_created_card_is_not_started_with_null_completed_at(client, setup, auth_header, fetch):
    _board, admin, _member, column = setup
    response = client.post(
        f"/api/columns/{column.column_id}/cards", json={"title": "New"}, headers=auth_header(admin)
    )
    data = assert_envelope(response, 201)
    assert (data["status"], data["completed_at"]) == ("NOT_STARTED", None)
    stored = row(fetch, data["card_id"])
    assert (stored.status, stored.completed_at) == ("NOT_STARTED", None)


@pytest.mark.parametrize("status", ["DONE", "NOT_STARTED", "", None, "x"])
def test_status_in_the_create_body_is_400_naming_status_and_creates_no_card(
    client, setup, auth_header, count_rows, status
):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column = setup
    response = client.post(
        f"/api/columns/{column.column_id}/cards",
        json={"title": "New", "status": status},
        headers=auth_header(admin),
    )
    assert "status" in assert_envelope(response, 400)
    assert count_rows(Card) == 0


def test_completed_at_in_the_create_or_update_body_is_400(client, setup, make_card, auth_header):
    _board, admin, _member, column = setup
    card = make_card(column)
    body = {"completed_at": "2030-01-01T00:00:00Z"}
    assert "completed_at" in assert_envelope(patch(client, auth_header(admin), card.card_id, body), 400)
    response = client.post(
        f"/api/columns/{column.column_id}/cards", json={"title": "T", **body}, headers=auth_header(admin)
    )
    assert "completed_at" in assert_envelope(response, 400)


def test_cards_created_without_status_default_to_not_started(setup, make_card, fetch):
    _board, _admin, _member, column = setup
    card = make_card(column)  # the factory models a Card that existed before V6
    stored = row(fetch, card.card_id)
    assert (stored.status, stored.completed_at) == ("NOT_STARTED", None)


# --- PATCH validation -------------------------------------------------------------------------------


@pytest.mark.parametrize("value", ["done", "Done", "urgent", "Urgent", "in_progress", "", None, "UNKNOWN", " DONE", 5, ["DONE"]])
def test_invalid_status_on_patch_is_400_and_changes_nothing(
    client, setup, make_card, auth_header, fetch, value
):
    _board, admin, _member, column = setup
    card = make_card(column, title="Stable")
    body = {"title": "Changed", "status": value}
    assert "status" in assert_envelope(patch(client, auth_header(admin), card.card_id, body), 400)
    stored = row(fetch, card.card_id)
    assert (stored.title, stored.status, stored.completed_at) == ("Stable", "NOT_STARTED", None)


@pytest.mark.parametrize("status", STATUSES)
def test_each_valid_status_is_accepted(client, setup, make_card, auth_header, status):
    _board, admin, _member, column = setup
    card = make_card(column)
    data = assert_envelope(patch(client, auth_header(admin), card.card_id, {"status": status}), 200)
    assert data["status"] == status


# --- completed_at rules -----------------------------------------------------------------------------


def _parse(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def test_entering_done_sets_completed_at_and_leaving_clears_it(client, setup, make_card, auth_header, fetch):
    _board, admin, _member, column = setup
    card = make_card(column)
    headers = auth_header(admin)
    before = datetime.now(timezone.utc)
    done = assert_envelope(patch(client, headers, card.card_id, {"status": "DONE"}), 200)
    assert done["status"] == "DONE" and done["completed_at"].endswith("Z")
    assert before - timedelta(seconds=1) <= _parse(done["completed_at"]) <= datetime.now(timezone.utc)
    assert row(fetch, card.card_id).completed_at is not None
    undone = assert_envelope(patch(client, headers, card.card_id, {"status": "IN_PROGRESS"}), 200)
    assert (undone["status"], undone["completed_at"]) == ("IN_PROGRESS", None)
    assert row(fetch, card.card_id).completed_at is None


def test_done_to_done_and_omitted_status_keep_completed_at(client, setup, make_card, auth_header):
    _board, admin, _member, column = setup
    card = make_card(column)
    headers = auth_header(admin)
    first = assert_envelope(patch(client, headers, card.card_id, {"status": "DONE"}), 200)
    again = assert_envelope(patch(client, headers, card.card_id, {"status": "DONE"}), 200)
    other = assert_envelope(patch(client, headers, card.card_id, {"title": "Renamed"}), 200)
    assert again["completed_at"] == first["completed_at"] == other["completed_at"]
    assert other["status"] == "DONE" and other["title"] == "Renamed"


def test_not_started_and_in_progress_keep_null_completed_at(client, setup, make_card, auth_header):
    _board, admin, _member, column = setup
    card = make_card(column)
    for status in ("IN_PROGRESS", "URGENT", "NOT_STARTED", "IN_PROGRESS"):
        data = assert_envelope(patch(client, auth_header(admin), card.card_id, {"status": status}), 200)
        assert data["completed_at"] is None


def test_status_and_other_fields_change_in_one_update(client, setup, make_card, auth_header, fetch):
    _board, admin, _member, column = setup
    card = make_card(column, title="Old", description="keep")
    data = assert_envelope(
        patch(client, auth_header(admin), card.card_id, {"title": "New", "status": "DONE"}), 200
    )
    stored = row(fetch, card.card_id)
    assert (stored.title, stored.description, stored.status) == ("New", "keep", "DONE")
    assert data["completed_at"] is not None


# --- status in every Card representation ---------------------------------------------------------------


def test_status_and_completed_at_appear_in_detail_search_and_my_tasks(
    client, setup, make_card, auth_header
):
    board, admin, _member, column = setup
    card = make_card(column, title="Findme", assignee=admin)
    done = assert_envelope(patch(client, auth_header(admin), card.card_id, {"status": "DONE"}), 200)

    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(admin)), 200)
    [listed] = detail["columns"][0]["cards"]
    searched = assert_envelope(client.get("/api/cards?q=Findme", headers=auth_header(admin)), 200)
    mine = assert_envelope(client.get("/api/cards?assignee=me", headers=auth_header(admin)), 200)
    for payload in (listed, searched[0], mine[0]):
        assert (payload["status"], payload["completed_at"]) == ("DONE", done["completed_at"])


# --- position independence -----------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["Done", "done", "DONE", "dOnE"])
def test_moving_into_a_column_named_done_changes_neither_field(
    client, setup, make_card, make_column, auth_header, fetch, name
):
    board, admin, _member, column = setup
    done_column = make_column(board, name)
    for status in ("NOT_STARTED", "IN_PROGRESS", "DONE"):
        card = make_card(column, status=status, completed_at=datetime.now(timezone.utc) if status == "DONE" else None)
        before = row(fetch, card.card_id)
        body = {"column_id": str(done_column.column_id), "order": 7.5}
        assert_envelope(client.patch(f"/api/cards/{card.card_id}/position", json=body, headers=auth_header(admin)), 200)
        after = row(fetch, card.card_id)
        assert after.column_id == done_column.column_id
        assert (after.status, after.completed_at) == (before.status, before.completed_at)


# --- assignee must be admin or member ----------------------------------------------------------------------


def _world(make_board, make_member, make_column, make_user):
    board = make_board()
    column = make_column(board)
    return SimpleWorld(
        board=board, admin=board.owner, member=make_member(board).member,
        guest=make_member(board, role="guest").member, column=column, outsider=make_user(),
    )


class SimpleWorld:
    def __init__(self, **fields):
        self.__dict__.update(fields)


def test_guest_removed_member_and_outsider_cannot_be_assignees(
    client, make_board, make_member, make_column, make_user, make_card, auth_header, fetch, notes
):
    w = _world(make_board, make_member, make_column, make_user)
    removed = make_member(w.board).member
    assert_envelope(
        client.delete(f"/api/boards/{w.board.board_id}/members/{removed.user_id}", headers=auth_header(w.admin)), 200
    )
    card = make_card(w.column)
    for candidate in (w.guest, removed, w.outsider):
        body = {"title": "T", "assignee_id": str(candidate.user_id)}
        assert_envelope(client.post(f"/api/columns/{w.column.column_id}/cards", json=body, headers=auth_header(w.admin)), 400)
        assert_envelope(patch(client, auth_header(w.admin), card.card_id, {"assignee_id": str(candidate.user_id)}), 400)
    assert row(fetch, card.card_id).assignee_id is None
    for user in (w.guest, removed, w.outsider):
        assert notes(user) == []


def test_admin_and_member_can_be_assignees_and_guest_gets_no_notification(
    client, make_board, make_member, make_column, make_user, make_card, make_comment, auth_header, notes
):
    w = _world(make_board, make_member, make_column, make_user)
    card = make_card(w.column)
    assert_envelope(patch(client, auth_header(w.admin), card.card_id, {"assignee_id": str(w.member.user_id)}), 200)
    assert_envelope(patch(client, auth_header(w.member), card.card_id, {"assignee_id": str(w.admin.user_id)}), 200)
    body = {"content": "hello"}
    assert_envelope(client.post(f"/api/cards/{card.card_id}/comments", json=body, headers=auth_header(w.member)), 201)
    assert notes(w.guest) == []
    assert len(notes(w.member)) == 1 and len(notes(w.admin)) >= 1


# --- guests cannot write cards ---------------------------------------------------------------------------


def test_guest_cannot_change_status_or_assignee(client, setup, make_member, make_card, auth_header, fetch):
    board, _admin, member, column = setup
    guest = make_member(board, role="guest").member
    card = make_card(column)
    for body in ({"status": "DONE"}, {"assignee_id": str(member.user_id)}, {"title": "x"}):
        assert_envelope(patch(client, auth_header(guest), card.card_id, body), 403)
    stored = row(fetch, card.card_id)
    assert (stored.status, stored.completed_at, stored.assignee_id, stored.title) == (
        "NOT_STARTED", None, None, card.title,
    )
