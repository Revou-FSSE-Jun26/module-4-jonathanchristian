"""pytest tests for POST /api/invites/<token>/accept and invite logging (V6)."""
import logging
import threading

import pytest

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def links_url(board):
    return f"/api/boards/{board.board_id}/invite-links"


def regen_url(board, role):
    return f"{links_url(board)}/{role}/regenerate"


def active_memberships(count_rows, board, user):
    from app.blueprints.boards.schema import BoardMembership as M

    return count_rows(M, M.board_id == board.board_id, M.user_id == user.user_id, M.is_deleted.is_(False))


@pytest.fixture
def tokens(client, auth_header):
    """`tokens(board, admin)` returns `(member_token, guest_token)` through the API."""

    def get(board, admin):
        data = assert_envelope(client.get(links_url(board), headers=auth_header(admin)), 200)
        return data["member"]["token"], data["guest"]["token"]

    return get


# --- accept ------------------------------------------------------------------------------------------------


@pytest.mark.parametrize("role,index", [("member", 0), ("guest", 1)])
def test_accept_creates_a_membership_with_the_token_role(
    client, make_board, make_user, auth_header, tokens, count_rows, role, index
):
    from app.blueprints.notifications.schema import Notification

    board, user = make_board(), make_user()
    token = tokens(board, board.owner)[index]
    data = assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(user)), 200)
    assert data == {"board_id": str(board.board_id), "role": role}
    assert active_memberships(count_rows, board, user) == 1
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(user)), 200)
    assert detail["my_role"] == role
    assert count_rows(Notification) == 0  # accepting creates no notification


@pytest.mark.parametrize(
    "existing,token_index,expected",
    [
        ("guest", 0, "member"),  # the only upgrade
        ("guest", 1, "guest"),
        ("member", 0, "member"),
        ("member", 1, "member"),  # no downgrade
        ("admin", 0, "admin"),
        ("admin", 1, "admin"),
    ],
)
def test_accept_never_lowers_a_role(
    client, make_board, make_member, auth_header, tokens, count_rows, existing, token_index, expected
):
    board = make_board()
    user = board.owner if existing == "admin" else make_member(board, role=existing).member
    token = tokens(board, board.owner)[token_index]
    for _ in range(2):  # repeating changes nothing
        data = assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(user)), 200)
        assert data["role"] == expected
    assert active_memberships(count_rows, board, user) == 1
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(user)), 200)
    assert detail["my_role"] == expected


def test_accept_does_not_consume_the_token(client, make_board, make_user, auth_header, tokens):
    board = make_board()
    token = tokens(board, board.owner)[1]
    for user in (make_user(), make_user(), make_user()):
        assert assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(user)), 200)["role"] == "guest"


def test_accept_after_removal_creates_a_new_row_and_leaves_the_old_one(
    client, make_board, make_member, auth_header, tokens, count_rows, fetch
):
    from app.blueprints.boards.schema import BoardMembership

    board = make_board()
    old = make_member(board)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}/members/{old.member.user_id}", headers=auth_header(board.owner)), 200)
    removed = fetch(BoardMembership, old.board_membership_id)
    assert removed.is_deleted is True
    token = tokens(board, board.owner)[0]
    assert assert_envelope(client.post(f"/api/invites/{token}/accept", headers=auth_header(old.member)), 200)["role"] == "member"
    assert active_memberships(count_rows, board, old.member) == 1
    assert count_rows(BoardMembership, BoardMembership.user_id == old.member.user_id) == 2
    untouched = fetch(BoardMembership, old.board_membership_id)
    assert (untouched.is_deleted, untouched.deleted_at) == (True, removed.deleted_at)


def test_two_simultaneous_accepts_end_with_one_active_membership(app, make_board, make_user, auth_header, tokens, count_rows, client):
    board = make_board()
    token = tokens(board, board.owner)[0]
    for _round in range(5):
        user = make_user()
        headers = auth_header(user)
        barrier, statuses = threading.Barrier(2), []

        def worker():
            thread_client = app.test_client()
            barrier.wait()
            statuses.append(thread_client.post(f"/api/invites/{token}/accept", headers=headers).status_code)

        threads = [threading.Thread(target=worker) for _ in range(2)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        assert statuses == [200, 200]
        assert active_memberships(count_rows, board, user) == 1


# --- logs never contain a token ----------------------------------------------------------------------------


@pytest.mark.parametrize("scenario", ["400", "401", "403", "404", "500"])
def test_invite_requests_leave_no_token_in_captured_logs(
    client, make_board, make_member, make_user, auth_header, tokens, caplog, monkeypatch, scenario
):
    from app.blueprints.boards.service import accept

    board = make_board()
    member_token, guest_token = tokens(board, board.owner)
    visitor = make_user()
    bad_token = "Zz9-" * 12
    with caplog.at_level(logging.DEBUG):
        if scenario == "400":
            assert_envelope(client.post(regen_url(board, "nope"), headers=auth_header(board.owner)), 400)
        elif scenario == "401":
            assert_envelope(client.post(f"/api/invites/{member_token}/accept"), 401)
        elif scenario == "403":
            assert_envelope(client.get(links_url(board), headers=auth_header(make_member(board).member)), 403)
        elif scenario == "404":
            assert_envelope(client.post(f"/api/invites/{bad_token}/accept", headers=auth_header(visitor)), 404)
        else:
            monkeypatch.setattr(accept, "_attempt", lambda *a, **k: 1 / 0)
            assert_envelope(client.post(f"/api/invites/{member_token}/accept", headers=auth_header(visitor)), 500)
        # the server's request line (werkzeug) goes through the same filter
        logging.getLogger("werkzeug").info('127.0.0.1 - - "POST /api/invites/%s/accept HTTP/1.1" 200 -', member_token)
        logging.getLogger("werkzeug").info('127.0.0.1 - - "GET /api/invites/%s HTTP/1.1" 404 -', bad_token)
    for secret in (member_token, guest_token, bad_token):
        assert secret not in caplog.text
    assert "/api/invites/<redacted>" in caplog.text
