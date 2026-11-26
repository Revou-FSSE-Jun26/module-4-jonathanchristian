"""Soft-delete exclusion, cascade, and atomicity tests (task 14.2)."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from endpoints import snapshot
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)


@pytest.fixture
def tree(make_user, make_board, make_member, make_column, make_card, make_comment, make_notification):
    """Two boards; board A has two columns, cards, comments, a member, and a notification."""
    admin, member = make_user(), make_user()
    board = make_board(admin)
    membership = make_member(board, member)
    col1, col2 = make_column(board), make_column(board)
    card1, card2, card3 = make_card(col1, assignee=member), make_card(col1), make_card(col2)
    c1, c2, c3 = make_comment(card1, member), make_comment(card2, admin), make_comment(card3, admin)
    other = make_board(admin)
    ocol = make_column(other)
    ocard = make_card(ocol, assignee=admin)
    ocomment = make_comment(ocard, admin)
    note = make_notification(member, card1)
    return {
        "admin": admin, "member": member, "board": board, "membership": membership,
        "cols": [col1, col2], "cards": [card1, card2, card3], "comments": [c1, c2, c3],
        "other": [other, ocol, ocard, ocomment], "note": note,
    }


def pk_of(obj):
    return getattr(obj, obj.__table__.primary_key.columns.keys()[0])


# --- cascades ---------------------------------------------------------------------------------------


def test_board_delete_cascades_with_one_timestamp_and_spares_everything_else(client, tree, auth_header, fetch):
    from app.blueprints.notifications.schema import Notification

    t = tree
    victims = [t["board"], t["membership"], *t["cols"], *t["cards"], *t["comments"]]
    assert_envelope(client.delete(f"/api/boards/{t['board'].board_id}", headers=auth_header(t["admin"])), 200)
    rows = [fetch(type(obj), pk_of(obj)) for obj in victims]
    assert all(r.is_deleted for r in rows) and len({r.deleted_at for r in rows}) == 1
    for r, obj in zip(rows, victims):  # data is preserved, only the delete columns changed
        assert r.created_at == obj.created_at
    for obj in t["other"]:
        assert not fetch(type(obj), pk_of(obj)).is_deleted
    assert not fetch(Notification, t["note"].notification_id).is_deleted
    headers = auth_header(t["admin"])
    for url in ("", "/members", "/analytics"):
        assert_envelope(client.get(f"/api/boards/{t['board'].board_id}{url}", headers=headers), 404)
    assert_envelope(client.get(f"/api/cards/{t['cards'][0].card_id}/comments", headers=headers), 404)
    assert_envelope(client.patch(f"/api/columns/{t['cols'][0].column_id}", json={"name": "x"}, headers=headers), 404)


def test_column_delete_cascades_only_to_its_cards_and_comments(client, tree, auth_header, fetch):
    t = tree
    victims = [t["cols"][0], t["cards"][0], t["cards"][1], t["comments"][0], t["comments"][1]]
    assert_envelope(client.delete(f"/api/columns/{t['cols'][0].column_id}", headers=auth_header(t["admin"])), 200)
    rows = [fetch(type(obj), pk_of(obj)) for obj in victims]
    assert all(r.is_deleted for r in rows) and len({r.deleted_at for r in rows}) == 1
    for obj in [t["board"], t["membership"], t["cols"][1], t["cards"][2], t["comments"][2], *t["other"]]:
        assert not fetch(type(obj), pk_of(obj)).is_deleted


def test_card_delete_cascades_only_to_its_comments(client, tree, auth_header, fetch):
    t = tree
    assert_envelope(client.delete(f"/api/cards/{t['cards'][0].card_id}", headers=auth_header(t["admin"])), 200)
    rows = [fetch(type(obj), pk_of(obj)) for obj in (t["cards"][0], t["comments"][0])]
    assert all(r.is_deleted for r in rows) and len({r.deleted_at for r in rows}) == 1
    for obj in [t["cards"][1], t["comments"][1], t["cols"][0], t["board"]]:
        assert not fetch(type(obj), pk_of(obj)).is_deleted
    assert_envelope(client.get(f"/api/cards/{t['cards'][0].card_id}/comments", headers=auth_header(t["admin"])), 404)


# --- exclusion from every read -------------------------------------------------------------------------


def test_every_read_excludes_soft_deleted_rows(client, tree, auth_header, persist, fetch):
    from app.blueprints.boards.schema import Board
    from app.blueprints.notifications.schema import Notification
    from app.soft_delete import utcnow

    t = tree
    admin_h, member_h = auth_header(t["admin"]), auth_header(t["member"])
    board_url = f"/api/boards/{t['board'].board_id}"
    for obj in (t["comments"][0], t["cards"][1], t["cols"][1], t["membership"], t["note"]):
        obj.is_deleted, obj.deleted_at = True, utcnow()
        persist(obj)
    detail = assert_envelope(client.get(board_url, headers=admin_h), 200)
    assert [c["column_id"] for c in detail["columns"]] == [str(t["cols"][0].column_id)]
    assert [c["card_id"] for c in detail["columns"][0]["cards"]] == [str(t["cards"][0].card_id)]
    assert assert_envelope(client.get(f"/api/cards/{t['cards'][0].card_id}/comments", headers=admin_h), 200) == []
    members = assert_envelope(client.get(board_url + "/members", headers=admin_h), 200)
    assert [m["user_id"] for m in members] == [str(t["admin"].user_id)]
    assert_envelope(client.get(board_url, headers=member_h), 403)  # membership is gone
    analytics = assert_envelope(client.get(board_url + "/analytics", headers=admin_h), 200)
    assert [c["count"] for c in analytics["cards_per_column"]] == [1]
    assert [m["comments"] for m in analytics["member_activity"]] == [1]  # c1 and c2 are deleted; only c3 (the admin's) remains
    listing = assert_envelope(client.get("/api/notifications", headers=member_h), 200)
    assert (listing["items"], listing["total"], listing["unread_count"]) == ([], 0, 0)
    assert fetch(Notification, t["note"].notification_id) is not None
    board_row = fetch(Board, t["board"].board_id)
    board_row.is_deleted, board_row.deleted_at = True, utcnow()
    persist(board_row)
    ids = [b["board_id"] for b in assert_envelope(client.get("/api/boards", headers=admin_h), 200)]
    assert str(t["board"].board_id) not in ids and str(t["other"][0].board_id) in ids


# --- atomicity ---------------------------------------------------------------------------------------------


def inject(monkeypatch, module, fail_on_call):
    """Make the nth `soft_delete_where` call of `module` raise, after earlier calls ran."""
    real, calls = module.soft_delete_where, {"n": 0}

    def flaky(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] == fail_on_call:
            raise RuntimeError("injected failure")
        return real(*args, **kwargs)

    monkeypatch.setattr(module, "soft_delete_where", flaky)


@pytest.mark.parametrize("fail_on_call", [1, 2, 3, 4, 5, 6, 7])
def test_failed_board_cascade_leaves_every_row_unchanged(app, client, tree, auth_header, monkeypatch, fail_on_call):
    from app.blueprints.boards.service import cascade

    before = snapshot(app)
    inject(monkeypatch, cascade, fail_on_call)
    response = client.delete(f"/api/boards/{tree['board'].board_id}", headers=auth_header(tree["admin"]))
    assert assert_envelope(response, 500) == "Internal server error"
    assert snapshot(app) == before


@pytest.mark.parametrize("fail_on_call", [1, 2, 3, 4, 5])
def test_failed_column_cascade_leaves_every_row_unchanged(app, client, tree, auth_header, monkeypatch, fail_on_call):
    from app.blueprints.columns import service

    before = snapshot(app)
    inject(monkeypatch, service, fail_on_call)
    response = client.delete(f"/api/columns/{tree['cols'][0].column_id}", headers=auth_header(tree["admin"]))
    assert_envelope(response, 500)
    assert snapshot(app) == before


@pytest.mark.parametrize("fail_on_call", [1, 2, 3, 4])
def test_failed_card_cascade_leaves_every_row_unchanged(app, client, tree, auth_header, monkeypatch, fail_on_call):
    from app.blueprints.cards.service import card_service

    before = snapshot(app)
    inject(monkeypatch, card_service, fail_on_call)
    assert_envelope(client.delete(f"/api/cards/{tree['cards'][0].card_id}", headers=auth_header(tree["admin"])), 500)
    assert snapshot(app) == before


# --- uniqueness ignores soft-deleted rows ----------------------------------------------------------------------


def test_soft_deleted_email_and_membership_do_not_block_new_rows(client, tree, make_deleted_user, auth_header):
    make_deleted_user("taken@example.com")
    body = {"name": "New", "email": "TAKEN@example.com", "password": "password123"}
    assert_envelope(client.post("/api/auth/register", json=body), 201)
    assert_envelope(client.post("/api/auth/register", json=body), 409)  # the active row does block
    board_url = f"/api/boards/{tree['board'].board_id}/members"
    admin_h = auth_header(tree["admin"])
    member_email = tree["member"].email
    assert_envelope(client.delete(f"{board_url}/{tree['member'].user_id}", headers=admin_h), 200)
    assert_envelope(client.post(board_url, json={"email": member_email}, headers=admin_h), 201)
    assert_envelope(client.post(board_url, json={"email": member_email}, headers=admin_h), 409)


# Feature: kano, Property 6 and 7: Soft-deleted rows never appear; delete cascades and preserves data
@DB_SETTINGS
@given(level=st.sampled_from(["board", "column", "card"]), target=st.integers(0, 1))
def test_property_cascade_marks_exactly_the_subtree_and_hides_it(
    client, make_user, make_board, make_column, make_card, make_comment, auth_header, fetch,
    reset_database, level, target,
):
    reset_database()
    owner = make_user()
    board = make_board(owner)
    columns = [make_column(board), make_column(board)]
    cards = [make_card(columns[0]), make_card(columns[0]), make_card(columns[1]), make_card(columns[1])]
    comments = [make_comment(card, owner) for card in cards]
    headers = auth_header(owner)
    if level == "board":
        url, doomed = f"/api/boards/{board.board_id}", {*columns, *cards, *comments, board}
    elif level == "column":
        url, doomed = f"/api/columns/{columns[target].column_id}", {columns[target], *cards[2 * target:2 * target + 2], *comments[2 * target:2 * target + 2]}
    else:
        url, doomed = f"/api/cards/{cards[target].card_id}", {cards[target], comments[target]}
    assert_envelope(client.delete(url, headers=headers), 200)
    everything = [board, *columns, *cards, *comments]
    stamps = set()
    for obj in everything:
        current = fetch(type(obj), pk_of(obj))
        assert current is not None and current.created_at == obj.created_at  # data preserved
        assert current.is_deleted == (obj in doomed)
        if obj in doomed:
            stamps.add(current.deleted_at)
        else:
            assert current.deleted_at is None
    assert len(stamps) == 1
    assert_envelope(client.delete(url, headers=headers), 404)
    if level != "board":
        detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
        shown = {c["card_id"] for col in detail["columns"] for c in col["cards"]}
        assert shown == {str(c.card_id) for c in cards if c not in doomed}


# Feature: kano, Property 8: Cascade atomicity
@DB_SETTINGS
@given(fail_on_call=st.integers(1, 7))
def test_property_a_failed_cascade_changes_nothing(
    app, client, make_user, make_board, make_column, make_card, make_comment, auth_header,
    reset_database, fail_on_call,
):
    from app.blueprints.boards.service import cascade

    reset_database()
    owner = make_user()
    board = make_board(owner)
    card = make_card(make_column(board))
    make_comment(card, owner)
    before = snapshot(app)
    real = cascade.soft_delete_where
    calls = {"n": 0}

    def flaky(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] == fail_on_call:
            raise RuntimeError("injected failure")
        return real(*args, **kwargs)

    cascade.soft_delete_where = flaky
    try:
        response = client.delete(f"/api/boards/{board.board_id}", headers=auth_header(owner))
    finally:
        cascade.soft_delete_where = real
    assert_envelope(response, 500)
    assert snapshot(app) == before


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows
@DB_SETTINGS
@given(email=st.from_regex(r"[a-z]{1,8}@[a-z]{1,8}\.com", fullmatch=True), flip=st.booleans())
def test_property_email_of_a_deleted_user_can_be_registered_again(
    client, make_deleted_user, reset_database, email, flip
):
    reset_database()
    make_deleted_user(email)
    body = {"name": "Again", "email": email.upper() if flip else email, "password": "password123"}
    assert_envelope(client.post("/api/auth/register", json=body), 201)
