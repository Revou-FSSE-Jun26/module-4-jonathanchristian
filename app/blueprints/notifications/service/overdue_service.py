"""Overdue Cards, computed on read (design A19). Nothing is stored and no Notification is written."""
from sqlalchemy import and_, func, or_, select

from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card
from app.blueprints.columns.schema import Column
from app.blueprints.notifications.schema import OverdueResultSchema
from app.extensions import db
from app.soft_delete import active

MAX_ITEMS = 100
result_schema = OverdueResultSchema()


def days_overdue(due, today_utc):
    """Whole days between the due date and `today_utc` (at least 1 for an overdue Card)."""
    return (today_utc - due).days


def _base_query(user_id, today_utc):
    return (
        select(
            Card.card_id,
            Card.title,
            Card.due_date,
            Card.status,
            Card.created_at,
            Column.name.label("column_name"),
            Board.board_id,
            Board.name.label("board_name"),
        )
        .join(Column, Column.column_id == Card.column_id)
        .join(Board, Board.board_id == Card.board_id)
        .join(
            BoardMembership,
            and_(
                BoardMembership.board_id == Card.board_id,
                BoardMembership.user_id == user_id,
                active(BoardMembership),
            ),
        )
        .where(
            active(Card),
            active(Column),
            active(Board),
            Card.due_date.is_not(None),
            Card.due_date < today_utc,
            Card.status != "DONE",
            or_(
                and_(
                    Card.assignee_id == user_id,
                    BoardMembership.role.in_(("admin", "manager", "member")),
                ),
                and_(Card.assignee_id.is_(None), BoardMembership.role.in_(("admin", "manager"))),
            ),
        )
    )


def list_overdue(user_id, today_utc):
    """Up to 100 overdue Cards of the user, plus the total number of matches."""
    base = _base_query(user_id, today_utc)
    rows = db.session.execute(
        base.order_by(Card.due_date.asc(), Card.created_at.asc(), Card.card_id.asc()).limit(
            MAX_ITEMS
        )
    ).all()
    total = db.session.execute(select(func.count()).select_from(base.subquery())).scalar_one()
    items = [
        {
            "card_id": row.card_id,
            "title": row.title,
            "due_date": row.due_date,
            "status": row.status,
            "column_name": row.column_name,
            "board_id": row.board_id,
            "board_name": row.board_name,
            "days_overdue": days_overdue(row.due_date, today_utc),
        }
        for row in rows
    ]
    return result_schema.dump({"items": items, "total": total})
