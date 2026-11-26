"""V11 analytics checks: managers in member activity, URGENT not completed, manager gets 403."""
import pytest

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def url(board):
    return f"/api/boards/{board.board_id}/analytics"


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


def test_managers_appear_in_member_activity_and_guests_do_not(
    client, setup, make_manager, make_member, auth_header
):
    board, admin, member = setup
    manager = make_manager(board).member
    guest = make_member(board, role="guest").member
    data = assert_envelope(client.get(url(board), headers=auth_header(admin)), 200)
    ids = set(activity(data))
    assert {str(admin.user_id), str(member.user_id), str(manager.user_id)} <= ids
    assert str(guest.user_id) not in ids


def test_an_urgent_card_is_not_counted_as_completed(client, setup, make_column, make_card, auth_header):
    board, admin, _member = setup
    column = make_column(board)
    make_card(column, status="URGENT")
    assert completed(client, board, admin, auth_header) == 0
    assert by_column(assert_envelope(client.get(url(board), headers=auth_header(admin)), 200))[column.name] == 1


def test_a_manager_gets_403_on_analytics(client, setup, make_manager, auth_header):
    board, _admin, _member = setup
    manager = make_manager(board).member
    assert_envelope(client.get(url(board), headers=auth_header(manager)), 403)
