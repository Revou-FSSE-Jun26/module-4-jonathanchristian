"""Cascading soft delete of a Board (G-DB-06). The caller owns the transaction."""
from sqlalchemy import select

from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card, CardLink, ChecklistItem
from app.blueprints.columns.schema import Column
from app.blueprints.comments.schema import Comment
from app.extensions import db
from app.soft_delete import soft_delete_where, utcnow


def soft_delete_board_tree(board_id):
    """Soft delete the Board, its memberships, columns, cards, comments, checklist items, and links.

    One `deleted_at` value is captured once and shared by every row. Notifications are kept.
    The caller commits; any exception leaves the rollback to the error handler.
    """
    ts = utcnow()
    board_cards = select(Card.card_id).where(Card.board_id == board_id)
    session = db.session
    soft_delete_where(session, Comment, Comment.card_id.in_(board_cards), deleted_at=ts)
    soft_delete_where(
        session, ChecklistItem, ChecklistItem.card_id.in_(board_cards), deleted_at=ts
    )
    soft_delete_where(session, CardLink, CardLink.card_id.in_(board_cards), deleted_at=ts)
    soft_delete_where(session, Card, Card.board_id == board_id, deleted_at=ts)
    soft_delete_where(session, Column, Column.board_id == board_id, deleted_at=ts)
    soft_delete_where(
        session, BoardMembership, BoardMembership.board_id == board_id, deleted_at=ts
    )
    soft_delete_where(session, Board, Board.board_id == board_id, deleted_at=ts)
    return ts
