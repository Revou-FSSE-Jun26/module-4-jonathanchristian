"""User model and users Marshmallow schemas."""
import uuid

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
