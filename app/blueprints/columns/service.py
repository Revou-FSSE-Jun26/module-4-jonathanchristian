"""Business logic and queries for the columns feature."""
from sqlalchemy import func, select

from app.blueprints.cards.schema import Card
from app.blueprints.columns.schema import Column, ColumnSchema
from app.blueprints.comments.schema import Comment
from app.errors import BadRequest
from app.extensions import db
from app.ordering import next_last_order
from app.permissions import get_column_for_member, require_board_member
from app.soft_delete import active, soft_delete_where, utcnow

column_schema = ColumnSchema()


def create_column(user, board_id, data):
    """Create a Column after the last active one (order 1.0 for the first)."""
    require_board_member(board_id, user.user_id)
    current_max = db.session.execute(
        select(func.max(Column.order)).where(Column.board_id == board_id, active(Column))
    ).scalar_one()
    column = Column(board_id=board_id, name=data["name"], order=next_last_order(current_max))
    db.session.add(column)
    db.session.commit()
    return column_schema.dump(column)


def rename_column(user, column_id, data):
    column, _board, _membership = get_column_for_member(column_id, user.user_id)
    column.name = data["name"]
    db.session.commit()
    return column_schema.dump(column)


def delete_column(user, column_id):
    """Soft delete the Column, its Cards, and their Comments with one `deleted_at`."""
    column, _board, _membership = get_column_for_member(column_id, user.user_id)
    ts = utcnow()
    column_cards = select(Card.card_id).where(Card.column_id == column_id)
    soft_delete_where(db.session, Comment, Comment.card_id.in_(column_cards), deleted_at=ts)
    soft_delete_where(db.session, Card, Card.column_id == column_id, deleted_at=ts)
    soft_delete_where(db.session, Column, Column.column_id == column_id, deleted_at=ts)
    db.session.commit()
    return {"column_id": str(column_id)}


def reorder_column(user, board_id, data):
    """Store the client-supplied order; the Column must belong to this Board (else 400)."""
    require_board_member(board_id, user.user_id)
    column = db.session.execute(
        select(Column).where(
            Column.column_id == data["column_id"], Column.board_id == board_id, active(Column)
        )
    ).scalar_one_or_none()
    if column is None:
        raise BadRequest("Column does not belong to this board")
    column.order = data["order"]
    db.session.commit()
    return column_schema.dump(column)
