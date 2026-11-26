"""pytest tests for the checklist endpoints (design A17, Requirements 41.2 to 41.10)."""
import threading
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e


@pytest.fixture
def setup(make_board, make_column, make_card):
    board = make_board()
    return board, make_card(make_column(board), "Card")


def add_url(card):
    return f"/api/cards/{card.card_id}/checklist"


def item_url(item):
    return f"/api/checklist/{item['checklist_item_id'] if isinstance(item, dict) else item.checklist_item_id}"


def add(client, auth_header, user, card, text="Step"):
    return client.post(add_url(card), json={"text": text}, headers=auth_header(user))


def test_add_returns_201_with_order_1_then_increasing_and_is_done_false(client, setup, auth_header):
    board, card = setup
    first = assert_envelope(add(client, auth_header, board.owner, card, "  one  "), 201)
    second = assert_envelope(add(client, auth_header, board.owner, card, "two"), 201)
    assert set(first) == {"checklist_item_id", "text", "is_done", "order", "created_at", "updated_at"}
    assert (first["text"], first["is_done"], first["order"]) == ("one", False, 1.0)
    assert second["order"] == 2.0


def test_new_order_ignores_soft_deleted_items(client, setup, auth_header, make_checklist_item):
    board, card = setup
    make_checklist_item(card, order=9.0, is_deleted=True)
    assert assert_envelope(add(client, auth_header, board.owner, card), 201)["order"] == 1.0


def test_patch_changes_only_the_supplied_fields(client, setup, auth_header):
    board, card = setup
    headers = auth_header(board.owner)
    item = assert_envelope(add(client, auth_header, board.owner, card, "keep"), 201)
    done = assert_envelope(client.patch(item_url(item), json={"is_done": True}, headers=headers), 200)
    assert (done["text"], done["is_done"], done["order"]) == ("keep", True, item["order"])
    edited = assert_envelope(client.patch(item_url(item), json={"text": " New ", "order": 7.5}, headers=headers), 200)
    assert (edited["text"], edited["is_done"], edited["order"]) == ("New", True, 7.5)
    undone = assert_envelope(client.patch(item_url(item), json={"is_done": False}, headers=headers), 200)
    assert undone["is_done"] is False


def test_delete_soft_deletes_and_returns_the_id(client, setup, auth_header, fetch, count_rows):
    from app.blueprints.cards.schema import ChecklistItem

    board, card = setup
    item = assert_envelope(add(client, auth_header, board.owner, card), 201)
    data = assert_envelope(client.delete(item_url(item), headers=auth_header(board.owner)), 200)
    assert data == {"checklist_item_id": item["checklist_item_id"]}
    row = fetch(ChecklistItem, uuid.UUID(item["checklist_item_id"]))
    assert row.is_deleted is True and row.deleted_at is not None
    assert count_rows(ChecklistItem) == 1  # never physically removed
    assert_envelope(client.delete(item_url(item), headers=auth_header(board.owner)), 404)
    assert_envelope(client.patch(item_url(item), json={"text": "x"}, headers=auth_header(board.owner)), 404)


def test_the_50th_item_is_accepted_and_the_51st_is_400(client, setup, auth_header, make_checklist_item):
    board, card = setup
    for _ in range(49):
        make_checklist_item(card)
    assert_envelope(add(client, auth_header, board.owner, card), 201)
    message = assert_envelope(add(client, auth_header, board.owner, card), 400)
    assert "50" in message


def test_a_soft_deleted_item_does_not_count_toward_the_cap(client, setup, auth_header, make_checklist_item):
    board, card = setup
    for _ in range(49):
        make_checklist_item(card)
    make_checklist_item(card, is_deleted=True)
    assert_envelope(add(client, auth_header, board.owner, card), 201)
    assert_envelope(add(client, auth_header, board.owner, card), 400)


