"""pytest tests for invitation links, regenerate, and invite info (V6). Accept: test_invites_accept.py."""
import re
import uuid

import pytest

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

TOKEN_FORMAT = re.compile(r"^[A-Za-z0-9_-]{43,128}$")


def links_url(board):
    return f"/api/boards/{board.board_id}/invite-links"


def regen_url(board, role):
    return f"{links_url(board)}/{role}/regenerate"


def board_row(fetch, board):
    from app.blueprints.boards.schema import Board

    return fetch(Board, board.board_id)


@pytest.fixture
def tokens(client, auth_header):
    """`tokens(board, admin)` returns `(member_token, guest_token)` through the API."""

    def get(board, admin):
        data = assert_envelope(client.get(links_url(board), headers=auth_header(admin)), 200)
        return data["member"]["token"], data["guest"]["token"]

    return get


# --- tokens are created with the Board and lazily ------------------------------------------------------


def test_board_creation_stores_both_tokens_and_never_returns_them(client, make_user, auth_header, fetch):
    admin = make_user()
    data = assert_envelope(client.post("/api/boards", json={"name": "B"}, headers=auth_header(admin)), 201)
    assert "token" not in str(data).lower()
    from app.blueprints.boards.schema import Board

    row = fetch(Board, uuid.UUID(data["board_id"]))
    assert TOKEN_FORMAT.match(row.member_invite_token) and TOKEN_FORMAT.match(row.guest_invite_token)
    assert row.member_invite_token != row.guest_invite_token


def test_board_with_null_tokens_gets_them_on_first_get_and_keeps_them(
    client, make_board, auth_header, fetch, tokens
):
    board = make_board()  # the factory models a Board that existed before V6
    row = board_row(fetch, board)
    assert row.member_invite_token is None and row.guest_invite_token is None
    first = tokens(board, board.owner)
    assert tokens(board, board.owner) == first
    row = board_row(fetch, board)
    assert (row.member_invite_token, row.guest_invite_token) == first


def test_get_invite_links_shape_and_roles(client, make_board, auth_header):
    board = make_board()
    data = assert_envelope(client.get(links_url(board), headers=auth_header(board.owner)), 200)
    assert set(data) == {"member", "guest"}
    assert data["member"]["role"] == "member" and data["guest"]["role"] == "guest"
    for link in data.values():
        assert TOKEN_FORMAT.match(link["token"])
    assert data["member"]["token"] != data["guest"]["token"]


def test_tokens_are_unique_across_many_boards(client, make_user, auth_header):
    seen = set()
    admin = make_user()
    for index in range(15):
        board = assert_envelope(client.post("/api/boards", json={"name": f"B{index}"}, headers=auth_header(admin)), 201)
        data = assert_envelope(client.get(links_url_of(board), headers=auth_header(admin)), 200)
        seen.update((data["member"]["token"], data["guest"]["token"]))
    assert len(seen) == 30


def links_url_of(board_json):
    return f"/api/boards/{board_json['board_id']}/invite-links"


# --- roles on invite-links and regenerate --------------------------------------------------------------


@pytest.mark.parametrize("actor", ["member", "guest", "outsider"])
def test_only_the_admin_may_read_or_regenerate(client, make_board, make_member, make_user, auth_header, fetch, actor):
    board = make_board()
    member, guest = make_member(board).member, make_member(board, role="guest").member
    user = {"member": member, "guest": guest, "outsider": make_user()}[actor]
    before = board_row(fetch, board)
    secret = (before.member_invite_token, before.guest_invite_token)
    for response in (
        client.get(links_url(board), headers=auth_header(user)),
        client.post(regen_url(board, "member"), headers=auth_header(user)),
        client.post(regen_url(board, "guest"), headers=auth_header(user)),
    ):
        message = assert_envelope(response, 403)
        assert board.name not in message
    after = board_row(fetch, board)
    assert (after.member_invite_token, after.guest_invite_token) == secret


@pytest.mark.parametrize("role", ["admin", "owner", "", "MEMBER", "Guest", "members"])
def test_bad_role_is_400_and_changes_nothing(client, make_board, auth_header, tokens, role):
    board = make_board()
    before = tokens(board, board.owner)
    response = client.post(f"{links_url(board)}/{role or '%20'}/regenerate", headers=auth_header(board.owner))
    assert_envelope(response, 400)
    assert tokens(board, board.owner) == before


def test_missing_deleted_malformed_board_is_404_and_unauthenticated_401(client, make_board, auth_header):
    board = make_board()
    headers = auth_header(board.owner)
    for path in (
        f"/api/boards/{uuid.uuid4()}/invite-links",
        "/api/boards/nope/invite-links",
        f"/api/boards/{uuid.uuid4()}/invite-links/member/regenerate",
    ):
        method = client.post if path.endswith("regenerate") else client.get
        assert_envelope(method(path, headers=headers), 404)
    assert_envelope(client.get(links_url(board)), 401)
    assert_envelope(client.post(regen_url(board, "member")), 401)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=headers), 200)
    assert_envelope(client.get(links_url(board), headers=headers), 404)


