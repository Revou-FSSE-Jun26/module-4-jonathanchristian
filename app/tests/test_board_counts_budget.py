"""pytest query budget and Property 77 for GET /api/boards (R47.4, design A22-R)."""
import random

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = [pytest.mark.e2e, pytest.mark.perf]

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
MAX_QUERIES = 4


def _fill(board, rng, make_member, make_column, make_card):
    for _ in range(rng.randint(0, 2)):
        make_member(board, role=rng.choice(["member", "manager", "guest"]))
    column = make_column(board)
    for _ in range(rng.randint(0, 3)):
        make_card(column)


def _list_queries(client, headers, query_counter):
    with query_counter() as counter:
        assert_envelope(client.get("/api/boards", headers=headers), 200)
    return counter.count


def test_board_list_runs_the_same_queries_for_one_and_for_five_boards(
    client, make_user, make_board, make_member, make_column, make_card, auth_header, query_counter
):
    one_user, many_user = make_user(), make_user()
    _fill(make_board(one_user), random.Random(1), make_member, make_column, make_card)
    for seed in range(5):
        _fill(make_board(many_user), random.Random(seed), make_member, make_column, make_card)
    one = _list_queries(client, auth_header(one_user), query_counter)
    many = _list_queries(client, auth_header(many_user), query_counter)
    assert one == many <= MAX_QUERIES


def test_a_user_without_boards_runs_two_queries(client, make_user, auth_header, query_counter):
    assert _list_queries(client, auth_header(make_user()), query_counter) == 2


# Feature: kano, Property 77: Board list query count is constant
@DB_SETTINGS
@given(st.integers(0, 2**32), st.integers(1, 20))
def test_board_list_query_count_is_constant(
    client, reset_database, make_user, make_board, make_member, make_column, make_card,
    auth_header, query_counter, seed, board_total,
):
    reset_database()
    rng = random.Random(seed)
    baseline_user, user = make_user(), make_user()
    _fill(make_board(baseline_user), rng, make_member, make_column, make_card)
    for _ in range(board_total):
        _fill(make_board(user), rng, make_member, make_column, make_card)
    baseline = _list_queries(client, auth_header(baseline_user), query_counter)
    assert _list_queries(client, auth_header(user), query_counter) == baseline <= MAX_QUERIES
