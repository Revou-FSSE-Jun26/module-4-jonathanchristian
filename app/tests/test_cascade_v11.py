"""Soft-delete cascades over checklist items and card links (design A17, Property 70)."""
import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from endpoints import snapshot
from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=40, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture]
)


@pytest.fixture
def tree(make_user, make_board, make_column, make_card, make_checklist_item, make_card_link):
    """One Board with two Columns; every Card has two items and two links, plus a pre-deleted pair."""
    owner = make_user()
    board = make_board(owner)
    cols = [make_column(board), make_column(board)]
    cards = [make_card(cols[0]), make_card(cols[0]), make_card(cols[1])]
    items = {c.card_id: [make_checklist_item(c), make_checklist_item(c, is_done=True)] for c in cards}
    links = {c.card_id: [make_card_link(c, owner), make_card_link(c, owner)] for c in cards}
    old_item = make_checklist_item(cards[0], is_deleted=True)
    old_link = make_card_link(cards[0], owner, is_deleted=True)
    other = make_board(owner)
    other_card = make_card(make_column(other))
    return {
        "owner": owner, "board": board, "cols": cols, "cards": cards, "items": items, "links": links,
        "old": [old_item, old_link],
        "other": [other_card, make_checklist_item(other_card), make_card_link(other_card, owner)],
    }


def pk_of(obj):
    return getattr(obj, obj.__table__.primary_key.columns.keys()[0])


def children(t, cards):
    return [obj for c in cards for obj in (*t["items"][c.card_id], *t["links"][c.card_id])]


def check_cascade(fetch, doomed, spared, t):
    rows = [fetch(type(o), pk_of(o)) for o in doomed]
    assert all(r.is_deleted for r in rows)
    assert len({r.deleted_at for r in rows}) == 1
    for row, obj in zip(rows, doomed):
        assert row.created_at == obj.created_at  # data preserved
    for obj in spared:
        row = fetch(type(obj), pk_of(obj))
        assert not row.is_deleted and row.deleted_at is None
    # a row deleted earlier keeps its own, older timestamp
    for obj in t["old"]:
        row = fetch(type(obj), pk_of(obj))
        assert row.is_deleted and row.deleted_at not in {r.deleted_at for r in rows}
    return rows[0].deleted_at


def test_board_delete_covers_items_and_links(client, tree, auth_header, fetch):
    t = tree
    doomed = [t["board"], *t["cols"], *t["cards"], *children(t, t["cards"])]
    assert_envelope(client.delete(f"/api/boards/{t['board'].board_id}", headers=auth_header(t["owner"])), 200)
    check_cascade(fetch, doomed, t["other"], t)


def test_column_delete_covers_the_items_and_links_of_its_cards_only(client, tree, auth_header, fetch):
    t = tree
    first, second = t["cards"][:2], t["cards"][2]
    doomed = [t["cols"][0], *first, *children(t, first)]
    spared = [t["board"], t["cols"][1], second, *children(t, [second]), *t["other"]]
    assert_envelope(client.delete(f"/api/columns/{t['cols'][0].column_id}", headers=auth_header(t["owner"])), 200)
    check_cascade(fetch, doomed, spared, t)


def test_card_delete_covers_its_items_and_links_only_and_the_card_is_then_404(client, tree, auth_header, fetch):
    t = tree
    card = t["cards"][0]
    doomed = [card, *children(t, [card])]
    spared = [t["cards"][1], *children(t, t["cards"][1:]), t["board"], *t["other"]]
    headers = auth_header(t["owner"])
    assert_envelope(client.delete(f"/api/cards/{card.card_id}", headers=headers), 200)
    check_cascade(fetch, doomed, spared, t)
    assert_envelope(client.get(f"/api/cards/{card.card_id}", headers=headers), 404)
    item = t["items"][card.card_id][0]
    assert_envelope(client.patch(f"/api/checklist/{item.checklist_item_id}", json={"text": "x"}, headers=headers), 404)


def inject(monkeypatch, module, fail_on_call):
    real, calls = module.soft_delete_where, {"n": 0}

    def flaky(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] == fail_on_call:
            raise RuntimeError("injected failure")
        return real(*args, **kwargs)

    monkeypatch.setattr(module, "soft_delete_where", flaky)


@pytest.mark.parametrize("fail_on_call", [2, 3])
def test_a_failure_after_items_or_links_changed_leaves_every_row_unchanged(
    app, client, tree, auth_header, monkeypatch, fail_on_call
):
    from app.blueprints.boards.service import cascade
    from app.blueprints.cards.service import card_service
    from app.blueprints.columns import service as column_service

    headers = auth_header(tree["owner"])
    cases = (
        (cascade, f"/api/boards/{tree['board'].board_id}"),
        (column_service, f"/api/columns/{tree['cols'][0].column_id}"),
        (card_service, f"/api/cards/{tree['cards'][0].card_id}"),
    )
    for module, url in cases:
        before = snapshot(app)
        inject(monkeypatch, module, fail_on_call)
        assert assert_envelope(client.delete(url, headers=headers), 500) == "Internal server error"
        assert snapshot(app) == before, url
        monkeypatch.undo()


# Feature: kano, Property 70: Soft-delete cascade covers checklist and links
@DB_SETTINGS
@given(level=st.sampled_from(["board", "column", "card"]), target=st.integers(0, 1), fail=st.booleans())
def test_property_cascade_marks_exactly_the_subtree_including_items_and_links(
    app, client, make_user, make_board, make_column, make_card, make_checklist_item, make_card_link,
    auth_header, fetch, reset_database, monkeypatch, level, target, fail,
):
    reset_database()
    owner = make_user()
    board = make_board(owner)
    columns = [make_column(board), make_column(board)]
    cards = [make_card(columns[0]), make_card(columns[0]), make_card(columns[1]), make_card(columns[1])]
    kids = [[make_checklist_item(c), make_card_link(c, owner)] for c in cards]
    headers = auth_header(owner)
    if level == "board":
        url, doomed_cards = f"/api/boards/{board.board_id}", set(range(4))
    elif level == "column":
        url, doomed_cards = f"/api/columns/{columns[target].column_id}", {2 * target, 2 * target + 1}
    else:
        url, doomed_cards = f"/api/cards/{cards[target].card_id}", {target}
    if fail:
        from app.blueprints.boards.service import cascade
        from app.blueprints.cards.service import card_service
        from app.blueprints.columns import service as column_service

        before = snapshot(app)
        inject(monkeypatch, {"board": cascade, "column": column_service, "card": card_service}[level], 2)
        assert_envelope(client.delete(url, headers=headers), 500)
        assert snapshot(app) == before
        return
    assert_envelope(client.delete(url, headers=headers), 200)
    stamps = set()
    for index, group in enumerate(kids):
        for obj in group:
            row = fetch(type(obj), pk_of(obj))
            assert row.is_deleted == (index in doomed_cards)
            if row.is_deleted:
                stamps.add(row.deleted_at)
    assert len(stamps) == 1
