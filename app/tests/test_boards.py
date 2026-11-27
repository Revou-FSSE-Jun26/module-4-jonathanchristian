"""pytest tests for the boards endpoints (create, list, detail, update, delete)."""
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
_board_names = st.text(alphabet="abcdefghijklmnopqrstuvwxyz ABC0123456789", min_size=1, max_size=100).filter(
    lambda text: text.strip()
)


def _membership_rows(count_rows, board_id):
    from app.blueprints.boards.schema import BoardMembership

    return count_rows(BoardMembership, BoardMembership.board_id == board_id)


# --- create -------------------------------------------------------------------------------------


def test_create_board_makes_creator_admin(client, make_user, auth_header, count_rows, fetch):
    from app.blueprints.boards.schema import Board, BoardMembership

    user = make_user()
    data = assert_envelope(client.post("/api/boards", json={"name": " Roadmap "}, headers=auth_header(user)), 201)
    assert set(data) == {"board_id", "name", "my_role", "created_at", "updated_at", "member_count", "card_count"}
    assert (data["member_count"], data["card_count"]) == (1, 0)
    assert (data["name"], data["my_role"]) == ("Roadmap", "admin")
    board_id = uuid.UUID(data["board_id"])
    assert fetch(Board, board_id).created_by == user.user_id
    assert count_rows(
        BoardMembership,
        BoardMembership.board_id == board_id,
        BoardMembership.user_id == user.user_id,
        BoardMembership.role == "admin",
    ) == 1


@pytest.mark.parametrize("name", ["", "   ", "x" * 101, None, 7])
def test_create_board_invalid_name_is_400(client, make_user, auth_header, count_rows, name):
    from app.blueprints.boards.schema import Board

    body = {} if name is None else {"name": name}
    assert_envelope(client.post("/api/boards", json=body, headers=auth_header(make_user())), 400)
    assert count_rows(Board) == 0


@pytest.mark.parametrize("name", ["a", "x" * 100])
def test_create_board_name_boundaries_are_accepted(client, make_user, auth_header, name):
    assert_envelope(client.post("/api/boards", json={"name": name}, headers=auth_header(make_user())), 201)


def test_create_board_rejects_unknown_fields(client, make_user, auth_header):
    body = {"name": "ok", "created_by": str(uuid.uuid4())}
    assert_envelope(client.post("/api/boards", json=body, headers=auth_header(make_user())), 400)


def test_board_endpoints_require_authentication(client):
    assert_envelope(client.post("/api/boards", json={"name": "x"}), 401)
    assert_envelope(client.get("/api/boards"), 401)


def test_create_board_is_atomic_when_membership_creation_fails(
    client, make_user, auth_header, count_rows, monkeypatch
):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.boards.service import board_service

    def explode(*args, **kwargs):
        raise RuntimeError("injected failure after the Board insert")

    monkeypatch.setattr(board_service, "_new_membership", explode)
    response = client.post("/api/boards", json={"name": "Doomed"}, headers=auth_header(make_user()))
    assert assert_envelope(response, 500) == "Internal server error"
    assert count_rows(Board) == 0
    assert count_rows(BoardMembership) == 0


# --- list -----------------------------------------------------------------------------------------


def test_list_boards_returns_only_own_boards_newest_first(
    client, make_user, make_board, make_member, auth_header
):
    me, other = make_user(), make_user()
    first = make_board(me, "first")
    second = make_board(other, "second")
    make_member(second, me)
    third = make_board(me, "third")
    make_board(other, "not mine")
    data = assert_envelope(client.get("/api/boards", headers=auth_header(me)), 200)
    assert [b["board_id"] for b in data] == [
        str(third.board_id),
        str(second.board_id),
        str(first.board_id),
    ]
    assert [b["my_role"] for b in data] == ["admin", "member", "admin"]
    assert all(set(b) == {"board_id", "name", "my_role", "created_at", "updated_at", "member_count", "card_count"} for b in data)
    assert [(b["member_count"], b["card_count"]) for b in data] == [(1, 0), (2, 0), (1, 0)]


def test_list_boards_is_empty_without_boards(client, make_user, auth_header):
    assert assert_envelope(client.get("/api/boards", headers=auth_header(make_user())), 200) == []


def test_list_boards_hides_deleted_boards_and_removed_memberships(
    client, make_user, make_board, make_member, auth_header, persist
):
    me = make_user()
    gone = make_board(me, "gone")
    kept = make_board(make_user(), "kept")
    membership = make_member(kept, me)
    other = make_board(make_user(), "removed")
    removed = make_member(other, me)
    client.delete(f"/api/boards/{gone.board_id}", headers=auth_header(me))
    removed.is_deleted = True
    persist(removed)
    data = assert_envelope(client.get("/api/boards", headers=auth_header(me)), 200)
    assert [b["board_id"] for b in data] == [str(kept.board_id)]
    assert membership.role == "member"


# --- update ----------------------------------------------------------------------------------------


def test_admin_can_rename_board(client, make_board, auth_header, fetch):
    from app.blueprints.boards.schema import Board

    board = make_board(name="Old")
    data = assert_envelope(
        client.patch(f"/api/boards/{board.board_id}", json={"name": " New "}, headers=auth_header(board.owner)),
        200,
    )
    assert (data["name"], data["my_role"]) == ("New", "admin")
    assert set(data) == {"board_id", "name", "my_role", "created_at", "updated_at", "member_count", "card_count"}
    assert (data["member_count"], data["card_count"]) == (1, 0)
    assert fetch(Board, board.board_id).name == "New"


