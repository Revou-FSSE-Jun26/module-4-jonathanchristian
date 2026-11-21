"""pytest tests for GET and PATCH /api/users/me (V6 contract: name and password, email fixed)."""
import logging

import pytest
from flask_jwt_extended import create_access_token
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
_names = st.text(alphabet="abcdefghijklmnopqrstuvwxyzABCDEFG0123456789", min_size=1, max_size=100)
_emails = st.from_regex(r"[a-zA-Z][a-zA-Z0-9]{0,20}@[a-z]{1,10}\.[a-z]{2,4}", fullmatch=True)


def _row(fetch, user):
    from app.blueprints.users.schema import User

    return fetch(User, user.user_id)


def _patch(client, user, auth_header, body):
    return client.patch("/api/users/me", json=body, headers=auth_header(user))


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


# --- GET ----------------------------------------------------------------------------------------------


def test_get_me_returns_profile_without_secrets(client, make_user, auth_header):
    user = make_user(name="Ada", email="ada@example.com")
    data = assert_envelope(client.get("/api/users/me", headers=auth_header(user)), 200)
    assert set(data) == {"user_id", "name", "email", "created_at"}
    assert data["user_id"] == str(user.user_id)
    assert (data["name"], data["email"]) == ("Ada", "ada@example.com")
    assert data["created_at"].endswith("Z")


# --- PATCH: name and password ----------------------------------------------------------------------


def test_patch_name_only(client, make_user, auth_header, fetch):
    user = make_user(name="Old", email="old@example.com")
    data = assert_envelope(_patch(client, user, auth_header, {"name": "  New Name "}), 200)
    assert set(data) == {"user_id", "name", "email", "created_at"}
    assert data["name"] == "New Name" and data["email"] == "old@example.com"
    row = _row(fetch, user)
    assert row.updated_at > user.updated_at
    assert row.password_hash == user.password_hash


@pytest.mark.parametrize("length,status", [(0, 400), (1, 200), (100, 200), (101, 400)])
def test_name_boundaries(client, make_user, auth_header, length, status):
    user = make_user()
    assert_envelope(_patch(client, user, auth_header, {"name": "n" * length}), status)


@pytest.mark.parametrize("length,status", [(7, 400), (8, 200), (128, 200), (129, 400)])
def test_password_boundaries_with_the_correct_current_password(
    client, make_user, auth_header, fetch, length, status
):
    user = make_user(email="pw@example.com")
    new = "p" * length
    body = {"password": new, "current_password": user.password}
    data = assert_envelope(_patch(client, user, auth_header, body), status)
    if status == 200:
        assert "password" not in data and "password_hash" not in data
        assert _login(client, "pw@example.com", new).status_code == 200  # new password works
        assert _login(client, "pw@example.com", user.password).status_code == 401  # old one fails
        assert _row(fetch, user).password_hash != user.password_hash
    else:
        assert _row(fetch, user).password_hash == user.password_hash
        assert _login(client, "pw@example.com", user.password).status_code == 200


def test_password_change_stores_a_salted_hash_and_keeps_old_tokens_valid(
    client, make_user, auth_header, fetch
):
    from werkzeug.security import check_password_hash

    user = make_user()
    headers = auth_header(user)
    body = {"password": "brand-new-pass", "current_password": user.password}
    assert_envelope(client.patch("/api/users/me", json=body, headers=headers), 200)
    stored = _row(fetch, user).password_hash
    assert stored != "brand-new-pass" and check_password_hash(stored, "brand-new-pass")
    assert_envelope(client.get("/api/users/me", headers=headers), 200)  # no token invalidation


def test_name_and_password_change_together(client, make_user, auth_header, fetch):
    user = make_user(name="Before")
    body = {"name": "After", "password": "another-pass1", "current_password": user.password}
    assert assert_envelope(_patch(client, user, auth_header, body), 200)["name"] == "After"
    assert _row(fetch, user).name == "After"


@pytest.mark.parametrize("current", [None, "wrong-password", " "])
def test_wrong_or_missing_current_password_is_400_naming_it_and_saves_nothing(
    client, make_user, auth_header, fetch, current
):
    user = make_user(name="Stable")
    body = {"name": "Changed", "password": "valid-new-pass"}
    if current is not None:
        body["current_password"] = current
    message = assert_envelope(_patch(client, user, auth_header, body), 400)
    assert "current_password" in message
    row = _row(fetch, user)
    assert (row.name, row.password_hash) == ("Stable", user.password_hash)  # name not saved either