def test_two_simultaneous_adds_at_49_items_end_with_50(app, setup, auth_header, make_checklist_item, count_rows):
    from app.blueprints.cards.schema import ChecklistItem

    board, card = setup
    for _ in range(49):
        make_checklist_item(card)
    headers = auth_header(board.owner)
    barrier, statuses = threading.Barrier(2), []

    def worker():
        client = app.test_client()
        barrier.wait()
        statuses.append(client.post(add_url(card), json={"text": "race"}, headers=headers).status_code)

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert sorted(statuses) == [201, 400], statuses
    assert count_rows(ChecklistItem, ChecklistItem.card_id == card.card_id, ChecklistItem.is_deleted.is_(False)) == 50


@pytest.mark.parametrize(
    "text,status",
    [("", 400), ("   ", 400), ("a", 201), ("a" * 200, 201), ("a" * 201, 400), (None, 400), (5, 400)],
)
def test_text_boundaries(client, setup, auth_header, text, status):
    board, card = setup
    assert_envelope(add(client, auth_header, board.owner, card, text), status)


def test_missing_text_and_unknown_fields_are_400(client, setup, auth_header):
    board, card = setup
    headers = auth_header(board.owner)
    assert_envelope(client.post(add_url(card), json={}, headers=headers), 400)
    assert_envelope(client.post(add_url(card), json={"text": "x", "is_done": True}, headers=headers), 400)


@pytest.mark.parametrize("body", [
    {}, {"is_done": "true"}, {"is_done": 1}, {"is_done": 0}, {"is_done": None}, {"text": ""},
    {"text": " "}, {"text": "a" * 201}, {"order": 0}, {"order": -1.0}, {"order": "2"}, {"order": True},
    {"order": None}, {"unknown": 1}, {"checklist_item_id": "x"},
])
def test_invalid_patch_bodies_are_400(client, setup, auth_header, body):
    board, card = setup
    item = assert_envelope(add(client, auth_header, board.owner, card), 201)
    assert_envelope(client.patch(item_url(item), json=body, headers=auth_header(board.owner)), 400)


def test_patch_with_an_infinite_order_is_400(client, setup, auth_header):
    board, card = setup
    item = assert_envelope(add(client, auth_header, board.owner, card), 201)
    response = client.patch(
        item_url(item), data='{"order": 1e999}', content_type="application/json",
        headers=auth_header(board.owner),
    )
    assert_envelope(response, 400)


@pytest.mark.parametrize("role", ["admin", "manager", "member"])
def test_writers_can_add_edit_and_delete(client, setup, auth_header, make_member, role):
    board, card = setup
    user = board.owner if role == "admin" else make_member(board, role=role).member
    headers = auth_header(user)
    item = assert_envelope(add(client, auth_header, user, card), 201)
    assert_envelope(client.patch(item_url(item), json={"is_done": True}, headers=headers), 200)
    assert_envelope(client.delete(item_url(item), headers=headers), 200)


def test_guest_and_non_participant_get_403_and_nothing_changes(
    client, setup, auth_header, make_member, make_user, make_checklist_item, count_rows, fetch
):
    from app.blueprints.cards.schema import ChecklistItem

    board, card = setup
    item = make_checklist_item(card, "orig")
    guest = make_member(board, role="guest").member
    for user in (guest, make_user()):
        headers = auth_header(user)
        for response in (
            client.post(add_url(card), json={"text": "x"}, headers=headers),
            client.patch(item_url(item), json={"text": "hacked"}, headers=headers),
            client.delete(item_url(item), headers=headers),
        ):
            message = assert_envelope(response, 403)
            assert "orig" not in message and str(card.card_id) not in message
    assert count_rows(ChecklistItem) == 1
    row = fetch(ChecklistItem, item.checklist_item_id)
    assert row.text == "orig" and row.is_deleted is False


