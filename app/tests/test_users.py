"""pytest tests for GET and PATCH /api/users/me."""
import uuid

import pytest
from flask_jwt_extended import create_access_token
from hypothesis import HealthCheck, assume, given, settings
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


def test_get_me_returns_profile_without_secrets(client, make_user, auth_header):
    user = make_user(name="Ada", email="ada@example.com")
    data = assert_envelope(client.get("/api/users/me", headers=auth_header(user)), 200)
    assert set(data) == {"user_id", "name", "email", "created_at"}
    assert data["user_id"] == str(user.user_id)
    assert (data["name"], data["email"]) == ("Ada", "ada@example.com")
    assert data["created_at"].endswith("Z")


def test_patch_name_only(client, make_user, auth_header, fetch):
    from app.blueprints.users.schema import User

    user = make_user(name="Old", email="old@example.com")
    data = assert_envelope(
        client.patch("/api/users/me", json={"name": "  New Name "}, headers=auth_header(user)), 200
    )
    assert data["name"] == "New Name" and data["email"] == "old@example.com"
    row = fetch(User, user.user_id)
    assert row.updated_at > user.updated_at


def test_patch_email_is_stored_lowercase(client, make_user, auth_header, fetch):
    from app.blueprints.users.schema import User

    user = make_user(name="Keep")
    data = assert_envelope(
        client.patch("/api/users/me", json={"email": " New.Mail@Example.COM "}, headers=auth_header(user)),
        200,
    )
    assert data["email"] == "new.mail@example.com" and data["name"] == "Keep"
    assert fetch(User, user.user_id).email == "new.mail@example.com"


def test_patch_own_email_in_other_case_is_allowed(client, make_user, auth_header):
    user = make_user(email="me@example.com")
    response = client.patch("/api/users/me", json={"email": "ME@example.com"}, headers=auth_header(user))
    assert assert_envelope(response, 200)["email"] == "me@example.com"


@pytest.mark.parametrize(
    "body",
    [
        {"password": "newpassword1"},
        {"name": "Ok", "password": "newpassword1"},
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 101},
        {"email": "not-an-email"},
        {"email": "a@b"},
        {"email": "a" * 250 + "@example.com"},
        {},
        {"unknown": 1},
        {"name": 5},
    ],
)
def test_patch_invalid_bodies_return_400_and_change_nothing(
    client, make_user, auth_header, fetch, body
):
    from app.blueprints.users.schema import User

    user = make_user(name="Stable", email="stable@example.com")
    assert_envelope(client.patch("/api/users/me", json=body, headers=auth_header(user)), 400)
    row = fetch(User, user.user_id)
    assert (row.name, row.email, row.password_hash) == ("Stable", "stable@example.com", user.password_hash)


def test_patch_without_json_body_is_400(client, make_user, auth_header):
    user = make_user()
    response = client.patch("/api/users/me", data="not json", headers=auth_header(user))
    assert_envelope(response, 400)


def test_patch_boundaries_accept_100_char_name(client, make_user, auth_header):
    user = make_user()
    response = client.patch("/api/users/me", json={"name": "n" * 100}, headers=auth_header(user))
    assert len(assert_envelope(response, 200)["name"]) == 100


def test_duplicate_email_in_other_case_is_409(client, make_user, auth_header, fetch):
    from app.blueprints.users.schema import User

    make_user(email="taken@example.com")
    user = make_user(email="mine@example.com")
    response = client.patch("/api/users/me", json={"email": "TAKEN@Example.com"}, headers=auth_header(user))
    assert_envelope(response, 409)
    assert fetch(User, user.user_id).email == "mine@example.com"


def test_soft_deleted_email_does_not_block_update(client, make_user, make_deleted_user, auth_header):
    make_deleted_user("free@example.com")
    user = make_user()
    response = client.patch("/api/users/me", json={"email": "Free@Example.com"}, headers=auth_header(user))
    assert assert_envelope(response, 200)["email"] == "free@example.com"


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
def test_soft_deleted_subject_yields_401(client, reset_database, make_deleted_user, auth_header, email):
    reset_database()
    user = make_deleted_user(email)
    assert_envelope(client.get("/api/users/me", headers=auth_header(user)), 401)


# Feature: kano, Property 17: Partial update (user)
@DB_SETTINGS
@given(st.one_of(st.none(), _names), st.one_of(st.none(), _emails))
def test_partial_update_changes_only_supplied_fields(
    client, reset_database, make_user, auth_header, fetch, name, email
):
    from app.blueprints.users.schema import User

    assume(name is not None or email is not None)
    reset_database()
    user = make_user(name="Original", email="original@example.com")
    body = {}
    if name is not None:
        body["name"] = name
    if email is not None:
        body["email"] = email
    data = assert_envelope(client.patch("/api/users/me", json=body, headers=auth_header(user)), 200)
    expected_name = name if name is not None else "Original"
    expected_email = email.lower() if email is not None else "original@example.com"
    assert (data["name"], data["email"]) == (expected_name, expected_email)
    row = fetch(User, user.user_id)
    assert (row.name, row.email) == (expected_name, expected_email)
    assert row.password_hash == user.password_hash
    assert row.updated_at >= user.updated_at


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows (user part)
@DB_SETTINGS
@given(_emails)
def test_email_uniqueness_is_case_insensitive_and_ignores_deleted(
    client, reset_database, make_user, make_deleted_user, auth_header, email
):
    reset_database()
    make_deleted_user(email)  # a soft-deleted row never blocks
    owner = make_user()
    assert_envelope(
        client.patch("/api/users/me", json={"email": email.upper()}, headers=auth_header(owner)), 200
    )
    other = make_user()
    response = client.patch("/api/users/me", json={"email": email.lower()}, headers=auth_header(other))
    assert_envelope(response, 409)
    assert uuid.UUID(str(other.user_id))
