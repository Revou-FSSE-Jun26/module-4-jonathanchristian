"""Per-card checklist and link counts in one grouped query (design A18, G-DB-10).

One statement left-joins a checklist subquery (`done`, `total`) and a links subquery (`n`) onto
the non-deleted Cards, so the number of queries does not depend on the number of Cards. Each
subquery is grouped by `card_id`, so the left joins add no rows.
"""
from sqlalchemy import func, select

from app.blueprints.cards.schema import Card, CardLink, ChecklistItem
from app.extensions import db
from app.soft_delete import active

NO_COUNTS = (0, 0, 0)


def _counts_rows(*card_conditions):
    """Rows `(card_id, done, total, links)` for the non-deleted Cards matching the conditions."""
    scope = select(Card.card_id).where(*card_conditions, active(Card))
    checklist = (
        select(
            ChecklistItem.card_id,
            func.count().label("total"),
            func.count().filter(ChecklistItem.is_done.is_(True)).label("done"),
        )
        .where(active(ChecklistItem), ChecklistItem.card_id.in_(scope))
        .group_by(ChecklistItem.card_id)
        .subquery()
    )
    links = (
        select(CardLink.card_id, func.count().label("n"))
        .where(active(CardLink), CardLink.card_id.in_(scope))
        .group_by(CardLink.card_id)
        .subquery()
    )
    return db.session.execute(
        select(
            Card.card_id,
            func.coalesce(checklist.c.done, 0),
            func.coalesce(checklist.c.total, 0),
            func.coalesce(links.c.n, 0),
        )
        .outerjoin(checklist, checklist.c.card_id == Card.card_id)
        .outerjoin(links, links.c.card_id == Card.card_id)
        .where(*card_conditions, active(Card))
    ).all()


def counts_for_board(board_id):
    """`{card_id: (checklist_done, checklist_total, link_count)}` for every Card of the Board."""
    return {
        card_id: (done, total, n) for card_id, done, total, n in _counts_rows(Card.board_id == board_id)
    }


def counts_for_card(card_id):
    """`(checklist_done, checklist_total, link_count)` of one Card (0, 0, 0 when none)."""
    rows = _counts_rows(Card.card_id == card_id)
    return tuple(rows[0][1:]) if rows else NO_COUNTS


def apply_counts(card, counts):
    """Set the three count attributes that `CardSchema` dumps on a Card object."""
    card.checklist_done, card.checklist_total, card.link_count = counts
    return card
