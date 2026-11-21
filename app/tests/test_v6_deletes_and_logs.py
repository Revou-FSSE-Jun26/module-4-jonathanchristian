"""V6 additions to the soft-delete, hygiene, and log tests (task 27.14)."""
import logging
from datetime import timedelta

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import APP_DIR, assert_envelope, is_dynamic_sql, source_files

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
STATUSES = ("NOT_STARTED", "IN_PROGRESS", "DONE")


def pk_of(obj):
    return getattr(obj, obj.__table__.primary_key.columns.keys()[0])


@pytest.fixture
def tokens(client, auth_header):
    def get(board):
        data = assert_envelope(client.get(f"/api/boards/{board.board_id}/invite-links", headers=auth_header(board.owner)), 200)
        return data["member"]["token"], data["guest"]["token"]

    return get


# --- boards, tokens, guests ----------------------------------------------------------------------------


def test_deleting_a_board_kills_its_tokens_and_cascades_guest_memberships(
    client, make_board, make_member, make_user, make_column, make_card, auth_header, tokens, fetch
):
    from app.blueprints.boards.schema import Board

    board = make_board()
    guest, member = make_member(board, role="guest"), make_member(board)
    card = make_card(make_column(board), status="DONE", completed_at=board.created_at)
    member_token, guest_token = tokens(board)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)

    stored = fetch(Board, board.board_id)
    assert stored.is_deleted and (stored.member_invite_token, stored.guest_invite_token) == (member_token, guest_token)
    rows = [fetch(type(o), pk_of(o)) for o in (guest, member, card)]
    assert all(r.is_deleted for r in rows) and len({r.deleted_at for r in rows} | {stored.deleted_at}) == 1
    assert (rows[2].status, rows[2].completed_at) == ("DONE", card.completed_at)
    assert card.completed_at is not None

    visitor = auth_header(make_user())
    for token in (member_token, guest_token):
        assert_envelope(client.get(f"/api/invites/{token}", headers=visitor), 404)
        assert_envelope(client.post(f"/api/invites/{token}/accept", headers=visitor), 404)
    assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(guest.member)), 404)


def test_soft_deleted_done_cards_are_excluded_from_analytics(
    client, make_board, make_column, make_card, auth_header
):
    from app.soft_delete import start_of_week_utc, utcnow

    board = make_board()
    column = make_column(board)
    stamp = start_of_week_utc(utcnow()) + timedelta(seconds=1)
    make_card(column, status="DONE", completed_at=stamp)
    gone = make_card(column, status="DONE", completed_at=stamp)
    headers = auth_header(board.owner)
    assert_envelope(client.delete(f"/api/cards/{gone.card_id}", headers=headers), 200)
    data = assert_envelope(client.get(f"/api/boards/{board.board_id}/analytics", headers=headers), 200)
    assert data["completed_this_week"] == 1 and data["cards_per_column"][0]["count"] == 1


# --- logs ---------------------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "body",
    [
        {"password": "NewSecret-1234", "current_password": "wrong-current-pw"},
        {"password": "NewSecret-1234"},
        {"current_password": "wrong-current-pw"},
        {"email": "other@example.com", "current_password": "wrong-current-pw"},
        {"password": "short", "current_password": "wrong-current-pw"},
        {"name": ""},
    ],
)
def test_failing_profile_updates_leave_no_password_or_hash_in_the_logs(client, make_user, auth_header, caplog, body):
    user = make_user()
    with caplog.at_level(logging.DEBUG):
        response = client.patch("/api/users/me", json=body, headers=auth_header(user))
    assert response.status_code == 400
    forbidden = ["NewSecret-1234", "wrong-current-pw", "current_password", user.password, "pbkdf2", "scrypt"]
    assert not [word for word in forbidden if word in caplog.text]
    assert "password" not in " ".join(r.getMessage().lower() for r in caplog.records)


