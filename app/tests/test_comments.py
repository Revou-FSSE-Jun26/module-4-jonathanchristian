"""pytest tests for the comments endpoints and comment notifications."""
import uuid
from datetime import timedelta

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from sqlalchemy import select

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
COMMENT_FIELDS = {"comment_id", "card_id", "content", "author", "created_at", "updated_at"}


def comments_url(card):
    return f"/api/cards/{card.card_id}/comments"


def comment_url(comment):
    return f"/api/comments/{comment.comment_id}"


@pytest.fixture
def setup(make_board, make_member, make_column, make_card):
    """Board with admin, an assignee member, a plain member, and one card assigned to the assignee."""
    board = make_board()
    assignee = make_member(board).member
    plain = make_member(board).member
    card = make_card(make_column(board), "Ship it", assignee=assignee)
    return board, board.owner, assignee, plain, card


@pytest.fixture
def notes(app):
    """`notes(user)` returns that user's notifications of type comment."""
    from app.blueprints.notifications.schema import Notification
    from app.extensions import db

    def fetch(user):
        with app.app_context():
            rows = db.session.execute(
                select(Notification).where(Notification.recipient_id == user.user_id)
            ).scalars().all()
            db.session.expunge_all()
            return rows

    return fetch


# --- create and list ----------------------------------------------------------------------------------


def test_create_comment_returns_author_and_timestamps(client, setup, auth_header):
    _board, _admin, _assignee, plain, card = setup
    data = assert_envelope(client.post(comments_url(card), json={"content": " Looks good "}, headers=auth_header(plain)), 201)
    assert set(data) == COMMENT_FIELDS
    assert data["content"] == " Looks good "
    assert data["author"] == {"user_id": str(plain.user_id), "name": plain.name}
    assert data["card_id"] == str(card.card_id) and data["created_at"].endswith("Z")


@pytest.mark.parametrize("body", [{}, {"content": ""}, {"content": " \n\t "}, {"content": "x" * 2001}, {"content": 5}, {"content": None}, {"content": "a", "author_id": "x"}])
def test_create_comment_invalid_content_is_400(client, setup, auth_header, count_rows, body):
    from app.blueprints.comments.schema import Comment

    _board, admin, _assignee, _plain, card = setup
    assert_envelope(client.post(comments_url(card), json=body, headers=auth_header(admin)), 400)
    assert count_rows(Comment) == 0


@pytest.mark.parametrize("content", ["a", " a ", "x" * 2000])
def test_content_boundaries_are_accepted(client, setup, auth_header, content):
    _board, admin, _assignee, _plain, card = setup
    assert_envelope(client.post(comments_url(card), json={"content": content}, headers=auth_header(admin)), 201)


def test_unauthenticated_requests_are_401(client, setup, make_comment):
    _board, admin, _assignee, _plain, card = setup
    comment = make_comment(card, admin)
    for call in (
        client.post(comments_url(card), json={"content": "x"}), client.get(comments_url(card)),
        client.patch(comment_url(comment), json={"content": "x"}), client.delete(comment_url(comment)),
    ):
        assert_envelope(call, 401)


def test_non_member_cannot_create_or_list(client, setup, make_comment, make_user, auth_header, count_rows):
    from app.blueprints.comments.schema import Comment

    _board, admin, _assignee, _plain, card = setup
    make_comment(card, admin, "secret text")
    outsider = auth_header(make_user())
    message = assert_envelope(client.get(comments_url(card), headers=outsider), 403)
    assert "secret" not in message
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=outsider), 403)
    assert count_rows(Comment) == 1


def test_missing_or_deleted_card_is_404(client, setup, auth_header):
    _board, admin, _assignee, _plain, card = setup
    headers = auth_header(admin)
    for url in (f"/api/cards/{uuid.uuid4()}/comments", "/api/cards/nope/comments"):
        assert_envelope(client.get(url, headers=headers), 404)
        assert_envelope(client.post(url, json={"content": "x"}, headers=headers), 404)
    assert_envelope(client.delete(f"/api/cards/{card.card_id}", headers=headers), 200)
    assert_envelope(client.get(comments_url(card), headers=headers), 404)
    assert_envelope(client.post(comments_url(card), json={"content": "x"}, headers=headers), 404)


