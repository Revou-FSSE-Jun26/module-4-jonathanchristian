"""pytest tests for GET /api/cards/<id>, the card counts, and the board detail query budget."""
import time
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DETAIL_FIELDS = {
    "card_id", "board_id", "column_id", "title", "description", "due_date", "labels", "assignee",
    "order", "status", "completed_at", "created_at", "updated_at", "checklist_done",
    "checklist_total", "link_count", "checklist", "links",
}
ITEM_FIELDS = {"checklist_item_id", "text", "is_done", "order", "created_at", "updated_at"}
LINK_FIELDS = {"card_link_id", "url", "label", "created_by", "created_at"}


@pytest.fixture
def setup(make_board, make_member, make_column, make_card):
    board = make_board()
    column = make_column(board)
    return board, column, make_card(column, "Detail card")


def get_detail(client, auth_header, user, card):
    return client.get(f"/api/cards/{card.card_id}", headers=auth_header(user))


def test_detail_returns_card_checklist_links_and_counts(
    client, setup, auth_header, make_checklist_item, make_card_link, make_user
):
    board, _column, card = setup
    late = make_checklist_item(card, "late", order=5.0)
    done = make_checklist_item(card, "done", is_done=True, order=2.0)
    first = make_checklist_item(card, "first", order=1.0)
    link_a = make_card_link(card, board.owner, label="a")
    link_b = make_card_link(card, board.owner, label="b")
    data = assert_envelope(get_detail(client, auth_header, board.owner, card), 200)
    assert set(data) == DETAIL_FIELDS
    assert [i["checklist_item_id"] for i in data["checklist"]] == [
        str(first.checklist_item_id), str(done.checklist_item_id), str(late.checklist_item_id)
    ]
    assert set(data["checklist"][0]) == ITEM_FIELDS
    assert (data["checklist_done"], data["checklist_total"], data["link_count"]) == (1, 3, 2)
    assert [l["card_link_id"] for l in data["links"]] == [
        str(link_a.card_link_id), str(link_b.card_link_id)
    ]
    assert set(data["links"][0]) == LINK_FIELDS
    assert data["links"][0]["created_by"] == str(board.owner.user_id)


def test_detail_without_items_has_empty_lists_and_zero_counts(client, setup, auth_header):
    board, _column, card = setup
    data = assert_envelope(get_detail(client, auth_header, board.owner, card), 200)
    assert data["checklist"] == [] and data["links"] == []
    assert (data["checklist_done"], data["checklist_total"], data["link_count"]) == (0, 0, 0)


@pytest.mark.parametrize("role", ["admin", "manager", "member", "guest"])
def test_every_role_can_read_the_detail(client, setup, auth_header, make_member, role):
    board, _column, card = setup
    user = board.owner if role == "admin" else make_member(board, role=role).member
    assert_envelope(get_detail(client, auth_header, user, card), 200)


def test_non_participant_gets_403_without_data(client, setup, auth_header, make_user):
    _board, _column, card = setup
    message = assert_envelope(get_detail(client, auth_header, make_user(), card), 403)
    assert "Detail card" not in message and str(card.card_id) not in message


def test_missing_deleted_and_malformed_ids_are_404(client, setup, auth_header, persist):
    board, _column, card = setup
    headers = auth_header(board.owner)
    for path in (f"/api/cards/{uuid.uuid4()}", "/api/cards/not-a-uuid"):
        assert_envelope(client.get(path, headers=headers), 404)
    card.is_deleted = True
    persist(card)
    assert_envelope(client.get(f"/api/cards/{card.card_id}", headers=headers), 404)


def test_detail_requires_a_token(client, setup):
    _board, _column, card = setup
    assert_envelope(client.get(f"/api/cards/{card.card_id}"), 401)


def test_soft_deleted_items_and_links_are_excluded(
    client, setup, auth_header, make_checklist_item, make_card_link
):
    board, _column, card = setup
    make_checklist_item(card, "live", is_done=True)
    make_checklist_item(card, "dead", is_done=True, is_deleted=True)
    make_card_link(card, board.owner)
    make_card_link(card, board.owner, is_deleted=True)
    data = assert_envelope(get_detail(client, auth_header, board.owner, card), 200)
    assert (data["checklist_done"], data["checklist_total"], data["link_count"]) == (1, 1, 1)
    assert [i["text"] for i in data["checklist"]] == ["live"]
    assert len(data["links"]) == 1


def test_board_detail_cards_carry_the_counts_and_other_cards_stay_zero(
    client, setup, auth_header, make_card, make_checklist_item, make_card_link
):
    board, column, card = setup
    other = make_card(column, "Other")
    make_checklist_item(card, "a", is_done=True)
    make_checklist_item(card, "b")
    make_checklist_item(card, "gone", is_deleted=True)
    make_card_link(card, board.owner)
    data = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    counts = {
        c["card_id"]: (c["checklist_done"], c["checklist_total"], c["link_count"])
        for c in data["columns"][0]["cards"]
    }
    assert counts == {str(card.card_id): (1, 2, 1), str(other.card_id): (0, 0, 0)}


