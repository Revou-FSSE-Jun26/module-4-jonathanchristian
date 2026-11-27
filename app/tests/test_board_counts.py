"""pytest tests for the Board member and card counts (R47, design A22-R)."""
import pytest

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


@pytest.fixture
def counts_of(app):
    from app.blueprints.boards.service.board_counts import board_counts, board_counts_one

    def call(*boards):
        with app.app_context():
            if len(boards) == 1:
                return board_counts_one(boards[0].board_id)
            return board_counts([b.board_id for b in boards])

    return call


def test_a_board_with_only_its_creator_has_one_member_and_no_card(make_board, counts_of):
    assert counts_of(make_board()) == (1, 0)


def test_every_role_counts_as_a_member(make_board, make_member, counts_of):
    board = make_board()
    for role in ("member", "manager", "guest"):
        make_member(board, role=role)
    assert counts_of(board) == (4, 0)


def test_a_soft_deleted_membership_is_not_counted(make_board, make_member, counts_of, persist):
    board = make_board()
    make_member(board, role="member")
    gone = make_member(board, role="guest")
    make_member(board, role="manager")
    gone.is_deleted = True
    persist(gone)
    assert counts_of(board) == (3, 0)


def test_cards_of_every_column_count_and_soft_deleted_cards_do_not(
    make_board, make_column, make_card, counts_of, persist
):
    board = make_board()
    first, second = make_column(board), make_column(board)
    make_card(first)
    dead = make_card(second)
    make_card(second, status="DONE")
    dead.is_deleted = True
    persist(dead)
    assert counts_of(board) == (1, 2)


def test_the_members_and_cards_of_another_board_are_not_counted(
    make_board, make_member, make_column, make_card, counts_of
):
    mine, other = make_board(), make_board()
    make_member(other)
    make_card(make_column(other))
    make_card(make_column(other))
    make_card(make_column(mine))
    assert counts_of(mine) == (1, 1)
    assert counts_of(mine, other) == {mine.board_id: (1, 1), other.board_id: (2, 2)}


def test_no_board_ids_give_an_empty_result_without_a_query(app, query_counter):
    from app.blueprints.boards.service.board_counts import board_counts

    with app.app_context(), query_counter() as counter:
        assert board_counts([]) == {}
    assert counter.count == 0


def test_post_returns_one_member_and_no_card(client, make_user, auth_header):
    data = assert_envelope(client.post("/api/boards", json={"name": "Fresh"}, headers=auth_header(make_user())), 201)
    assert (data["member_count"], data["card_count"]) == (1, 0)


def test_patch_returns_the_current_counts(client, make_board, make_member, make_column, make_card, auth_header):
    board = make_board()
    make_member(board, role="guest")
    make_member(board)
    column = make_column(board)
    make_card(column)
    make_card(column)
    make_card(column)
    response = client.patch(f"/api/boards/{board.board_id}", json={"name": "Renamed"}, headers=auth_header(board.owner))
    data = assert_envelope(response, 200)
    assert (data["name"], data["member_count"], data["card_count"]) == ("Renamed", 3, 3)


def test_get_list_returns_the_counts_and_detail_returns_neither_key(
    client, make_board, make_member, make_column, make_card, auth_header
):
    board = make_board()
    make_member(board)
    make_card(make_column(board))
    headers = auth_header(board.owner)
    [listed] = assert_envelope(client.get("/api/boards", headers=headers), 200)
    assert (listed["member_count"], listed["card_count"]) == (2, 1)
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
    assert "member_count" not in detail and "card_count" not in detail