def test_missing_soft_deleted_and_malformed_ids_are_404(client, setup, auth_header, persist):
    board, card = setup
    headers = auth_header(board.owner)
    random_id = uuid.uuid4()
    assert_envelope(client.post(f"/api/cards/{random_id}/checklist", json={"text": "x"}, headers=headers), 404)
    assert_envelope(client.patch(f"/api/checklist/{random_id}", json={"text": "x"}, headers=headers), 404)
    assert_envelope(client.delete(f"/api/checklist/{random_id}", headers=headers), 404)
    assert_envelope(client.post("/api/cards/not-a-uuid/checklist", json={"text": "x"}, headers=headers), 404)
    assert_envelope(client.delete("/api/checklist/not-a-uuid", headers=headers), 404)
    card.is_deleted = True
    persist(card)
    assert_envelope(add(client, auth_header, board.owner, card), 404)


def test_requests_without_a_token_are_401(client, setup, make_checklist_item):
    _board, card = setup
    item = make_checklist_item(card)
    assert_envelope(client.post(add_url(card), json={"text": "x"}), 401)
    assert_envelope(client.patch(item_url(item), json={"text": "x"}), 401)
    assert_envelope(client.delete(item_url(item)), 401)


def test_checklist_changes_never_notify_or_touch_status(client, setup, auth_header, count_rows, fetch):
    from app.blueprints.cards.schema import Card
    from app.blueprints.notifications.schema import Notification

    board, card = setup
    headers = auth_header(board.owner)
    before = fetch(Card, card.card_id)
    item = assert_envelope(add(client, auth_header, board.owner, card), 201)
    client.patch(item_url(item), json={"is_done": True}, headers=headers)
    client.delete(item_url(item), headers=headers)
    after = fetch(Card, card.card_id)
    assert (after.status, after.completed_at) == (before.status, before.completed_at) == ("NOT_STARTED", None)
    assert count_rows(Notification) == 0


# Feature: kano, Property 66: Checklist rules
_operations = st.lists(
    st.one_of(
        st.tuples(st.just("add"), st.text("abcdef ", min_size=1, max_size=8).filter(lambda t: t.strip())),
        st.tuples(st.just("toggle"), st.integers(0, 20)),
        st.tuples(st.just("edit"), st.integers(0, 20), st.text("xyz", min_size=1, max_size=6)),
        st.tuples(st.just("delete"), st.integers(0, 20)),
    ),
    max_size=14,
)


@settings(max_examples=15, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(operations=_operations)
def test_property_checklist_matches_a_naive_model(
    client, reset_database, make_user, make_board, make_column, make_card, auth_header, operations
):
    reset_database()
    board = make_board(make_user())
    card = make_card(make_column(board))
    headers = auth_header(board.owner)
    model = []  # live items as {"id", "text", "done", "order"}
    next_order = 1.0
    for operation in operations:
        kind = operation[0]
        if kind == "add":
            data = assert_envelope(client.post(add_url(card), json={"text": operation[1]}, headers=headers), 201)
            assert data["order"] == next_order and data["is_done"] is False
            model.append({"id": data["checklist_item_id"], "text": operation[1].strip(), "done": False, "order": next_order})
            next_order += 1.0
        elif model:
            target = model[operation[1] % len(model)]
            url = f"/api/checklist/{target['id']}"
            if kind == "toggle":
                target["done"] = not target["done"]
                assert_envelope(client.patch(url, json={"is_done": target["done"]}, headers=headers), 200)
            elif kind == "edit":
                target["text"] = operation[2]
                assert_envelope(client.patch(url, json={"text": operation[2]}, headers=headers), 200)
            else:
                assert_envelope(client.delete(url, headers=headers), 200)
                model.remove(target)
                next_order = max([item["order"] for item in model] + [0.0]) + 1.0
    detail = assert_envelope(client.get(f"/api/cards/{card.card_id}", headers=headers), 200)
    assert [(i["checklist_item_id"], i["text"], i["is_done"]) for i in detail["checklist"]] == [
        (m["id"], m["text"], m["done"]) for m in sorted(model, key=lambda m: m["order"])
    ]
    assert detail["checklist_total"] == len(model)
    assert detail["checklist_done"] == sum(m["done"] for m in model)
    assert 0 <= detail["checklist_done"] <= detail["checklist_total"] <= 50
