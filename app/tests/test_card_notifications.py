"""pytest tests for assignment notifications raised by card create and update."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from sqlalchemy import select

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


@pytest.fixture
def notes(app):
    """`notes(user)` returns that user's notifications (all rows, oldest first)."""
    from app.blueprints.notifications.schema import Notification
    from app.extensions import db

    def fetch(user):
        with app.app_context():
            rows = db.session.execute(
                select(Notification)
                .where(Notification.recipient_id == user.user_id)
                .order_by(Notification.created_at)
            ).scalars().all()
            db.session.expunge_all()
            return rows

    return fetch


@pytest.fixture
def setup(make_board, make_member, make_column):
    board = make_board()
    return board, board.owner, make_member(board).member, make_column(board)


def create(client, headers, column, **body):
    return client.post(f"/api/columns/{column.column_id}/cards", json={"title": "Ship it", **body}, headers=headers)


def test_create_with_other_assignee_notifies_that_user(client, setup, auth_header, notes):
    board, admin, member, column = setup
    data = assert_envelope(create(client, auth_header(admin), column, assignee_id=str(member.user_id)), 201)
    [note] = notes(member)
    assert (note.type, note.is_read, str(note.card_id), note.board_id) == (
        "assignment", False, data["card_id"], board.board_id,
    )
    assert "Ship it" in note.message and len(note.message) <= 255
    assert notes(admin) == []


def test_self_assignment_and_no_assignee_create_no_notification(client, setup, auth_header, notes):
    _board, admin, member, column = setup
    assert_envelope(create(client, auth_header(admin), column, assignee_id=str(admin.user_id)), 201)
    assert_envelope(create(client, auth_header(admin), column), 201)
    assert notes(admin) == [] and notes(member) == []


def test_update_to_new_assignee_notifies_once_and_unchanged_assignee_does_not(
    client, setup, make_card, auth_header, notes
):
    _board, admin, member, column = setup
    card = make_card(column, "Task")
    url = f"/api/cards/{card.card_id}"
    body = {"assignee_id": str(member.user_id)}
    assert_envelope(client.patch(url, json=body, headers=auth_header(admin)), 200)
    assert_envelope(client.patch(url, json={**body, "title": "Task 2"}, headers=auth_header(admin)), 200)
    [note] = notes(member)
    assert "Task 2" not in note.message and "Task" in note.message


def test_update_self_assignment_unassign_and_other_fields_create_nothing(
    client, setup, make_card, auth_header, notes
):
    _board, admin, member, column = setup
    card = make_card(column, assignee=member)
    url = f"/api/cards/{card.card_id}"
    assert_envelope(client.patch(url, json={"title": "Renamed"}, headers=auth_header(admin)), 200)
    assert_envelope(client.patch(url, json={"assignee_id": None}, headers=auth_header(admin)), 200)
    assert_envelope(client.patch(url, json={"assignee_id": str(admin.user_id)}, headers=auth_header(admin)), 200)
    assert notes(member) == [] and notes(admin) == []


def test_reassignment_notifies_only_the_new_assignee(client, setup, make_card, make_member, auth_header, notes):
    board, admin, member, column = setup
    third = make_member(board).member
    card = make_card(column, assignee=member)
    body = {"assignee_id": str(third.user_id)}
    assert_envelope(client.patch(f"/api/cards/{card.card_id}", json=body, headers=auth_header(member)), 200)
    assert len(notes(third)) == 1 and notes(member) == []


def test_long_title_is_shortened_to_255_characters(client, setup, auth_header, notes):
    _board, admin, member, column = setup
    title = "T" * 200
    assert_envelope(create(client, auth_header(admin), column, title=title, assignee_id=str(member.user_id)), 201)
    [note] = notes(member)
    assert len(note.message) <= 255 and "T" * 50 in note.message


def test_rejected_request_creates_no_notification(client, setup, make_user, auth_header, notes, count_rows):
    from app.blueprints.notifications.schema import Notification

    _board, admin, member, column = setup
    assert_envelope(create(client, auth_header(admin), column, title="", assignee_id=str(member.user_id)), 400)
    assert_envelope(create(client, auth_header(admin), column, assignee_id=str(make_user().user_id)), 400)
    assert count_rows(Notification) == 0


# Feature: kano, Property 21: Notification recipients (assignment part)
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(actor_is_admin=st.booleans(), assignee=st.sampled_from(["none", "self", "other"]), on_update=st.booleans())
def test_property_assignment_notifies_only_a_different_new_assignee(
    client, make_board, make_member, make_column, make_card, auth_header, reset_database, count_rows,
    actor_is_admin, assignee, on_update,
):
    from app.blueprints.notifications.schema import Notification

    reset_database()
    board = make_board()
    member = make_member(board).member
    column = make_column(board)
    actor, other = (board.owner, member) if actor_is_admin else (member, board.owner)
    target = {"none": None, "self": actor, "other": other}[assignee]
    body = {} if target is None else {"assignee_id": str(target.user_id)}
    if on_update:
        card = make_card(column)
        assert_envelope(client.patch(f"/api/cards/{card.card_id}", json=body, headers=auth_header(actor)), 200)
    else:
        assert_envelope(create(client, auth_header(actor), column, **body), 201)
    expected = 1 if assignee == "other" else 0
    assert count_rows(Notification) == expected
    assert count_rows(Notification, Notification.recipient_id == other.user_id) == expected
