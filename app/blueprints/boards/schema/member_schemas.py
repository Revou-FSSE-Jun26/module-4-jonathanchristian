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


class MemberRoleSchema(Schema):
    """PATCH /api/boards/<id>/members/<user_id>: `role` is a required string.

    Only the type is checked here, before any permission check; `admin` and unknown values are
    rejected with 400 by `decide_role_change` (design A20, Open issue 59).
    """

    class Meta:
        unknown = RAISE

    role = fields.String(required=True)


class MemberSchema(Schema):
    """A member row: user fields plus the role (set on the object by the service)."""

    user_id = UuidField()
    name = fields.String()
    email = fields.String()
    role = fields.String()
