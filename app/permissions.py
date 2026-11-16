"""Membership and role checks (G-BE-09).

Every helper answers 404 first (resource or its Board missing or soft deleted), then 403
for a caller who is not an active Board member, then 403 for a non-admin where an admin is
required. Each helper runs one joined query. The 403 body never carries resource data.
This module imports `schema.py` files only, never a `service.py`.
"""
from sqlalchemy import and_, select

from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card
from app.blueprints.columns.schema import Column
from app.blueprints.comments.schema import Comment
from app.errors import BadRequest, Forbidden, NotFound
from app.extensions import db
from app.soft_delete import active

ADMIN = "admin"
MEMBER = "member"


def _membership_join(user_id):
    """ON clause that attaches the caller's active membership of the resource's Board."""
    return and_(
        BoardMembership.board_id == Board.board_id,
        BoardMembership.user_id == user_id,
        active(BoardMembership),
    )


def _require_membership(membership):
    if membership is None:
        raise Forbidden()
    return membership


def _require_admin(membership):
    if membership.role != ADMIN:
        raise Forbidden()


def get_board_or_404(board_id):
    board = db.session.execute(
        select(Board).where(Board.board_id == board_id, active(Board))
    ).scalar_one_or_none()
    if board is None:
        raise NotFound("Board not found")
    return board


def require_board_member(board_id, user_id):
    """Return `(board, membership)` or raise 404 / 403."""
    row = db.session.execute(
        select(Board, BoardMembership)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Board.board_id == board_id, active(Board))
    ).first()
    if row is None:
        raise NotFound("Board not found")
    board, membership = row
    return board, _require_membership(membership)


def require_board_admin(board_id, user_id):
    """Return `(board, membership)` for a Board admin or raise 404 / 403."""
    board, membership = require_board_member(board_id, user_id)
    _require_admin(membership)
    return board, membership


def get_column_for_member(column_id, user_id):
    """Return `(column, board, membership)` or raise 404 / 403."""
    row = db.session.execute(
        select(Column, Board, BoardMembership)
        .join(Board, Board.board_id == Column.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Column.column_id == column_id, active(Column), active(Board))
    ).first()
    if row is None:
        raise NotFound("Column not found")
    column, board, membership = row
    return column, board, _require_membership(membership)


def get_card_for_member(card_id, user_id):
    """Return `(card, board, membership)` or raise 404 / 403."""
    row = db.session.execute(
        select(Card, Board, BoardMembership)
        .join(Board, Board.board_id == Card.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Card.card_id == card_id, active(Card), active(Board))
    ).first()
    if row is None:
        raise NotFound("Card not found")
    card, board, membership = row
    return card, board, _require_membership(membership)


def get_comment_for_member(comment_id, user_id):
    """Return `(comment, card, membership)` or raise 404 / 403."""
    row = db.session.execute(
        select(Comment, Card, BoardMembership)
        .join(Card, Card.card_id == Comment.card_id)
        .join(Board, Board.board_id == Card.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(
            Comment.comment_id == comment_id,
            active(Comment),
            active(Card),
            active(Board),
        )
    ).first()
    if row is None:
        raise NotFound("Comment not found")
    comment, card, membership = row
    return comment, card, _require_membership(membership)


def assert_assignee_is_member(board_id, assignee_id):
    """Raise 400 unless `assignee_id` is an active member of the Board."""
    found = db.session.execute(
        select(BoardMembership.board_membership_id).where(
            BoardMembership.board_id == board_id,
            BoardMembership.user_id == assignee_id,
            active(BoardMembership),
        )
    ).first()
    if found is None:
        raise BadRequest("Assignee must be a member of the board")
