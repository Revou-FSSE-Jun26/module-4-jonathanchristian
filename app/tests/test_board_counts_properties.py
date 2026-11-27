"""Hypothesis properties 76, 78, and 79 for the Board counts (R47, design A22-R)."""
import random

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
ROLES = ["member", "manager", "guest"]


@pytest.fixture
def build_boards(make_user, make_board, make_member, make_column, make_card, persist):
    """Random Boards of one User; returns `(user, {board: (naive_members, naive_cards)})`."""

    def build(rng, board_total):
        user = make_user()
        naive = {}
        for _ in range(board_total):
            board = make_board(user)
            members, cards = 1, 0
            for _ in range(rng.randint(0, 3)):
                membership = make_member(board, role=rng.choice(ROLES))
                if rng.random() < 0.3:
                    membership.is_deleted = True
                    persist(membership)
                else:
                    members += 1
            columns = [make_column(board) for _ in range(rng.randint(1, 2))]
            for _ in range(rng.randint(0, 4)):
                card = make_card(rng.choice(columns), status=rng.choice(["NOT_STARTED", "URGENT", "DONE"]))
                if rng.random() < 0.3:
                    card.is_deleted = True
                    persist(card)
                else:
                    cards += 1
            naive[board] = (members, cards)
        return user, naive

    return build


# Feature: kano, Property 76: Board counts equal a naive model
@DB_SETTINGS
@given(st.integers(0, 2**32), st.integers(1, 4))
def test_board_counts_equal_a_naive_model(app, client, reset_database, build_boards, auth_header, seed, board_total):
    from app.blueprints.boards.service.board_counts import board_counts, board_counts_one

    reset_database()
    user, naive = build_boards(random.Random(seed), board_total)
    with app.app_context():
        grouped = board_counts([b.board_id for b in naive])
        singles = {b: board_counts_one(b.board_id) for b in naive}
    for board, expected in naive.items():
        assert grouped[board.board_id] == expected == singles[board]
    listed = assert_envelope(client.get("/api/boards", headers=auth_header(user)), 200)
    by_id = {item["board_id"]: (item["member_count"], item["card_count"]) for item in listed}
    assert by_id == {str(b.board_id): expected for b, expected in naive.items()}


# Feature: kano, Property 78: Create and update carry the right counts
@DB_SETTINGS
@given(st.integers(0, 2**32))
def test_create_and_update_carry_the_right_counts(client, reset_database, build_boards, make_user, auth_header, seed):
    reset_database()
    created = assert_envelope(
        client.post("/api/boards", json={"name": "New"}, headers=auth_header(make_user())), 201
    )
    assert (created["member_count"], created["card_count"]) == (1, 0)
    user, naive = build_boards(random.Random(seed), 1)
    [(board, expected)] = naive.items()
    patched = assert_envelope(
        client.patch(f"/api/boards/{board.board_id}", json={"name": "Renamed"}, headers=auth_header(user)), 200
    )
    assert (patched["member_count"], patched["card_count"]) == expected


# Feature: kano, Property 79: Board detail never carries the counts
@DB_SETTINGS
@given(st.integers(0, 2**32))
def test_board_detail_never_carries_the_counts(client, reset_database, build_boards, auth_header, seed):
    reset_database()
    user, naive = build_boards(random.Random(seed), 1)
    [board] = naive
    headers = auth_header(user)
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
    assert "member_count" not in detail and "card_count" not in detail
    [listed] = assert_envelope(client.get("/api/boards", headers=headers), 200)
    patched = assert_envelope(
        client.patch(f"/api/boards/{board.board_id}", json={"name": "Again"}, headers=headers), 200
    )
    for body in (listed, patched):
        assert {"member_count", "card_count"} <= set(body)
