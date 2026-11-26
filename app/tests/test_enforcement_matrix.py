"""Role and membership enforcement matrix over every Board-scoped endpoint (V11: five actors)."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from endpoints import ENDPOINT_IDS, ENDPOINTS, SECRETS, build_world, call, snapshot
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

ACTORS = ["nonmember", "guest", "member", "manager", "admin"]
READ_ONLY_ENDPOINTS = {e.id for e in ENDPOINTS if "guest" in e.allowed}
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


def test_guest_gets_403_on_every_write_and_succeeds_on_every_read(app, client, auth_header, world):
    for endpoint in ENDPOINTS:
        before = snapshot(app)
        response = call(client, endpoint, world, auth_header(world.guest))
        if endpoint.id in READ_ONLY_ENDPOINTS:
            assert_envelope(response, endpoint.success)
        else:
            assert_envelope(response, 403)
            assert snapshot(app) == before, endpoint.id
    assert READ_ONLY_ENDPOINTS == {"get_board", "list_members", "search_cards", "list_comments", "get_card"}


@pytest.mark.parametrize("method,body", [("patch", {"content": "Edited"}), ("delete", None)])
def test_guest_who_authored_an_old_comment_still_gets_403(app, client, auth_header, world, method, body):
    before = snapshot(app)
    kwargs = {"headers": auth_header(world.guest)}
    if body:
        kwargs["json"] = body
    response = getattr(client, method)(f"/api/comments/{world.guest_comment.comment_id}", **kwargs)
    assert_envelope(response, 403)
    assert snapshot(app) == before


def test_only_the_admin_and_managers_can_read_the_invite_tokens(app, client, auth_header, world):
    for actor in ("nonmember", "guest", "member"):
        message = assert_envelope(
            client.get(f"/api/boards/{world.board.board_id}/invite-links", headers=auth_header(world.actors[actor])), 403
        )
        assert world.member_token not in message and world.guest_token not in message


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


# Feature: kano, Property 13: Role and membership enforcement (updated role set)
# Feature: kano, Property 47: Guest never writes (updated role set)
# Feature: kano, Property 73: V11 permission matrix (database part)
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(endpoint_id=st.sampled_from(ENDPOINT_IDS), actor=st.sampled_from(ACTORS), body_ok=st.booleans())
def test_property_forbidden_requests_get_403_before_validation_and_never_leak(
    app, client, auth_header, make_user, make_board, make_member, make_column, make_card, make_comment,
    persist, make_checklist_item, make_card_link, reset_database, endpoint_id, actor, body_ok,
):
    reset_database()
    w = build_world(
        make_user, make_board, make_member, make_column, make_card, make_comment, persist,
        make_checklist_item, make_card_link,
    )
    endpoint = BY_ID[endpoint_id]
    body = "default" if (body_ok or endpoint.bad_body is None) else endpoint.bad_body
    before = snapshot(app)
    response = call(client, endpoint, w, auth_header(w.actors[actor]), body)
    invalid = body != "default"
    if invalid and endpoint.validates_first:
        assert_envelope(response, 400)  # the role-change body is validated before any 403
        assert snapshot(app) == before
    elif actor not in endpoint.allowed:
        # Membership and role are checked before the body is validated: always 403.
        message = assert_envelope(response, 403)
        assert all(secret not in message for secret in SECRETS.values())
        assert snapshot(app) == before
    elif invalid:
        assert_envelope(response, 400)
        assert snapshot(app) == before
    else:
        assert_envelope(response, endpoint.success)
