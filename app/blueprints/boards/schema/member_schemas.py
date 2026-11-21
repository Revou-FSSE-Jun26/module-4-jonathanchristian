"""Board member Marshmallow schemas."""
from marshmallow import RAISE, Schema, fields, pre_load

from app.blueprints.users.schema import EMAIL_VALIDATORS, clean_text_fields
from app.errors import UuidField


class MemberAddSchema(Schema):
    class Meta:
        unknown = RAISE

    email = fields.String(required=True, validate=EMAIL_VALIDATORS)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "email")


class MemberSchema(Schema):
    """A member row: user fields plus the role (set on the object by the service)."""

    user_id = UuidField()
    name = fields.String()
    email = fields.String()
    role = fields.String()
