"""Property tests for invitation tokens and accept (V6, Properties 49, 51, 57)."""
import logging
import re

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app.blueprints.boards.service.accept import resolve_accept
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
TOKEN_FORMAT = re.compile(r"^[A-Za-z0-9_-]{43,128}$")


def links(client, auth_header, board):
    url = f"/api/boards/{board.board_id}/invite-links"
    return assert_envelope(client.get(url, headers=auth_header(board.owner)), 200)


def info_status(client, headers, token):
    return client.get(f"/api/invites/{token}", headers=headers).status_code


# Feature: kano, Property 49: Invite tokens are well formed, unique, and regeneration invalidates
@DB_SETTINGS
@given(
    boards=st.integers(min_value=1, max_value=3),
    regenerations=st.lists(st.tuples(st.integers(min_value=0, max_value=2), st.sampled_from(["member", "guest"])), max_size=6),
    junk=st.one_of(st.text(max_size=80), st.text(alphabet="abcXYZ_-019", min_size=1, max_size=42)),
)
def test_tokens_are_well_formed_unique_and_regeneration_invalidates(
    client, reset_database, make_user, make_board, auth_header, boards, regenerations, junk
):
    reset_database()
    visitor = auth_header(make_user())
    made = [make_board() for _ in range(boards)]
    current = {}
    for index, board in enumerate(made):
        data = links(client, auth_header, board)
        current[index] = {"member": data["member"]["token"], "guest": data["guest"]["token"]}
    replaced = []
    for board_index, role in regenerations:
        index = board_index % boards
        board = made[index]
        before = dict(current[index])
        url = f"/api/boards/{board.board_id}/invite-links/{role}/regenerate"
        data = assert_envelope(client.post(url, headers=auth_header(board.owner)), 200)
        replaced.append(before[role])
        current[index][role] = data["token"]
        other = "guest" if role == "member" else "member"
        assert current[index][other] == before[other]  # the other role is untouched
    every = [token for per_board in current.values() for token in per_board.values()]
    assert len(set(every)) == len(every) == 2 * boards  # unique across Boards and both roles
    assert all(TOKEN_FORMAT.match(token) for token in every)
    for index, per_board in current.items():
        for role, token in per_board.items():
            response = client.get(f"/api/invites/{token}", headers=visitor)
            assert assert_envelope(response, 200)["role"] == role
    for token in replaced:
        if token not in every:
            assert info_status(client, visitor, token) == 404
    if junk not in every and not TOKEN_FORMAT.match(junk):
        assert info_status(client, visitor, junk.replace("/", "x") or "x") == 404
    # a soft-deleted Board answers 404 for both of its tokens
    assert_envelope(client.delete(f"/api/boards/{made[0].board_id}", headers=auth_header(made[0].owner)), 200)
    for token in current[0].values():
        assert info_status(client, visitor, token) == 404


_existing = st.sampled_from([None, "guest", "member", "admin", "removed"])


# Feature: kano, Property 51: Accept is idempotent and keeps one active membership
@DB_SETTINGS
@given(existing=_existing, accepts=st.lists(st.sampled_from(["member", "guest"]), min_size=1, max_size=5))
def test_accept_is_idempotent_and_keeps_one_active_membership(
    client, reset_database, make_user, make_board, make_member, auth_header, count_rows, fetch, existing, accepts
):
    from app.blueprints.boards.schema import BoardMembership as M

    reset_database()
    board = make_board()
    tokens = links(client, auth_header, board)
    user = board.owner if existing == "admin" else make_user()
    old_row = None
    if existing in ("guest", "member"):
        make_member(board, user, role=existing)
    elif existing == "removed":
        old_row = make_member(board, user, role="member")
        assert_envelope(client.delete(f"/api/boards/{board.board_id}/members/{user.user_id}", headers=auth_header(board.owner)), 200)
        old_row = fetch(M, old_row.board_membership_id)
    role = None if existing in (None, "removed") else existing
    for token_role in accepts:
        expected, _action = resolve_accept(role, token_role)
        url = f"/api/invites/{tokens[token_role]['token']}/accept"
        data = assert_envelope(client.post(url, headers=auth_header(user)), 200)
        assert data == {"board_id": str(board.board_id), "role": expected}
        role = expected
        assert count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id, M.is_deleted.is_(False)) == 1
    assert tokens == links(client, auth_header, board)  # no accept consumes a token
    if old_row is not None:
        again = fetch(M, old_row.board_membership_id)
        assert (again.is_deleted, again.deleted_at, again.role) == (True, old_row.deleted_at, old_row.role)


# Feature: kano, Property 57: Invite tokens never reach the logs (integration: captured logs)
@DB_SETTINGS
@given(st.sampled_from(["accept", "info", "bad-role", "forbidden", "unknown"]))
def test_no_invite_request_leaves_a_token_in_the_logs(
    client, reset_database, make_user, make_board, make_member, auth_header, caplog, kind
):
    reset_database()
    board = make_board()
    tokens = links(client, auth_header, board)
    secrets_ = [tokens["member"]["token"], tokens["guest"]["token"]]
    visitor = make_user()
    caplog.clear()
    with caplog.at_level(logging.DEBUG):
        if kind == "accept":
            client.post(f"/api/invites/{secrets_[0]}/accept", headers=auth_header(visitor))
        elif kind == "info":
            client.get(f"/api/invites/{secrets_[1]}", headers=auth_header(visitor))
        elif kind == "bad-role":
            client.post(f"/api/boards/{board.board_id}/invite-links/bad/regenerate", headers=auth_header(board.owner))
        elif kind == "forbidden":
            client.get(f"/api/boards/{board.board_id}/invite-links", headers=auth_header(make_member(board).member))
        else:
            unknown = "Qq7_" * 11
            secrets_.append(unknown)
            client.post(f"/api/invites/{unknown}/accept", headers=auth_header(visitor))
        for secret in secrets_:
            logging.getLogger("werkzeug").info('"GET /api/invites/%s HTTP/1.1" 200 -', secret)
    for secret in secrets_:
        assert secret not in caplog.text
