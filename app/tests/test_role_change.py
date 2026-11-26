"""pytest tests for member role change and removal (design A15 and A20, Requirement 31.23)."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


def member_url(board, user):
    return f"/api/boards/{board.board_id}/members/{user.user_id}"


@pytest.fixture
def team(make_board, make_member, make_manager):
    """An admin (the creator), two managers, two members, and a guest on one Board."""
    board = make_board()
    return {
        "board": board,
        "admin": board.owner,
        "manager": make_manager(board).member,
        "manager2": make_manager(board).member,
        "member": make_member(board).member,
        "member2": make_member(board).member,
        "guest": make_member(board, role="guest").member,
    }


def change(client, auth_header, team, caller, target, role):
    return client.patch(
        member_url(team["board"], team[target]), json={"role": role}, headers=auth_header(team[caller])
    )


@pytest.fixture
def membership_row(app):
    from sqlalchemy import select

    from app.blueprints.boards.schema import BoardMembership
    from app.extensions import db

    def _row(board, user):
        with app.app_context():
            row = db.session.execute(
                select(BoardMembership).where(
                    BoardMembership.board_id == board.board_id,
                    BoardMembership.user_id == user.user_id,
                    BoardMembership.is_deleted.is_(False),
                )
            ).scalar_one()
            db.session.expunge(row)
            return row

    return _row


@pytest.fixture
def fetch_role(app):
    from sqlalchemy import select

    from app.blueprints.boards.schema import BoardMembership
    from app.extensions import db

    def _role(board, user):
        with app.app_context():
            rows = db.session.execute(
                select(BoardMembership.role).where(
                    BoardMembership.board_id == board.board_id,
                    BoardMembership.user_id == user.user_id,
                    BoardMembership.is_deleted.is_(False),
                )
            ).scalars().all()
        assert len(rows) <= 1  # exactly one active membership
        return rows[0] if rows else None

    return _role


def test_admin_grants_manager_and_the_response_has_the_member_fields(client, team, auth_header, fetch_role):
    data = assert_envelope(change(client, auth_header, team, "admin", "member", "manager"), 200)
    assert data == {
        "user_id": str(team["member"].user_id), "name": team["member"].name,
        "email": team["member"].email, "role": "manager",
    }
    assert fetch_role(team["board"], team["member"]) == "manager"


def test_a_manager_cannot_grant_manager_or_touch_a_manager_or_the_admin(client, team, auth_header, fetch_role):
    for target, role in (("member", "manager"), ("manager2", "member"), ("manager2", "guest"), ("admin", "member")):
        assert_envelope(change(client, auth_header, team, "manager", target, role), 403)
    assert fetch_role(team["board"], team["member"]) == "member"
    assert fetch_role(team["board"], team["manager2"]) == "manager"
    assert fetch_role(team["board"], team["admin"]) == "admin"


def test_a_manager_can_change_members_and_guests_up_to_member(client, team, auth_header, fetch_role):
    assert_envelope(change(client, auth_header, team, "manager", "guest", "member"), 200)
    assert fetch_role(team["board"], team["guest"]) == "member"
    assert_envelope(change(client, auth_header, team, "manager", "member", "guest"), 200)
    assert fetch_role(team["board"], team["member"]) == "guest"


def test_the_admin_cannot_be_demoted_and_admin_self_target_is_400(client, team, auth_header, fetch_role):
    assert_envelope(change(client, auth_header, team, "admin", "admin", "member"), 400)
    assert_envelope(change(client, auth_header, team, "manager", "admin", "guest"), 403)
    assert fetch_role(team["board"], team["admin"]) == "admin"


@pytest.mark.parametrize("body", [{}, {"role": "admin"}, {"role": "owner"}, {"role": "Manager"}, {"role": ""}, {"role": 5},
                                  {"role": None}, {"role": "member", "extra": 1}, []])
def test_invalid_bodies_are_400_for_every_caller_before_any_403(client, team, auth_header, make_user, body):
    for caller in ("admin", "manager", "member", "guest"):
        response = client.patch(member_url(team["board"], team["member2"]), json=body, headers=auth_header(team[caller]))
        assert_envelope(response, 400)
    response = client.patch(member_url(team["board"], team["member2"]), json=body, headers=auth_header(make_user()))
    assert_envelope(response, 400)


def test_404_when_the_target_has_no_active_membership_or_the_board_is_missing(client, team, auth_header, make_user):
    headers = auth_header(team["admin"])
    stranger = make_user()
    assert_envelope(client.patch(member_url(team["board"], stranger), json={"role": "member"}, headers=headers), 404)
    assert_envelope(client.delete(member_url(team["board"], stranger), headers=headers), 404)
    missing = f"/api/boards/{uuid.uuid4()}/members/{team['member'].user_id}"
    assert_envelope(client.patch(missing, json={"role": "member"}, headers=headers), 404)
    assert_envelope(client.patch(f"/api/boards/{team['board'].board_id}/members/not-a-uuid", json={"role": "member"}, headers=headers), 404)


def test_member_guest_and_non_participant_get_403_and_nothing_changes(client, team, auth_header, make_user, fetch_role):
    for caller in (team["member"], team["guest"], make_user()):
        message = assert_envelope(
            client.patch(member_url(team["board"], team["member2"]), json={"role": "guest"}, headers=auth_header(caller)), 403
        )
        assert team["member2"].name not in message
        assert_envelope(client.delete(member_url(team["board"], team["member2"]), headers=auth_header(caller)), 403)
    assert fetch_role(team["board"], team["member2"]) == "member"


def test_a_change_to_guest_clears_the_assignee_of_that_users_cards_only(
    client, team, auth_header, make_column, make_card, fetch
):
    from app.blueprints.cards.schema import Card

    column = make_column(team["board"])
    theirs = make_card(column, assignee=team["member"])
    others = make_card(column, assignee=team["member2"])
    assert_envelope(change(client, auth_header, team, "admin", "member", "guest"), 200)
    assert fetch(Card, theirs.card_id).assignee_id is None
    assert fetch(Card, others.card_id).assignee_id == team["member2"].user_id


def test_a_change_to_manager_keeps_assignments(client, team, auth_header, make_column, make_card, fetch):
    from app.blueprints.cards.schema import Card

    card = make_card(make_column(team["board"]), assignee=team["member"])
    assert_envelope(change(client, auth_header, team, "admin", "member", "manager"), 200)
    assert fetch(Card, card.card_id).assignee_id == team["member"].user_id


def test_a_same_role_change_is_200_and_changes_nothing(client, team, auth_header, membership_row):
    before = membership_row(team["board"], team["member"])
    data = assert_envelope(change(client, auth_header, team, "admin", "member", "member"), 200)
    assert data["role"] == "member"
    after = membership_row(team["board"], team["member"])
    assert (after.role, after.updated_at) == (before.role, before.updated_at)
    assert_envelope(change(client, auth_header, team, "manager", "manager2", "manager"), 403)  # the rank rule still applies


def test_a_role_change_creates_no_notification(client, team, auth_header, count_rows):
    from app.blueprints.notifications.schema import Notification

    assert_envelope(change(client, auth_header, team, "admin", "member", "manager"), 200)
    assert_envelope(change(client, auth_header, team, "admin", "guest", "member"), 200)
    assert count_rows(Notification) == 0


def test_my_role_in_board_detail_can_be_any_of_the_four_values(client, team, auth_header):
    for name, role in (("admin", "admin"), ("manager", "manager"), ("member", "member"), ("guest", "guest")):
        data = assert_envelope(client.get(f"/api/boards/{team['board'].board_id}", headers=auth_header(team[name])), 200)
        assert data["my_role"] == role


# --- removal ----------------------------------------------------------------------------------------


def test_admin_removes_a_manager_and_a_manager_removes_member_and_guest(client, team, auth_header, fetch_role):
    headers_admin, headers_manager = auth_header(team["admin"]), auth_header(team["manager"])
    assert_envelope(client.delete(member_url(team["board"], team["manager2"]), headers=headers_admin), 200)
    assert_envelope(client.delete(member_url(team["board"], team["member"]), headers=headers_manager), 200)
    assert_envelope(client.delete(member_url(team["board"], team["guest"]), headers=headers_manager), 200)
    assert [fetch_role(team["board"], team[n]) for n in ("manager2", "member", "guest")] == [None, None, None]


def test_a_manager_cannot_remove_a_manager_the_admin_or_themselves(client, team, auth_header, fetch_role):
    headers = auth_header(team["manager"])
    for target in ("manager2", "admin", "manager"):
        assert_envelope(client.delete(member_url(team["board"], team[target]), headers=headers), 403)
    assert fetch_role(team["board"], team["manager2"]) == "manager"
    assert fetch_role(team["board"], team["admin"]) == "admin"


def test_the_admin_cannot_remove_themselves(client, team, auth_header):
    assert_envelope(client.delete(member_url(team["board"], team["admin"]), headers=auth_header(team["admin"])), 400)


def test_removal_clears_the_assignee_and_keeps_one_membership_after_a_rejoin(
    client, team, auth_header, make_column, make_card, fetch, fetch_role
):
    from app.blueprints.cards.schema import Card

    card = make_card(make_column(team["board"]), assignee=team["member"])
    assert_envelope(client.delete(member_url(team["board"], team["member"]), headers=auth_header(team["manager"])), 200)
    assert fetch(Card, card.card_id).assignee_id is None
    body = {"email": team["member"].email}
    assert_envelope(client.post(f"/api/boards/{team['board'].board_id}/members", json=body, headers=auth_header(team["manager"])), 201)
    assert fetch_role(team["board"], team["member"]) == "member"


# Feature: kano, Property 72: Role-change and removal decisions (endpoint part)
@settings(max_examples=40, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    caller=st.sampled_from(["admin", "manager", "member", "guest", "none"]),
    target=st.sampled_from(["guest", "member", "manager"]),
    new_role=st.sampled_from(["guest", "member", "manager", "admin", "owner"]),
    remove=st.booleans(),
)
def test_property_endpoint_outcome_matches_the_pure_decisions(
    client, reset_database, make_user, make_board, make_member, auth_header, fetch_role,
    caller, target, new_role, remove,
):
    from app.permissions import decide_member_removal, decide_role_change

    reset_database()
    board = make_board(make_user())
    target_user = make_member(board, role=target).member
    if caller == "admin":
        actor = board.owner
    elif caller == "none":
        actor = make_user()
    else:
        actor = make_member(board, role=caller).member
    role = None if caller == "none" else caller
    headers = auth_header(actor)
    if remove:
        response = client.delete(member_url(board, target_user), headers=headers)
        decision = decide_member_removal(role, target, False)
        expected = {"ok": 200, "forbidden": 403, "bad_request": 400}[decision]
    else:
        response = client.patch(member_url(board, target_user), json={"role": new_role}, headers=headers)
        if new_role not in ("guest", "member", "manager"):
            expected = 400
        else:
            expected = {"ok": 200, "forbidden": 403, "bad_request": 400}[decide_role_change(role, target, new_role, False)]
    assert response.status_code == expected, (caller, target, new_role, remove, response.get_json())
    stored = fetch_role(board, target_user)
    if expected == 200:
        assert stored == (None if remove else new_role)
    else:
        assert stored == target
