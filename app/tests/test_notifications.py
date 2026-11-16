"""pytest tests for notifications: pure recipient rules, pagination, and mark-read."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
LIST_URL = "/api/notifications"
BASE_TIME = datetime(2025, 1, 1, tzinfo=timezone.utc)

_ids = st.sampled_from([uuid.UUID(int=n) for n in range(1, 5)])


# --- pure rules (no database) -----------------------------------------------------------------------


@pytest.mark.unit
def test_comment_recipients_examples():
    from app.blueprints.notifications.service import comment_recipients

    author, assignee, admin = (uuid.uuid4() for _ in range(3))
    assert comment_recipients(author, assignee, admin) == [assignee, admin]
    assert comment_recipients(author, assignee, assignee) == [assignee]
    assert comment_recipients(assignee, assignee, admin) == [admin]
    assert comment_recipients(admin, assignee, admin) == [assignee]
    assert comment_recipients(author, None, admin) == [admin]
    assert comment_recipients(author, None, None) == []
    assert comment_recipients(author, author, author) == []


# Feature: kano, Property 21: Notification recipients (pure part)
@pytest.mark.unit
@settings(max_examples=200, deadline=None)
@given(author=_ids, assignee=st.none() | _ids, admin=st.none() | _ids)
def test_property_comment_recipients(author, assignee, admin):
    from app.blueprints.notifications.service import comment_recipients

    result = comment_recipients(author, assignee, admin)
    assert len(result) == len(set(result))
    assert author not in result and None not in result
    assert set(result) == ({assignee, admin} - {author, None})


@pytest.mark.unit
@pytest.mark.parametrize("title", ["short", "x" * 200, "y" * 5000, "é" * 300, ""])
def test_messages_fit_255_characters_and_keep_the_title(title):
    from app.blueprints.notifications.service import assignment_message, comment_message

    assigned = assignment_message(title)
    commented = comment_message("N" * 100, title)
    assert len(assigned) <= 255 and len(commented) <= 255
    assert assigned.startswith("Assigned to you:")
    if len(title) <= 100:
        assert title in assigned and title in commented


@pytest.mark.unit
def test_shorten_marks_the_cut():
    from app.blueprints.notifications.service import shorten

    assert shorten("abc", 10) == "abc"
    assert shorten("a" * 20, 10) == "a" * 7 + "..."
    assert len(shorten("a" * 20, 2)) == 2


# --- list and pagination ----------------------------------------------------------------------------


def seed(make_notification, recipient, card, count, **kwargs):
    """`count` notifications, oldest first, one minute apart."""
    return [
        make_notification(recipient, card, created_at=BASE_TIME + timedelta(minutes=i), **kwargs)
        for i in range(count)
    ]


@pytest.fixture
def card_for(make_board, make_column, make_card):
    def build(owner=None):
        board = make_board(owner)
        return board, make_card(make_column(board))

    return build


@pytest.mark.e2e
def test_list_defaults_shape_and_newest_first(client, make_user, card_for, make_notification, auth_header):
    user = make_user()
    _board, card = card_for(user)
    rows = seed(make_notification, user, card, 3)
    rows[0].is_read = True
    data = assert_envelope(client.get(LIST_URL, headers=auth_header(user)), 200)
    assert set(data) == {"items", "page", "per_page", "total", "unread_count"}
    assert (data["page"], data["per_page"], data["total"]) == (1, 20, 3)
    assert [n["notification_id"] for n in data["items"]] == [str(n.notification_id) for n in reversed(rows)]
    assert set(data["items"][0]) == {
        "notification_id", "type", "message", "card_id", "board_id", "is_read", "created_at",
    }
    assert data["items"][0]["created_at"].endswith("Z")


@pytest.mark.e2e
def test_list_returns_only_own_active_notifications(
    client, make_user, card_for, make_notification, auth_header, persist, fetch
):
    from app.blueprints.notifications.schema import Notification

    me, other = make_user(), make_user()
    _board, card = card_for(me)
    mine = make_notification(me, card)
    make_notification(other, card)
    gone = make_notification(me, card)
    gone.is_deleted = True
    gone.deleted_at = BASE_TIME
    persist(gone)
    unread = make_notification(me, card, is_read=True)
    data = assert_envelope(client.get(LIST_URL, headers=auth_header(me)), 200)
    assert {n["notification_id"] for n in data["items"]} == {str(mine.notification_id), str(unread.notification_id)}
    assert (data["total"], data["unread_count"]) == (2, 1)
    assert fetch(Notification, gone.notification_id) is not None


@pytest.mark.e2e
def test_pagination_pages_and_ties(client, make_user, card_for, make_notification, auth_header):
    user = make_user()
    _board, card = card_for(user)
    rows = seed(make_notification, user, card, 5)
    newest_first = [str(n.notification_id) for n in reversed(rows)]
    headers = auth_header(user)
    pages = [
        assert_envelope(client.get(f"{LIST_URL}?page={p}&per_page=2", headers=headers), 200) for p in (1, 2, 3, 4)
    ]
    assert [[n["notification_id"] for n in page["items"]] for page in pages] == [
        newest_first[0:2], newest_first[2:4], newest_first[4:5], [],
    ]
    assert {(p["total"], p["unread_count"], p["per_page"]) for p in pages} == {(5, 5, 2)}
    assert [p["page"] for p in pages] == [1, 2, 3, 4]


@pytest.mark.e2e
def test_same_timestamp_is_ordered_by_id_descending(client, make_user, card_for, make_notification, auth_header):
    user = make_user()
    _board, card = card_for(user)
    rows = [make_notification(user, card, created_at=BASE_TIME) for _ in range(4)]
    data = assert_envelope(client.get(LIST_URL, headers=auth_header(user)), 200)
    ids = [n["notification_id"] for n in data["items"]]
    assert ids == sorted((str(n.notification_id) for n in rows), reverse=True)


@pytest.mark.e2e
@pytest.mark.parametrize(
    "query",
    [
        "page=0", "page=-1", "page=abc", "page=1.5", "page=", "page=2147483648", "page=+1", "page=1_0",
        "per_page=0", "per_page=101", "per_page=x", "per_page=2147483648", "per_page=", "other=1",
    ],
)
def test_invalid_pagination_is_400(client, make_user, card_for, make_notification, auth_header, query):
    user = make_user()
    _board, card = card_for(user)
    make_notification(user, card)
    assert_envelope(client.get(f"{LIST_URL}?{query}", headers=auth_header(user)), 400)


@pytest.mark.e2e
@pytest.mark.parametrize("query", ["page=1&per_page=100", "page=2147483647&per_page=1", "per_page=1"])
def test_pagination_boundaries_are_accepted(client, make_user, auth_header, query):
    data = assert_envelope(client.get(f"{LIST_URL}?{query}", headers=auth_header(make_user())), 200)
    assert data["items"] == [] and data["total"] == 0 and data["unread_count"] == 0


@pytest.mark.e2e
def test_list_and_mark_read_require_authentication(client):
    assert_envelope(client.get(LIST_URL), 401)
    assert_envelope(client.patch(f"{LIST_URL}/{uuid.uuid4()}/read"), 401)


# Feature: kano, Property 22: Notification pagination
@pytest.mark.e2e
@DB_SETTINGS
@given(total=st.integers(0, 12), page=st.integers(1, 6), per_page=st.integers(1, 6))
def test_property_pagination_slices_the_newest_first_sequence(
    client, make_user, card_for, make_notification, auth_header, reset_database, total, page, per_page
):
    reset_database()
    user = make_user()
    _board, card = card_for(user)
    rows = seed(make_notification, user, card, total)
    expected = [str(n.notification_id) for n in reversed(rows)][(page - 1) * per_page : page * per_page]
    url = f"{LIST_URL}?page={page}&per_page={per_page}"
    data = assert_envelope(client.get(url, headers=auth_header(user)), 200)
    assert [n["notification_id"] for n in data["items"]] == expected
    assert (data["total"], data["unread_count"], data["page"], data["per_page"]) == (total, total, page, per_page)


# --- mark read -------------------------------------------------------------------------------------------


@pytest.mark.e2e
def test_mark_read_sets_flag_and_is_idempotent(client, make_user, card_for, make_notification, auth_header, fetch):
    from app.blueprints.notifications.schema import Notification

    user = make_user()
    _board, card = card_for(user)
    notification = make_notification(user, card)
    url = f"{LIST_URL}/{notification.notification_id}/read"
    for _ in range(3):
        data = assert_envelope(client.patch(url, headers=auth_header(user)), 200)
        assert data["is_read"] is True and data["notification_id"] == str(notification.notification_id)
    assert fetch(Notification, notification.notification_id).is_read is True
    listing = assert_envelope(client.get(LIST_URL, headers=auth_header(user)), 200)
    assert listing["unread_count"] == 0 and listing["total"] == 1


@pytest.mark.e2e
def test_mark_read_by_another_user_is_403_and_unchanged(
    client, make_user, card_for, make_notification, auth_header, fetch
):
    from app.blueprints.notifications.schema import Notification

    owner, other = make_user(), make_user()
    _board, card = card_for(owner)
    notification = make_notification(owner, card)
    response = client.patch(f"{LIST_URL}/{notification.notification_id}/read", headers=auth_header(other))
    message = assert_envelope(response, 403)
    assert card.title not in message
    assert fetch(Notification, notification.notification_id).is_read is False


@pytest.mark.e2e
def test_mark_read_missing_deleted_or_malformed_is_404(
    client, make_user, card_for, make_notification, auth_header, persist
):
    user = make_user()
    _board, card = card_for(user)
    headers = auth_header(user)
    assert_envelope(client.patch(f"{LIST_URL}/{uuid.uuid4()}/read", headers=headers), 404)
    assert_envelope(client.patch(f"{LIST_URL}/not-a-uuid/read", headers=headers), 404)
    notification = make_notification(user, card)
    notification.is_deleted = True
    notification.deleted_at = BASE_TIME
    persist(notification)
    assert_envelope(client.patch(f"{LIST_URL}/{notification.notification_id}/read", headers=headers), 404)


# Feature: kano, Property 23: Mark-read idempotence
@pytest.mark.e2e
@DB_SETTINGS
@given(repeats=st.integers(1, 5), total=st.integers(1, 4))
def test_property_mark_read_is_idempotent_and_lowers_unread_once(
    client, make_user, card_for, make_notification, auth_header, reset_database, repeats, total
):
    reset_database()
    user = make_user()
    _board, card = card_for(user)
    rows = seed(make_notification, user, card, total)
    headers = auth_header(user)
    for _ in range(repeats):
        data = assert_envelope(client.patch(f"{LIST_URL}/{rows[0].notification_id}/read", headers=headers), 200)
        assert data["is_read"] is True
    listing = assert_envelope(client.get(LIST_URL, headers=headers), 200)
    assert (listing["total"], listing["unread_count"]) == (total, total - 1)
