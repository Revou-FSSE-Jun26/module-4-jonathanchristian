"""Cards Marshmallow schemas (output and input)."""
from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from app.blueprints.cards.schema.card_model import CARD_STATUSES
from app.blueprints.cards.schema.checklist_schemas import ChecklistItemSchema
from app.blueprints.cards.schema.link_schemas import CardLinkSchema
from app.blueprints.users.schema import UserRefSchema, clean_text_fields
from app.errors import OrderField, UtcDateTime, UuidField


class CardBaseSchema(Schema):
    """Card fields shared by every output. `assignee` must be loaded (joinedload) before dumping."""

    card_id = UuidField()
    board_id = UuidField()
    column_id = UuidField()
    title = fields.String()
    description = fields.String(allow_none=True)
    due_date = fields.Date(allow_none=True)
    labels = fields.List(fields.String())
    assignee = fields.Nested(UserRefSchema, allow_none=True)
    order = fields.Float()
    status = fields.String()
    completed_at = UtcDateTime()
    created_at = UtcDateTime()
    updated_at = UtcDateTime()


class CardSchema(CardBaseSchema):
    """A Card in board detail and in the create, update, and position responses (design A18).

    The service sets `checklist_done`, `checklist_total`, and `link_count` on the Card first.
    """

    checklist_done = fields.Integer()
    checklist_total = fields.Integer()
    link_count = fields.Integer()


class CardSearchResultSchema(CardBaseSchema):
    """A Card in search and My Tasks results, with its Board and Column names (no counts)."""

    board_name = fields.String()
    column_name = fields.String()


class CardDetailSchema(CardSchema):
    """GET /api/cards/<id>: the Card with its checklist and links (design A18)."""

    checklist = fields.List(fields.Nested(ChecklistItemSchema))
    links = fields.List(fields.Nested(CardLinkSchema))


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
    """PATCH: every field optional; only supplied fields change. `title` and `status` cannot be null.

    POST (CardCreateSchema) does not declare `status`, so `unknown = RAISE` rejects it with 400.
    """

    title = fields.String(validate=validate.Length(min=1, max=200))
    # Exact, case-sensitive; null is rejected. `completed_at` is never accepted from the client.
    status = fields.String(validate=validate.OneOf(CARD_STATUSES), allow_none=False)


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
