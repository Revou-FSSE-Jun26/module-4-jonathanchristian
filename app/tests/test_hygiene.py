"""Database failure and server-side hygiene tests (task 14.4)."""
import ast
import logging
import os

import pytest
from sqlalchemy.exc import OperationalError, ProgrammingError

from helpers import APP_DIR, assert_envelope, is_dynamic_sql, source_files

pytestmark = pytest.mark.e2e

DANGEROUS = [
    "'; DROP TABLE users; --",
    '" OR 1=1 --',
    "Robert'); DROP TABLE boards;--",
    "%s %(name)s {0} {x}",
    "100% \\ _ ; --",
]


def fail_after_user_lookup(monkeypatch, error):
    """Let the JWT user lookup (first query) pass, then raise `error` on the next query."""
    from app.extensions import db

    real, calls = db.session.execute, {"n": 0}

    def execute(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] >= 2:
            raise error
        return real(*args, **kwargs)

    monkeypatch.setattr(db.session, "execute", execute)


# --- database failures ----------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "error",
    [
        ProgrammingError("SELECT * FROM boards", {}, Exception('relation "boards" does not exist')),
        OperationalError("SELECT 1", {}, Exception("server closed the connection")),
    ],
    ids=["missing_table", "connection_lost"],
)
def test_database_failure_gives_generic_500_logs_it_and_the_app_keeps_serving(
    client, make_user, auth_header, monkeypatch, caplog, error
):
    user = make_user()
    headers = auth_header(user)
    with monkeypatch.context() as patch, caplog.at_level(logging.ERROR):
        fail_after_user_lookup(patch, error)
        message = assert_envelope(client.get("/api/boards", headers=headers), 500)
    assert message == "Internal server error"
    for word in ("boards", "relation", "SELECT", "connection"):
        assert word.lower() not in message.lower()
    assert any(record.exc_info for record in caplog.records), "the exception must be logged"
    assert assert_envelope(client.get("/api/boards", headers=headers), 200) == []
    assert assert_envelope(client.get("/api/health"), 200) == {"status": "ok"}


def test_unreachable_database_gives_500_and_health_still_answers(make_user, auth_header):
    from app import create_app

    unreachable = create_app({"DATABASE_URL": "postgresql+psycopg2://nobody:nopass@127.0.0.1:1/missing", "TESTING": True})
    headers = auth_header(make_user())
    with unreachable.test_client() as client:
        assert assert_envelope(client.get("/api/boards", headers=headers), 500) == "Internal server error"
        assert assert_envelope(client.post("/api/auth/login", json={"email": "a@b.co", "password": "password123"}), 500)
        assert assert_envelope(client.get("/api/health"), 200) == {"status": "ok"}
        assert_envelope(client.get("/api/boards", headers=headers), 500)  # and again: no crash


# --- log hygiene ----------------------------------------------------------------------------------------


def test_logs_never_contain_passwords_or_tokens(client, make_user, auth_header, monkeypatch, caplog):
    user = make_user()
    headers = auth_header(user)
    token = headers["Authorization"].split()[1]
    secret = "SuperSecretPw123!"
    with caplog.at_level(logging.DEBUG):
        assert_envelope(client.post("/api/auth/register", json={"name": "", "email": "x", "password": secret}), 400)
        assert_envelope(client.post("/api/auth/login", json={"email": "ghost@example.com", "password": secret}), 401)
        assert_envelope(client.get("/api/boards", headers={"Authorization": "Bearer not-a-token"}), 401)
        assert_envelope(client.get("/api/boards", headers=headers), 200)
        with monkeypatch.context() as patch:
            fail_after_user_lookup(patch, RuntimeError("boom"))
            assert_envelope(client.get("/api/boards", headers=headers), 500)
    text = caplog.text
    for forbidden in (secret, token, "not-a-token", "Bearer"):
        assert forbidden not in text
    assert "password" not in " ".join(record.getMessage().lower() for record in caplog.records)


# --- literal data -----------------------------------------------------------------------------------------


@pytest.mark.parametrize("value", DANGEROUS)
def test_sql_metacharacters_in_names_are_stored_and_returned_literally(client, make_user, auth_header, count_rows, value):
    from app.blueprints.boards.schema import Board
    from app.blueprints.users.schema import User

    body = {"name": value[:100], "email": "meta@example.com", "password": "password123"}
    registered = assert_envelope(client.post("/api/auth/register", json=body), 201)
    assert registered["name"] == value[:100].strip()
    login = assert_envelope(client.post("/api/auth/login", json={"email": "meta@example.com", "password": "password123"}), 200)
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    board = assert_envelope(client.post("/api/boards", json={"name": value[:100]}, headers=headers), 201)
    assert board["name"] == value[:100].strip()
    assert [b["name"] for b in assert_envelope(client.get("/api/boards", headers=headers), 200)] == [board["name"]]
    assert count_rows(User) == 1 and count_rows(Board) == 1


# --- static check -----------------------------------------------------------------------------------------------


def test_no_sql_is_built_by_string_formatting():
    offenders = []
    for path in source_files():
        for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
            if not isinstance(node, ast.Call) or not node.args:
                continue
            func = node.func
            name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
            if name in ("text", "execute", "exec_driver_sql") and is_dynamic_sql(node.args[0]):
                offenders.append(f"{path.relative_to(APP_DIR)}:{node.lineno}")
    assert offenders == []


def test_static_check_detects_a_formatted_query():
    sample = ast.parse('db.session.execute(f"SELECT {x}")\ntext("a" % b)\ntext("a".format(b))\ntext("fine")')
    flagged = [is_dynamic_sql(call.args[0]) for call in ast.walk(sample) if isinstance(call, ast.Call) and call.args]
    assert flagged.count(True) == 3 and os.path.exists(APP_DIR)
