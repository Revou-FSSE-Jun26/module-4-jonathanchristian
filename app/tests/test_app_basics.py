"""Health, unknown-route, wrong-method, and CORS tests that need no database."""
import time

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from env_helpers import make_unit_app

pytestmark = pytest.mark.unit

ALLOWED = ["http://localhost:3000", "https://kano.example.com"]


@pytest.fixture(scope="module")
def client():
    return make_unit_app().test_client()


def _assert_envelope(response, status):
    body = response.get_json()
    assert response.status_code == status
    assert len(body) == 1
    key = "data" if status < 400 else "error"
    assert list(body) == [key]
    if key == "error":
        assert isinstance(body["error"], str) and 0 < len(body["error"]) <= 500


def test_health_returns_ok_within_budget(client):
    started = time.perf_counter()
    response = client.get("/api/health")
    elapsed_ms = (time.perf_counter() - started) * 1000
    _assert_envelope(response, 200)
    assert response.get_json() == {"data": {"status": "ok"}}
    assert elapsed_ms < 500


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_health_rejects_other_methods_with_405(client, method):
    _assert_envelope(getattr(client, method)("/api/health"), 405)


def test_unknown_path_is_404_envelope(client):
    _assert_envelope(client.get("/api/does-not-exist"), 404)


def test_allowed_origin_gets_allow_origin_header(client):
    for origin in ALLOWED:
        response = client.get("/api/health", headers={"Origin": origin})
        assert response.headers.get("Access-Control-Allow-Origin") == origin


def test_preflight_allows_authorization_and_content_type(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": ALLOWED[0],
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )
    allowed = response.headers.get("Access-Control-Allow-Headers", "").lower()
    assert "authorization" in allowed and "content-type" in allowed
    assert "Access-Control-Allow-Credentials" not in response.headers


_other_origins = st.from_regex(
    r"https?://[a-z0-9][a-z0-9.-]{0,20}(:[0-9]{1,5})?", fullmatch=True
).filter(lambda origin: origin not in ALLOWED)


# Feature: kano, Property 4: CORS origin filtering
@settings(max_examples=100, deadline=None)
@given(_other_origins)
def test_unlisted_origin_gets_no_allow_origin_header(client, origin):
    response = client.get("/api/health", headers={"Origin": origin})
    assert "Access-Control-Allow-Origin" not in response.headers


# Feature: kano, Property 1: Envelope shape (routes that need no database)
# Feature: kano, Property 2: Status code by outcome (health 200, unknown path 404, wrong method 405)
_segments = st.from_regex(r"zz[a-z0-9_-]{0,15}", fullmatch=True)  # never a real route


@settings(max_examples=100, deadline=None)
@given(_segments)
def test_unknown_paths_return_404_envelope(client, segment):
    _assert_envelope(client.get(f"/api/{segment}"), 404)


@settings(max_examples=100, deadline=None)
@given(st.sampled_from(["post", "put", "patch", "delete"]))
def test_health_wrong_method_returns_405_envelope(client, method):
    _assert_envelope(getattr(client, method)("/api/health"), 405)


@settings(max_examples=100, deadline=None)
@given(st.just("/api/health"))
def test_health_returns_200_envelope(client, path):
    _assert_envelope(client.get(path), 200)
