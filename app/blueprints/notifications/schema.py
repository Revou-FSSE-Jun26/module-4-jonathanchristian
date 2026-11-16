"""Notification model and notifications Marshmallow schemas."""
import uuid

from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Notification(SoftDeleteMixin, db.Model):
    __tablename__ = "notifications"

    notification_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    recipient_id = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_notifications_users"), nullable=False
    )
    card_id = db.Column(
        db.Uuid, db.ForeignKey("cards.card_id", name="fk_notifications_cards"), nullable=False
    )
    # board_id is denormalized so notification navigation needs no Card lookup (design D11).
    board_id = db.Column(
        db.Uuid, db.ForeignKey("boards.board_id", name="fk_notifications_boards"), nullable=False
    )
    type = db.Column(db.String(10), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())

    __table_args__ = (
        db.CheckConstraint("type IN ('assignment', 'comment')", name="ck_notifications_type"),
        db.Index("ix_notifications_recipient_created", "recipient_id", "created_at"),
        db.Index(
            "ix_notifications_recipient_unread",
            "recipient_id",
            postgresql_where=db.text("is_read = false"),
        ),
    )
