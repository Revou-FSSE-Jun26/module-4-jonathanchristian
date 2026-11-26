"""Invitation links and add-member for managers (design A20, Requirements 37.3, 37.5, 37.6, 37.12)."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def links_url(board):
    return f"/api/boards/{board.board_id}/invite-links"


def regen_url(board, role):
    return f"{links_url(board)}/{role}/regenerate"


@pytest.fixture
def board(make_board):
    return make_board()


@pytest.fixture
def tokens(client, auth_header):
    def read(board):
        data = assert_envelope(client.get(links_url(board), headers=auth_header(board.owner)), 200)
        return data["member"]["token"], data["guest"]["token"]

    return read


def test_the_admin_and_a_manager_read_the_same_links(client, board, make_manager, auth_header, tokens):
    manager = make_manager(board).member
    data = assert_envelope(client.get(links_url(board), headers=auth_header(manager)), 200)
    assert (data["member"]["token"], data["guest"]["token"]) == tokens(board)
    assert data["member"]["role"] == "member" and data["guest"]["role"] == "guest"


@pytest.mark.parametrize("actor", ["member", "guest", "outsider"])
def test_member_guest_and_outsider_get_403_without_a_token(
    client, board, make_member, make_user, auth_header, tokens, fetch, actor
):
    from app.blueprints.boards.schema import Board

    user = {
        "member": lambda: make_member(board).member,
        "guest": lambda: make_member(board, role="guest").member,
        "outsider": make_user,
    }[actor]()
    secret = tokens(board)
    headers = auth_header(user)
    for response in (
        client.get(links_url(board), headers=headers),
        client.post(regen_url(board, "member"), headers=headers),
        client.post(regen_url(board, "guest"), headers=headers),
    ):
        message = assert_envelope(response, 403)
        assert not any(token in message for token in secret)
    assert tokens(board) == secret
    row = fetch(Board, board.board_id)
    assert (row.member_invite_token, row.guest_invite_token) == secret


@pytest.mark.parametrize("role", ["member", "guest"])
def test_regenerate_by_a_manager_replaces_one_token_and_keeps_the_other(
    client, board, make_manager, make_user, auth_header, tokens, role
):
    manager = make_manager(board).member
    before = tokens(board)
    data = assert_envelope(client.post(regen_url(board, role), headers=auth_header(manager)), 200)
    after = tokens(board)
    index = 0 if role == "member" else 1
    assert data == {"role": role, "token": after[index]}
    assert after[index] != before[index] and after[1 - index] == before[1 - index]
    visitor = make_user()
    assert_envelope(client.get(f"/api/invites/{before[index]}", headers=auth_header(visitor)), 404)  # old token is dead
    assert_envelope(client.get(f"/api/invites/{after[index]}", headers=auth_header(visitor)), 200)


def test_accept_keeps_manager_and_admin_for_any_token(client, board, make_manager, tokens, auth_header, fetch_role):
    manager = make_manager(board).member
    member_token, guest_token = tokens(board)
    for user, expected in ((manager, "manager"), (board.owner, "admin")):
        for token in (member_token, guest_token):
            data = assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(user)), 200)
            assert data == {"board_id": str(board.board_id), "role": expected}
        assert fetch_role(board, user) == expected


def test_a_guest_is_upgraded_only_through_the_member_token(client, board, make_member, tokens, auth_header, fetch_role):
    guest = make_member(board, role="guest").member
    member_token, guest_token = tokens(board)
    assert assert_envelope(client.post(f"/api/invites/{guest_token}/accept", headers=auth_header(guest)), 200)["role"] == "guest"
    assert fetch_role(board, guest) == "guest"
    assert assert_envelope(client.post(f"/api/invites/{member_token}/accept", headers=auth_header(guest)), 200)["role"] == "member"
    assert fetch_role(board, guest) == "member"


def test_invite_info_shows_a_managers_current_role(client, board, make_manager, tokens, auth_header):
    manager = make_manager(board).member
    member_token, _guest = tokens(board)
    data = assert_envelope(client.get(f"/api/invites/{member_token}", headers=auth_header(manager)), 200)
    assert data["current_role"] == "manager" and data["role"] == "member"


def test_a_manager_adds_a_member_by_email_with_the_role_member(
    client, board, make_manager, make_user, auth_header, fetch_role
):
    manager = make_manager(board).member
    newcomer = make_user()
    data = assert_envelope(
        client.post(f"/api/boards/{board.board_id}/members", json={"email": newcomer.email}, headers=auth_header(manager)),
        201,
    )
    assert data["role"] == "member" and data["user_id"] == str(newcomer.user_id)
    assert fetch_role(board, newcomer) == "member"
    assert_envelope(
        client.post(f"/api/boards/{board.board_id}/members", json={"email": newcomer.email}, headers=auth_header(manager)),
        409,
    )


def test_a_member_and_a_guest_cannot_add_members(client, board, make_member, make_user, auth_header):
    newcomer = make_user()
    for user in (make_member(board).member, make_member(board, role="guest").member):
        assert_envelope(
            client.post(f"/api/boards/{board.board_id}/members", json={"email": newcomer.email}, headers=auth_header(user)),
            403,
        )


@pytest.fixture
def fetch_role(app):
    from sqlalchemy import select

    from app.blueprints.boards.schema import BoardMembership
    from app.extensions import db

    def _role(board, user):
        with app.app_context():
            return db.session.execute(
                select(BoardMembership.role).where(
                    BoardMembership.board_id == board.board_id,
                    BoardMembership.user_id == user.user_id,
                    BoardMembership.is_deleted.is_(False),
                )
            ).scalar_one_or_none()

    return _role


# Feature: kano, Property 75: Manager accept and invite links (endpoint part)
@settings(max_examples=30, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(existing=st.sampled_from([None, "guest", "member", "manager", "admin"]), token_role=st.sampled_from(["member", "guest"]))
def test_property_accept_matches_resolve_accept_and_never_lowers_a_role(
    client, reset_database, make_user, make_board, make_member, auth_header, fetch_role, existing, token_role
):
    from app.blueprints.boards.service.accept import resolve_accept
    from app.permissions import ROLE_RANK

    reset_database()
    owner = make_user()
    board = make_board(owner)
    visitor = owner if existing == "admin" else make_user()
    if existing not in (None, "admin"):
        make_member(board, visitor, role=existing)
    data = assert_envelope(client.get(links_url(board), headers=auth_header(owner)), 200)
    token = data[token_role]["token"]
    result = assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(visitor)), 200)
    expected_role, _action = resolve_accept(existing, token_role)
    assert result["role"] == expected_role == fetch_role(board, visitor)
    if existing is not None:
        assert ROLE_RANK[expected_role] >= ROLE_RANK[existing]
    if existing in ("manager", "admin"):
        assert expected_role == existing
