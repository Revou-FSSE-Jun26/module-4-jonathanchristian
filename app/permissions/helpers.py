"""Membership and role checks that query the database (G-BE-09).

Four roles exist per Board: admin, manager, member, guest. Helpers are split by level
(design A15): reader (any role), writer (admin, manager, member), manager (admin, manager),
admin. Every helper answers 404 first (resource or its Board missing or soft deleted), then 403
for a caller without an active membership, then 403 for a role below the level. Each helper runs
one joined query. The 403 body never carries resource data. This module imports `schema`
packages only, never a `service` module.
"""
from sqlalchemy import and_, select

from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card, CardLink, ChecklistItem
from app.blueprints.columns.schema import Column
from app.blueprints.comments.schema import Comment
from app.errors import BadRequest, Forbidden, NotFound
from app.extensions import db
from app.permissions.rules import ADMIN, MANAGER, MEMBER, role_allows
from app.soft_delete import active


def _membership_join(user_id):
    """ON clause that attaches the caller's active membership of the resource's Board."""
    return and_(
        BoardMembership.board_id == Board.board_id,
        BoardMembership.user_id == user_id,
        active(BoardMembership),
    )


def _require_level(membership, level):
    """403 without a membership, then 403 when the role is below `level`."""
    if not role_allows(membership.role if membership is not None else None, level):
        raise Forbidden()
    return membership


# --- joined lookups: resource + Board + the caller's membership (or None) ---------------------


def _board_row(board_id, user_id):
    row = db.session.execute(
        select(Board, BoardMembership)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Board.board_id == board_id, active(Board))
    ).first()
    if row is None:
        raise NotFound("Board not found")
    return row


def _column_row(column_id, user_id):
    row = db.session.execute(
        select(Column, Board, BoardMembership)
        .join(Board, Board.board_id == Column.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Column.column_id == column_id, active(Column), active(Board))
    ).first()
    if row is None:
        raise NotFound("Column not found")
    return row


def _card_row(card_id, user_id, lock=False):
    statement = (
        select(Card, Board, BoardMembership)
        .join(Board, Board.board_id == Card.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(Card.card_id == card_id, active(Card), active(Board))
    )
    if lock:
        # `of=Card`: PostgreSQL cannot lock the nullable side of the outer join (Open issue 54).
        statement = statement.with_for_update(of=Card)
    row = db.session.execute(statement).first()
    if row is None:
        raise NotFound("Card not found")
    return row


def _comment_row(comment_id, user_id):
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
    return row


def _child_row(model, id_column, child_id, user_id, message):
    """Item or link + its Card + the caller's membership; the join goes child, Card, Board."""
    row = db.session.execute(
        select(model, Card, BoardMembership)
        .join(Card, Card.card_id == model.card_id)
        .join(Board, Board.board_id == Card.board_id)
        .outerjoin(BoardMembership, _membership_join(user_id))
        .where(id_column == child_id, active(model), active(Card), active(Board))
    ).first()
    if row is None:
        raise NotFound(message)
    return row


# --- public helpers ---------------------------------------------------------------------------


def get_board_or_404(board_id):
    board = db.session.execute(
        select(Board).where(Board.board_id == board_id, active(Board))
    ).scalar_one_or_none()
    if board is None:
        raise NotFound("Board not found")
    return board


def require_board_reader(board_id, user_id):
    """Any role passes. Return `(board, membership)` or raise 404 / 403."""
    board, membership = _board_row(board_id, user_id)
    return board, _require_level(membership, "reader")


def require_board_writer(board_id, user_id):
    """Role admin, manager, or member; a guest gets 403."""
    board, membership = _board_row(board_id, user_id)
    return board, _require_level(membership, "writer")


def require_board_manager(board_id, user_id):
    """Role admin or manager; members, guests, and non-participants get 403."""
    board, membership = _board_row(board_id, user_id)
    return board, _require_level(membership, "manager")


def require_board_admin(board_id, user_id):
    """Role admin only; managers, members, guests, and non-participants get 403."""
    board, membership = _board_row(board_id, user_id)
    return board, _require_level(membership, "admin")


def get_column_for_writer(column_id, user_id):
    """Return `(column, board, membership)`; a guest gets 403."""
    column, board, membership = _column_row(column_id, user_id)
    return column, board, _require_level(membership, "writer")


def get_column_for_manager(column_id, user_id):
    """Return `(column, board, membership)`; a member or guest gets 403."""
    column, board, membership = _column_row(column_id, user_id)
    return column, board, _require_level(membership, "manager")


def get_card_for_reader(card_id, user_id):
    """Return `(card, board, membership)`; any role passes."""
    card, board, membership = _card_row(card_id, user_id)
    return card, board, _require_level(membership, "reader")


def get_card_for_writer(card_id, user_id, lock=False):
    """Return `(card, board, membership)`; a guest gets 403.

    `lock=True` runs `SELECT ... FOR UPDATE` on the Card row so the per-card caps of checklist
    items and links cannot be exceeded by two concurrent adds.
    """
    card, board, membership = _card_row(card_id, user_id, lock=lock)
    return card, board, _require_level(membership, "writer")


def get_checklist_item_for_writer(item_id, user_id):
    """Return `(item, card, membership)`; a guest gets 403."""
    item, card, membership = _child_row(
        ChecklistItem, ChecklistItem.checklist_item_id, item_id, user_id, "Checklist item not found"
    )
    return item, card, _require_level(membership, "writer")


def get_card_link_for_writer(link_id, user_id):
    """Return `(link, card, membership)`; a guest gets 403."""
    link, card, membership = _child_row(
        CardLink, CardLink.card_link_id, link_id, user_id, "Link not found"
    )
    return link, card, _require_level(membership, "writer")


def get_comment_for_reader(comment_id, user_id):
    """Return `(comment, card, membership)`; any role passes."""
    comment, card, membership = _comment_row(comment_id, user_id)
    return comment, card, _require_level(membership, "reader")


def get_comment_for_writer(comment_id, user_id):
    """Return `(comment, card, membership)`; a guest gets 403 even for an old own Comment."""
    comment, card, membership = _comment_row(comment_id, user_id)
    return comment, card, _require_level(membership, "writer")


def assert_assignee_is_writer(board_id, assignee_id):
    """Raise 400 unless `assignee_id` has an active admin, manager, or member membership."""
    found = db.session.execute(
        select(BoardMembership.board_membership_id).where(
            BoardMembership.board_id == board_id,
            BoardMembership.user_id == assignee_id,
            BoardMembership.role.in_((ADMIN, MANAGER, MEMBER)),
            active(BoardMembership),
        )
    ).first()
    if found is None:
        raise BadRequest("Assignee must be an admin, manager, or member of the board")