@pytest.mark.parametrize("name", ["", "  ", "x" * 101])
def test_rename_with_invalid_name_is_400_and_changes_nothing(client, make_board, auth_header, fetch, name):
    from app.blueprints.boards.schema import Board

    board = make_board(name="Stay")
    assert_envelope(
        client.patch(f"/api/boards/{board.board_id}", json={"name": name}, headers=auth_header(board.owner)),
        400,
    )
    assert fetch(Board, board.board_id).name == "Stay"


@pytest.mark.parametrize("method,body", [("patch", {"name": "Hacked"}), ("delete", None)])
def test_member_who_is_not_admin_gets_403(client, make_board, make_member, auth_header, fetch, method, body):
    from app.blueprints.boards.schema import Board

    board = make_board(name="Mine")
    member = make_member(board).member
    response = getattr(client, method)(f"/api/boards/{board.board_id}", json=body, headers=auth_header(member))
    assert_envelope(response, 403)
    row = fetch(Board, board.board_id)
    assert row.name == "Mine" and row.is_deleted is False


@pytest.mark.parametrize("method,body", [("patch", {"name": "Hacked"}), ("delete", None)])
def test_non_member_gets_403_on_update_and_delete(client, make_user, make_board, auth_header, fetch, method, body):
    from app.blueprints.boards.schema import Board

    board = make_board(name="Mine")
    response = getattr(client, method)(f"/api/boards/{board.board_id}", json=body, headers=auth_header(make_user()))
    assert_envelope(response, 403)
    row = fetch(Board, board.board_id)
    assert row.name == "Mine" and row.is_deleted is False


@pytest.mark.parametrize("method", ["patch", "delete"])
def test_update_and_delete_404_for_missing_or_malformed(client, make_user, auth_header, method):
    user = make_user()
    for path in (f"/api/boards/{uuid.uuid4()}", "/api/boards/123"):
        assert_envelope(getattr(client, method)(path, json={"name": "x"}, headers=auth_header(user)), 404)


# --- delete ----------------------------------------------------------------------------------------


def test_delete_board_soft_deletes_the_tree_with_one_timestamp(
    client, make_board, make_member, make_column, make_card, make_comment, auth_header, fetch
):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns.schema import Column
    from app.blueprints.comments.schema import Comment

    board = make_board()
    membership = make_member(board)
    column = make_column(board)
    card = make_card(column)
    comment = make_comment(card, board.owner)
    unrelated = make_board()
    data = assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    assert data == {"board_id": str(board.board_id)}
    rows = [
        fetch(Board, board.board_id),
        fetch(Column, column.column_id),
        fetch(Card, card.card_id),
        fetch(Comment, comment.comment_id),
        fetch(BoardMembership, membership.board_membership_id),
    ]
    assert all(row.is_deleted for row in rows)
    assert len({row.deleted_at for row in rows}) == 1
    assert fetch(Board, unrelated.board_id).is_deleted is False


# --- properties -------------------------------------------------------------------------------------


# Feature: kano, Property 14: Board creation makes the creator admin
@DB_SETTINGS
@given(_board_names)
def test_board_creation_makes_creator_admin(client, reset_database, make_user, auth_header, count_rows, name):
    from app.blueprints.boards.schema import BoardMembership

    reset_database()
    user = make_user()
    data = assert_envelope(client.post("/api/boards", json={"name": name}, headers=auth_header(user)), 201)
    assert data["name"] == name.strip() and data["my_role"] == "admin"
    assert count_rows(
        BoardMembership,
        BoardMembership.board_id == uuid.UUID(data["board_id"]),
        BoardMembership.user_id == user.user_id,
        BoardMembership.role == "admin",
    ) == 1
    listed = assert_envelope(client.get("/api/boards", headers=auth_header(user)), 200)
    assert [b["board_id"] for b in listed] == [data["board_id"]]


# Feature: kano, Property 15: Server order allocation (board listing order)
@DB_SETTINGS
@given(st.integers(min_value=1, max_value=6))
def test_boards_are_listed_newest_first(client, reset_database, make_user, auth_header, total):
    reset_database()
    user = make_user()
    created = []
    for index in range(total):
        data = assert_envelope(
            client.post("/api/boards", json={"name": f"b{index}"}, headers=auth_header(user)), 201
        )
        created.append(data["board_id"])
    listed = assert_envelope(client.get("/api/boards", headers=auth_header(user)), 200)
    assert [b["board_id"] for b in listed] == list(reversed(created))


# Feature: kano, Property 8: Cascade atomicity (Board create part)
@DB_SETTINGS
@given(_board_names)
def test_failed_board_creation_leaves_no_rows(
    client, reset_database, make_user, auth_header, count_rows, monkeypatch, name
):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.boards.service import board_service

    reset_database()
    user = make_user()
    with monkeypatch.context() as patch:
        patch.setattr(board_service, "_new_membership", lambda *a, **k: 1 / 0)
        response = client.post("/api/boards", json={"name": name}, headers=auth_header(user))
    assert assert_envelope(response, 500) == "Internal server error"
    assert count_rows(Board) == 0 and count_rows(BoardMembership) == 0
