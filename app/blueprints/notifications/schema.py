"""Notification model and notifications Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, fields, validate

from app.errors import UtcDateTime, UuidField
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


# --- Marshmallow schemas ---------------------------------------------------------------------

MAX_INT = 2147483647
MAX_PER_PAGE = 100


class _QueryInteger(fields.Integer):
    """Query-string integer: plain decimal digits only (no sign, spaces, or underscores)."""

    def _validated(self, value):
        if not isinstance(value, str) or not value.isascii() or not value.isdigit():
            raise self.make_error("invalid")
        return super()._validated(value)


class NotificationQuerySchema(Schema):
    class Meta:
        unknown = RAISE

    page = _QueryInteger(load_default=1, validate=validate.Range(min=1, max=MAX_INT))
    per_page = _QueryInteger(
        load_default=20, validate=validate.Range(min=1, max=MAX_PER_PAGE)
    )


class NotificationSchema(Schema):
    notification_id = UuidField()
    type = fields.String()
    message = fields.String()
    card_id = UuidField()
    board_id = UuidField()
    is_read = fields.Boolean()
    created_at = UtcDateTime()


class NotificationPageSchema(Schema):
    items = fields.List(fields.Nested(NotificationSchema))
    page = fields.Integer()
    per_page = fields.Integer()
    total = fields.Integer()
    unread_count = fields.Integer()
