"""CardLink model (design Data Models V11, A17)."""
import uuid

from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class CardLink(SoftDeleteMixin, db.Model):
    __tablename__ = "card_links"

    card_link_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    # No ON DELETE CASCADE: deleting a Card soft deletes its links in the service (G-DB-05).
    card_id = db.Column(
        db.Uuid, db.ForeignKey("cards.card_id", name="fk_card_links_cards"), nullable=False
    )
    created_by = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_card_links_users"), nullable=False
    )
    # The http/https scheme rule is enforced by `validate_link_url`, not by the database.
    url = db.Column(db.String(2048), nullable=False)
    label = db.Column(db.String(100), nullable=False)

    card = db.relationship("Card", lazy="raise")
    creator = db.relationship("User", foreign_keys="CardLink.created_by", lazy="raise")

    __table_args__ = (
        db.CheckConstraint("char_length(url) BETWEEN 1 AND 2048", name="ck_card_links_url_len"),
        db.CheckConstraint("char_length(label) BETWEEN 1 AND 100", name="ck_card_links_label_len"),
        db.Index("ix_card_links_card_id", "card_id"),
    )