# --- regenerate -----------------------------------------------------------------------------------------


@pytest.mark.parametrize("role,other", [("member", "guest"), ("guest", "member")])
def test_regenerate_replaces_one_token_and_invalidates_the_old_one(
    client, make_board, make_member, make_user, auth_header, tokens, count_rows, role, other
):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    make_member(board)
    old = dict(zip(("member", "guest"), tokens(board, board.owner)))
    memberships_before = count_rows(BoardMembership)
    data = assert_envelope(client.post(regen_url(board, role), headers=auth_header(board.owner)), 200)
    assert set(data) == {"role", "token"} and data["role"] == role
    assert data["token"] != old[role] and TOKEN_FORMAT.match(data["token"])
    visitor = auth_header(make_user())
    assert_envelope(client.get(f"/api/invites/{old[role]}", headers=visitor), 404)
    assert_envelope(client.post(f"/api/invites/{old[role]}/accept", headers=visitor), 404)
    assert assert_envelope(client.get(f"/api/invites/{data['token']}", headers=visitor), 200)["role"] == role
    assert assert_envelope(client.get(f"/api/invites/{old[other]}", headers=visitor), 200)["role"] == other
    assert tokens(board, board.owner)[0 if role == "member" else 1] == data["token"]
    assert count_rows(BoardMembership) == memberships_before


# --- invite info ------------------------------------------------------------------------------------------


def test_invite_info_shape_and_current_role(client, make_board, make_member, make_user, auth_header, tokens):
    board = make_board()
    guest = make_member(board, role="guest").member
    member_token, guest_token = tokens(board, board.owner)
    stranger = assert_envelope(client.get(f"/api/invites/{member_token}", headers=auth_header(make_user())), 200)
    assert stranger == {
        "board_id": str(board.board_id), "board_name": board.name, "role": "member", "current_role": None,
    }
    assert assert_envelope(client.get(f"/api/invites/{member_token}", headers=auth_header(guest)), 200)["current_role"] == "guest"
    assert assert_envelope(client.get(f"/api/invites/{guest_token}", headers=auth_header(board.owner)), 200)["current_role"] == "admin"


@pytest.mark.parametrize("token", ["short", "a" * 42, "a" * 129, "a" * 43, "../" + "a" * 43, "a" * 42 + "%0A"])
def test_unknown_or_malformed_tokens_are_404_without_board_data(client, make_board, make_user, auth_header, token):
    board = make_board()
    headers = auth_header(make_user())
    for call in (client.get(f"/api/invites/{token}", headers=headers), client.post(f"/api/invites/{token}/accept", headers=headers)):
        assert board.name not in assert_envelope(call, 404)


def test_token_of_a_soft_deleted_board_is_404_and_creates_nothing(
    client, make_board, make_user, auth_header, tokens, count_rows
):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    member_token, _guest = tokens(board, board.owner)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    visitor = make_user()
    before = count_rows(BoardMembership)
    assert_envelope(client.get(f"/api/invites/{member_token}", headers=auth_header(visitor)), 404)
    assert_envelope(client.post(f"/api/invites/{member_token}/accept", headers=auth_header(visitor)), 404)
    assert count_rows(BoardMembership) == before


def test_invite_endpoints_need_an_access_token(client, make_board, make_user, refresh_header, tokens):
    board = make_board()
    token, _ = tokens(board, board.owner)
    user = make_user()
    for method in (client.get, client.post):
        suffix = "" if method == client.get else "/accept"
        assert_envelope(method(f"/api/invites/{token}{suffix}"), 401)
        assert_envelope(method(f"/api/invites/{token}{suffix}", headers=refresh_header(user)), 401)
        assert_envelope(method(f"/api/invites/{token}{suffix}", headers={"Authorization": "Bearer junk"}), 401)


def test_token_reads_and_lazy_creation_never_touch_a_soft_deleted_board(app, client, make_board, auth_header, fetch):
    from sqlalchemy.exc import NoResultFound

    from app.blueprints.boards.service import invite_service

    board = make_board()  # NULL tokens, so lazy creation would otherwise write to the row
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    with app.app_context():
        with pytest.raises(NoResultFound):
            invite_service._read_tokens(board.board_id)
    row = board_row(fetch, board)
    assert row.is_deleted and row.member_invite_token is None and row.guest_invite_token is None
    assert_envelope(client.get(links_url(board), headers=auth_header(board.owner)), 404)
    row = board_row(fetch, board)
    assert row.member_invite_token is None and row.guest_invite_token is None