def test_list_is_empty_then_ordered_by_creation_ascending_without_deleted(
    client, setup, make_comment, auth_header, persist
):
    _board, admin, _assignee, plain, card = setup
    headers = auth_header(plain)
    assert assert_envelope(client.get(comments_url(card), headers=headers), 200) == []
    first = make_comment(card, admin, "first")
    second = make_comment(card, plain, "second")
    third = make_comment(card, admin, "third")
    second.created_at = first.created_at + timedelta(minutes=1)
    third.created_at = first.created_at - timedelta(minutes=1)
    persist(second), persist(third)
    gone = make_comment(card, admin, "gone")
    assert_envelope(client.delete(comment_url(gone), headers=auth_header(admin)), 200)
    data = assert_envelope(client.get(comments_url(card), headers=headers), 200)
    assert [c["content"] for c in data] == ["third", "first", "second"]
    assert data[0]["author"]["name"] == admin.name


# --- update and delete ----------------------------------------------------------------------------------


def test_owner_updates_content_and_updated_at(client, setup, make_comment, auth_header, fetch):
    from app.blueprints.comments.schema import Comment

    _board, _admin, _assignee, plain, card = setup
    comment = make_comment(card, plain, "old")
    data = assert_envelope(client.patch(comment_url(comment), json={"content": "new"}, headers=auth_header(plain)), 200)
    assert data["content"] == "new" and data["comment_id"] == str(comment.comment_id)
    row = fetch(Comment, comment.comment_id)
    assert row.content == "new" and row.updated_at > comment.updated_at


@pytest.mark.parametrize("body", [{}, {"content": ""}, {"content": "   "}, {"content": "x" * 2001}, {"content": 1}])
def test_update_invalid_content_is_400_and_unchanged(client, setup, make_comment, auth_header, fetch, body):
    from app.blueprints.comments.schema import Comment

    _board, _admin, _assignee, plain, card = setup
    comment = make_comment(card, plain, "keep")
    assert_envelope(client.patch(comment_url(comment), json=body, headers=auth_header(plain)), 400)
    assert fetch(Comment, comment.comment_id).content == "keep"


def test_only_the_owner_may_edit_or_delete_not_even_the_admin(client, setup, make_comment, make_user, auth_header, fetch):
    from app.blueprints.comments.schema import Comment

    _board, admin, assignee, plain, card = setup
    comment = make_comment(card, plain, "mine")
    for other in (admin, assignee, make_user()):
        headers = auth_header(other)
        assert_envelope(client.patch(comment_url(comment), json={"content": "hacked"}, headers=headers), 403)
        assert_envelope(client.delete(comment_url(comment), headers=headers), 403)
    row = fetch(Comment, comment.comment_id)
    assert row.content == "mine" and not row.is_deleted


def test_removed_member_loses_access_to_own_comment(client, setup, make_comment, auth_header):
    board, admin, _assignee, plain, card = setup
    comment = make_comment(card, plain)
    assert_envelope(client.delete(f"/api/boards/{board.board_id}/members/{plain.user_id}", headers=auth_header(admin)), 200)
    assert_envelope(client.patch(comment_url(comment), json={"content": "x"}, headers=auth_header(plain)), 403)


def test_owner_deletes_comment_and_it_disappears(client, setup, make_comment, auth_header, fetch):
    from app.blueprints.comments.schema import Comment

    _board, _admin, _assignee, plain, card = setup
    comment = make_comment(card, plain)
    data = assert_envelope(client.delete(comment_url(comment), headers=auth_header(plain)), 200)
    assert data == {"comment_id": str(comment.comment_id)}
    row = fetch(Comment, comment.comment_id)
    assert row.is_deleted and row.deleted_at is not None
    assert assert_envelope(client.get(comments_url(card), headers=auth_header(plain)), 200) == []
    assert_envelope(client.delete(comment_url(comment), headers=auth_header(plain)), 404)
    assert_envelope(client.patch(comment_url(comment), json={"content": "x"}, headers=auth_header(plain)), 404)


