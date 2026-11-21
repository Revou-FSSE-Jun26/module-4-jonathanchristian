"""Invitation link Marshmallow schemas (design A14)."""
from marshmallow import RAISE, Schema, fields, validate

from app.errors import UuidField

INVITE_ROLES = ("member", "guest")
INVITE_TOKEN_PATTERN = r"^[A-Za-z0-9_-]{43,128}$"


class InviteRoleSchema(Schema):
    """The `<role>` path segment of a regenerate request: `member` or `guest`."""

    class Meta:
        unknown = RAISE

    role = fields.String(required=True, validate=validate.OneOf(INVITE_ROLES))


class InviteTokenSchema(Schema):
    """The `<token>` path segment of an invite request (format check before any query)."""

    class Meta:
        unknown = RAISE

    token = fields.String(required=True, validate=validate.Regexp(INVITE_TOKEN_PATTERN))


class InviteLinkSchema(Schema):
    role = fields.String()
    token = fields.String()


class InviteLinksSchema(Schema):
    """GET invite-links: `{member: {role, token}, guest: {role, token}}`."""

    member = fields.Nested(InviteLinkSchema)
    guest = fields.Nested(InviteLinkSchema)


class InviteInfoSchema(Schema):
    """GET /api/invites/<token>: what the token grants and the caller's current role."""

    board_id = UuidField()
    board_name = fields.String()
    role = fields.String()
    current_role = fields.String(allow_none=True)


class AcceptResultSchema(Schema):
    board_id = UuidField()
    role = fields.String()
