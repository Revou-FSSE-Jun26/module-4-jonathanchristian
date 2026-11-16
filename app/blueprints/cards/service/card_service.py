"""Card create, update, and delete."""
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.blueprints.cards.schema import Card, CardSchema
from app.blueprints.comments.schema import Comment
from app.blueprints.notifications import service as notifications
from app.extensions import db
from app.ordering import next_last_order
from app.permissions import assert_assignee_is_member, get_card_for_member, get_column_for_member
from app.soft_delete import active, soft_delete_where, utcnow

card_schema = CardSchema()
UPDATABLE_FIELDS = ("title", "description", "due_date", "labels", "assignee_id")


def dump_card(card_id):
    """Reload the Card with its assignee joined (relationships are `lazy="raise"`) and dump it."""
    card = db.session.execute(
        select(Card)
        .options(joinedload(Card.assignee))
        .where(Card.card_id == card_id)
        .execution_options(populate_existing=True)
    ).scalar_one()
    return card_schema.dump(card)


def _notify_assignment(card, assignee_id, current_user):
    if assignee_id is not None and assignee_id != current_user.user_id:
        notifications.create_notification(
            assignee_id, notifications.ASSIGNMENT, card, notifications.assignment_message(card.title)
        )


def create_card(user, column_id, data):
    column, board, _membership = get_column_for_member(column_id, user.user_id)
    assignee_id = data.get("assignee_id")
    if assignee_id is not None:
        assert_assignee_is_member(board.board_id, assignee_id)
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
    return dump_card(card.card_id)


def update_card(user, card_id, data):
    """Change only the supplied fields; notify a new assignee in the same transaction."""
    card, board, _membership = get_card_for_member(card_id, user.user_id)
    new_assignee = data.get("assignee_id")
    assignee_changed = "assignee_id" in data and new_assignee != card.assignee_id
    if assignee_changed and new_assignee is not None:
        assert_assignee_is_member(board.board_id, new_assignee)
    for key in UPDATABLE_FIELDS:
        if key in data:
            setattr(card, key, data[key])
    if assignee_changed:
        _notify_assignment(card, new_assignee, user)
    db.session.commit()
    return dump_card(card_id)


def delete_card(user, card_id):
    """Soft delete the Card and its Comments with one `deleted_at`."""
    get_card_for_member(card_id, user.user_id)
    ts = utcnow()
    soft_delete_where(db.session, Comment, Comment.card_id == card_id, deleted_at=ts)
    soft_delete_where(db.session, Card, Card.card_id == card_id, deleted_at=ts)
    db.session.commit()
    return {"card_id": str(card_id)}
