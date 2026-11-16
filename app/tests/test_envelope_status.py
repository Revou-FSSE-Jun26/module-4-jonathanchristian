"""Envelope, status code, and serialization tests across all endpoints (task 14.3)."""
import re
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from sqlalchemy import insert

from endpoints import CREATING_POSTS, build_world, call, with_auth
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

ALL = with_auth()
IDS = [endpoint.id for endpoint, _ in ALL]
DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
TIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
UUID_IN_PATH = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")


@pytest.fixture
def full(world, make_notification):
    world.note = make_notification(world.member, world.card)
    return world


@pytest.fixture
def headers_for(auth_header, refresh_header):
    def build(w, kind):
        return {
            "none": {},
            "refresh": refresh_header(w.member),
            "member": auth_header(w.member),
            "admin": auth_header(w.admin),
        }[kind]

    return build


def fire(client, endpoint, w, headers, path=None, body="default", method=None):
    """Like `call`, with an optional replacement path and HTTP method."""
    payload = endpoint.body(w) if (body == "default" and endpoint.body) else (None if body == "default" else body)
    kwargs = {"headers": headers}
    if payload is not None:
        kwargs["json"] = payload
    verb = (method or endpoint.method).lower()
    return getattr(client, verb)(path or endpoint.path(w), **kwargs)


def walk(value, key=None):
    """Yield `(key, value)` for every leaf of a JSON document."""
    if isinstance(value, dict):
        for child_key, child in value.items():
            yield from walk(child, child_key)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child, key)
    else:
        yield key, value


def check_formats(data):
    for key, value in walk(data):
        if value is None or not isinstance(key, str):
            continue
        if key.endswith("_id"):
            assert UUID_RE.match(value), (key, value)
        if key.endswith("_at"):
            assert TIME_RE.match(value), (key, value)


# --- success --------------------------------------------------------------------------------------------


@pytest.mark.parametrize("endpoint,auth", ALL, ids=IDS)
def test_success_has_one_data_key_and_the_documented_status(client, full, headers_for, endpoint, auth):
    expected = 201 if endpoint.id in CREATING_POSTS else 200
    assert endpoint.success == expected
    data = assert_envelope(fire(client, endpoint, full, headers_for(full, auth)), expected)
    assert isinstance(data, (dict, list))
    if endpoint.method == "DELETE":
        assert isinstance(data, dict) and len(data) == 1
    check_formats(data)


def test_exactly_six_endpoints_answer_201():
    assert {e.id for e, _ in ALL if e.success == 201} == CREATING_POSTS
    assert len(ALL) == 30  # the 29 endpoints of design A11 plus 3a


# --- failures -------------------------------------------------------------------------------------------------


@pytest.mark.parametrize("endpoint,auth", ALL, ids=IDS)
def test_missing_token_is_401_for_every_protected_endpoint(client, full, endpoint, auth):
    if auth == "none":
        pytest.skip("public endpoint")
    assert_envelope(fire(client, endpoint, full, {}), 401)


@pytest.mark.parametrize("endpoint,auth", [pair for pair in ALL if pair[0].has_id], ids=[e.id for e, _ in ALL if e.has_id])
def test_unknown_and_malformed_ids_are_404(client, full, headers_for, endpoint, auth):
    headers = headers_for(full, auth)
    path = endpoint.path(full)
    for replacement in (str(uuid.uuid4()), "not-a-uuid"):
        broken = UUID_IN_PATH.sub(replacement, path, count=1)
        assert_envelope(fire(client, endpoint, full, headers, path=broken), 404)


@pytest.mark.parametrize("endpoint,auth", [pair for pair in ALL if pair[0].bad_body is not None], ids=[e.id for e, _ in ALL if e.bad_body is not None])
def test_invalid_body_is_400(client, full, headers_for, endpoint, auth):
    assert_envelope(fire(client, endpoint, full, headers_for(full, auth), body=endpoint.bad_body), 400)


@pytest.mark.parametrize("endpoint,auth", ALL, ids=IDS)
def test_wrong_method_is_405(client, full, headers_for, endpoint, auth):
    path = endpoint.path(full)
    assert assert_envelope(fire(client, endpoint, full, headers_for(full, auth), path=path, method="PUT", body=None), 405)


def test_conflicts_are_409(client, full, auth_header):
    body = {"name": "Dup", "email": full.member.email.upper(), "password": "password123"}
    assert_envelope(client.post("/api/auth/register", json=body), 409)
    members = f"/api/boards/{full.board.board_id}/members"
    assert_envelope(client.post(members, json={"email": full.extra.email}, headers=auth_header(full.admin)), 409)
    assert_envelope(client.patch("/api/users/me", json={"email": full.admin.email}, headers=auth_header(full.member)), 409)


