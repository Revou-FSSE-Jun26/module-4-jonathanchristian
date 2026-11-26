"""Checklist item Marshmallow schemas (design A17)."""
from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from app.blueprints.users.schema import clean_text_fields
from app.errors import OrderField, UtcDateTime, UuidField

TEXT_LENGTH = validate.Length(min=1, max=200)


class StrictBoolean(fields.Boolean):
    """Only the JSON booleans `true` and `false` pass (not 1, 0, or strings)."""

    def _deserialize(self, value, attr, data, **kwargs):
        if not isinstance(value, bool):
            raise self.make_error("invalid", input=value)
        return value


class ChecklistCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    text = fields.String(required=True, validate=TEXT_LENGTH)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "text")


class ChecklistUpdateSchema(Schema):
    """PATCH: every field optional but at least one is required."""

    class Meta:
        unknown = RAISE

    text = fields.String(validate=TEXT_LENGTH)
    is_done = StrictBoolean()
    order = OrderField()

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "text")

    @validates_schema
    def _not_empty(self, data, **kwargs):
        if not data:
            raise ValidationError("Provide text, is_done, or order", "_schema")


class ChecklistItemSchema(Schema):
    checklist_item_id = UuidField()
    text = fields.String()
    is_done = fields.Boolean()
    order = fields.Float()
    created_at = UtcDateTime()
    updated_at = UtcDateTime()
