"""pytest tests for card search and My Tasks (GET /api/cards)."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

URL = "/api/cards"
RESULT_FIELDS = {
    "card_id", "board_id", "column_id", "title", "description", "due_date", "labels",
    "assignee", "order", "created_at", "updated_at", "board_name", "column_name",
}


def ids(data):
    return {card["card_id"] for card in data}


@pytest.fixture
def world(make_user, make_board, make_member, make_column, make_card):
    """Two boards of `me`, one foreign board, with a few named cards."""
    me = make_user()
    board_a = make_board(me, name="Alpha")
    board_b = make_board(me, name="Beta")
    foreign = make_board(name="Foreign")
    col_a, col_b = make_column(board_a, "Doing"), make_column(board_b, "Done")
    col_f = make_column(foreign)
    return {
        "me": me, "board_a": board_a, "board_b": board_b, "foreign": foreign,
        "a1": make_card(col_a, "Fix Login bug", assignee=me),
        "a2": make_card(col_a, "Write docs", description="mention LOGIN flow"),
        "b1": make_card(col_b, "Deploy", assignee=me),
        "f1": make_card(col_f, "Foreign login", assignee=None),
    }


# --- search -------------------------------------------------------------------------------------------


def test_search_matches_title_or_description_case_insensitively_in_own_boards(client, world, auth_header):
    data = assert_envelope(client.get(f"{URL}?q=login", headers=auth_header(world["me"])), 200)
    assert ids(data) == {str(world["a1"].card_id), str(world["a2"].card_id)}
    assert set(data[0]) == RESULT_FIELDS
    first = next(card for card in data if card["card_id"] == str(world["a1"].card_id))
    assert (first["board_name"], first["column_name"]) == ("Alpha", "Doing")
    assert first["assignee"]["user_id"] == str(world["me"].user_id)


def test_search_restricted_to_one_board(client, world, auth_header):
    url = f"{URL}?q=e&board_id={world['board_b'].board_id}"
    data = assert_envelope(client.get(url, headers=auth_header(world["me"])), 200)
    assert ids(data) == {str(world["b1"].card_id)}


def test_search_board_where_not_a_member_is_403_and_missing_is_404(client, world, auth_header):
    headers = auth_header(world["me"])
    message = assert_envelope(client.get(f"{URL}?q=login&board_id={world['foreign'].board_id}", headers=headers), 403)
    assert "Foreign" not in message
    assert_envelope(client.get(f"{URL}?q=login&board_id={uuid.uuid4()}", headers=headers), 404)


def test_search_without_matches_is_an_empty_list(client, world, auth_header):
    assert assert_envelope(client.get(f"{URL}?q=zzzz", headers=auth_header(world["me"])), 200) == []


@pytest.mark.parametrize(
    "query",
    [
        "", "q=", "q=" + "x" * 101, "board_id=" + str(uuid.uuid4()), "q=a&board_id=nope", "assignee=you",
        "assignee=", "assignee=me&q=a", "assignee=me&board_id=" + str(uuid.uuid4()), "other=1", "q=a&other=1",
    ],
)
def test_invalid_query_combinations_are_400(client, world, auth_header, query):
    assert_envelope(client.get(f"{URL}?{query}", headers=auth_header(world["me"])), 400)


@pytest.mark.parametrize("q", ["x", "x" * 100])
def test_query_length_boundaries_are_accepted(client, world, auth_header, q):
    assert_envelope(client.get(f"{URL}?q={q}", headers=auth_header(world["me"])), 200)


def test_search_excludes_soft_deleted_cards_columns_boards_and_memberships(
    client, world, auth_header, make_user, make_board, make_column, make_card, make_member
):
    me, headers = world["me"], auth_header(world["me"])
    a1_id = str(world["a1"].card_id)
    assert_envelope(client.delete(f"/api/cards/{world['a1'].card_id}", headers=headers), 200)
    assert a1_id not in ids(assert_envelope(client.get(f"{URL}?q=login", headers=headers), 200))
    assert_envelope(client.delete(f"/api/boards/{world['board_a'].board_id}", headers=headers), 200)
    assert assert_envelope(client.get(f"{URL}?q=login", headers=headers), 200) == []
    other = make_board()
    membership = make_member(other, me)
    make_card(make_column(other), "login on other")
    assert len(assert_envelope(client.get(f"{URL}?q=login", headers=headers), 200)) == 1
    assert_envelope(client.delete(f"/api/boards/{other.board_id}/members/{me.user_id}", headers=auth_header(other.owner)), 200)
    assert assert_envelope(client.get(f"{URL}?q=login", headers=headers), 200) == []
    assert membership is not None


@pytest.mark.parametrize(
    "text", ["100%", "a_b", "back\\slash", "it's", "x; DROP TABLE cards;--", "%", "_", "\\", "' OR '1'='1"]
)
def test_metacharacters_are_literal_data(client, make_board, make_column, make_card, auth_header, text):
    board = make_board()
    column = make_column(board)
    exact = make_card(column, f"has {text} inside")
    make_card(column, "has 100x inside", description="aXb back/slash its")
    make_card(column, "plain")
    data = assert_envelope(client.get(URL, query_string={"q": text}, headers=auth_header(board.owner)), 200)
    assert ids(data) == {str(exact.card_id)}


def test_search_requires_authentication(client):
    assert_envelope(client.get(f"{URL}?q=a"), 401)


# --- My Tasks ----------------------------------------------------------------------------------------------


def test_my_tasks_returns_assigned_cards_with_board_and_column(client, world, auth_header):
    data = assert_envelope(client.get(f"{URL}?assignee=me", headers=auth_header(world["me"])), 200)
    assert ids(data) == {str(world["a1"].card_id), str(world["b1"].card_id)}
    by_id = {card["card_id"]: card for card in data}
    b1 = by_id[str(world["b1"].card_id)]
    assert (b1["board_id"], b1["board_name"], b1["column_name"]) == (str(world["board_b"].board_id), "Beta", "Done")
    assert [card["board_name"] for card in data] == ["Alpha", "Beta"]


def test_my_tasks_excludes_deleted_cards_columns_boards_and_removed_membership(
    client, world, auth_header, make_board, make_member, make_column, make_card
):
    me, headers = world["me"], auth_header(world["me"])
    other = make_board()
    make_member(other, me)
    gone_column = make_column(other, "Gone")
    make_card(gone_column, "in deleted column", assignee=me)
    kept = make_card(make_column(other), "kept", assignee=me)
    assert_envelope(client.delete(f"/api/columns/{gone_column.column_id}", headers=auth_header(other.owner)), 200)
    assert_envelope(client.delete(f"/api/cards/{world['a1'].card_id}", headers=headers), 200)
    assert_envelope(client.delete(f"/api/boards/{world['board_b'].board_id}", headers=headers), 200)
    assert ids(assert_envelope(client.get(f"{URL}?assignee=me", headers=headers), 200)) == {str(kept.card_id)}


def test_my_tasks_is_empty_without_assignments(client, make_user, auth_header):
    assert assert_envelope(client.get(f"{URL}?assignee=me", headers=auth_header(make_user())), 200) == []


# Feature: kano, Property 19: Search and My Tasks semantics
@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    needle=st.text(alphabet="abAB%_\\'", min_size=1, max_size=4),
    titles=st.lists(st.text(alphabet="abAB%_\\' x", min_size=1, max_size=12), min_size=1, max_size=6),
)
def test_property_search_equals_a_naive_case_insensitive_contains(
    client, make_board, make_column, make_card, auth_header, reset_database, needle, titles
):
    reset_database()
    board = make_board()
    column = make_column(board)
    cards = [make_card(column, title) for title in titles]
    expected = {str(c.card_id) for c, t in zip(cards, titles) if needle.lower() in t.lower()}
    data = assert_envelope(client.get(URL, query_string={"q": needle}, headers=auth_header(board.owner)), 200)
    assert ids(data) == expected
