"""Marshmallow schemas for authentication (no model)."""
from marshmallow import RAISE, Schema, fields, pre_load, validate

from app.blueprints.users.schema import EMAIL_VALIDATORS, NAME_FIELD_ARGS, clean_text_fields


class RegisterSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(required=True, **NAME_FIELD_ARGS)
    email = fields.String(required=True, validate=EMAIL_VALIDATORS)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "name", "email")


class LoginSchema(Schema):
    class Meta:
        unknown = RAISE

    email = fields.String(required=True, validate=[validate.Length(min=1, max=254), validate.Email()])
    password = fields.String(required=True, validate=validate.Length(min=1, max=1024))

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "email")
