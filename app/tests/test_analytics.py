"""pytest tests for GET /api/boards/<id>/analytics (V6: status and completed_at, no guests)."""
import uuid
from datetime import timedelta

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def url(board):
    return f"/api/boards/{board.board_id}/analytics"


def week_start():
    from app.soft_delete import start_of_week_utc, utcnow

    return start_of_week_utc(utcnow())


@pytest.fixture
def setup(make_board, make_member):
    board = make_board()
    return board, board.owner, make_member(board).member


def by_column(data):
    return {c["name"]: c["count"] for c in data["cards_per_column"]}


def activity(data):
    return {m["user_id"]: (m["assigned_cards"], m["comments"]) for m in data["member_activity"]}


def completed(client, board, admin, auth_header):
    return assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)["completed_this_week"]


def test_shape_counts_per_column_in_order_with_empty_columns(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    todo, doing, done = make_column(board, "To Do"), make_column(board, "Doing"), make_column(board, "Done")
    make_card(todo), make_card(todo), make_card(done)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert set(data) == {"cards_per_column", "completed_this_week", "member_activity"}
    assert data["cards_per_column"] == [
        {"column_id": str(todo.column_id), "name": "To Do", "count": 2},
        {"column_id": str(doing.column_id), "name": "Doing", "count": 0},
        {"column_id": str(done.column_id), "name": "Done", "count": 1},
    ]


def test_cards_per_column_count_every_status(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    column = make_column(board, "Work")
    for status in ("NOT_STARTED", "IN_PROGRESS", "DONE"):
        make_card(column, status=status)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert by_column(data) == {"Work": 3}


def test_board_without_columns_or_cards_has_empty_and_zero_values(client, setup, auth_header):
    board, admin, member = setup
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["cards_per_column"] == [] and data["completed_this_week"] == 0
    assert activity(data) == {str(admin.user_id): (0, 0), str(member.user_id): (0, 0)}


def test_no_done_card_gives_zero_even_with_a_done_column(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    done = make_column(board, "Done")
    make_card(done), make_card(done, status="IN_PROGRESS")
    assert completed(client, board, admin, auth_header) == 0


def test_week_boundary_monday_included_earlier_and_future_excluded(client, setup, make_column, make_card, auth_header):
    from app.soft_delete import utcnow

    board, admin, _member = setup
    column = make_column(board, "Work")
    start = week_start()
    make_card(column, status="DONE", completed_at=start)  # included: exactly Monday 00:00:00 UTC
    make_card(column, status="DONE", completed_at=start + timedelta(seconds=1))
    make_card(column, status="DONE", completed_at=start - timedelta(seconds=1))  # one second earlier
    make_card(column, status="DONE", completed_at=start - timedelta(days=3))
    make_card(column, status="DONE", completed_at=utcnow() + timedelta(hours=1))  # future
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["completed_this_week"] == 2
    assert by_column(data)["Work"] == 5


def test_done_card_counts_in_any_column_name(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    for name in ("Backlog", "Finished", "To Do"):
        make_card(make_column(board, name), status="DONE", completed_at=week_start())
    assert completed(client, board, admin, auth_header) == 3


@pytest.mark.parametrize("name", ["Done", "done", "DONE"])
def test_card_in_a_column_named_done_with_another_status_is_not_counted(
    client, setup, make_column, make_card, auth_header, name
):
    board, admin, _member = setup
    column = make_column(board, name)
    make_card(column, status="NOT_STARTED"), make_card(column, status="IN_PROGRESS")
    assert completed(client, board, admin, auth_header) == 0


def test_soft_deleted_done_cards_are_not_counted(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    column = make_column(board, "Work")
    make_card(column, status="DONE", completed_at=week_start())
    gone = make_card(column, status="DONE", completed_at=week_start())
    assert_envelope(client.delete(f"/api/cards/{gone.card_id}", headers=auth_header(admin)), 200)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["completed_this_week"] == 1 and by_column(data) == {"Work": 1}


def test_cards_of_a_deleted_column_are_not_counted(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    column = make_column(board, "Gone")
    make_card(column, status="DONE", completed_at=week_start())
    assert_envelope(client.delete(f"/api/columns/{column.column_id}", headers=auth_header(admin)), 200)
    assert completed(client, board, admin, auth_header) == 0


def test_marking_a_card_done_through_the_api_counts_it(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    card = make_card(make_column(board, "To Do"))
    assert_envelope(client.patch(f"/api/cards/{card.card_id}", json={"status": "DONE"}, headers=auth_header(admin)), 200)
    assert completed(client, board, admin, auth_header) == 1


def test_member_activity_counts_assignments_and_comments_with_zeros(
    client, setup, make_member, make_column, make_card, make_comment, auth_header
):
    board, admin, member = setup
    idle = make_member(board).member
    column = make_column(board)
    first, second = make_card(column, assignee=member), make_card(column, assignee=member)
    make_card(column, assignee=admin)
    make_comment(first, member), make_comment(first, member), make_comment(second, admin)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert activity(data) == {
        str(admin.user_id): (1, 1), str(member.user_id): (2, 2), str(idle.user_id): (0, 0),
    }
    assert [m["user_id"] for m in data["member_activity"]] == [str(u.user_id) for u in (admin, member, idle)]
    assert data["member_activity"][1]["name"] == member.name


def test_guests_are_excluded_from_member_activity(
    client, setup, make_member, make_column, make_card, make_comment, auth_header
):
    board, admin, member = setup
    guest = make_member(board, role="guest").member
    column = make_column(board)
    card = make_card(column, assignee=guest)  # seeded directly: the API never allows a guest assignee
    make_comment(card, guest)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert set(activity(data)) == {str(admin.user_id), str(member.user_id)}
    assert by_column(data)[column.name] == 1  # the Card itself still counts


def test_soft_deleted_rows_are_excluded_everywhere(
    client, setup, make_column, make_card, make_comment, make_member, auth_header
):
    board, admin, member = setup
    removed = make_member(board).member
    gone_column, column = make_column(board, "Gone"), make_column(board, "Work")
    make_card(gone_column, assignee=member)
    card = make_card(column, assignee=member)
    deleted_card = make_card(column, assignee=member)
    make_comment(card, member)
    dead_comment = make_comment(card, member)
    make_comment(deleted_card, member)
    headers = auth_header(admin)
    assert_envelope(client.delete(f"/api/columns/{gone_column.column_id}", headers=headers), 200)
    assert_envelope(client.delete(f"/api/cards/{deleted_card.card_id}", headers=headers), 200)
    assert_envelope(client.delete(f"/api/comments/{dead_comment.comment_id}", headers=auth_header(member)), 200)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}/members/{removed.user_id}", headers=headers), 200)
    data = assert_envelope(client.get(url(board), headers=headers), 200)
    assert by_column(data) == {"Work": 1}
    assert activity(data) == {str(admin.user_id): (0, 0), str(member.user_id): (1, 1)}


def test_member_guest_and_non_participant_are_403_without_data(
    client, setup, make_member, make_user, auth_header
):
    board, _admin, member = setup
    guest = make_member(board, role="guest").member
    for user in (member, guest, make_user()):
        message = assert_envelope(client.get(url(board), headers=auth_header(user)), 403)
        assert board.name not in message


def test_missing_deleted_or_malformed_board_is_404_and_unauthenticated_401(client, setup, auth_header):
    board, admin, _member = setup
    headers = auth_header(admin)
    assert_envelope(client.get(f"/api/boards/{uuid.uuid4()}/analytics", headers=headers), 404)
    assert_envelope(client.get("/api/boards/nope/analytics", headers=headers), 404)
    assert_envelope(client.get(url(board)), 401)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=headers), 200)
    assert_envelope(client.get(url(board), headers=headers), 404)


# Feature: kano, Property 46: Analytics equals a naive model (roles admin, manager, member)
_card = st.fixed_dictionaries(
    {
        "assignee": st.sampled_from([None, 0, 1, 2, 3]),  # index 2 is a manager, 3 a guest
        "status": st.sampled_from(["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"]),
        "completed": st.sampled_from([None, "start-1s", "start", "now", "future", "old"]),
        "deleted": st.booleans(),
        "comments": st.lists(st.tuples(st.sampled_from([0, 1, 2, 3]), st.booleans()), max_size=3),
    }
)
_column = st.fixed_dictionaries(
    {
        "name": st.sampled_from(["Done", "done", "DONE", "Todo", "Doing"]),
        "deleted": st.booleans(),
        "cards": st.lists(_card, max_size=4),
    }
)


@settings(max_examples=60, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(columns=st.lists(_column, max_size=4))
def test_property_analytics_equals_a_naive_model(
    client, make_board, make_member, make_column, make_card, make_comment, persist, auth_header,
    reset_database, columns,
):
    from app.soft_delete import utcnow

    reset_database()
    board = make_board()
    users = [
        board.owner, make_member(board).member, make_member(board, role="manager").member,
        make_member(board, role="guest").member,
    ]
    now, start = utcnow(), week_start()
    offsets = {
        None: None, "start-1s": start - timedelta(seconds=1), "start": start,
        "now": now, "future": now + timedelta(hours=1), "old": start - timedelta(days=3),
    }
    expected_cards, expected_done = {}, 0
    expected_activity = {u.user_id: [0, 0] for u in users[:3]}  # guests are not listed
    for spec in columns:
        column = make_column(board, spec["name"])
        if spec["deleted"]:
            column.is_deleted, column.deleted_at = True, now
            persist(column)
        live_cards = 0
        for card_spec in spec["cards"]:
            assignee = None if card_spec["assignee"] is None else users[card_spec["assignee"]]
            completed_at = offsets[card_spec["completed"]]
            card = make_card(column, assignee=assignee, status=card_spec["status"], completed_at=completed_at)
            card_gone = card_spec["deleted"] or spec["deleted"]  # a Column delete cascades
            if card_gone:
                card.is_deleted, card.deleted_at = True, now
                persist(card)
            for author_index, comment_deleted in card_spec["comments"]:
                comment = make_comment(card, users[author_index])
                if comment_deleted or card_gone:
                    comment.is_deleted, comment.deleted_at = True, now
                    persist(comment)
            if card_gone:
                continue
            live_cards += 1
            if card_spec["status"] == "DONE" and completed_at is not None and start <= completed_at <= now:
                expected_done += 1
            if assignee is not None and assignee in users[:3]:
                expected_activity[assignee.user_id][0] += 1
            for author_index, comment_deleted in card_spec["comments"]:
                if not comment_deleted and author_index < 3:
                    expected_activity[users[author_index].user_id][1] += 1
        if not spec["deleted"]:
            expected_cards[column.column_id] = live_cards
    data = assert_envelope(client.get(url(board), headers=auth_header(board.owner)), 200)
    assert {uuid.UUID(c["column_id"]): c["count"] for c in data["cards_per_column"]} == expected_cards
    assert data["completed_this_week"] == expected_done
    assert {uuid.UUID(k): list(v) for k, v in activity(data).items()} == expected_activity
