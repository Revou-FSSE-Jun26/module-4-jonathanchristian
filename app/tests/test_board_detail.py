"""pytest tests for GET /api/boards/<id> (board detail)."""
import uuid

import pytest

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def test_board_detail_orders_columns_and_cards(
    client, make_board, make_member, make_column, make_card, auth_header
):
    board = make_board()
    member = make_member(board).member
    late = make_column(board, "late", order=3.0)
    early = make_column(board, "early", order=1.5)
    c2 = make_card(early, "second", assignee=member, order=2.0)
    c1 = make_card(early, "first", order=0.5)
    data = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(member)), 200)
    assert data["my_role"] == "member"
    assert [c["name"] for c in data["columns"]] == ["early", "late"]
    assert [c["card_id"] for c in data["columns"][0]["cards"]] == [str(c1.card_id), str(c2.card_id)]
    assert data["columns"][1]["column_id"] == str(late.column_id) and data["columns"][1]["cards"] == []
    cards = data["columns"][0]["cards"]
    assert cards[0]["assignee"] is None
    assert cards[1]["assignee"] == {"user_id": str(member.user_id), "name": member.name}
    assert set(cards[0]) == {
        "card_id", "board_id", "column_id", "title", "description", "due_date",
        "labels", "assignee", "order", "status", "completed_at", "created_at", "updated_at",
    }


def test_board_detail_excludes_soft_deleted_columns_and_cards(
    client, make_board, make_column, make_card, auth_header, persist
):
    board = make_board()
    live = make_column(board, "live")
    dead_column = make_column(board, "dead")
    keep = make_card(live, "keep")
    dead_card = make_card(live, "dead card")
    dead_card.is_deleted = True
    persist(dead_card)
    dead_column.is_deleted = True
    persist(dead_column)
    data = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    assert [c["name"] for c in data["columns"]] == ["live"]
    assert [c["card_id"] for c in data["columns"][0]["cards"]] == [str(keep.card_id)]


def test_board_detail_403_for_non_member_without_data_leak(
    client, make_user, make_board, auth_header
):
    board = make_board(name="Secret Board Name")
    response = client.get(f"/api/boards/{board.board_id}", headers=auth_header(make_user()))
    message = assert_envelope(response, 403)
    assert "Secret" not in message and str(board.board_id) not in message


def test_board_detail_404_for_missing_deleted_and_malformed_ids(
    client, make_board, auth_header, make_user
):
    user = make_user()
    for path in (f"/api/boards/{uuid.uuid4()}", "/api/boards/not-a-uuid"):
        assert_envelope(client.get(path, headers=auth_header(user)), 404)
    board = make_board()
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 404)


def test_board_detail_runs_a_fixed_number_of_queries(
    client, make_board, make_column, make_card, auth_header, query_counter
):
    board = make_board()
    column = make_column(board)
    headers = auth_header(board.owner)
    make_card(column, assignee=board.owner)
    with query_counter() as few:
        assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
    for _ in range(15):
        make_card(column, assignee=board.owner)
    with query_counter() as many:
        assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
    assert few.count == many.count == 4
