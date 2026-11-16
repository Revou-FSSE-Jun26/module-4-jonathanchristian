"""pytest tests for POST /api/auth/register and POST /api/auth/login."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from werkzeug.security import check_password_hash

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
_names = st.text(alphabet="abcdefghijklmnopqrstuvwxyzABCDEFG0123456789", min_size=1, max_size=100)
_emails = st.from_regex(r"[a-zA-Z][a-zA-Z0-9]{0,20}@[a-z]{1,10}\.[a-z]{2,4}", fullmatch=True)
_passwords = st.text(
    alphabet=st.characters(blacklist_categories=("Cs", "Cc")), min_size=8, max_size=128
)
LOGIN_ERROR = "Invalid email or password"


def register_body(**overrides):
    body = {"name": "Grace", "email": "grace@example.com", "password": "password123"}
    body.update(overrides)
    return body


def _user_count(count_rows):
    from app.blueprints.users.schema import User

    return count_rows(User)


# --- register ---------------------------------------------------------------------------------


def test_register_success_returns_profile_only(client, count_rows):
    response = client.post("/api/auth/register", json=register_body(email=" Grace@Example.COM "))
    data = assert_envelope(response, 201)
    assert set(data) == {"user_id", "name", "email", "created_at"}
    assert data["email"] == "grace@example.com"
    assert "password" not in response.get_data(as_text=True).lower()
    assert _user_count(count_rows) == 1


def test_register_stores_a_salted_hash(client, fetch):
    from app.blueprints.users.schema import User

    first = assert_envelope(client.post("/api/auth/register", json=register_body()), 201)
    second = assert_envelope(
        client.post("/api/auth/register", json=register_body(email="other@example.com")), 201
    )
    one, two = fetch(User, uuid.UUID(first["user_id"])), fetch(
        User, uuid.UUID(second["user_id"])
    )
    assert one.password_hash != "password123"
    assert one.password_hash != two.password_hash
    assert check_password_hash(one.password_hash, "password123")


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 101},
        {"email": ""},
        {"email": "plainaddress"},
        {"email": "a" * 243 + "@example.com"},  # 255 characters
        {"password": "1234567"},
        {"password": "p" * 129},
        {"unexpected": "field"},
    ],
)
def test_register_invalid_field_returns_400_and_creates_nothing(client, count_rows, overrides):
    assert_envelope(client.post("/api/auth/register", json=register_body(**overrides)), 400)
    assert _user_count(count_rows) == 0


@pytest.mark.parametrize("missing", ["name", "email", "password"])
def test_register_missing_field_is_400_and_names_the_field(client, count_rows, missing):
    body = register_body()
    del body[missing]
    message = assert_envelope(client.post("/api/auth/register", json=body), 400)
    assert missing in message
    assert _user_count(count_rows) == 0


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": "n"},
        {"name": "n" * 100},
        {"password": "12345678"},
        {"password": "p" * 128},
        {"email": "a" * 242 + "@example.com"},  # exactly 254 characters
    ],
)
def test_register_boundary_values_are_accepted(client, overrides):
    assert_envelope(client.post("/api/auth/register", json=register_body(**overrides)), 201)


def test_register_non_json_body_is_400(client):
    assert_envelope(client.post("/api/auth/register", data="nope"), 400)


def test_register_duplicate_email_in_other_case_is_409(client, count_rows):
    assert_envelope(client.post("/api/auth/register", json=register_body()), 201)
    message = assert_envelope(
        client.post("/api/auth/register", json=register_body(email="GRACE@example.com")), 409
    )
    assert "already registered" in message
    assert _user_count(count_rows) == 1


def test_register_over_soft_deleted_email_succeeds(client, make_deleted_user):
    make_deleted_user("grace@example.com")
    assert_envelope(client.post("/api/auth/register", json=register_body()), 201)


# --- login ------------------------------------------------------------------------------------


def test_login_success_shape(client, make_user):
    user = make_user(email="login@example.com", password="secret-pass-1")
    response = client.post(
        "/api/auth/login", json={"email": "LOGIN@example.com", "password": "secret-pass-1"}
    )
    data = assert_envelope(response, 200)
    assert set(data) == {
        "access_token",
        "refresh_token",
        "token_type",
        "expires_in",
        "refresh_expires_in",
        "user",
    }
    assert data["token_type"] == "Bearer"
    assert (data["expires_in"], data["refresh_expires_in"]) == (3600, 604800)
    assert data["user"]["user_id"] == str(user.user_id)
    assert set(data["user"]) == {"user_id", "name", "email", "created_at"}


def test_login_failures_share_one_401_message(client, make_user, make_deleted_user):
    make_user(email="real@example.com", password="right-password")
    make_deleted_user("gone@example.com", password="right-password")
    attempts = [
        {"email": "nobody@example.com", "password": "right-password"},
        {"email": "real@example.com", "password": "wrong-password"},
        {"email": "gone@example.com", "password": "right-password"},
    ]
    messages = [assert_envelope(client.post("/api/auth/login", json=body), 401) for body in attempts]
    assert messages == [LOGIN_ERROR] * 3


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"email": "a@example.com"},
        {"password": "password123"},
        {"email": "", "password": "password123"},
        {"email": "a@example.com", "password": ""},
        {"email": "not-an-email", "password": "password123"},
        {"email": "a@example.com", "password": "x", "extra": 1},
    ],
)
def test_login_invalid_input_is_400_with_no_tokens(client, body):
    response = client.post("/api/auth/login", json=body)
    assert_envelope(response, 400)
    assert "token" not in response.get_data(as_text=True).replace("Missing data", "")


def test_login_non_json_body_is_400(client):
    assert_envelope(client.post("/api/auth/login", data="nope"), 400)


# --- properties ---------------------------------------------------------------------------------


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows (email normalization)
@DB_SETTINGS
@given(_emails, st.randoms(use_true_random=False))
def test_email_normalization_and_soft_deleted_uniqueness(
    client, reset_database, make_deleted_user, fetch, email, rnd
):
    from app.blueprints.users.schema import User

    reset_database()
    make_deleted_user(email)
    mixed = "".join(c.upper() if rnd.random() < 0.5 else c.lower() for c in email)
    created = assert_envelope(client.post("/api/auth/register", json=register_body(email=mixed)), 201)
    assert created["email"] == email.lower()
    swapped = email.swapcase()
    assert_envelope(client.post("/api/auth/register", json=register_body(email=swapped)), 409)
    assert fetch(User, uuid.UUID(created["user_id"])).email == email.lower()


# Feature: kano, Property 10: Password handling
@DB_SETTINGS
@given(_passwords)
def test_password_is_hashed_and_never_returned(client, reset_database, fetch, password):
    from app.blueprints.users.schema import User

    reset_database()
    response = client.post("/api/auth/register", json=register_body(password=password))
    data = assert_envelope(response, 201)
    row = fetch(User, uuid.UUID(data["user_id"]))
    assert row.password_hash != password
    assert check_password_hash(row.password_hash, password)
    text = response.get_data(as_text=True)
    assert row.password_hash not in text and "password" not in text.lower()


# Feature: kano, Property 11: Register then login round trip
@DB_SETTINGS
@given(_names, _emails, _passwords)
def test_register_then_login_round_trip(client, reset_database, name, email, password):
    reset_database()
    body = {"name": name, "email": email, "password": password}
    created = assert_envelope(client.post("/api/auth/register", json=body), 201)
    login = assert_envelope(
        client.post("/api/auth/login", json={"email": email.upper(), "password": password}), 200
    )
    assert login["user"]["user_id"] == created["user_id"]
    assert login["access_token"] and login["refresh_token"]
    wrong = client.post("/api/auth/login", json={"email": email, "password": password + "x"})
    assert_envelope(wrong, 401)


# Feature: kano, Property 12: Server input validation (auth fields)
@DB_SETTINGS
@given(
    st.text(max_size=140),
    st.text(max_size=300),
    st.text(max_size=140),
)
def test_register_validation_matches_the_documented_boundaries(
    client, reset_database, count_rows, name, email_text, password
):
    reset_database()
    response = client.post(
        "/api/auth/register", json={"name": name, "email": email_text, "password": password}
    )
    name_ok = 1 <= len(name.strip()) <= 100
    password_ok = 8 <= len(password) <= 128
    if response.status_code == 201:
        assert name_ok and password_ok
        assert _user_count(count_rows) == 1
    else:
        assert_envelope(response, 400)
        assert _user_count(count_rows) == 0
    if not (name_ok and password_ok):
        assert response.status_code == 400