@pytest.mark.parametrize("value", ["me@example.com", "ME@example.com", "other@example.com", "", None, 5, "x"])
def test_any_email_value_is_400_naming_email(client, make_user, auth_header, fetch, value):
    user = make_user(name="Stable", email="me@example.com")
    body = {"email": value, "name": "Changed"}
    assert "email" in assert_envelope(_patch(client, user, auth_header, body), 400)
    row = _row(fetch, user)
    assert (row.name, row.email) == ("Stable", "me@example.com")


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"unknown": 1},
        {"name": ""},
        {"name": "   "},
        {"name": 5},
        {"current_password": "password123"},
        {"name": "Ok", "current_password": "password123"},
        {"password": "new-password-1"},
        {"password": "new-password-1", "current_password": ""},
        {"password": 12345678, "current_password": "password123"},
    ],
)
def test_invalid_bodies_return_400_and_change_nothing(client, make_user, auth_header, fetch, body):
    user = make_user(name="Stable", email="stable@example.com")
    assert_envelope(_patch(client, user, auth_header, body), 400)
    row = _row(fetch, user)
    assert (row.name, row.email, row.password_hash) == ("Stable", "stable@example.com", user.password_hash)


def test_patch_without_json_body_is_400(client, make_user, auth_header):
    user = make_user()
    response = client.patch("/api/users/me", data="not json", headers=auth_header(user))
    assert_envelope(response, 400)


def test_responses_and_logs_never_contain_passwords_or_hashes(client, make_user, auth_header, caplog):
    user = make_user()
    new = "SuperSecretNew-123"
    with caplog.at_level(logging.DEBUG):
        responses = [
            _patch(client, user, auth_header, {"password": new, "current_password": "wrong-one-xyz"}),
            _patch(client, user, auth_header, {"email": "x@example.com"}),
            _patch(client, user, auth_header, {"password": new, "current_password": user.password}),
        ]
    assert [r.status_code for r in responses] == [400, 400, 200]
    for response in responses:
        text = response.get_data(as_text=True)
        for forbidden in (new, "wrong-one-xyz", user.password, "password_hash", "pbkdf2", "scrypt"):
            assert forbidden not in text
    for forbidden in (new, "wrong-one-xyz", user.password, "pbkdf2", "scrypt"):
        assert forbidden not in caplog.text


# --- 401 paths ----------------------------------------------------------------------------------------


@pytest.mark.parametrize("method", ["get", "patch"])
def test_missing_or_garbage_token_is_401(client, method):
    call = getattr(client, method)
    assert_envelope(call("/api/users/me", json={"name": "x"}), 401)
    assert_envelope(call("/api/users/me", json={"name": "x"}, headers={"Authorization": "Bearer abc.def.ghi"}), 401)


@pytest.mark.parametrize("method", ["get", "patch"])
def test_refresh_token_is_rejected_with_401(client, make_user, refresh_header, method):
    user = make_user()
    response = getattr(client, method)("/api/users/me", json={"name": "x"}, headers=refresh_header(user))
    assert_envelope(response, 401)


@pytest.mark.parametrize("method", ["get", "patch"])
def test_token_of_soft_deleted_user_is_401(client, make_deleted_user, auth_header, method):
    user = make_deleted_user()
    response = getattr(client, method)("/api/users/me", json={"name": "x"}, headers=auth_header(user))
    assert_envelope(response, 401)


def _token_for_subject(app, subject):
    with app.app_context():
        return {"Authorization": f"Bearer {create_access_token(identity=subject)}"}


# Feature: kano, Property 43: Deleted or unknown token subject yields 401
@DB_SETTINGS
@given(st.one_of(st.uuids().map(str), st.text(max_size=40)))
def test_unknown_subject_yields_401(app, client, reset_database, subject):
    reset_database()
    headers = _token_for_subject(app, subject)
    assert_envelope(client.get("/api/users/me", headers=headers), 401)
    assert_envelope(client.patch("/api/users/me", json={"name": "x"}, headers=headers), 401)


# Feature: kano, Property 43: Deleted or unknown token subject yields 401
@DB_SETTINGS
@given(_emails)
def test_soft_deleted_subject_yields_401_on_get_and_patch(
    client, reset_database, make_deleted_user, auth_header, email
):
    reset_database()
    user = make_deleted_user(email)
    assert_envelope(client.get("/api/users/me", headers=auth_header(user)), 401)
    body = {"name": "x", "password": "newpassword1", "current_password": user.password}
    assert_envelope(client.patch("/api/users/me", json=body, headers=auth_header(user)), 401)