def test_an_unexpected_failure_while_changing_the_password_logs_no_secret(client, make_user, auth_header, caplog, monkeypatch):
    from app.blueprints.users import service

    def explode(user, data):
        raise RuntimeError("boom")

    monkeypatch.setattr(service, "update_me", explode)
    user = make_user()
    body = {"password": "NewSecret-1234", "current_password": user.password}
    with caplog.at_level(logging.DEBUG):
        response = client.patch("/api/users/me", json=body, headers=auth_header(user))
    assert assert_envelope(response, 500) == "Internal server error"
    assert "NewSecret-1234" not in caplog.text and user.password not in caplog.text


# --- static scan ----------------------------------------------------------------------------------------------


def test_the_sql_scan_covers_the_invite_and_analytics_code():
    scanned = {path.relative_to(APP_DIR).as_posix() for path in source_files()}
    for name in (
        "blueprints/boards/service/invite_service.py",
        "blueprints/boards/service/accept.py",
        "blueprints/analytics/service.py",
        "blueprints/users/service.py",
    ):
        assert name in scanned, name


def test_no_v6_module_builds_sql_from_strings():
    import ast

    for name in ("boards/service/invite_service.py", "boards/service/accept.py", "analytics/service.py"):
        tree = ast.parse((APP_DIR / "blueprints" / name).read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and node.args:
                func = node.func
                called = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
                if called in ("text", "execute", "exec_driver_sql"):
                    assert not is_dynamic_sql(node.args[0]), (name, node.lineno)


# --- properties ---------------------------------------------------------------------------------------------------


# Feature: kano, Property 6 and 7: re-run with Cards that have a status and Boards that have tokens
@DB_SETTINGS
@given(
    level=st.sampled_from(["board", "column", "card"]),
    target=st.integers(0, 1),
    statuses=st.lists(st.sampled_from(STATUSES), min_size=4, max_size=4),
    guests=st.integers(0, 2),
)
def test_property_cascade_with_statuses_tokens_and_guests(
    client, make_board, make_member, make_column, make_card, make_comment, auth_header, fetch,
    reset_database, level, target, statuses, guests,
):
    from app.blueprints.boards.schema import Board
    from app.soft_delete import utcnow

    reset_database()
    board = make_board()
    owner = board.owner
    guest_rows = [make_member(board, role="guest") for _ in range(guests)]
    columns = [make_column(board), make_column(board)]
    stamp = utcnow()
    cards = [
        make_card(columns[i // 2], status=s, completed_at=stamp if s == "DONE" else None)
        for i, s in enumerate(statuses)
    ]
    comments = [make_comment(card, owner) for card in cards]
    headers = auth_header(owner)
    links = assert_envelope(client.get(f"/api/boards/{board.board_id}/invite-links", headers=headers), 200)
    if level == "board":
        url, doomed = f"/api/boards/{board.board_id}", {board, *columns, *cards, *comments, *guest_rows}
    elif level == "column":
        url = f"/api/columns/{columns[target].column_id}"
        doomed = {columns[target], *cards[2 * target:2 * target + 2], *comments[2 * target:2 * target + 2]}
    else:
        url, doomed = f"/api/cards/{cards[target].card_id}", {cards[target], comments[target]}
    assert_envelope(client.delete(url, headers=headers), 200)

    stamps = set()
    for obj in [board, *columns, *cards, *comments, *guest_rows]:
        current = fetch(type(obj), pk_of(obj))
        assert current is not None and current.created_at == obj.created_at  # never physically removed
        assert current.is_deleted == (obj in doomed)
        if obj in doomed:
            stamps.add(current.deleted_at)
    assert len(stamps) == 1
    for card, status in zip(cards, statuses):  # status and completed_at survive a soft delete
        current = fetch(type(card), card.card_id)
        assert current.status == status and (current.completed_at is not None) == (status == "DONE")
    row = fetch(Board, board.board_id)
    assert row.member_invite_token == links["member"]["token"] and row.guest_invite_token == links["guest"]["token"]
    visitor = auth_header(owner)
    expected = 404 if level == "board" else 200
    for link in links.values():
        assert client.get(f"/api/invites/{link['token']}", headers=visitor).status_code == expected
    if level != "board":
        shown = {
            c["card_id"]: c["status"]
            for col in assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)["columns"]
            for c in col["cards"]
        }
        assert shown == {str(c.card_id): s for c, s in zip(cards, statuses) if c not in doomed}
