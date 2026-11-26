"""Move a Card to a Column and Order_Value (drag and drop)."""
from sqlalchemy import select

from app.blueprints.cards.service.card_service import dump_card
from app.blueprints.columns.schema import Column
from app.errors import BadRequest
from app.extensions import db
from app.permissions import get_card_for_writer
from app.soft_delete import active


def move_card(user, card_id, load_data):
    """Store the client-supplied order; the target Column must be active and in the same Board."""
    card, board, _membership = get_card_for_writer(card_id, user.user_id)
    data = load_data()
    target = db.session.execute(
        select(Column.column_id).where(
            Column.column_id == data["column_id"],
            Column.board_id == board.board_id,
            active(Column),
        )
    ).first()
    if target is None:
        raise BadRequest("Target column does not belong to this board")
    card.column_id = data["column_id"]
    card.order = data["order"]
    db.session.commit()
    return dump_card(card_id)  # dump_card adds the counts of this Card
