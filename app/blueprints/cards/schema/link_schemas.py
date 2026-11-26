"""Card link Marshmallow schemas (design A17)."""
from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from app.blueprints.cards.schema.url_rules import validate_link_url
from app.blueprints.users.schema import clean_text_fields
from app.errors import UtcDateTime, UuidField

LABEL_LENGTH = validate.Length(min=1, max=100)


def _url_validator(value):
    try:
        validate_link_url(value)
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc


class CardLinkCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    url = fields.String(required=True, validate=_url_validator)
    label = fields.String(validate=LABEL_LENGTH)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "url", "label")


class CardLinkUpdateSchema(Schema):
    """PATCH: `url` and/or `label`; at least one is required."""

    class Meta:
        unknown = RAISE

    url = fields.String(validate=_url_validator)
    label = fields.String(validate=LABEL_LENGTH)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "url", "label")

    @validates_schema
    def _not_empty(self, data, **kwargs):
        if not data:
            raise ValidationError("Provide url or label", "_schema")


class CardLinkSchema(Schema):
    card_link_id = UuidField()
    url = fields.String()
    label = fields.String()
    created_by = UuidField()
    created_at = UtcDateTime()
