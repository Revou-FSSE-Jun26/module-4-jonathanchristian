"""Card model and cards Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema
from sqlalchemy.dialects import postgresql

from app.blueprints.users.schema import UserRefSchema, clean_text_fields
from app.errors import OrderField, UtcDateTime, UuidField
from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Card(SoftDeleteMixin, db.Model):
    __tablename__ = "cards"

    card_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    # board_id is denormalized from the Column; a Card never changes Board (design D11).
    board_id = db.Column(
        db.Uuid, db.ForeignKey("boards.board_id", name="fk_cards_boards"), nullable=False
    )
    column_id = db.Column(
        db.Uuid, db.ForeignKey("columns.column_id", name="fk_cards_columns"), nullable=False
    )
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    labels = db.Column(
        postgresql.ARRAY(db.String(30)), nullable=False, default=list, server_default="{}"
    )
    assignee_id = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_cards_users"), nullable=True
    )
    order = db.Column(db.Float, nullable=False)

    assignee = db.relationship("User", foreign_keys="Card.assignee_id", lazy="raise")

    __table_args__ = (
        db.CheckConstraint("char_length(description) <= 5000", name="ck_cards_description_len"),
        db.CheckConstraint('"order" > 0', name="ck_cards_order_positive"),
        db.Index("ix_cards_column_id_order", "column_id", "order"),
        db.Index("ix_cards_board_id", "board_id"),
        db.Index("ix_cards_assignee_id", "assignee_id"),
    )


class CardSchema(Schema):
    """Output schema for a Card. `assignee` must be loaded (joinedload) before dumping."""

    card_id = UuidField()
    board_id = UuidField()
    column_id = UuidField()
    title = fields.String()
    description = fields.String(allow_none=True)
    due_date = fields.Date(allow_none=True)
    labels = fields.List(fields.String())
    assignee = fields.Nested(UserRefSchema, allow_none=True)
    order = fields.Float()
    created_at = UtcDateTime()
    updated_at = UtcDateTime()


class CardSearchResultSchema(CardSchema):
    """A Card in search and My Tasks results, with its Board and Column names."""

    board_name = fields.String()
    column_name = fields.String()


# --- input schemas ---------------------------------------------------------------------------

LABEL_ITEM = fields.String(validate=validate.Length(min=1, max=30))


class CardCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=5000))
    due_date = fields.Date(allow_none=True)
    labels = fields.List(LABEL_ITEM, validate=validate.Length(max=10))
    assignee_id = UuidField(allow_none=True)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "title")


class CardUpdateSchema(CardCreateSchema):
    """PATCH: every field optional; only supplied fields change. `title` cannot be null."""

    title = fields.String(validate=validate.Length(min=1, max=200))


class CardPositionSchema(Schema):
    class Meta:
        unknown = RAISE

    column_id = UuidField(required=True)
    order = OrderField(required=True)


class CardQuerySchema(Schema):
    """GET /api/cards: `assignee=me`, or `q` with an optional `board_id`; nothing else."""

    class Meta:
        unknown = RAISE

    assignee = fields.String(validate=validate.Equal("me"))
    q = fields.String(validate=validate.Length(min=1, max=100))
    board_id = UuidField()

    @validates_schema
    def _valid_combination(self, data, **kwargs):
        if "assignee" in data:
            if "q" in data or "board_id" in data:
                raise ValidationError("assignee cannot be combined with q or board_id", "_schema")
        elif "q" not in data:
            raise ValidationError("Provide assignee=me or q", "_schema")
