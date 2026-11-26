"""Performance and query-count checks (V6: statuses, guest role, invite links; marker `perf`)."""
import time

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.perf

P95_BUDGET_MS = 500
REQUESTS = 100
MAX_QUERIES = 5
STATUSES = ("NOT_STARTED", "IN_PROGRESS", "DONE")


@pytest.fixture
def seed(app, make_user):
    """`seed(owner, columns, cards_per_column, ...)` bulk-inserts one Board and returns it."""
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns.schema import Column
    from app.extensions import db
    from app.soft_delete import utcnow

    def build(owner, board_name="Perf board", columns=20, cards_per_column=25, assign_every=0, title="Task", guest=None):
        with app.app_context():
            board = Board(name=board_name, created_by=owner.user_id)
            db.session.add(board)
            db.session.flush()
            db.session.add(BoardMembership(board_id=board.board_id, user_id=owner.user_id, role="admin"))
            if guest is not None:
                db.session.add(BoardMembership(board_id=board.board_id, user_id=guest.user_id, role="guest"))
            cards = []
            for c in range(columns):
                column = Column(board_id=board.board_id, name=f"Column {c}", order=float(c + 1))
                db.session.add(column)
                db.session.flush()
                for n in range(cards_per_column):
                    assigned = assign_every and n % assign_every == 0
                    status = STATUSES[n % 3]  # V6: every Card carries a status and completed_at
                    cards.append(
                        Card(
                            board_id=board.board_id, column_id=column.column_id, title=f"{title} {c}-{n}",
                            description=f"Description of {title} {c}-{n}", order=float(n + 1),
                            assignee_id=owner.user_id if assigned else None, labels=["a", "b"],
                            status=status, completed_at=utcnow() if status == "DONE" else None,
                        )
                    )
            db.session.add_all(cards)
            db.session.commit()
            board_id = board.board_id
        return board_id

    return build


def p95_ms(client, url, headers, requests=REQUESTS):
    samples = []
    for _ in range(requests):
        started = time.perf_counter()
        response = client.get(url, headers=headers)
        samples.append((time.perf_counter() - started) * 1000)
        assert response.status_code == 200
    samples.sort()
    return samples[int(len(samples) * 0.95) - 1]


def assert_p95(label, measured):
    assert measured < P95_BUDGET_MS, f"{label}: p95 {measured:.1f} ms exceeds {P95_BUDGET_MS} ms"


def test_board_detail_p95_with_20_columns_and_500_cards(client, make_user, auth_header, seed):
    owner = make_user()
    board_id = seed(owner, columns=20, cards_per_column=25)
    headers = auth_header(owner)
    data = assert_envelope(client.get(f"/api/boards/{board_id}", headers=headers), 200)
    assert len(data["columns"]) == 20 and sum(len(c["cards"]) for c in data["columns"]) == 500
    assert {c["status"] for col in data["columns"] for c in col["cards"]} == set(STATUSES)
    assert_p95("GET /api/boards/<id> (500 cards)", p95_ms(client, f"/api/boards/{board_id}", headers))


def test_board_detail_query_count_is_small_and_independent_of_card_count(
    client, make_user, auth_header, seed, query_counter
):
    owner = make_user()
    small, large = seed(owner, "Small", columns=2, cards_per_column=5), seed(owner, "Large", columns=20, cards_per_column=25)
    headers = auth_header(owner)
    counts = {}
    for name, board_id in (("small", small), ("large", large)):
        with query_counter() as counter:
            assert_envelope(client.get(f"/api/boards/{board_id}", headers=headers), 200)
        counts[name] = counter.count
    assert counts["small"] == counts["large"], counts
    assert counts["large"] <= MAX_QUERIES, counts


def test_guest_board_detail_uses_the_same_number_of_queries(client, make_user, auth_header, seed, query_counter):
    owner, guest = make_user(), make_user()
    small = seed(owner, "Small", columns=2, cards_per_column=5, guest=guest)
    large = seed(owner, "Large", columns=20, cards_per_column=25, guest=guest)
    counts = {}
    for name, board_id in (("small", small), ("large", large)):
        with query_counter() as counter:
            data = assert_envelope(client.get(f"/api/boards/{board_id}", headers=auth_header(guest)), 200)
        assert data["my_role"] == "guest"
        counts[name] = counter.count
    assert counts["small"] == counts["large"] <= MAX_QUERIES, counts


def test_invite_links_with_lazy_creation_use_a_fixed_number_of_queries(
    client, make_user, auth_header, seed, query_counter
):
    owner = make_user()
    small = seed(owner, "Small", columns=1, cards_per_column=1)
    large = seed(owner, "Large", columns=20, cards_per_column=25)  # the seeded Boards have NULL tokens
    headers, counts = auth_header(owner), {}
    for name, board_id in (("small", small), ("large", large)):
        for attempt in ("lazy", "existing"):
            with query_counter() as counter:
                data = assert_envelope(client.get(f"/api/boards/{board_id}/invite-links", headers=headers), 200)
            assert data["member"]["token"] and data["guest"]["token"]
            counts[(name, attempt)] = counter.count
    assert counts[("small", "lazy")] == counts[("large", "lazy")] <= 12, counts
    assert counts[("small", "existing")] == counts[("large", "existing")] <= 5, counts
    assert counts[("large", "existing")] < counts[("large", "lazy")], counts


def test_search_and_my_tasks_p95_with_20_boards_and_2000_cards(client, make_user, auth_header, seed):
    owner = make_user()
    for index in range(20):
        seed(owner, f"Board {index:02d}", columns=4, cards_per_column=25, assign_every=5, title="Task")
    headers = auth_header(owner)
    found = assert_envelope(client.get("/api/cards?q=task", headers=headers), 200)
    mine = assert_envelope(client.get("/api/cards?assignee=me", headers=headers), 200)
    assert len(found) == 2000 and len(mine) == 400
    assert all(card["status"] in STATUSES and "completed_at" in card for card in found)
    assert_p95("GET /api/cards?q=", p95_ms(client, "/api/cards?q=task", headers))
    assert_p95("GET /api/cards?assignee=me", p95_ms(client, "/api/cards?assignee=me", headers))


# Feature: kano, Property 25: Constant query count for board detail
@settings(max_examples=15, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(columns=st.integers(1, 5), cards_per_column=st.integers(0, 12))
def test_property_board_detail_query_count_is_constant(
    client, make_user, auth_header, seed, query_counter, reset_database, columns, cards_per_column
):
    reset_database()
    owner = make_user()
    board_id = seed(owner, columns=columns, cards_per_column=cards_per_column)
    with query_counter() as counter:
        assert_envelope(client.get(f"/api/boards/{board_id}", headers=auth_header(owner)), 200)
    assert counter.count == 5, counter.statements
