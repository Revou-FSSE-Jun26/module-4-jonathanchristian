"""Member and card counts of Boards for the list, create, and update responses (R47, design A22-R)."""
from sqlalchemy import func, select

from app.blueprints.boards.schema import BoardMembership
from app.blueprints.cards.schema import Card
from app.extensions import db
from app.soft_delete import active


def _grouped(model, board_ids):
    rows = db.session.execute(
        select(model.board_id, func.count())
        .where(model.board_id.in_(board_ids), active(model))
        .group_by(model.board_id)
    ).all()
    return dict(rows)


def board_counts(board_ids):
    """`{board_id: (member_count, card_count)}`; two grouped queries for any number of ids, none for []."""
    if not board_ids:
        return {}
    members, cards = _grouped(BoardMembership, board_ids), _grouped(Card, board_ids)
    return {bid: (members.get(bid, 0), cards.get(bid, 0)) for bid in board_ids}


def board_counts_one(board_id):
    """`(member_count, card_count)` of one Board (0, 0 when it has none)."""
    return board_counts([board_id])[board_id]
