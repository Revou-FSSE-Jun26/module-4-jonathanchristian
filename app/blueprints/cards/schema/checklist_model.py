"""ChecklistItem model (design Data Models V11, A17)."""
import uuid

from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class ChecklistItem(SoftDeleteMixin, db.Model):
    __tablename__ = "checklist_items"

    checklist_item_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    # No ON DELETE CASCADE: deleting a Card soft deletes its items in the service (G-DB-05).
    card_id = db.Column(
        db.Uuid, db.ForeignKey("cards.card_id", name="fk_checklist_items_cards"), nullable=False
    )
    text = db.Column(db.String(200), nullable=False)
    is_done = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    order = db.Column(db.Float, nullable=False)

    card = db.relationship("Card", lazy="raise")

    __table_args__ = (
        db.CheckConstraint("char_length(text) BETWEEN 1 AND 200", name="ck_checklist_items_text_len"),
        db.CheckConstraint('"order" > 0', name="ck_checklist_items_order_positive"),
        # Also serves the card_id filter (R44.3).
        db.Index("ix_checklist_items_card_id_order", "card_id", "order"),
    )
