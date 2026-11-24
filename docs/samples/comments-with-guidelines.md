# Sample: comments feature generated WITH the Guidelines

This is the "after" sample for [`../guideline-comparison.md`](../guideline-comparison.md). It is kept unchanged as the AI returned it and is not part of the running application. The real implementation is in `app/blueprints/comments/`. This file is documentation only.

- **Generator:** a fresh Kiro sub-agent session (`general-task-execution`) with no repository access other than `guidelines/backend.md` and `guidelines/database.md` attached to the prompt.
- **Prompt:** the same Requirement 12 text and stack paragraph as the "before" sample, plus "follow every applicable guideline entry".
- **Date:** 2026-11-24

---

## `app/blueprints/comments/schema.py`

```python
import uuid

from marshmallow import Schema, ValidationError, fields, validates, RAISE

from app.extensions import db
from app.soft_delete import SoftDeleteMixin

CONTENT_MAX_LENGTH = 2000


class Comment(SoftDeleteMixin, db.Model):
    __tablename__ = "comments"

    comment_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    card_id = db.Column(
        db.Uuid,
        db.ForeignKey("cards.card_id", name="fk_comments_cards"),
        nullable=False,
    )
    author_id = db.Column(
        db.Uuid,
        db.ForeignKey("users.user_id", name="fk_comments_users"),
        nullable=False,
    )
    content = db.Column(db.Text, nullable=False)

    # Related models are referenced by string name and never lazy-loaded.
    author = db.relationship("User", lazy="raise")

    __table_args__ = (
        db.CheckConstraint(
            f"char_length(content) BETWEEN 1 AND {CONTENT_MAX_LENGTH}",
            name="ck_comments_content_length",
        ),
        db.Index("ix_comments_card_id_created_at", "card_id", "created_at"),
    )


class CommentContentSchema(Schema):
    """Request body for creating or updating a comment."""

    class Meta:
        unknown = RAISE

    content = fields.String(required=True)

    @validates("content")
    def validate_content(self, value, **kwargs):
        if not value.strip():
            raise ValidationError("Content must contain a non-whitespace character")
        if len(value) > CONTENT_MAX_LENGTH:
            raise ValidationError(
                f"Content must be at most {CONTENT_MAX_LENGTH} characters"
            )


class CommentCreateSchema(CommentContentSchema):
    pass


class CommentUpdateSchema(CommentContentSchema):
    pass


class CommentSchema(Schema):
    """Response shape. UUIDs are serialized as lowercase hyphenated strings."""

    comment_id = fields.UUID(dump_only=True)
    card_id = fields.UUID(dump_only=True)
    author_id = fields.UUID(dump_only=True)
    author_name = fields.Method("get_author_name", dump_only=True)
    content = fields.String(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_author_name(self, comment):
        return comment.author.name


comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)
```

## `app/blueprints/comments/service.py`

```python
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.blueprints.cards.schema import Card
from app.blueprints.comments.schema import Comment
from app.errors import Forbidden, NotFound
from app.extensions import db
from app.permissions import require_board_participant
from app.soft_delete import active, utcnow

GUEST_ROLE = "guest"


def _get_active_card(card_id):
    card = db.session.execute(
        select(Card).where(Card.card_id == card_id, active(Card))
    ).scalar_one_or_none()
    if card is None:
        raise NotFound("Card not found")
    return card


def _get_active_comment(comment_id):
    comment = db.session.execute(
        select(Comment)
        .options(joinedload(Comment.author))
        .where(Comment.comment_id == comment_id, active(Comment))
    ).scalar_one_or_none()
    if comment is None:
        raise NotFound("Comment not found")
    return comment


def _require_writer(board_id, user):
    """Board participant who is not a guest (404 -> 403 ordering is in permissions)."""
    membership = require_board_participant(board_id, user.user_id)
    if membership.role == GUEST_ROLE:
        raise Forbidden("Guests cannot modify comments")


def _require_owner(comment, user):
    if comment.author_id != user.user_id:
        raise Forbidden("Only the comment owner can do this")


def list_comments(user, card_id):
    card = _get_active_card(card_id)
    require_board_participant(card.board_id, user.user_id)
    return (
        db.session.execute(
            select(Comment)
            .options(joinedload(Comment.author))
            .where(Comment.card_id == card.card_id, active(Comment))
            .order_by(Comment.created_at.asc(), Comment.comment_id.asc())
        )
        .scalars()
        .all()
    )


def create_comment(user, card_id, data):
    card = _get_active_card(card_id)
    _require_writer(card.board_id, user)
    comment = Comment(
        card_id=card.card_id,
        author_id=user.user_id,
        content=data["content"],
    )
    db.session.add(comment)
    db.session.commit()
    return _get_active_comment(comment.comment_id)


def update_comment(user, comment_id, data):
    comment = _get_active_comment(comment_id)
    card = _get_active_card(comment.card_id)
    _require_writer(card.board_id, user)
    _require_owner(comment, user)
    comment.content = data["content"]
    comment.updated_at = utcnow()
    db.session.commit()
    return _get_active_comment(comment_id)


def delete_comment(user, comment_id):
    comment = _get_active_comment(comment_id)
    card = _get_active_card(comment.card_id)
    _require_writer(card.board_id, user)
    _require_owner(comment, user)
    comment.is_deleted = True
    comment.deleted_at = utcnow()
    db.session.commit()
    return comment.comment_id
```

## `app/blueprints/comments/routes.py`

```python
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.comments import service
from app.blueprints.comments.schema import (
    CommentCreateSchema,
    CommentUpdateSchema,
    comment_schema,
    comments_schema,
)
from app.errors import load_json, ok

comments_bp = Blueprint("comments", __name__)


@comments_bp.get("/api/cards/<uuid:card_id>/comments")
@jwt_required()
def list_comments(card_id):
    comments = service.list_comments(current_user, card_id)
    return ok(comments_schema.dump(comments))


@comments_bp.post("/api/cards/<uuid:card_id>/comments")
@jwt_required()
def create_comment(card_id):
    data = load_json(CommentCreateSchema())
    comment = service.create_comment(current_user, card_id, data)
    return ok(comment_schema.dump(comment), 201)


@comments_bp.patch("/api/comments/<uuid:comment_id>")
@jwt_required()
def update_comment(comment_id):
    data = load_json(CommentUpdateSchema())
    comment = service.update_comment(current_user, comment_id, data)
    return ok(comment_schema.dump(comment))


@comments_bp.delete("/api/comments/<uuid:comment_id>")
@jwt_required()
def delete_comment(comment_id):
    deleted_id = service.delete_comment(current_user, comment_id)
    return ok({"comment_id": str(deleted_id)})
```
