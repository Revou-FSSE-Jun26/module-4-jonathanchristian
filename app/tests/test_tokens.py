"""pytest tests for access/refresh tokens, POST /api/auth/refresh, and token type enforcement."""
import uuid
from datetime import timedelta

import pytest
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from werkzeug.routing import RequestRedirect
from werkzeug.exceptions import MethodNotAllowed, NotFound

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
_emails = st.from_regex(r"[a-zA-Z][a-zA-Z0-9]{0,20}@[a-z]{1,10}\.[a-z]{2,4}", fullmatch=True)
ID = "00000000-0000-4000-8000-000000000001"

# (method, path) of every protected endpoint other than POST /api/auth/refresh (design A11).
# Endpoints that a later task has not implemented yet are skipped by the lookup below.
PROTECTED_ENDPOINTS = [
    ("GET", "/api/users/me"),
    ("PATCH", "/api/users/me"),
    ("POST", "/api/boards"),
    ("GET", "/api/boards"),
    ("GET", f"/api/boards/{ID}"),
    ("PATCH", f"/api/boards/{ID}"),
    ("DELETE", f"/api/boards/{ID}"),
    ("POST", f"/api/boards/{ID}/members"),
    ("GET", f"/api/boards/{ID}/members"),
    ("DELETE", f"/api/boards/{ID}/members/{ID}"),
    ("POST", f"/api/boards/{ID}/columns"),
    ("PATCH", f"/api/columns/{ID}"),
    ("DELETE", f"/api/columns/{ID}"),
    ("PATCH", f"/api/boards/{ID}/columns/reorder"),
    ("POST", f"/api/columns/{ID}/cards"),
    ("PATCH", f"/api/cards/{ID}"),
    ("DELETE", f"/api/cards/{ID}"),
    ("PATCH", f"/api/cards/{ID}/position"),
    ("GET", "/api/cards?assignee=me"),
    ("POST", f"/api/cards/{ID}/comments"),
    ("GET", f"/api/cards/{ID}/comments"),
    ("PATCH", f"/api/comments/{ID}"),
    ("DELETE", f"/api/comments/{ID}"),
    ("GET", "/api/notifications"),
    ("PATCH", f"/api/notifications/{ID}/read"),
    ("GET", f"/api/boards/{ID}/analytics"),
]


def _is_implemented(app, method, path):
    adapter = app.url_map.bind("localhost")
    try:
        adapter.match(path.split("?")[0], method=method)
        return True
    except (NotFound, MethodNotAllowed, RequestRedirect):
        return False


@pytest.fixture
def implemented_endpoints(app):
    return [(m, p) for m, p in PROTECTED_ENDPOINTS if _is_implemented(app, m, p)]


def _call(client, method, path, headers):
    return client.open(path, method=method, headers=headers, json={})


def _claims(app, token):
    with app.app_context():
        return decode_token(token)


def _token(app, kind, identity, **kwargs):
    create = create_access_token if kind == "access" else create_refresh_token
    with app.app_context():
        return {"Authorization": f"Bearer {create(identity=identity, **kwargs)}"}


# --- token contents ---------------------------------------------------------------------------


def test_login_issues_typed_tokens_with_configured_lifetimes(app, client, make_user):
    user = make_user(email="tokens@example.com", password="token-pass-1")
    data = assert_envelope(
        client.post("/api/auth/login", json={"email": "tokens@example.com", "password": "token-pass-1"}),
        200,
    )
    access, refresh = _claims(app, data["access_token"]), _claims(app, data["refresh_token"])
    assert (access["type"], refresh["type"]) == ("access", "refresh")
    assert access["sub"] == refresh["sub"] == str(user.user_id)
    assert access["exp"] - access["iat"] == 3600 == data["expires_in"]
    assert refresh["exp"] - refresh["iat"] == 604800 == data["refresh_expires_in"]
    assert data["token_type"] == "Bearer"


# --- refresh endpoint ---------------------------------------------------------------------------


def test_refresh_returns_new_access_token_that_works(app, client, make_user, refresh_header):
    user = make_user()
    data = assert_envelope(client.post("/api/auth/refresh", headers=refresh_header(user)), 200)
    assert set(data) == {"access_token", "token_type", "expires_in"}
    assert (data["token_type"], data["expires_in"]) == ("Bearer", 3600)
    claims = _claims(app, data["access_token"])
    assert claims["type"] == "access" and claims["sub"] == str(user.user_id)
    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert assert_envelope(me, 200)["user_id"] == str(user.user_id)


def test_refresh_does_not_return_a_new_refresh_token(client, make_user, refresh_header):
    user = make_user()
    data = assert_envelope(client.post("/api/auth/refresh", headers=refresh_header(user)), 200)
    assert "refresh_token" not in data


