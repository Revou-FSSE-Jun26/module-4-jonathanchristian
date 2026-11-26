"""pytest tests for the workspace link endpoints (design A17, Requirements 42.2 to 42.9)."""
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
    return f"/api/cards/{card.card_id}/links"


def link_url(link):
    return f"/api/links/{link['card_link_id'] if isinstance(link, dict) else link.card_link_id}"


def add(client, auth_header, user, card, **body):
    body.setdefault("url", "https://example.com/docs")
    return client.post(add_url(card), json=body, headers=auth_header(user))


def test_add_returns_201_with_the_creator_and_a_hostname_label(client, setup, auth_header):
    board, card = setup
    data = assert_envelope(add(client, auth_header, board.owner, card, url=" HTTPS://Docs.Example.com/a "), 201)
    assert set(data) == {"card_link_id", "url", "label", "created_by", "created_at"}
    assert data["url"] == "HTTPS://Docs.Example.com/a"
    assert data["label"] == "docs.example.com"
    assert data["created_by"] == str(board.owner.user_id)


def test_a_given_label_is_trimmed_and_kept(client, setup, auth_header):
    board, card = setup
    data = assert_envelope(add(client, auth_header, board.owner, card, label="  Spec  "), 201)
    assert data["label"] == "Spec"


def test_a_hostname_over_100_characters_is_cut_to_100(client, setup, auth_header):
    board, card = setup
    host = ".".join(["a" * 60, "b" * 60, "com"])
    data = assert_envelope(add(client, auth_header, board.owner, card, url=f"https://{host}/x"), 201)
    assert data["label"] == host[:100] and len(data["label"]) == 100


@pytest.mark.parametrize("label,status", [("", 400), ("   ", 400), ("a", 201), ("a" * 100, 201), ("a" * 101, 400), (None, 400)])
def test_label_boundaries(client, setup, auth_header, label, status):
    board, card = setup
    assert_envelope(add(client, auth_header, board.owner, card, label=label), status)


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "file:///etc/passwd",
        "example.com/path", "//example.com/path", "http:///x", "https://", "",  "   ",
        "https://exa mple.com", "https://example.com/\nx", "ftp://example.com",
        "https://example.com/" + "a" * 2049, 5, None,
    ],
)
def test_unsafe_or_malformed_urls_are_400_on_create_and_patch(client, setup, auth_header, make_card_link, url):
    board, card = setup
    assert_envelope(client.post(add_url(card), json={"url": url}, headers=auth_header(board.owner)), 400)
    link = make_card_link(card, board.owner)
    assert_envelope(client.patch(link_url(link), json={"url": url}, headers=auth_header(board.owner)), 400)


def test_a_url_of_exactly_2048_characters_is_accepted(client, setup, auth_header):
    board, card = setup
    url = "https://example.com/" + "a" * (2048 - len("https://example.com/"))
    assert_envelope(add(client, auth_header, board.owner, card, url=url), 201)


def test_missing_url_and_unknown_fields_are_400(client, setup, auth_header):
    board, card = setup
    headers = auth_header(board.owner)
    assert_envelope(client.post(add_url(card), json={}, headers=headers), 400)
    assert_envelope(client.post(add_url(card), json={"url": "https://a.com", "created_by": "x"}, headers=headers), 400)


def test_patch_updates_the_supplied_fields_and_needs_at_least_one(client, setup, auth_header):
    board, card = setup
    headers = auth_header(board.owner)
    link = assert_envelope(add(client, auth_header, board.owner, card, label="Old"), 201)
    renamed = assert_envelope(client.patch(link_url(link), json={"label": " New "}, headers=headers), 200)
    assert (renamed["label"], renamed["url"]) == ("New", link["url"])
    moved = assert_envelope(client.patch(link_url(link), json={"url": "http://other.org"}, headers=headers), 200)
    assert (moved["url"], moved["label"]) == ("http://other.org", "New")
    assert_envelope(client.patch(link_url(link), json={}, headers=headers), 400)
    assert_envelope(client.patch(link_url(link), json={"label": ""}, headers=headers), 400)


def test_delete_soft_deletes_and_returns_the_id(client, setup, auth_header, fetch, count_rows):
    from app.blueprints.cards.schema import CardLink

    board, card = setup
    link = assert_envelope(add(client, auth_header, board.owner, card), 201)
    data = assert_envelope(client.delete(link_url(link), headers=auth_header(board.owner)), 200)
    assert data == {"card_link_id": link["card_link_id"]}
    row = fetch(CardLink, uuid.UUID(link["card_link_id"]))
    assert row.is_deleted is True and row.deleted_at is not None
    assert count_rows(CardLink) == 1
    assert_envelope(client.delete(link_url(link), headers=auth_header(board.owner)), 404)


def test_the_10th_link_is_accepted_and_the_11th_is_400(client, setup, auth_header, make_card_link):
    board, card = setup
    for _ in range(9):
        make_card_link(card, board.owner)
    assert_envelope(add(client, auth_header, board.owner, card), 201)
    assert "10" in assert_envelope(add(client, auth_header, board.owner, card), 400)


