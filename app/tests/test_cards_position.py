"""pytest tests for card position (drag and drop) and its properties."""
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


# --- position ----------------------------------------------------------------------------------------


def test_position_moves_card_to_column_and_order(client, setup, make_card, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, _admin, member, column, other = setup
    card = make_card(column)
    body = {"column_id": str(other.column_id), "order": 2.5}
    data = assert_envelope(client.patch(card_url(card, "/position"), json=body, headers=auth_header(member)), 200)
    assert (data["column_id"], data["order"]) == (str(other.column_id), 2.5)
    row = fetch(Card, card.card_id)
    assert (row.column_id, row.order) == (other.column_id, 2.5)


def test_position_within_same_column_reorders_the_board_detail(client, setup, make_card, auth_header):
    board, admin, _member, column, _other = setup
    a, b, c = make_card(column), make_card(column), make_card(column)
    body = {"column_id": str(column.column_id), "order": 0.5}
    assert_envelope(client.patch(card_url(c, "/position"), json=body, headers=auth_header(admin)), 200)
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(admin)), 200)
    ids = [card["card_id"] for card in detail["columns"][0]["cards"]]
    assert ids == [str(c.card_id), str(a.card_id), str(b.card_id)]


def test_position_to_other_board_or_deleted_or_unknown_column_is_400(
    client, setup, make_board, make_column, make_card, auth_header, fetch
):
    from app.blueprints.cards.schema import Card

    board, admin, _member, column, other = setup
    card = make_card(column, order=3.0)
    foreign = make_column(make_board(admin))
    assert_envelope(client.delete(f"/api/columns/{other.column_id}", headers=auth_header(admin)), 200)
    for target in (foreign.column_id, other.column_id, uuid.uuid4()):
        body = {"column_id": str(target), "order": 9.0}
        assert_envelope(client.patch(card_url(card, "/position"), json=body, headers=auth_header(admin)), 400)
    row = fetch(Card, card.card_id)
    assert (row.column_id, row.order) == (column.column_id, 3.0)


@pytest.mark.parametrize(
    "order", [0, -1, -0.1, "2", "abc", None, True, [], float("inf"), float("nan")]
)
def test_position_invalid_order_is_400_and_unchanged(client, setup, make_card, auth_header, fetch, order):
    import json

    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, _other = setup
    card = make_card(column, order=3.0)
    response = client.patch(
        card_url(card, "/position"),
        data=json.dumps({"column_id": str(column.column_id), "order": order}),
        headers={**auth_header(admin), "Content-Type": "application/json"},
    )
    assert_envelope(response, 400)
    assert fetch(Card, card.card_id).order == 3.0


@pytest.mark.parametrize("column_id", ["nope", 5, None, "", "1234"])
def test_position_invalid_column_id_is_400(client, setup, make_card, auth_header, column_id):
    _board, admin, _member, column, _other = setup
    card = make_card(column)
    body = {"column_id": column_id, "order": 2.0}
    assert_envelope(client.patch(card_url(card, "/position"), json=body, headers=auth_header(admin)), 400)
    assert_envelope(client.patch(card_url(card, "/position"), json={"order": 2.0}, headers=auth_header(admin)), 400)


def test_position_non_member_403_and_missing_card_404(client, setup, make_card, make_user, auth_header, fetch):
    from app.blueprints.cards.schema import Card

    _board, admin, _member, column, other = setup
    card = make_card(column, order=3.0)
    body = {"column_id": str(other.column_id), "order": 1.0}
    assert_envelope(client.patch(card_url(card, "/position"), json=body, headers=auth_header(make_user())), 403)
    assert fetch(Card, card.card_id).column_id == column.column_id
    assert_envelope(client.patch(f"/api/cards/{uuid.uuid4()}/position", json=body, headers=auth_header(admin)), 404)


# Feature: kano, Property 15: Server order allocation (cards)
@DB_SETTINGS
@given(existing=st.lists(st.floats(0.001, 1000, allow_nan=False, allow_infinity=False), max_size=4))
def test_property_new_card_order_exceeds_every_existing_order(
    client, make_board, make_column, make_card, auth_header, reset_database, existing
):
    reset_database()
    board = make_board()
    column = make_column(board)
    for value in existing:
        make_card(column, order=value)
    data = assert_envelope(client.post(cards_url(column), json={"title": "new"}, headers=auth_header(board.owner)), 201)
    assert data["order"] == (max(existing) + 1.0 if existing else 1.0)
    assert all(data["order"] > value for value in existing)


# Feature: kano, Property 16: Position and reorder persistence (cards)
@DB_SETTINGS
@given(order=st.floats(1e-6, 1e9, allow_nan=False, allow_infinity=False), to_other=st.booleans())
def test_property_position_persists_exactly(
    client, make_board, make_column, make_card, auth_header, reset_database, fetch, order, to_other
):
    from app.blueprints.cards.schema import Card

    reset_database()
    board = make_board()
    column, other = make_column(board), make_column(board)
    card = make_card(column)
    target = other if to_other else column
    body = {"column_id": str(target.column_id), "order": order}
    data = assert_envelope(client.patch(card_url(card, "/position"), json=body, headers=auth_header(board.owner)), 200)
    assert data["order"] == order and data["column_id"] == str(target.column_id)
    row = fetch(Card, card.card_id)
    assert (row.column_id, row.order) == (target.column_id, order)
