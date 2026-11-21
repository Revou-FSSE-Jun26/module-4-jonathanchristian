"""pytest tests for card create, update, delete, and position."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
CARD_FIELDS = {
    "card_id", "board_id", "column_id", "title", "description", "due_date", "labels",
    "assignee", "order", "status", "completed_at", "created_at", "updated_at",
}
_safe_text = st.characters(blacklist_categories=("Cs",), blacklist_characters="\x00")


def cards_url(column):
    return f"/api/columns/{column.column_id}/cards"


def card_url(card, suffix=""):
    return f"/api/cards/{card.card_id}{suffix}"


@pytest.fixture
def setup(make_board, make_member, make_column):
    """A board with an admin, a member, and two columns."""
    board = make_board()
    member = make_member(board).member
    return board, board.owner, member, make_column(board), make_column(board)


# --- create ----------------------------------------------------------------------------------------


def test_create_card_full_shape_and_first_order(client, setup, auth_header):
    board, admin, member, column, _other = setup
    body = {
        "title": " Write docs ", "description": "Details", "due_date": "2030-05-17",
        "labels": ["bug", "ui"], "assignee_id": str(member.user_id),
    }
    data = assert_envelope(client.post(cards_url(column), json=body, headers=auth_header(admin)), 201)
    assert set(data) == CARD_FIELDS
    assert (data["title"], data["order"], data["due_date"]) == ("Write docs", 1.0, "2030-05-17")
    assert data["labels"] == ["bug", "ui"] and data["description"] == "Details"
    assert data["assignee"] == {"user_id": str(member.user_id), "name": member.name}
    assert data["board_id"] == str(board.board_id) and data["column_id"] == str(column.column_id)


def test_create_card_defaults_and_increasing_order(client, setup, auth_header, make_card):
    _board, admin, member, column, other = setup
    headers = auth_header(member)
    first = assert_envelope(client.post(cards_url(column), json={"title": "A"}, headers=headers), 201)
    assert (first["description"], first["due_date"], first["labels"], first["assignee"]) == (None, None, [], None)
    make_card(column, order=10.0)
    second = assert_envelope(client.post(cards_url(column), json={"title": "B"}, headers=headers), 201)
    assert first["order"] == 1.0 and second["order"] == 11.0
    in_other = assert_envelope(client.post(cards_url(other), json={"title": "C"}, headers=headers), 201)
    assert in_other["order"] == 1.0


def test_new_card_order_ignores_soft_deleted_cards(client, setup, auth_header, make_card):
    _board, admin, _member, column, _other = setup
    make_card(column, order=1.0)
    doomed = make_card(column, order=50.0)
    assert_envelope(client.delete(card_url(doomed), headers=auth_header(admin)), 200)
    data = assert_envelope(client.post(cards_url(column), json={"title": "x"}, headers=auth_header(admin)), 201)
    assert data["order"] == 2.0


INVALID_BODIES = [
    {}, {"title": ""}, {"title": "   "}, {"title": "x" * 201}, {"title": 5}, {"title": None},
    {"title": "t", "description": "d" * 5001}, {"title": "t", "description": 5},
    {"title": "t", "due_date": "not-a-date"}, {"title": "t", "due_date": "2030-13-40"},
    {"title": "t", "due_date": "2030-01-01T10:00:00"}, {"title": "t", "due_date": 20300101},
    {"title": "t", "labels": ["l"] * 11}, {"title": "t", "labels": [""]}, {"title": "t", "labels": ["x" * 31]},
    {"title": "t", "labels": "bug"}, {"title": "t", "labels": [1]}, {"title": "t", "labels": None},
    {"title": "t", "assignee_id": "nope"}, {"title": "t", "assignee_id": 5},
    {"title": "t", "order": 3.0}, {"title": "t", "column_id": str(uuid.uuid4())},
]


@pytest.mark.parametrize("body", INVALID_BODIES)
def test_create_card_invalid_body_is_400_and_creates_nothing(client, setup, auth_header, count_rows, body):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    assert_envelope(client.post(cards_url(column), json=body, headers=auth_header(admin)), 400)
    assert count_rows(Card) == 0


@pytest.mark.parametrize(
    "body",
    [
        {"title": "t"}, {"title": "x" * 200}, {"title": "t", "description": "d" * 5000},
        {"title": "t", "description": ""}, {"title": "t", "description": None},
        {"title": "t", "labels": ["x" * 30] * 10}, {"title": "t", "labels": []},
        {"title": "t", "due_date": None}, {"title": "t", "due_date": "2024-02-29"},
    ],
)
def test_create_card_boundary_values_are_accepted(client, setup, auth_header, body):
    _board, admin, _member, column, _other = setup
    assert_envelope(client.post(cards_url(column), json=body, headers=auth_header(admin)), 201)


def test_create_card_assignee_must_be_a_member(client, setup, make_user, make_deleted_user, auth_header, count_rows):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    for assignee in (make_user(), make_deleted_user(), type("U", (), {"user_id": uuid.uuid4()})()):
        body = {"title": "t", "assignee_id": str(assignee.user_id)}
        assert_envelope(client.post(cards_url(column), json=body, headers=auth_header(admin)), 400)
    assert count_rows(Card) == 0


def test_create_card_non_member_is_403_and_missing_column_is_404(client, setup, make_user, auth_header, count_rows):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    outsider = make_user()
    assert_envelope(client.post(cards_url(column), json={"title": "t"}, headers=auth_header(outsider)), 403)
    assert_envelope(client.post(f"/api/columns/{uuid.uuid4()}/cards", json={"title": "t"}, headers=auth_header(admin)), 404)
    assert_envelope(client.post("/api/columns/bad/cards", json={"title": "t"}, headers=auth_header(admin)), 404)
    assert count_rows(Card) == 0


def test_create_card_in_deleted_column_is_404(client, setup, auth_header):
    _board, admin, _member, column, _other = setup
    assert_envelope(client.delete(f"/api/columns/{column.column_id}", headers=auth_header(admin)), 200)
    assert_envelope(client.post(cards_url(column), json={"title": "t"}, headers=auth_header(admin)), 404)


# --- update -----------------------------------------------------------------------------------------


def test_update_changes_only_supplied_fields(client, setup, make_card, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, admin, member, column, _other = setup
    card = make_card(
        column, "Original", assignee=member, description="Keep me", labels=["a"], order=4.0
    )
    data = assert_envelope(client.patch(card_url(card), json={"title": "Renamed"}, headers=auth_header(member)), 200)
    assert data["title"] == "Renamed"
    assert (data["description"], data["labels"], data["order"]) == ("Keep me", ["a"], 4.0)
    assert data["assignee"]["user_id"] == str(member.user_id)
    row = fetch(Card, card.card_id)
    assert row.title == "Renamed" and row.assignee_id == member.user_id and row.column_id == column.column_id


def test_update_can_clear_optional_fields_and_unassign(client, setup, make_card, auth_header):
    _board, admin, member, column, _other = setup
    card = make_card(column, assignee=member, description="x", labels=["a"])
    body = {"description": None, "due_date": None, "assignee_id": None, "labels": []}
    data = assert_envelope(client.patch(card_url(card), json=body, headers=auth_header(admin)), 200)
    assert (data["description"], data["due_date"], data["assignee"], data["labels"]) == (None, None, None, [])


def test_update_empty_body_changes_nothing(client, setup, make_card, auth_header):
    _board, admin, _member, column, _other = setup
    card = make_card(column, "Same")
    data = assert_envelope(client.patch(card_url(card), json={}, headers=auth_header(admin)), 200)
    assert data["title"] == "Same"


@pytest.mark.parametrize("body", [
    {"title": ""}, {"title": "   "}, {"title": "x" * 201}, {"title": None}, {"description": "d" * 5001},
    {"due_date": "bad"}, {"labels": ["l"] * 11}, {"labels": ["x" * 31]}, {"labels": [""]},
    {"assignee_id": "nope"}, {"order": 5}, {"column_id": str(uuid.uuid4())}, {"board_id": str(uuid.uuid4())},
])
def test_update_invalid_body_is_400_and_unchanged(client, setup, make_card, auth_header, fetch, body):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    card = make_card(column, "Stable", description="d")
    assert_envelope(client.patch(card_url(card), json={"title": "Changed", **body}, headers=auth_header(admin)), 400)
    row = fetch(Card, card.card_id)
    assert (row.title, row.description) == ("Stable", "d")


def test_update_assignee_must_be_a_member(client, setup, make_card, make_user, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, admin, member, column, _other = setup
    card = make_card(column, assignee=member)
    body = {"title": "New", "assignee_id": str(make_user().user_id)}
    assert_envelope(client.patch(card_url(card), json=body, headers=auth_header(admin)), 400)
    row = fetch(Card, card.card_id)
    assert row.assignee_id == member.user_id and row.title != "New"


def test_update_non_member_403_and_missing_404(client, setup, make_card, make_user, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    card = make_card(column, "Keep")
    assert_envelope(client.patch(card_url(card), json={"title": "X"}, headers=auth_header(make_user())), 403)
    assert fetch(Card, card.card_id).title == "Keep"
    assert_envelope(client.patch(f"/api/cards/{uuid.uuid4()}", json={"title": "X"}, headers=auth_header(admin)), 404)
    assert_envelope(client.patch("/api/cards/nope", json={"title": "X"}, headers=auth_header(admin)), 404)
    assert_envelope(client.patch(card_url(card), json={"title": "X"}), 401)


# --- delete -----------------------------------------------------------------------------------------


def test_delete_card_cascades_to_comments_with_one_timestamp(
    client, setup, make_card, make_comment, auth_header, fetch
):
    from app.blueprints.cards.schema import Card
    from app.blueprints.comments.schema import Comment

    _board, admin, member, column, _other = setup
    doomed, kept = make_card(column), make_card(column)
    comment, kept_comment = make_comment(doomed, member), make_comment(kept, member)
    data = assert_envelope(client.delete(card_url(doomed), headers=auth_header(member)), 200)
    assert data == {"card_id": str(doomed.card_id)}
    rows = [fetch(Card, doomed.card_id), fetch(Comment, comment.comment_id)]
    assert all(row.is_deleted for row in rows) and len({row.deleted_at for row in rows}) == 1
    assert not fetch(Card, kept.card_id).is_deleted and not fetch(Comment, kept_comment.comment_id).is_deleted
    assert_envelope(client.delete(card_url(doomed), headers=auth_header(member)), 404)
    assert_envelope(client.patch(card_url(doomed), json={"title": "x"}, headers=auth_header(member)), 404)


def test_delete_card_non_member_is_403_and_changes_nothing(client, setup, make_card, make_user, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, _admin, _member, column, _other = setup
    card = make_card(column)
    assert_envelope(client.delete(card_url(card), headers=auth_header(make_user())), 403)
    assert not fetch(Card, card.card_id).is_deleted
