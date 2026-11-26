"""Card create, update, and delete."""
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.blueprints.cards.schema import Card, CardLink, CardSchema, ChecklistItem
from app.blueprints.comments.schema import Comment
from app.blueprints.cards.service.counts import NO_COUNTS, apply_counts, counts_for_card
from app.blueprints.cards.service.status import apply_status_change
from app.blueprints.notifications import service as notifications
from app.extensions import db
from app.ordering import next_last_order
from app.permissions import assert_assignee_is_writer, get_card_for_writer, get_column_for_writer
from app.soft_delete import active, soft_delete_where, utcnow

card_schema = CardSchema()
UPDATABLE_FIELDS = ("title", "description", "due_date", "labels", "assignee_id")


def dump_card(card_id, counts=None):
    """Reload the Card with its assignee joined (relationships are `lazy="raise"`) and dump it.

    `counts` is `(checklist_done, checklist_total, link_count)`; one query computes it when None.
    """
    card = db.session.execute(
        select(Card)
        .options(joinedload(Card.assignee))
        .where(Card.card_id == card_id)
        .execution_options(populate_existing=True)
    ).scalar_one()
    apply_counts(card, counts if counts is not None else counts_for_card(card_id))
    return card_schema.dump(card)


def _notify_assignment(card, assignee_id, current_user):
    if assignee_id is not None and assignee_id != current_user.user_id:
        notifications.create_notification(
            assignee_id, notifications.ASSIGNMENT, card, notifications.assignment_message(card.title)
        )


def create_card(user, column_id, load_data):
    column, board, _membership = get_column_for_writer(column_id, user.user_id)
    data = load_data()
    assignee_id = data.get("assignee_id")
    if assignee_id is not None:
        assert_assignee_is_writer(board.board_id, assignee_id)
    current_max = db.session.execute(
        select(func.max(Card.order)).where(Card.column_id == column_id, active(Card))
    ).scalar_one()
    card = Card(
        board_id=board.board_id,
        column_id=column_id,
        order=next_last_order(current_max),
        **{key: data[key] for key in UPDATABLE_FIELDS if key in data},
    )
    db.session.add(card)
    db.session.flush()
    _notify_assignment(card, assignee_id, user)
    db.session.commit()
    return dump_card(card.card_id, NO_COUNTS)  # a new Card has no items or links


def update_card(user, card_id, load_data):
    """Change only the supplied fields; notify a new assignee in the same transaction."""
    card, board, _membership = get_card_for_writer(card_id, user.user_id)
    data = load_data()
    new_assignee = data.get("assignee_id")
    assignee_changed = "assignee_id" in data and new_assignee != card.assignee_id
    if assignee_changed and new_assignee is not None:
        assert_assignee_is_writer(board.board_id, new_assignee)
    for key in UPDATABLE_FIELDS:
        if key in data:
            setattr(card, key, data[key])
    # One call, same transaction and same UPDATE as the other fields (design A13).
    card.status, card.completed_at = apply_status_change(
        card.status, card.completed_at, data.get("status"), utcnow()
    )
    if assignee_changed:
        _notify_assignment(card, new_assignee, user)
    db.session.commit()
    return dump_card(card_id)


def delete_card(user, card_id):
    """Soft delete the Card and its Comments, checklist items, and links with one `deleted_at`."""
    get_card_for_writer(card_id, user.user_id)
    ts = utcnow()
    soft_delete_where(db.session, Comment, Comment.card_id == card_id, deleted_at=ts)
    soft_delete_where(
        db.session, ChecklistItem, ChecklistItem.card_id == card_id, deleted_at=ts
    )
    soft_delete_where(db.session, CardLink, CardLink.card_id == card_id, deleted_at=ts)
    soft_delete_where(db.session, Card, Card.card_id == card_id, deleted_at=ts)
    db.session.commit()
    return {"card_id": str(card_id)}
