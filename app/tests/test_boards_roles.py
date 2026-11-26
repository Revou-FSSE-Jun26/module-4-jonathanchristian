"""pytest tests for Board creation tokens, the guest role, and membership rules (V6)."""
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
_names = st.text(alphabet="abcdefghijklmnopqrstuvwxyz ", min_size=1, max_size=40).filter(lambda s: s.strip())


def members_url(board, suffix=""):
    return f"/api/boards/{board.board_id}/members{suffix}"


@pytest.fixture
def world(make_board, make_member, make_column, make_card):
    board = make_board()
    guest = make_member(board, role="guest").member
    member = make_member(board).member
    column = make_column(board, "Todo")
    card = make_card(column, title="Visible", assignee=member)
    return board, board.owner, member, guest, column, card


# --- creation ---------------------------------------------------------------------------------------------


def test_creating_a_board_creates_both_tokens_with_the_admin_membership(
    client, make_user, auth_header, fetch, count_rows
):
    from uuid import UUID

    from app.blueprints.boards.schema import Board, BoardMembership

    admin = make_user()
    data = assert_envelope(client.post("/api/boards", json={"name": "Tokens"}, headers=auth_header(admin)), 201)
    assert data["my_role"] == "admin" and "invite" not in str(data)
    assert count_rows(BoardMembership) == 1
    assert count_rows(BoardMembership, BoardMembership.role == "admin") == 1
    row = fetch(Board, UUID(data["board_id"]))
    assert row.member_invite_token and row.guest_invite_token


def test_failed_creation_leaves_no_board_membership_or_token(client, make_user, auth_header, count_rows, monkeypatch):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.boards.service import board_service

    monkeypatch.setattr(board_service, "_new_membership", lambda *a, **k: 1 / 0)
    response = client.post("/api/boards", json={"name": "Doomed"}, headers=auth_header(make_user()))
    assert assert_envelope(response, 500) == "Internal server error"
    assert count_rows(Board) == 0 and count_rows(BoardMembership) == 0  # tokens live on the Board row


def test_a_token_that_keeps_colliding_fails_creation_cleanly(client, make_user, auth_header, count_rows, monkeypatch):
    from app.blueprints.boards.schema import Board
    from app.blueprints.boards.service import invite_service

    monkeypatch.setattr(invite_service, "new_invite_token", lambda: "a" * 43)
    admin = make_user()
    assert_envelope(client.post("/api/boards", json={"name": "First"}, headers=auth_header(admin)), 500)
    assert count_rows(Board) == 0  # the guest token could never differ from the member token


# --- guests on reads -------------------------------------------------------------------------------------


def test_guest_sees_the_same_detail_with_role_guest(client, world, auth_header):
    board, admin, _member, guest, column, card = world
    as_guest = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(guest)), 200)
    as_admin = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(admin)), 200)
    assert as_guest["my_role"] == "guest" and as_admin["my_role"] == "admin"
    as_guest.pop("my_role"), as_admin.pop("my_role")
    assert as_guest == as_admin
    assert as_guest["columns"][0]["cards"][0]["card_id"] == str(card.card_id)


def test_board_list_shows_the_guest_role(client, world, auth_header):
    board, _admin, _member, guest, _column, _card = world
    [listed] = assert_envelope(client.get("/api/boards", headers=auth_header(guest)), 200)
    assert (listed["board_id"], listed["my_role"]) == (str(board.board_id), "guest")


def test_members_list_includes_guest_rows_for_every_role_that_can_read(client, world, auth_header):
    board, admin, member, guest, _column, _card = world
    for reader in (admin, member, guest):
        rows = assert_envelope(client.get(members_url(board), headers=auth_header(reader)), 200)
        assert {r["user_id"]: r["role"] for r in rows} == {
            str(admin.user_id): "admin", str(guest.user_id): "guest", str(member.user_id): "member",
        }


# --- guests cannot manage members --------------------------------------------------------------------------


def test_guest_cannot_add_or_remove_members_or_change_the_board(client, world, make_user, auth_header, count_rows):
    from app.blueprints.boards.schema import BoardMembership

    board, _admin, member, guest, _column, _card = world
    newbie = make_user()
    before = count_rows(BoardMembership)
    headers = auth_header(guest)
    assert_envelope(client.post(members_url(board), json={"email": newbie.email}, headers=headers), 403)
    assert_envelope(client.delete(members_url(board, f"/{member.user_id}"), headers=headers), 403)
    assert_envelope(client.patch(f"/api/boards/{board.board_id}", json={"name": "x"}, headers=headers), 403)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=headers), 403)
    assert count_rows(BoardMembership) == before


def test_admin_removes_a_guest_and_the_guest_is_locked_out(client, world, auth_header):
    board, admin, _member, guest, _column, _card = world
    assert assert_envelope(client.delete(members_url(board, f"/{guest.user_id}"), headers=auth_header(admin)), 200) == {
        "user_id": str(guest.user_id)
    }
    for path in (f"/api/boards/{board.board_id}", members_url(board)):
        assert_envelope(client.get(path, headers=auth_header(guest)), 403)
    assert assert_envelope(client.get("/api/boards", headers=auth_header(guest)), 200) == []


