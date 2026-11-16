"""pytest tests for the columns endpoints."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)


def board_columns_url(board):
    return f"/api/boards/{board.board_id}/columns"


def reorder_url(board):
    return f"/api/boards/{board.board_id}/columns/reorder"


def column_url(column):
    return f"/api/columns/{column.column_id}"


# --- create ---------------------------------------------------------------------------------------


def test_first_column_gets_order_1_and_later_ones_exceed_the_maximum(
    client, make_board, make_member, auth_header
):
    board = make_board()
    member = make_member(board).member
    first = assert_envelope(
        client.post(board_columns_url(board), json={"name": " To Do "}, headers=auth_header(board.owner)), 201
    )
    assert set(first) == {"column_id", "board_id", "name", "order"}
    assert (first["name"], first["order"], first["board_id"]) == ("To Do", 1.0, str(board.board_id))
    second = assert_envelope(
        client.post(board_columns_url(board), json={"name": "Doing"}, headers=auth_header(member)), 201
    )
    assert second["order"] > first["order"]


def test_new_column_ignores_soft_deleted_maximum(client, make_board, make_column, auth_header):
    board = make_board()
    make_column(board, order=1.0)
    gone = make_column(board, order=9.0)
    assert_envelope(client.delete(column_url(gone), headers=auth_header(board.owner)), 200)
    data = assert_envelope(
        client.post(board_columns_url(board), json={"name": "After"}, headers=auth_header(board.owner)), 201
    )
    assert data["order"] == 2.0


@pytest.mark.parametrize("name", ["", "   ", "x" * 101, 5, None])
def test_create_column_invalid_name_is_400(client, make_board, auth_header, count_rows, name):
    from app.blueprints.columns.schema import Column

    board = make_board()
    body = {} if name is None else {"name": name}
    assert_envelope(client.post(board_columns_url(board), json=body, headers=auth_header(board.owner)), 400)
    assert count_rows(Column) == 0


def test_create_column_rejects_unknown_fields(client, make_board, auth_header):
    board = make_board()
    body = {"name": "A", "order": 5}
    assert_envelope(client.post(board_columns_url(board), json=body, headers=auth_header(board.owner)), 400)


@pytest.mark.parametrize("name", ["a", "x" * 100])
def test_column_name_boundaries_are_accepted(client, make_board, auth_header, name):
    board = make_board()
    assert_envelope(client.post(board_columns_url(board), json={"name": name}, headers=auth_header(board.owner)), 201)


def test_create_column_non_member_is_403(client, make_board, make_user, auth_header, count_rows):
    from app.blueprints.columns.schema import Column

    board = make_board()
    assert_envelope(
        client.post(board_columns_url(board), json={"name": "x"}, headers=auth_header(make_user())), 403
    )
    assert count_rows(Column) == 0


def test_create_column_missing_or_deleted_board_is_404(client, make_board, make_user, auth_header):
    user = make_user()
    missing = f"/api/boards/{uuid.uuid4()}/columns"
    assert_envelope(client.post(missing, json={"name": "x"}, headers=auth_header(user)), 404)
    board = make_board(user)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(user)), 200)
    assert_envelope(client.post(board_columns_url(board), json={"name": "x"}, headers=auth_header(user)), 404)
    assert_envelope(client.post("/api/boards/not-a-uuid/columns", json={"name": "x"}, headers=auth_header(user)), 404)


def test_create_column_requires_authentication(client, make_board):
    assert_envelope(client.post(board_columns_url(make_board()), json={"name": "x"}), 401)


# --- rename ----------------------------------------------------------------------------------------


def test_member_renames_column(client, make_board, make_member, make_column, auth_header, fetch):
    from app.blueprints.columns.schema import Column

    board = make_board()
    column = make_column(board, "Old")
    member = make_member(board).member
    data = assert_envelope(client.patch(column_url(column), json={"name": " New "}, headers=auth_header(member)), 200)
    assert data["name"] == "New" and data["column_id"] == str(column.column_id)
    assert fetch(Column, column.column_id).name == "New"


@pytest.mark.parametrize("body", [{}, {"name": ""}, {"name": "  "}, {"name": "x" * 101}, {"name": "A", "board_id": "x"}])
def test_rename_column_invalid_is_400_and_unchanged(client, make_board, make_column, auth_header, fetch, body):
    from app.blueprints.columns.schema import Column

    board = make_board()
    column = make_column(board, "Keep")
    assert_envelope(client.patch(column_url(column), json=body, headers=auth_header(board.owner)), 400)
    assert fetch(Column, column.column_id).name == "Keep"


def test_rename_column_non_member_is_403_and_unchanged(client, make_board, make_column, make_user, auth_header, fetch):
    from app.blueprints.columns.schema import Column

    column = make_column(make_board(), "Keep")
    assert_envelope(client.patch(column_url(column), json={"name": "Hacked"}, headers=auth_header(make_user())), 403)
    assert fetch(Column, column.column_id).name == "Keep"


def test_rename_missing_or_deleted_column_is_404(client, make_board, make_column, auth_header):
    board = make_board()
    headers = auth_header(board.owner)
    assert_envelope(client.patch(f"/api/columns/{uuid.uuid4()}", json={"name": "x"}, headers=headers), 404)
    assert_envelope(client.patch("/api/columns/not-a-uuid", json={"name": "x"}, headers=headers), 404)
    column = make_column(board)
    assert_envelope(client.delete(column_url(column), headers=headers), 200)
    assert_envelope(client.patch(column_url(column), json={"name": "x"}, headers=headers), 404)
    assert_envelope(client.delete(column_url(column), headers=headers), 404)


# --- delete cascade ---------------------------------------------------------------------------------


def test_delete_column_cascades_to_cards_and_comments_with_one_timestamp(
    client, make_board, make_column, make_card, make_comment, auth_header, fetch
):
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns.schema import Column
    from app.blueprints.comments.schema import Comment

    board = make_board()
    doomed = make_column(board)
    other = make_column(board)
    card = make_card(doomed)
    kept_card = make_card(other)
    comment = make_comment(card, board.owner)
    kept_comment = make_comment(kept_card, board.owner)
    data = assert_envelope(client.delete(column_url(doomed), headers=auth_header(board.owner)), 200)
    assert data == {"column_id": str(doomed.column_id)}
    rows = [fetch(Column, doomed.column_id), fetch(Card, card.card_id), fetch(Comment, comment.comment_id)]
    assert all(row.is_deleted for row in rows)
    assert len({row.deleted_at for row in rows}) == 1
    for row in (fetch(Column, other.column_id), fetch(Card, kept_card.card_id), fetch(Comment, kept_comment.comment_id)):
        assert not row.is_deleted and row.deleted_at is None
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    assert [c["column_id"] for c in detail["columns"]] == [str(other.column_id)]


def test_delete_column_non_member_is_403_and_changes_nothing(
    client, make_board, make_column, make_card, make_user, auth_header, fetch
):
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns.schema import Column

    column = make_column(make_board())
    card = make_card(column)
    assert_envelope(client.delete(column_url(column), headers=auth_header(make_user())), 403)
    assert not fetch(Column, column.column_id).is_deleted
    assert not fetch(Card, card.card_id).is_deleted


def test_delete_column_failure_rolls_back_everything(
    app, client, make_board, make_column, make_card, auth_header, fetch, monkeypatch
):
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns import service
    from app.blueprints.columns.schema import Column

    board = make_board()
    column = make_column(board)
    card = make_card(column)
    real = service.soft_delete_where

    def explode(session, model, *conditions, deleted_at):
        if model is Column:
            raise RuntimeError("boom")
        return real(session, model, *conditions, deleted_at=deleted_at)

    monkeypatch.setattr(service, "soft_delete_where", explode)
    assert_envelope(client.delete(column_url(column), headers=auth_header(board.owner)), 500)
    assert not fetch(Card, card.card_id).is_deleted
    assert not fetch(Column, column.column_id).is_deleted
