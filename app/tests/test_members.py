"""pytest tests for board members and role enforcement."""
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


def members_url(board):
    return f"/api/boards/{board.board_id}/members"


def member_url(board, user):
    return f"/api/boards/{board.board_id}/members/{user.user_id}"


# --- add ------------------------------------------------------------------------------------------


def test_admin_adds_member_by_email_case_insensitively(client, make_board, make_user, auth_header, count_rows):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    target = make_user(name="Newbie", email="newbie@example.com")
    response = client.post(members_url(board), json={"email": " NEWBIE@Example.com "}, headers=auth_header(board.owner))
    data = assert_envelope(response, 201)
    assert data == {
        "user_id": str(target.user_id),
        "name": "Newbie",
        "email": "newbie@example.com",
        "role": "member",
    }
    assert count_rows(BoardMembership, BoardMembership.board_id == board.board_id) == 2


@pytest.mark.parametrize(
    "body",
    [{}, {"email": ""}, {"email": "nope"}, {"email": "a" * 250 + "@example.com"}, {"email": 5}, {"email": "a@b.co", "role": "admin"}],
)
def test_add_member_invalid_email_is_400(client, make_board, auth_header, count_rows, body):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    assert_envelope(client.post(members_url(board), json=body, headers=auth_header(board.owner)), 400)
    assert count_rows(BoardMembership) == 1


def test_add_member_unknown_email_is_404(client, make_board, auth_header):
    board = make_board()
    response = client.post(members_url(board), json={"email": "ghost@example.com"}, headers=auth_header(board.owner))
    assert_envelope(response, 404)


def test_add_member_for_soft_deleted_user_is_404(client, make_board, make_deleted_user, auth_header):
    board = make_board()
    make_deleted_user("gone@example.com")
    response = client.post(members_url(board), json={"email": "gone@example.com"}, headers=auth_header(board.owner))
    assert_envelope(response, 404)


def test_add_existing_member_is_409_and_keeps_membership(client, make_board, make_member, auth_header, count_rows):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    member = make_member(board).member
    response = client.post(members_url(board), json={"email": member.email}, headers=auth_header(board.owner))
    assert_envelope(response, 409)
    assert count_rows(BoardMembership, BoardMembership.board_id == board.board_id) == 2


# --- list -------------------------------------------------------------------------------------------


def test_list_members_in_creation_order(client, make_board, make_member, auth_header):
    board = make_board()
    first = make_member(board).member
    second = make_member(board).member
    data = assert_envelope(client.get(members_url(board), headers=auth_header(second)), 200)
    assert [m["user_id"] for m in data] == [str(u.user_id) for u in (board.owner, first, second)]
    assert [m["role"] for m in data] == ["admin", "member", "member"]
    assert set(data[0]) == {"user_id", "name", "email", "role"}


# --- remove -------------------------------------------------------------------------------------------


def test_remove_member_clears_assignments_and_blocks_access(
    client, make_board, make_member, make_column, make_card, auth_header, fetch
):
    from app.blueprints.cards.schema import Card

    board = make_board()
    removed = make_member(board).member
    kept = make_member(board).member
    column = make_column(board)
    mine = make_card(column, "assigned to removed", assignee=removed)
    theirs = make_card(column, "assigned to kept", assignee=kept)
    other_board = make_board(board.owner)
    other_card = make_card(make_column(other_board), "other board", assignee=removed)
    data = assert_envelope(client.delete(member_url(board, removed), headers=auth_header(board.owner)), 200)
    assert data == {"user_id": str(removed.user_id)}
    assert fetch(Card, mine.card_id).assignee_id is None
    assert fetch(Card, theirs.card_id).assignee_id == kept.user_id
    assert fetch(Card, other_card.card_id).assignee_id == removed.user_id
    assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(removed)), 403)
    assert_envelope(client.get(members_url(board), headers=auth_header(removed)), 403)
    listed = assert_envelope(client.get(members_url(board), headers=auth_header(board.owner)), 200)
    assert str(removed.user_id) not in [m["user_id"] for m in listed]


def test_admin_cannot_remove_self(client, make_board, auth_header, count_rows):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    assert_envelope(client.delete(member_url(board, board.owner), headers=auth_header(board.owner)), 400)
    assert count_rows(BoardMembership, BoardMembership.is_deleted.is_(False)) == 1