def test_removing_a_member_clears_assignments_on_that_board_only(client, world, make_board, make_column, make_card, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    board, admin, member, _guest, _column, card = world
    other_board = make_board(member)  # the member also owns another Board
    other_card = make_card(make_column(other_board), assignee=member)
    assert_envelope(client.delete(members_url(board, f"/{member.user_id}"), headers=auth_header(admin)), 200)
    assert fetch(Card, card.card_id).assignee_id is None
    assert fetch(Card, other_card.card_id).assignee_id == member.user_id


# --- membership uniqueness ignores soft-deleted rows for all three roles ----------------------------------


@pytest.mark.parametrize("role", ["manager", "member", "guest"])  # V11: only the creator is admin
def test_a_soft_deleted_membership_of_any_role_does_not_block_a_new_one(
    client, make_board, make_member, make_user, auth_header, count_rows, role
):
    from app.blueprints.boards.schema import BoardMembership as M

    board = make_board()
    user = make_user()
    make_member(board, user, role=role)
    assert_envelope(client.delete(members_url(board, f"/{user.user_id}"), headers=auth_header(board.owner)), 200)
    assert_envelope(client.post(members_url(board), json={"email": user.email}, headers=auth_header(board.owner)), 201)
    assert count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id) == 2
    assert count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id, M.is_deleted.is_(False)) == 1
    assert_envelope(client.post(members_url(board), json={"email": user.email}, headers=auth_header(board.owner)), 409)


# --- property tests ---------------------------------------------------------------------------------------


# Feature: kano, Property 14: Board creation makes the creator admin (and creates both tokens)
@DB_SETTINGS
@given(_names)
def test_board_creation_makes_creator_admin_with_two_distinct_tokens(
    client, reset_database, make_user, auth_header, fetch, name
):
    from uuid import UUID

    from app.blueprints.boards.schema import Board

    reset_database()
    admin = make_user()
    data = assert_envelope(client.post("/api/boards", json={"name": name}, headers=auth_header(admin)), 201)
    assert data["my_role"] == "admin"
    row = fetch(Board, UUID(data["board_id"]))
    assert row.member_invite_token != row.guest_invite_token
    assert len(row.member_invite_token) == len(row.guest_invite_token) == 43
    [listed] = assert_envelope(client.get("/api/boards", headers=auth_header(admin)), 200)
    assert listed["my_role"] == "admin"


# Feature: kano, Property 8: Cascade atomicity (Board creation part including tokens)
@DB_SETTINGS
@given(_names, st.sampled_from(["membership", "tokens"]))
def test_failed_board_creation_leaves_no_rows_or_tokens(
    client, reset_database, make_user, auth_header, count_rows, monkeypatch, name, where
):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.boards.service import board_service, invite_service

    reset_database()
    user = make_user()
    with monkeypatch.context() as patch:
        if where == "membership":
            patch.setattr(board_service, "_new_membership", lambda *a, **k: 1 / 0)
        else:
            patch.setattr(invite_service, "generate_unique_token", lambda *a, **k: 1 / 0)
        response = client.post("/api/boards", json={"name": name}, headers=auth_header(user))
    assert assert_envelope(response, 500) == "Internal server error"
    assert count_rows(Board) == 0 and count_rows(BoardMembership) == 0


_ops = st.lists(st.sampled_from(["add", "remove", "accept-member", "accept-guest"]), min_size=1, max_size=8)


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows (membership uniqueness, three roles)
@DB_SETTINGS
@given(st.sampled_from([None, "guest", "member"]), _ops)
def test_membership_uniqueness_ignores_soft_deleted_rows(
    client, reset_database, make_board, make_member, make_user, auth_header, count_rows, start, ops
):
    from app.blueprints.boards.schema import BoardMembership as M
    from app.blueprints.boards.service.accept import resolve_accept

    reset_database()
    board, user = make_board(), make_user()
    if start:
        make_member(board, user, role=start)
    tokens = assert_envelope(
        client.get(f"/api/boards/{board.board_id}/invite-links", headers=auth_header(board.owner)), 200
    )
    role, created = start, 1 if start else 0
    for op in ops:
        admin = auth_header(board.owner)
        if op == "add":
            response = client.post(members_url(board), json={"email": user.email}, headers=admin)
            assert_envelope(response, 201 if role is None else 409)  # 409 only while an active row exists
            role, created = ("member", created + 1) if role is None else (role, created)
        elif op == "remove":
            response = client.delete(members_url(board, f"/{user.user_id}"), headers=admin)
            assert_envelope(response, 200 if role is not None else 404)
            role = None
        else:
            token_role = op.split("-")[1]
            url = f"/api/invites/{tokens[token_role]['token']}/accept"
            assert_envelope(client.post(url, headers=auth_header(user)), 200)
            if role is None:
                created += 1
            role, _action = resolve_accept(role, token_role)
        active = count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id, M.is_deleted.is_(False))
        assert active == (0 if role is None else 1)
        assert count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id) == created


# Feature: kano, Property 18: Removal clears the removed user's assignments (removal part)
@DB_SETTINGS
@given(st.lists(st.sampled_from([0, 1, 2]), min_size=1, max_size=8))
def test_removal_clears_exactly_the_removed_members_assignments(
    client, reset_database, make_board, make_member, make_column, make_card, auth_header, fetch, assignees
):
    from app.blueprints.cards.schema import Card

    reset_database()
    board = make_board()
    users = [board.owner, make_member(board).member, make_member(board).member]
    column = make_column(board)
    cards = [(make_card(column, assignee=users[i]), i) for i in assignees]
    assert_envelope(client.delete(members_url(board, f"/{users[2].user_id}"), headers=auth_header(board.owner)), 200)
    for card, index in cards:
        expected = None if index == 2 else users[index].user_id
        assert fetch(Card, card.card_id).assignee_id == expected