def test_a_soft_deleted_link_does_not_count_toward_the_cap(client, setup, auth_header, make_card_link):
    board, card = setup
    for _ in range(9):
        make_card_link(card, board.owner)
    make_card_link(card, board.owner, is_deleted=True)
    assert_envelope(add(client, auth_header, board.owner, card), 201)
    assert_envelope(add(client, auth_header, board.owner, card), 400)


def test_links_are_listed_by_creation_time_in_card_detail(client, setup, auth_header):
    board, card = setup
    ids = [assert_envelope(add(client, auth_header, board.owner, card, label=str(n)), 201)["card_link_id"] for n in range(3)]
    detail = assert_envelope(client.get(f"/api/cards/{card.card_id}", headers=auth_header(board.owner)), 200)
    assert [l["card_link_id"] for l in detail["links"]] == ids and detail["link_count"] == 3


@pytest.mark.parametrize("role", ["admin", "manager", "member"])
def test_writers_can_add_edit_and_delete_links(client, setup, auth_header, make_member, role):
    board, card = setup
    user = board.owner if role == "admin" else make_member(board, role=role).member
    link = assert_envelope(add(client, auth_header, user, card), 201)
    assert link["created_by"] == str(user.user_id)
    assert_envelope(client.patch(link_url(link), json={"label": "x"}, headers=auth_header(user)), 200)
    assert_envelope(client.delete(link_url(link), headers=auth_header(user)), 200)


def test_guest_and_non_participant_get_403_and_nothing_changes(
    client, setup, auth_header, make_member, make_user, make_card_link, count_rows, fetch
):
    from app.blueprints.cards.schema import CardLink

    board, card = setup
    link = make_card_link(card, board.owner, label="orig")
    guest = make_member(board, role="guest").member
    for user in (guest, make_user()):
        headers = auth_header(user)
        for response in (
            client.post(add_url(card), json={"url": "https://x.com"}, headers=headers),
            client.patch(link_url(link), json={"label": "hacked"}, headers=headers),
            client.delete(link_url(link), headers=headers),
        ):
            message = assert_envelope(response, 403)
            assert "orig" not in message and "example.com" not in message
    assert count_rows(CardLink) == 1
    assert fetch(CardLink, link.card_link_id).label == "orig"


def test_missing_soft_deleted_and_malformed_ids_are_404(client, setup, auth_header, persist):
    board, card = setup
    headers = auth_header(board.owner)
    random_id = uuid.uuid4()
    assert_envelope(client.post(f"/api/cards/{random_id}/links", json={"url": "https://a.com"}, headers=headers), 404)
    assert_envelope(client.patch(f"/api/links/{random_id}", json={"label": "x"}, headers=headers), 404)
    assert_envelope(client.delete(f"/api/links/{random_id}", headers=headers), 404)
    assert_envelope(client.delete("/api/links/not-a-uuid", headers=headers), 404)
    card.is_deleted = True
    persist(card)
    assert_envelope(client.post(add_url(card), json={"url": "https://a.com"}, headers=headers), 404)


def test_requests_without_a_token_are_401(client, setup, make_card_link):
    board, card = setup
    link = make_card_link(card, board.owner)
    assert_envelope(client.post(add_url(card), json={"url": "https://a.com"}), 401)
    assert_envelope(client.patch(link_url(link), json={"label": "x"}), 401)
    assert_envelope(client.delete(link_url(link)), 401)


def test_link_changes_never_notify_or_touch_status(client, setup, auth_header, count_rows, fetch):
    from app.blueprints.cards.schema import Card
    from app.blueprints.notifications.schema import Notification

    board, card = setup
    link = assert_envelope(add(client, auth_header, board.owner, card), 201)
    client.patch(link_url(link), json={"label": "n"}, headers=auth_header(board.owner))
    client.delete(link_url(link), headers=auth_header(board.owner))
    row = fetch(Card, card.card_id)
    assert (row.status, row.completed_at) == ("NOT_STARTED", None)
    assert count_rows(Notification) == 0


# Feature: kano, Property 68: Link URL validation and cap (endpoint part)
_scheme = st.sampled_from(["http", "https", "HTTP", "HtTpS", "javascript", "data", "file", "ftp", ""])
_host = st.from_regex(r"[a-z][a-z0-9]{0,10}(\.[a-z]{2,4}){0,2}", fullmatch=True)
_url = st.builds(
    lambda scheme, sep, host, tail: f"{scheme}{sep}{host}{tail}",
    _scheme, st.sampled_from(["://", ":", ""]), _host, st.sampled_from(["", "/a", "/a b", "/a?x=1"]),
)


@settings(max_examples=25, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(url=_url)
def test_property_endpoint_accepts_exactly_what_the_rule_accepts(
    client, reset_database, make_user, make_board, make_column, make_card, auth_header, url
):
    from app.blueprints.cards.schema import validate_link_url

    reset_database()
    board = make_board(make_user())
    card = make_card(make_column(board))
    try:
        validate_link_url(url)
        expected = 201
    except ValueError:
        expected = 400
    response = client.post(add_url(card), json={"url": url}, headers=auth_header(board.owner))
    assert response.status_code == expected, (url, response.get_json())
    if expected == 201:
        assert response.get_json()["data"]["url"] == url.strip()
        assert 1 <= len(response.get_json()["data"]["label"]) <= 100
