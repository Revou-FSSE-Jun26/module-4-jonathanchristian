"""Comment model and comments Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, ValidationError, fields, validate

from app.blueprints.users.schema import UserRefSchema
from app.errors import UtcDateTime, UuidField
from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Comment(SoftDeleteMixin, db.Model):
    __tablename__ = "comments"

    comment_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    card_id = db.Column(
        db.Uuid, db.ForeignKey("cards.card_id", name="fk_comments_cards"), nullable=False
    )
    author_id = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_comments_users"), nullable=False
    )
    content = db.Column(db.Text, nullable=False)

    author = db.relationship("User", foreign_keys="Comment.author_id", lazy="raise")

    __table_args__ = (
        db.CheckConstraint(
            "char_length(content) BETWEEN 1 AND 2000", name="ck_comments_content_len"
        ),
        db.Index("ix_comments_card_id_created_at", "card_id", "created_at"),
    )


# --- Marshmallow schemas ---------------------------------------------------------------------

MAX_CONTENT = 2000


def _has_visible_text(value):
    if not value.strip():
        raise ValidationError("Content must contain a non-whitespace character")


class CommentCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    content = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=MAX_CONTENT), _has_visible_text],
    )


class CommentUpdateSchema(CommentCreateSchema):
    pass


class CommentSchema(Schema):
    """Output schema. `author` must be loaded (joinedload) before dumping."""

    comment_id = UuidField()
    card_id = UuidField()
    content = fields.String()
    author = fields.Nested(UserRefSchema)
    created_at = UtcDateTime()
    updated_at = UtcDateTime()