def test_missing_comment_is_404(client, setup, auth_header):
    _board, admin, _assignee, _plain, _card = setup
    for url in (f"/api/comments/{uuid.uuid4()}", "/api/comments/nope"):
        assert_envelope(client.patch(url, json={"content": "x"}, headers=auth_header(admin)), 404)
        assert_envelope(client.delete(url, headers=auth_header(admin)), 404)


# --- notifications --------------------------------------------------------------------------------------


def test_comment_notifies_assignee_and_admin_but_not_the_author(client, setup, auth_header, notes):
    _board, admin, assignee, plain, card = setup
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=auth_header(plain)), 201)
    for recipient in (admin, assignee):
        [note] = notes(recipient)
        assert (note.type, note.card_id, note.is_read) == ("comment", card.card_id, False)
        assert plain.name in note.message and "Ship it" in note.message and len(note.message) <= 255
    assert notes(plain) == []


def test_assignee_author_notifies_only_the_admin(client, setup, auth_header, notes):
    _board, admin, assignee, plain, card = setup
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=auth_header(assignee)), 201)
    assert len(notes(admin)) == 1 and notes(assignee) == [] and notes(plain) == []


def test_admin_author_notifies_only_the_assignee(client, setup, auth_header, notes):
    _board, admin, assignee, plain, card = setup
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=auth_header(admin)), 201)
    assert len(notes(assignee)) == 1 and notes(admin) == [] and notes(plain) == []


def test_admin_who_is_also_the_assignee_gets_one_notification(client, setup, make_card, make_column, auth_header, notes):
    board, admin, _assignee, plain, _card = setup
    card = make_card(make_column(board), "Mine", assignee=admin)
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=auth_header(plain)), 201)
    assert len(notes(admin)) == 1


def test_unassigned_card_notifies_only_the_admin_and_admin_author_nobody(client, setup, make_card, make_column, auth_header, notes):
    board, admin, assignee, plain, _card = setup
    card = make_card(make_column(board), "Open")
    assert_envelope(client.post(comments_url(card), json={"content": "hi"}, headers=auth_header(plain)), 201)
    assert len(notes(admin)) == 1 and notes(assignee) == []
    assert_envelope(client.post(comments_url(card), json={"content": "again"}, headers=auth_header(admin)), 201)
    assert len(notes(admin)) == 1 and notes(assignee) == [] and notes(plain) == []


def test_rejected_comment_creates_no_notification(client, setup, auth_header, count_rows):
    from app.blueprints.notifications.schema import Notification

    _board, _admin, _assignee, plain, card = setup
    assert_envelope(client.post(comments_url(card), json={"content": "  "}, headers=auth_header(plain)), 400)
    assert count_rows(Notification) == 0


# Feature: kano, Property 20: Comment ownership
@DB_SETTINGS
@given(actor=st.sampled_from(["owner", "admin", "assignee", "outsider"]), action=st.sampled_from(["patch", "delete"]))
def test_property_only_the_owner_can_change_a_comment(
    client, make_board, make_member, make_column, make_card, make_comment, make_user, auth_header,
    reset_database, actor, action,
):
    reset_database()
    board = make_board()
    owner, assignee = make_member(board).member, make_member(board).member
    comment = make_comment(make_card(make_column(board), assignee=assignee), owner, "orig")
    user = {"owner": owner, "admin": board.owner, "assignee": assignee, "outsider": make_user()}[actor]
    headers = auth_header(user)
    response = (
        client.patch(comment_url(comment), json={"content": "new"}, headers=headers)
        if action == "patch" else client.delete(comment_url(comment), headers=headers)
    )
    assert_envelope(response, 200 if actor == "owner" else 403)


# Feature: kano, Property 12: Server input validation (comment content)
@DB_SETTINGS
@given(content=st.text(alphabet=st.characters(blacklist_categories=("Cs",), blacklist_characters="\x00"), max_size=2100))
def test_property_comment_content_validation(client, make_board, make_column, make_card, auth_header, reset_database, content):
    reset_database()
    board = make_board()
    card = make_card(make_column(board))
    response = client.post(comments_url(card), json={"content": content}, headers=auth_header(board.owner))
    assert_envelope(response, 201 if 1 <= len(content) <= 2000 and content.strip() else 400)
