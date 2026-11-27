"""Board create, list, detail, update, and delete."""
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.blueprints.boards.schema import (
    Board,
    BoardDetailSchema,
    BoardMembership,
    BoardSummarySchema,
)
from app.blueprints.boards.service import cascade, invite_service as invites
from app.blueprints.boards.service.board_counts import board_counts, board_counts_one
from app.blueprints.cards.schema import Card
from app.blueprints.cards.service.counts import NO_COUNTS, apply_counts, counts_for_board
from app.blueprints.columns.schema import Column
from app.extensions import db
from app.permissions import ADMIN, require_board_admin, require_board_reader
from app.soft_delete import active

board_schema = BoardSummarySchema()
board_detail_schema = BoardDetailSchema()


def serialize_board(board, role, counts):
    """Dump a Board_Summary; `counts` is `(member_count, card_count)`."""
    board.my_role = role
    board.member_count, board.card_count = counts
    return board_schema.dump(board)


def _new_membership(board, user, role):
    return BoardMembership(board_id=board.board_id, user_id=user.user_id, role=role)


def create_board(user, data):
    """Create the Board, both Invite_Tokens, and the creator's admin membership in one transaction."""
    member_token = invites.generate_unique_token(db.session)
    guest_token = invites.generate_unique_token(db.session, exclude=(member_token,))
    board = Board(
        name=data["name"],
        created_by=user.user_id,
        member_invite_token=member_token,
        guest_invite_token=guest_token,
    )
    db.session.add(board)
    db.session.flush()  # the Board row exists; the membership follows in the same transaction
    db.session.add(_new_membership(board, user, ADMIN))
    db.session.commit()
    # The creator's membership is the only one and a new Board has no Card: no query needed (R47.5).
    return serialize_board(board, ADMIN, (1, 0))


def list_boards(user):
    rows = db.session.execute(
        select(Board, BoardMembership.role)
        .join(BoardMembership, BoardMembership.board_id == Board.board_id)
        .where(BoardMembership.user_id == user.user_id, active(BoardMembership), active(Board))
        .order_by(Board.created_at.desc(), Board.board_id.desc())
    ).all()
    counts = board_counts([board.board_id for board, _ in rows])
    return [serialize_board(board, role, counts[board.board_id]) for board, role in rows]


def get_board_detail(user, board_id):
    """Board with Columns and Cards in a fixed number of queries.

    Query 1 (user lookup) runs in the JWT callback. Here: 2 board plus membership,
    3 columns, 4 cards with the assignee joined, 5 the checklist and link counts (design A18).
    """
    board, membership = require_board_reader(board_id, user.user_id)
    columns = db.session.execute(
        select(Column)
        .where(Column.board_id == board_id, active(Column))
        .order_by(Column.order, Column.created_at)
    ).scalars().all()
    cards = db.session.execute(
        select(Card)
        .options(joinedload(Card.assignee))
        .where(Card.board_id == board_id, active(Card))
        .order_by(Card.order, Card.created_at)
    ).scalars().all()
    counts = counts_for_board(board_id)
    cards_by_column = defaultdict(list)
    for card in cards:
        apply_counts(card, counts.get(card.card_id, NO_COUNTS))
        cards_by_column[card.column_id].append(card)
    for column in columns:
        column.cards = cards_by_column[column.column_id]
    board.columns = columns
    board.my_role = membership.role
    return board_detail_schema.dump(board)


def update_board(user, board_id, load_data):
    board, membership = require_board_admin(board_id, user.user_id)
    data = load_data()  # validated after the 404/403 checks
    board.name = data["name"]
    db.session.commit()
    return serialize_board(board, membership.role, board_counts_one(board_id))


def delete_board(user, board_id):
    require_board_admin(board_id, user.user_id)
    cascade.soft_delete_board_tree(board_id)
    db.session.commit()
    return {"board_id": str(board_id)}
