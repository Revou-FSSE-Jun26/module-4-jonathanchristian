"""Board Marshmallow schemas."""
from marshmallow import RAISE, Schema, fields, pre_load, validate

from app.blueprints.cards.schema import CardSchema
from app.blueprints.columns.schema import ColumnSchema
from app.blueprints.users.schema import clean_text_fields
from app.errors import UtcDateTime, UuidField


class BoardCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(required=True, validate=validate.Length(min=1, max=100))

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "name")


class BoardUpdateSchema(BoardCreateSchema):
    pass


class BoardSchema(Schema):
    """A Board with the caller's role (`my_role`, set by the service before dumping)."""

    board_id = UuidField()
    name = fields.String()
    my_role = fields.String()
    created_at = UtcDateTime()
    updated_at = UtcDateTime()


class ColumnDetailSchema(ColumnSchema):
    cards = fields.List(fields.Nested(CardSchema))


class BoardDetailSchema(BoardSchema):
    columns = fields.List(fields.Nested(ColumnDetailSchema))