def test_create_update_and_position_responses_carry_the_counts(
    client, setup, auth_header, make_column, make_checklist_item, make_card_link
):
    board, column, card = setup
    headers = auth_header(board.owner)
    created = assert_envelope(
        client.post(f"/api/columns/{column.column_id}/cards", json={"title": "New"}, headers=headers), 201
    )
    assert (created["checklist_done"], created["checklist_total"], created["link_count"]) == (0, 0, 0)
    make_checklist_item(card, "a", is_done=True)
    make_checklist_item(card, "b")
    make_card_link(card, board.owner)
    updated = assert_envelope(
        client.patch(f"/api/cards/{card.card_id}", json={"title": "Renamed"}, headers=headers), 200
    )
    assert (updated["checklist_done"], updated["checklist_total"], updated["link_count"]) == (1, 2, 1)
    other = make_column(board)
    moved = assert_envelope(
        client.patch(
            f"/api/cards/{card.card_id}/position",
            json={"column_id": str(other.column_id), "order": 3.0},
            headers=headers,
        ),
        200,
    )
    assert (moved["checklist_done"], moved["checklist_total"], moved["link_count"]) == (1, 2, 1)


def test_search_and_my_tasks_results_carry_no_counts(client, setup, auth_header, make_card, make_user):
    board, column, _card = setup
    make_card(column, "Findable", assignee=board.owner)
    headers = auth_header(board.owner)
    for url in ("/api/cards?q=Findable", "/api/cards?assignee=me"):
        results = assert_envelope(client.get(url, headers=headers), 200)
        assert results and not ({"checklist_done", "checklist_total", "link_count"} & set(results[0]))


# --- query budget -----------------------------------------------------------------------------------


def _seed_children(app, board, count_cards, items_per_card, links_per_card, user):
    """Bulk insert one Column with cards, items, and links."""
    from app.blueprints.cards.schema import Card, CardLink, ChecklistItem
    from app.blueprints.columns.schema import Column
    from app.extensions import db

    with app.app_context():
        column = Column(board_id=board.board_id, name="Bulk", order=50.0)
        db.session.add(column)
        db.session.flush()
        for number in range(count_cards):
            card = Card(
                board_id=board.board_id, column_id=column.column_id, title=f"c{number}",
                order=float(number + 1),
            )
            db.session.add(card)
            db.session.flush()
            for index in range(items_per_card):
                db.session.add(
                    ChecklistItem(card_id=card.card_id, text="t", order=float(index + 1), is_done=index % 2 == 0)
                )
            for index in range(links_per_card):
                db.session.add(
                    CardLink(card_id=card.card_id, created_by=user.user_id, url="https://example.com", label="x")
                )
        db.session.commit()


def test_board_detail_query_count_is_5_and_the_same_for_10_and_500_cards(
    client, app, make_board, auth_header, query_counter
):
    small, large = make_board(), make_board()
    _seed_children(app, small, 10, 3, 2, small.owner)
    _seed_children(app, large, 500, 3, 2, large.owner)
    counts = {}
    for name, board in (("small", small), ("large", large)):
        with query_counter() as counter:
            data = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
        counts[name] = counter.count
        card = data["columns"][0]["cards"][0]
        assert (card["checklist_done"], card["checklist_total"], card["link_count"]) == (2, 3, 2)
    assert counts["small"] == counts["large"] == 5, counts


@pytest.mark.perf
def test_board_detail_p95_with_500_cards_with_items_and_links(client, app, make_board, auth_header):
    board = make_board()
    _seed_children(app, board, 500, 3, 2, board.owner)
    headers, samples = auth_header(board.owner), []
    for _ in range(100):
        started = time.perf_counter()
        assert client.get(f"/api/boards/{board.board_id}", headers=headers).status_code == 200
        samples.append((time.perf_counter() - started) * 1000)
    samples.sort()
    assert samples[94] < 500, samples[94]


# Feature: kano, Property 71: Board payload counts and constant query count
@settings(max_examples=15, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    cards=st.lists(
        st.tuples(
            st.lists(st.tuples(st.booleans(), st.booleans()), max_size=5),  # (is_done, is_deleted)
            st.lists(st.booleans(), max_size=4),  # is_deleted per link
        ),
        min_size=1,
        max_size=6,
    )
)
def test_property_counts_match_the_rows_and_the_query_count_is_constant(
    client, reset_database, make_user, make_board, make_column, make_card,
    make_checklist_item, make_card_link, auth_header, query_counter, cards,
):
    reset_database()
    board = make_board(make_user())
    column = make_column(board)
    expected = {}
    for index, (items, links) in enumerate(cards):
        card = make_card(column, f"c{index}")
        for done, deleted in items:
            make_checklist_item(card, is_done=done, is_deleted=deleted)
        for deleted in links:
            make_card_link(card, board.owner, is_deleted=deleted)
        live = [done for done, deleted in items if not deleted]
        expected[str(card.card_id)] = (sum(live), len(live), links.count(False))
    with query_counter() as counter:
        data = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(board.owner)), 200)
    assert counter.count == 5, counter.statements
    shown = {
        c["card_id"]: (c["checklist_done"], c["checklist_total"], c["link_count"])
        for c in data["columns"][0]["cards"]
    }
    assert shown == expected
