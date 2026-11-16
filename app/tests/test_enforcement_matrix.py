"""Role and membership enforcement matrix over every Board-scoped endpoint (task 14.1)."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from endpoints import ENDPOINT_IDS, ENDPOINTS, SECRETS, build_world, call, snapshot
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

ACTORS = ["nonmember", "member", "admin"]
BY_ID = {endpoint.id: endpoint for endpoint in ENDPOINTS}


def run(client, app, auth_header, world, endpoint, actor):
    before = snapshot(app)
    response = call(client, endpoint, world, auth_header(world.actors[actor]))
    return response, before


def check(app, world, endpoint, actor, response, before):
    if actor in endpoint.allowed:
        assert_envelope(response, endpoint.success)
        return
    message = assert_envelope(response, 403)
    for secret in SECRETS.values():
        assert secret not in message
    assert snapshot(app) == before, "a 403 must leave every row unchanged"


@pytest.mark.parametrize("actor", ACTORS)
@pytest.mark.parametrize("endpoint", ENDPOINTS, ids=ENDPOINT_IDS)
def test_role_matrix(app, client, auth_header, world, endpoint, actor):
    response, before = run(client, app, auth_header, world, endpoint, actor)
    check(app, world, endpoint, actor, response, before)


@pytest.mark.parametrize("endpoint", ENDPOINTS, ids=ENDPOINT_IDS)
def test_403_body_is_identical_for_every_endpoint_and_leaks_nothing(app, client, auth_header, world, endpoint):
    forbidden = [a for a in ACTORS if a not in endpoint.allowed]
    messages = {
        assert_envelope(call(client, endpoint, world, auth_header(world.actors[actor])), 403)
        for actor in forbidden
    }
    assert len(messages) == 1  # no resource data and no distinction between the 403 reasons


def test_removed_member_is_locked_out_of_every_endpoint(app, client, auth_header, world):
    removed_headers = auth_header(world.extra)
    board_url = f"/api/boards/{world.board.board_id}"
    assert_envelope(client.get(board_url, headers=removed_headers), 200)  # still a member
    removal = f"{board_url}/members/{world.extra.user_id}"
    assert_envelope(client.delete(removal, headers=auth_header(world.admin)), 200)
    before = snapshot(app)
    for endpoint in ENDPOINTS:
        assert_envelope(call(client, endpoint, world, removed_headers), 403)
    assert snapshot(app) == before


# Feature: kano, Property 13: Role and membership enforcement
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(endpoint_id=st.sampled_from(ENDPOINT_IDS), actor=st.sampled_from(ACTORS), body_ok=st.booleans())
def test_property_forbidden_requests_get_403_before_validation_and_never_leak(
    app, client, auth_header, make_user, make_board, make_member, make_column, make_card, make_comment,
    reset_database, endpoint_id, actor, body_ok,
):
    reset_database()
    w = build_world(make_user, make_board, make_member, make_column, make_card, make_comment)
    endpoint = BY_ID[endpoint_id]
    body = "default" if (body_ok or endpoint.bad_body is None) else endpoint.bad_body
    before = snapshot(app)
    response = call(client, endpoint, w, auth_header(w.actors[actor]), body)
    invalid = body != "default"
    if actor not in endpoint.allowed:
        # Membership and role are checked before the body is validated: always 403.
        message = assert_envelope(response, 403)
        assert all(secret not in message for secret in SECRETS.values())
        assert snapshot(app) == before
    elif invalid:
        assert_envelope(response, 400)
        assert snapshot(app) == before
    else:
        assert_envelope(response, endpoint.success)
