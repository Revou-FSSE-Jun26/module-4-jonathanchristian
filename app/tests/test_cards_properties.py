"""Property tests for card input validation, partial update, and assignee rules."""
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



# Feature: kano, Property 12: Server input validation (card fields)
@DB_SETTINGS
@given(
    title=st.text(alphabet=_safe_text, max_size=230),
    description=st.text(alphabet=_safe_text, max_size=5100) | st.none(),
    labels=st.lists(st.text(alphabet=_safe_text, max_size=35), max_size=12),
)
def test_property_card_validation_matches_the_rules(
    client, make_board, make_column, auth_header, reset_database, title, description, labels
):
    reset_database()
    board = make_board()
    column = make_column(board)
    body = {"title": title, "labels": labels}
    if description is not None:
        body["description"] = description
    valid = (
        1 <= len(title.strip()) <= 200
        and (description is None or len(description) <= 5000)
        and len(labels) <= 10
        and all(1 <= len(label) <= 30 for label in labels)
    )
    response = client.post(cards_url(column), json=body, headers=auth_header(board.owner))
    assert_envelope(response, 201 if valid else 400)


# Feature: kano, Property 17: Partial update (card)
@DB_SETTINGS
@given(
    fields=st.fixed_dictionaries(
        {},
        optional={
            "title": st.text(alphabet=st.characters(whitelist_categories=("Ll", "Lu")), min_size=1, max_size=50),
            "description": st.text(alphabet=st.characters(whitelist_categories=("Ll",)), max_size=100) | st.none(),
            "labels": st.lists(st.text(alphabet="abcxyz", min_size=1, max_size=10), max_size=10),
        },
    )
)
def test_property_update_changes_only_supplied_fields(
    client, make_board, make_column, make_card, auth_header, reset_database, fields
):
    reset_database()
    board = make_board()
    card = make_card(make_column(board), "Original title", description="Original", labels=["orig"], order=7.0)
    before = {"title": "Original title", "description": "Original", "labels": ["orig"]}
    data = assert_envelope(client.patch(card_url(card), json=fields, headers=auth_header(board.owner)), 200)
    for name, original in before.items():
        assert data[name] == (fields[name] if name in fields else original)
    assert data["order"] == 7.0 and data["column_id"] == str(card.column_id)


# Feature: kano, Property 18: Assignee must be a member (card create and update)
@DB_SETTINGS
@given(is_member=st.booleans(), on_update=st.booleans())
def test_property_assignee_must_be_a_member(
    client, make_board, make_member, make_column, make_card, make_user, auth_header, reset_database, is_member, on_update
):
    reset_database()
    board = make_board()
    column = make_column(board)
    assignee = make_member(board).member if is_member else make_user()
    body = {"assignee_id": str(assignee.user_id)}
    if on_update:
        card = make_card(column)
        response = client.patch(card_url(card), json=body, headers=auth_header(board.owner))
        assert_envelope(response, 200 if is_member else 400)
    else:
        response = client.post(cards_url(column), json={"title": "t", **body}, headers=auth_header(board.owner))
        assert_envelope(response, 201 if is_member else 400)
