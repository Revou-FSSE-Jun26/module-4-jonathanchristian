"""pytest tests for GET /api/boards/<id>/analytics."""
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


def test_board_without_columns_or_cards_has_empty_and_zero_values(client, setup, auth_header):
    board, admin, member = setup
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["cards_per_column"] == [] and data["completed_this_week"] == 0
    assert activity(data) == {str(admin.user_id): (0, 0), str(member.user_id): (0, 0)}


def test_no_done_column_means_zero_completed(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    make_card(make_column(board, "Finished"))
    assert assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)["completed_this_week"] == 0


@pytest.mark.parametrize("name", ["Done", "done", "DONE", "dOnE"])
def test_done_column_matches_case_insensitively(client, setup, make_column, make_card, auth_header, name):
    board, admin, _member = setup
    make_card(make_column(board, name))
    assert assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)["completed_this_week"] == 1


def test_week_boundary_monday_included_earlier_and_future_excluded(client, setup, make_column, make_card, auth_header):
    from app.soft_delete import utcnow

    board, admin, _member = setup
    done = make_column(board, "Done")
    start = week_start()
    make_card(done, updated_at=start)  # included: exactly Monday 00:00:00 UTC
    make_card(done, updated_at=start + timedelta(seconds=1))
    make_card(done, updated_at=start - timedelta(microseconds=1))  # last week
    make_card(done, updated_at=start - timedelta(days=3))
    make_card(done, updated_at=utcnow() + timedelta(hours=1))  # future
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["completed_this_week"] == 2
    assert by_column(data)["Done"] == 5


def test_cards_outside_done_and_soft_deleted_ones_do_not_count_as_completed(
    client, setup, make_column, make_card, auth_header
):
    board, admin, _member = setup
    done, other = make_column(board, "Done"), make_column(board, "Doing")
    make_card(other)
    gone = make_card(done)
    keep = make_card(done)
    assert_envelope(client.delete(f"/api/cards/{gone.card_id}", headers=auth_header(admin)), 200)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["completed_this_week"] == 1 and by_column(data) == {"Done": 1, "Doing": 1}
    assert keep is not None


def test_moving_a_card_into_done_counts_it(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    todo, done = make_column(board, "To Do"), make_column(board, "Done")
    card = make_card(todo)
    body = {"column_id": str(done.column_id), "order": 1.0}
    assert_envelope(client.patch(f"/api/cards/{card.card_id}/position", json=body, headers=auth_header(admin)), 200)
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    assert data["completed_this_week"] == 1


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


def test_soft_deleted_rows_are_excluded_everywhere(
    client, setup, make_column, make_card, make_comment, make_member, auth_header
):
    board, admin, member = setup
    removed = make_member(board).member
    gone_column, column = make_column(board, "Gone"), make_column(board, "Done")
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
    assert by_column(data) == {"Done": 1}
    assert activity(data) == {str(admin.user_id): (0, 0), str(member.user_id): (1, 1)}


def test_non_admin_member_is_403_without_data_and_non_member_is_403(client, setup, make_user, auth_header):
    board, _admin, member = setup
    for user in (member, make_user()):
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


# Feature: kano, Property 24: Analytics equals a naive model
_card = st.fixed_dictionaries(
    {
        "assignee": st.sampled_from([None, 0, 1, 2]),
        "age_hours": st.sampled_from([-48, -1, 0, 1, 24, 24 * 6, 24 * 12]),  # negative = future
        "deleted": st.booleans(),
        "comments": st.lists(st.tuples(st.sampled_from([0, 1, 2]), st.booleans()), max_size=3),
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
    users = [board.owner, make_member(board).member, make_member(board).member]
    now, start = utcnow(), week_start()
    expected_cards, expected_done = {}, 0
    expected_activity = {u.user_id: [0, 0] for u in users}
    for spec in columns:
        column = make_column(board, spec["name"])
        if spec["deleted"]:
            column.is_deleted, column.deleted_at = True, now
            persist(column)
        live_cards = 0
        for card_spec in spec["cards"]:
            assignee = None if card_spec["assignee"] is None else users[card_spec["assignee"]]
            updated = now - timedelta(hours=card_spec["age_hours"])
            card = make_card(column, assignee=assignee, updated_at=updated)
            card_gone = card_spec["deleted"] or spec["deleted"]  # a Column delete cascades
            if card_gone:
                card.is_deleted, card.deleted_at = True, now
                card.updated_at = updated
                persist(card)
            for author_index, comment_deleted in card_spec["comments"]:
                comment = make_comment(card, users[author_index])
                if comment_deleted or card_gone:
                    comment.is_deleted, comment.deleted_at = True, now
                    persist(comment)
            if card_gone:
                continue
            live_cards += 1
            if spec["name"].lower() == "done" and start <= updated <= now:
                expected_done += 1
            if assignee is not None:
                expected_activity[assignee.user_id][0] += 1
            for author_index, comment_deleted in card_spec["comments"]:
                if not comment_deleted:
                    expected_activity[users[author_index].user_id][1] += 1
        if not spec["deleted"]:
            expected_cards[column.column_id] = live_cards
    data = assert_envelope(client.get(url(board), headers=auth_header(board.owner)), 200)
    assert {uuid.UUID(c["column_id"]): c["count"] for c in data["cards_per_column"]} == expected_cards
    assert data["completed_this_week"] == expected_done
    assert {uuid.UUID(k): list(v) for k, v in activity(data).items()} == expected_activity