def test_error_messages_never_exceed_500_characters(client, full, auth_header):
    huge = "x" * 20000
    for response in (
        client.post("/api/boards", json={"name": huge, "x" * 600: 1}, headers=auth_header(full.member)),
        client.post("/api/auth/register", json={"name": huge, "email": huge, "password": huge}),
        client.get(f"/api/cards?q={huge}", headers=auth_header(full.member)),
    ):
        message = assert_envelope(response, 400)
        assert len(message) <= 500


def test_database_violations_map_to_statuses_without_sql_details(client, full, auth_header, monkeypatch):
    """A real unique, foreign-key, and not-null violation raised inside a request."""
    from app.blueprints.boards import service as boards_service
    from app.blueprints.boards.schema import Board
    from app.blueprints.users.schema import User
    from app.extensions import db

    def violate(statement):
        def raiser(user, data):
            db.session.execute(statement)
            return {}

        return raiser

    cases = {
        409: insert(User).values(user_id=uuid.uuid4(), name="Dup", email=full.member.email, password_hash="x", is_deleted=False, created_at=full.member.created_at, updated_at=full.member.created_at),
        400: insert(Board).values(board_id=uuid.uuid4(), name="Orphan", created_by=uuid.uuid4(), is_deleted=False, created_at=full.member.created_at, updated_at=full.member.created_at),
    }
    not_null = insert(Board).values(board_id=uuid.uuid4(), name=None, created_by=full.member.user_id, is_deleted=False, created_at=full.member.created_at, updated_at=full.member.created_at)
    for expected, statement in [*cases.items(), (400, not_null)]:
        monkeypatch.setattr(boards_service, "create_board", violate(statement))
        message = assert_envelope(client.post("/api/boards", json={"name": "x"}, headers=auth_header(full.member)), expected)
        lowered = message.lower()
        for word in ("insert", "constraint", "violates", "duplicate key", "psycopg", "sqlalchemy", "users", "boards"):
            assert word not in lowered


# --- properties --------------------------------------------------------------------------------------------------


# Feature: kano, Property 1: Envelope shape and Property 2: Status code by outcome
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(index=st.integers(0, len(ALL) - 1), scenario=st.sampled_from(["ok", "no_token", "unknown_id", "bad_body", "wrong_method"]))
def test_property_every_outcome_has_one_envelope_key_and_its_status(
    client, make_user, make_board, make_member, make_column, make_card, make_comment, make_notification,
    headers_for, reset_database, index, scenario,
):
    reset_database()
    w = build_world(make_user, make_board, make_member, make_column, make_card, make_comment)
    w.note = make_notification(w.member, w.card)
    endpoint, auth = ALL[index]
    headers = headers_for(w, auth)
    if scenario == "ok":
        response, expected = fire(client, endpoint, w, headers), endpoint.success
    elif scenario == "no_token":
        if auth == "none":
            return
        response, expected = fire(client, endpoint, w, {}), 401
    elif scenario == "unknown_id":
        if not endpoint.has_id:
            return
        path = UUID_IN_PATH.sub(str(uuid.uuid4()), endpoint.path(w), count=1)
        response, expected = fire(client, endpoint, w, headers, path=path), 404
    elif scenario == "bad_body":
        if endpoint.bad_body is None:
            return
        response, expected = fire(client, endpoint, w, headers, body=endpoint.bad_body), 400
    else:
        response, expected = fire(client, endpoint, w, headers, method="PUT", body=None), 405
    body = response.get_json()
    assert list(body) == ["data" if expected < 400 else "error"]
    assert response.status_code == expected
    if expected >= 400:
        assert 0 < len(body["error"]) <= 500
    assert "status" not in body


# Feature: kano, Property 3: Serialization format
@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    title=st.text(alphabet=st.characters(whitelist_categories=("Ll", "Lu", "Nd")), min_size=1, max_size=40),
    content=st.text(alphabet=st.characters(whitelist_categories=("Ll", "Lu")), min_size=1, max_size=40),
)
def test_property_ids_are_lowercase_uuids_and_timestamps_end_in_z(
    client, make_user, make_board, make_member, make_column, make_card, make_comment, make_notification,
    auth_header, reset_database, title, content,
):
    reset_database()
    w = build_world(make_user, make_board, make_member, make_column, make_card, make_comment)
    w.note = make_notification(w.member, w.card)
    headers = auth_header(w.admin)
    created = assert_envelope(client.post(f"/api/columns/{w.column.column_id}/cards", json={"title": title, "assignee_id": str(w.member.user_id)}, headers=headers), 201)
    assert_envelope(client.post(f"/api/cards/{created['card_id']}/comments", json={"content": content}, headers=headers), 201)
    for url in (
        f"/api/boards/{w.board.board_id}", f"/api/cards/{created['card_id']}/comments", "/api/boards",
        f"/api/boards/{w.board.board_id}/analytics", f"/api/boards/{w.board.board_id}/members",
        f"/api/cards?q={w.card.title}", "/api/users/me",
    ):
        check_formats(assert_envelope(client.get(url, headers=headers), 200))
    check_formats(assert_envelope(client.get("/api/notifications", headers=auth_header(w.member)), 200))
