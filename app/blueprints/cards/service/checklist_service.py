"""Checklist items of a Card: add, update, delete (design A17). Progress is never stored."""
from sqlalchemy import func, select

from app.blueprints.cards.schema import ChecklistItem, ChecklistItemSchema
from app.errors import BadRequest
from app.extensions import db
from app.ordering import next_last_order
from app.permissions import get_card_for_writer, get_checklist_item_for_writer
from app.soft_delete import active, soft_delete_where, utcnow

MAX_ITEMS = 50
item_schema = ChecklistItemSchema()
UPDATABLE_FIELDS = ("text", "is_done", "order")


def add_item(user, card_id, load_data):
    """Append an item. The Card row is locked so two concurrent adds cannot pass the cap."""
    get_card_for_writer(card_id, user.user_id, lock=True)
    data = load_data()  # validated after the 404/403 checks
    count, current_max = db.session.execute(
        select(func.count(), func.max(ChecklistItem.order)).where(
            ChecklistItem.card_id == card_id, active(ChecklistItem)
        )
    ).one()
    if count >= MAX_ITEMS:
        raise BadRequest("checklist: limit of 50 items reached")
    item = ChecklistItem(
        card_id=card_id, text=data["text"], is_done=False, order=next_last_order(current_max)
    )
    db.session.add(item)
    db.session.commit()
    return item_schema.dump(item)


def update_item(user, item_id, load_data):
    """Change only the supplied fields."""
    item, _card, _membership = get_checklist_item_for_writer(item_id, user.user_id)
    data = load_data()
    for key in UPDATABLE_FIELDS:
        if key in data:
            setattr(item, key, data[key])
    db.session.commit()
    return item_schema.dump(item)


def delete_item(user, item_id):
    get_checklist_item_for_writer(item_id, user.user_id)
    soft_delete_where(
        db.session, ChecklistItem, ChecklistItem.checklist_item_id == item_id, deleted_at=utcnow()
    )
    db.session.commit()
    return {"checklist_item_id": str(item_id)}