def test_refresh_with_expired_token_is_401(app, client, make_user):
    user = make_user()
    headers = _token(app, "refresh", str(user.user_id), expires_delta=timedelta(seconds=-5))
    assert_envelope(client.post("/api/auth/refresh", headers=headers), 401)


def test_refresh_without_token_is_401(client):
    assert_envelope(client.post("/api/auth/refresh"), 401)


@pytest.mark.parametrize("value", ["Bearer abc.def.ghi", "Bearer notatoken", "Token xyz", "Bearer "])
def test_refresh_with_malformed_token_is_401(client, value):
    assert_envelope(client.post("/api/auth/refresh", headers={"Authorization": value}), 401)


def test_refresh_with_token_signed_by_other_key_is_401(client, make_user):
    import jwt as pyjwt

    user = make_user()
    forged = pyjwt.encode(
        {"sub": str(user.user_id), "type": "refresh", "fresh": False, "jti": "x",
         "iat": 1, "exp": 4102444800},
        "another-secret-key-with-enough-length-1234567890",
        algorithm="HS256",
    )
    assert_envelope(client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {forged}"}), 401)


def test_refresh_with_access_token_is_401(client, make_user, auth_header):
    user = make_user()
    assert_envelope(client.post("/api/auth/refresh", headers=auth_header(user)), 401)


def test_refresh_with_token_of_soft_deleted_user_is_401(client, make_deleted_user, refresh_header):
    user = make_deleted_user()
    assert_envelope(client.post("/api/auth/refresh", headers=refresh_header(user)), 401)


# --- token type enforcement on protected endpoints ---------------------------------------------------


def test_refresh_token_is_rejected_on_every_protected_endpoint(
    client, make_user, refresh_header, implemented_endpoints
):
    assert ("GET", "/api/users/me") in implemented_endpoints
    headers = refresh_header(make_user())
    for method, path in implemented_endpoints:
        assert_envelope(_call(client, method, path, headers), 401)


def test_access_token_of_soft_deleted_user_is_401_on_protected_endpoints(
    client, make_deleted_user, auth_header, implemented_endpoints
):
    headers = auth_header(make_deleted_user())
    checked = 0
    for method, path in implemented_endpoints:
        assert_envelope(_call(client, method, path, headers), 401)
        checked += 1
    assert checked >= 2  # users/me GET and PATCH; boards endpoints join in once implemented


# --- properties ---------------------------------------------------------------------------------------


# Feature: kano, Property 36: Token types and lifetimes
@DB_SETTINGS
@given(_emails)
def test_login_tokens_have_types_subject_and_lifetimes(app, client, reset_database, make_user, email):
    reset_database()
    user = make_user(email=email, password="property-pass")
    data = assert_envelope(
        client.post("/api/auth/login", json={"email": email, "password": "property-pass"}), 200
    )
    access, refresh = _claims(app, data["access_token"]), _claims(app, data["refresh_token"])
    assert access["type"] == "access" and refresh["type"] == "refresh"
    assert access["sub"] == refresh["sub"] == str(user.user_id)
    assert access["exp"] - access["iat"] == data["expires_in"] == 3600
    assert refresh["exp"] - refresh["iat"] == data["refresh_expires_in"] == 604800


# Feature: kano, Property 37: Token type enforcement
@DB_SETTINGS
@given(_emails, st.sampled_from([("GET", "/api/users/me"), ("PATCH", "/api/users/me")]))
def test_token_type_is_enforced_in_both_directions(
    client, reset_database, make_user, auth_header, refresh_header, email, endpoint
):
    reset_database()
    user = make_user(email=email)
    method, path = endpoint
    assert_envelope(_call(client, method, path, refresh_header(user)), 401)
    assert_envelope(client.post("/api/auth/refresh", headers=auth_header(user)), 401)


# Feature: kano, Property 38: Refresh yields a working access token
@DB_SETTINGS
@given(_emails)
def test_refreshed_access_token_works(client, reset_database, make_user, refresh_header, email):
    reset_database()
    user = make_user(email=email)
    data = assert_envelope(client.post("/api/auth/refresh", headers=refresh_header(user)), 200)
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    assert assert_envelope(client.get("/api/users/me", headers=headers), 200)["email"] == email.lower()


# Feature: kano, Property 43: Deleted or unknown token subject yields 401 (refresh tokens)
@DB_SETTINGS
@given(st.uuids())
def test_refresh_token_of_unknown_subject_is_401(app, client, reset_database, subject):
    reset_database()
    headers = _token(app, "refresh", str(subject))
    assert_envelope(client.post("/api/auth/refresh", headers=headers), 401)
    assert uuid.UUID(str(subject))
