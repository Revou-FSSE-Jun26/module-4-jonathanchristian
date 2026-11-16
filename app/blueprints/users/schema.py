"""User model and users Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from app.errors import UtcDateTime, UuidField
from app.extensions import db
from app.soft_delete import SoftDeleteMixin


def normalize_email(value):
    """Trim and lowercase an email. The stored column is always normalized."""
    return value.strip().lower()


class User(SoftDeleteMixin, db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(254), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    __table_args__ = (
        db.CheckConstraint("email = lower(email)", name="ck_users_email_lowercase"),
        db.Index(
            "uq_users_email_active",
            "email",
            unique=True,
            postgresql_where=db.text("is_deleted = false"),
        ),
    )


def clean_text_fields(data, *names):
    """pre_load helper: strip surrounding whitespace of the named string fields, and
    normalize an `email` value. Non-string values are left for field validation."""
    if not isinstance(data, dict):
        return data
    cleaned = dict(data)
    for name in names:
        if isinstance(cleaned.get(name), str):
            cleaned[name] = normalize_email(cleaned[name]) if name == "email" else cleaned[name].strip()
    return cleaned


NAME_FIELD_ARGS = {"validate": validate.Length(min=1, max=100)}
EMAIL_VALIDATORS = [validate.Length(max=254), validate.Email()]


class UserSchema(Schema):
    """Output schema: never includes the password or its hash."""

    user_id = UuidField()
    name = fields.String()
    email = fields.String()
    created_at = UtcDateTime()


class UserRefSchema(Schema):
    """Minimal user reference embedded in cards (assignee) and comments (author)."""

    user_id = UuidField()
    name = fields.String()


class UserUpdateSchema(Schema):
    """PATCH /api/users/me. `password` (or any unknown key) is rejected with 400."""

    class Meta:
        unknown = RAISE

    name = fields.String(**NAME_FIELD_ARGS)
    email = fields.String(validate=EMAIL_VALIDATORS)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "name", "email")

    @validates_schema
    def _at_least_one_field(self, data, **kwargs):
        if "name" not in data and "email" not in data:
            raise ValidationError("Provide at least one of name or email", "_schema")