def test_remove_user_without_membership_is_404(client, make_board, make_user, auth_header):
    board = make_board()
    assert_envelope(client.delete(member_url(board, make_user()), headers=auth_header(board.owner)), 404)


def test_remove_already_removed_member_is_404(client, make_board, make_member, auth_header):
    board = make_board()
    member = make_member(board).member
    assert_envelope(client.delete(member_url(board, member), headers=auth_header(board.owner)), 200)
    assert_envelope(client.delete(member_url(board, member), headers=auth_header(board.owner)), 404)


# --- roles and 404s ---------------------------------------------------------------------------------------


def test_non_admin_member_cannot_add_or_remove(client, make_board, make_member, make_user, auth_header, count_rows):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    member = make_member(board).member
    victim = make_member(board).member
    target = make_user()
    headers = auth_header(member)
    assert_envelope(client.post(members_url(board), json={"email": target.email}, headers=headers), 403)
    assert_envelope(client.delete(member_url(board, victim), headers=headers), 403)
    assert count_rows(BoardMembership, BoardMembership.board_id == board.board_id, BoardMembership.is_deleted.is_(False)) == 3


def test_non_member_gets_403_on_every_members_endpoint(client, make_board, make_user, auth_header):
    board = make_board()
    outsider = make_user()
    target = make_user()
    headers = auth_header(outsider)
    assert_envelope(client.get(members_url(board), headers=headers), 403)
    assert_envelope(client.post(members_url(board), json={"email": target.email}, headers=headers), 403)
    assert_envelope(client.delete(member_url(board, target), headers=headers), 403)


def test_members_endpoints_404_for_missing_board_and_malformed_ids(client, make_user, auth_header):
    user = make_user()
    headers = auth_header(user)
    missing = uuid.uuid4()
    assert_envelope(client.get(f"/api/boards/{missing}/members", headers=headers), 404)
    assert_envelope(client.post(f"/api/boards/{missing}/members", json={"email": "a@b.co"}, headers=headers), 404)
    assert_envelope(client.delete(f"/api/boards/{missing}/members/{user.user_id}", headers=headers), 404)
    assert_envelope(client.get("/api/boards/xyz/members", headers=headers), 404)


def test_members_endpoints_require_a_token(client):
    url = f"/api/boards/{uuid.uuid4()}/members"
    assert_envelope(client.get(url), 401)
    assert_envelope(client.post(url, json={"email": "a@b.co"}), 401)


# --- properties ----------------------------------------------------------------------------------------------


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows (membership)
@DB_SETTINGS
@given(st.integers(min_value=1, max_value=3))
def test_membership_can_be_recreated_after_removal(
    client, reset_database, make_board, make_user, auth_header, count_rows, cycles
):
    from app.blueprints.boards.schema import BoardMembership

    reset_database()
    board = make_board()
    target = make_user()
    headers = auth_header(board.owner)
    for _ in range(cycles):
        assert_envelope(client.post(members_url(board), json={"email": target.email}, headers=headers), 201)
        assert_envelope(client.post(members_url(board), json={"email": target.email}, headers=headers), 409)
        assert_envelope(client.delete(member_url(board, target), headers=headers), 200)
    rows = count_rows(BoardMembership, BoardMembership.user_id == target.user_id)
    active_rows = count_rows(
        BoardMembership, BoardMembership.user_id == target.user_id, BoardMembership.is_deleted.is_(False)
    )
    assert (rows, active_rows) == (cycles, 0)


# Feature: kano, Property 18: Assignee must be a member and removal clears assignment (removal part)
@DB_SETTINGS
@given(st.integers(min_value=0, max_value=4), st.integers(min_value=0, max_value=4))
def test_removal_clears_only_the_removed_members_cards(
    client, reset_database, make_board, make_member, make_column, make_card, auth_header, fetch, mine, others
):
    from app.blueprints.cards.schema import Card

    reset_database()
    board = make_board()
    removed = make_member(board).member
    kept = make_member(board).member
    column = make_column(board)
    removed_cards = [make_card(column, assignee=removed) for _ in range(mine)]
    kept_cards = [make_card(column, assignee=kept) for _ in range(others)]
    assert_envelope(client.delete(member_url(board, removed), headers=auth_header(board.owner)), 200)
    assert all(fetch(Card, c.card_id).assignee_id is None for c in removed_cards)
    assert all(fetch(Card, c.card_id).assignee_id == kept.user_id for c in kept_cards)
