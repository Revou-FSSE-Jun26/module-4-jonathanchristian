"""Column endpoints by role (design A15, Requirements 10.1 to 10.11)."""
import pytest

from endpoints import snapshot
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

MANAGER_ROLES = ("admin", "manager")
DENIED_ROLES = ("member", "guest", "nonmember")


@pytest.fixture
def world(make_board, make_member, make_manager, make_user, make_column):
    board = make_board()
    people = {
        "admin": board.owner,
        "manager": make_manager(board).member,
        "member": make_member(board).member,
        "guest": make_member(board, role="guest").member,
        "nonmember": make_user(),
    }
    return board, people, make_column(board, "First"), make_column(board, "Second")


def requests_for(board, first, second):
    base = f"/api/boards/{board.board_id}"
    return {
        "create": ("post", f"{base}/columns", {"name": "Created"}),
        "rename": ("patch", f"/api/columns/{first.column_id}", {"name": "Renamed"}),
        "delete": ("delete", f"/api/columns/{first.column_id}", None),
        "reorder": ("patch", f"{base}/columns/reorder", {"column_id": str(second.column_id), "order": 9.5}),
    }


def send(client, headers, request):
    method, url, body = request
    kwargs = {"headers": headers}
    if body is not None:
        kwargs["json"] = body
    return getattr(client, method)(url, **kwargs)


@pytest.mark.parametrize("action", ["create", "rename", "delete", "reorder"])
@pytest.mark.parametrize("role", MANAGER_ROLES)
def test_admin_and_manager_succeed_on_all_four_endpoints(client, world, auth_header, role, action):
    board, people, first, second = world
    request = requests_for(board, first, second)[action]
    assert_envelope(send(client, auth_header(people[role]), request), 201 if action == "create" else 200)


@pytest.mark.parametrize("action", ["create", "rename", "delete", "reorder"])
@pytest.mark.parametrize("role", DENIED_ROLES)
def test_member_guest_and_outsider_get_403_and_the_data_is_unchanged(app, client, world, auth_header, role, action):
    board, people, first, second = world
    before = snapshot(app)
    message = assert_envelope(send(client, auth_header(people[role]), requests_for(board, first, second)[action]), 403)
    assert "First" not in message and board.name not in message
    assert snapshot(app) == before


@pytest.mark.parametrize("action", ["create", "rename", "delete", "reorder"])
def test_a_member_is_denied_before_the_body_is_validated(client, world, auth_header, action):
    board, people, first, second = world
    method, url, _body = requests_for(board, first, second)[action]
    bad = {"name": ""} if action in ("create", "rename") else {"order": 0}
    if action == "delete":
        bad = None
    assert_envelope(send(client, auth_header(people["member"]), (method, url, bad)), 403)


def test_a_member_keeps_full_access_to_cards_items_links_comments_and_status(client, world, auth_header, make_card):
    board, people, first, _second = world
    headers = auth_header(people["member"])
    created = assert_envelope(client.post(f"/api/columns/{first.column_id}/cards", json={"title": "T"}, headers=headers), 201)
    card_id = created["card_id"]
    assert_envelope(client.patch(f"/api/cards/{card_id}", json={"status": "URGENT"}, headers=headers), 200)
    assert_envelope(client.post(f"/api/cards/{card_id}/checklist", json={"text": "s"}, headers=headers), 201)
    assert_envelope(client.post(f"/api/cards/{card_id}/links", json={"url": "https://a.org"}, headers=headers), 201)
    assert_envelope(client.post(f"/api/cards/{card_id}/comments", json={"content": "hi"}, headers=headers), 201)
    assert_envelope(
        client.patch(f"/api/cards/{card_id}/position", json={"column_id": str(first.column_id), "order": 4.0}, headers=headers),
        200,
    )
    assert_envelope(client.delete(f"/api/cards/{card_id}", headers=headers), 200)


def test_missing_column_and_missing_board_are_404_for_a_manager(client, world, auth_header):
    import uuid

    _board, people, _first, _second = world
    headers = auth_header(people["manager"])
    assert_envelope(client.patch(f"/api/columns/{uuid.uuid4()}", json={"name": "x"}, headers=headers), 404)
    assert_envelope(client.delete(f"/api/columns/{uuid.uuid4()}", headers=headers), 404)
    assert_envelope(client.post(f"/api/boards/{uuid.uuid4()}/columns", json={"name": "x"}, headers=headers), 404)


def test_invalid_bodies_are_400_for_a_manager_and_reorder_of_a_foreign_column_is_400(client, world, auth_header, make_board, make_column):
    board, people, first, _second = world
    headers = auth_header(people["manager"])
    assert_envelope(client.post(f"/api/boards/{board.board_id}/columns", json={"name": ""}, headers=headers), 400)
    assert_envelope(client.patch(f"/api/columns/{first.column_id}", json={"name": "x" * 101}, headers=headers), 400)
    foreign = make_column(make_board())
    body = {"column_id": str(foreign.column_id), "order": 2.0}
    assert_envelope(client.patch(f"/api/boards/{board.board_id}/columns/reorder", json=body, headers=headers), 400)
