# Sample: comments feature generated WITHOUT the Guidelines

This is the "before" sample for [`../guideline-comparison.md`](../guideline-comparison.md). It is kept unchanged as the AI returned it and is not part of the running application. It is documentation only. Do not copy it into `app/`.

- **Generator:** a fresh Kiro sub-agent session (`general-task-execution`) with no access to `guidelines/` and no repository files.
- **Prompt:** the text of Requirement 12 (Comments, criteria 1 to 11) plus a one-paragraph stack description (Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Marshmallow, PostgreSQL; existing `db`, User, Board, BoardMembership, and Card).
- **Date:** 2026-11-24

---

## `app/comments/__init__.py`

```python
from flask import Blueprint

comments_bp = Blueprint("comments", __name__)

from . import routes  # noqa: E402,F401
from .errors import register_error_handlers  # noqa: E402

__all__ = ["comments_bp", "register_error_handlers"]
```

## `app/comments/errors.py`

```python
from flask import jsonify
from marshmallow import ValidationError


class ApiError(Exception):
    def __init__(self, status, message, details=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.details = details


def _body(message, details=None):
    body = {"error": message}
    if details:
        body["details"] = details
    return body


def register_error_handlers(app, jwt):
    """Call once from the app factory: register_error_handlers(app, jwt)."""

    @app.errorhandler(ApiError)
    def _api_error(err):
        return jsonify(_body(err.message, err.details)), err.status

    @app.errorhandler(ValidationError)
    def _validation_error(err):
        return jsonify(_body("Validation failed", err.messages)), 400

    # Flask-JWT-Extended returns 422 for invalid tokens by default; force 401.
    @jwt.unauthorized_loader
    def _missing(reason):
        return jsonify(_body("Missing or malformed authorization")), 401

    @jwt.invalid_token_loader
    def _invalid(reason):
        return jsonify(_body("Invalid token")), 401

    @jwt.expired_token_loader
    def _expired(jwt_header, jwt_payload):
        return jsonify(_body("Token has expired")), 401

    @jwt.revoked_token_loader
    def _revoked(jwt_header, jwt_payload):
        return jsonify(_body("Token has been revoked")), 401

    @jwt.needs_fresh_token_loader
    def _not_fresh(jwt_header, jwt_payload):
        return jsonify(_body("Fresh token required")), 401
```

## `app/comments/models.py`

```python
from datetime import datetime, timezone

from app import db


def utcnow():
    return datetime.now(timezone.utc)


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(
        db.Integer, db.ForeignKey("cards.id"), nullable=False, index=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    content = db.Column(db.String(2000), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

    author = db.relationship("User", lazy="joined")
    card = db.relationship("Card", lazy="joined")

    __table_args__ = (
        db.CheckConstraint(
            "char_length(content) BETWEEN 1 AND 2000", name="ck_comment_len"
        ),
        db.Index("ix_comments_card_created", "card_id", "created_at"),
    )
```

## `app/comments/schemas.py`

```python
from marshmallow import Schema, ValidationError, fields, validates

MAX_LEN = 2000


class CommentInputSchema(Schema):
    content = fields.String(
        required=True,
        error_messages={
            "required": "content is required",
            "null": "content is required",
            "invalid": "content must be a string",
        },
    )

    @validates("content")
    def _validate_content(self, value):
        if not value.strip():
            raise ValidationError("content must contain a non-whitespace character")
        if len(value) > MAX_LEN:
            raise ValidationError(f"content must be at most {MAX_LEN} characters")


class CommentOutputSchema(Schema):
    id = fields.Integer()
    card_id = fields.Integer()
    user_id = fields.Integer()
    content = fields.String()
    author_name = fields.Method("get_author_name")
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso", allow_none=True)

    def get_author_name(self, obj):
        return obj.author.name if obj.author else None


comment_input_schema = CommentInputSchema()
comment_output_schema = CommentOutputSchema()
comments_output_schema = CommentOutputSchema(many=True)
```

## `app/comments/services.py`

```python
from app import db
from app.models import BoardMembership, Card

from .errors import ApiError
from .models import Comment, utcnow

WRITE_ROLES = {"admin", "member"}


def _get_card_or_404(card_id):
    card = db.session.get(Card, card_id)
    if card is None or getattr(card, "deleted_at", None) is not None:
        raise ApiError(404, "Card not found")
    return card


def _get_comment_or_404(comment_id):
    comment = db.session.get(Comment, comment_id)
    if comment is None or comment.deleted_at is not None:
        raise ApiError(404, "Comment not found")
    return comment


def _role(board_id, user_id):
    membership = BoardMembership.query.filter_by(
        board_id=board_id, user_id=user_id
    ).first()
    return membership.role if membership else None


def _require_participant(board_id, user_id):
    role = _role(board_id, user_id)
    if role is None:
        raise ApiError(403, "Not a participant of this board")
    return role


def _require_writer(board_id, user_id):
    role = _require_participant(board_id, user_id)
    if role not in WRITE_ROLES:
        raise ApiError(403, "Guests cannot modify comments")


def _require_owner_writer(comment, user_id):
    """Only the owner may edit/delete, never another user (even a board admin).
    The owner must still be a non-guest participant of the board."""
    _require_writer(comment.card.board_id, user_id)
    if comment.user_id != user_id:
        raise ApiError(403, "Only the comment owner can do this")


def list_comments(card_id, user_id):
    card = _get_card_or_404(card_id)
    _require_participant(card.board_id, user_id)  # guests allowed
    return (
        Comment.query.filter(
            Comment.card_id == card.id, Comment.deleted_at.is_(None)
        )
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .all()
    )


def create_comment(card_id, user_id, content):
    card = _get_card_or_404(card_id)
    _require_writer(card.board_id, user_id)
    comment = Comment(card_id=card.id, user_id=user_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return comment


def update_comment(comment_id, user_id, content):
    comment = _get_comment_or_404(comment_id)
    _require_owner_writer(comment, user_id)
    comment.content = content
    comment.updated_at = utcnow()
    db.session.commit()
    return comment


def delete_comment(comment_id, user_id):
    comment = _get_comment_or_404(comment_id)
    _require_owner_writer(comment, user_id)
    comment.deleted_at = utcnow()
    db.session.commit()
```

## `app/comments/routes.py`

```python
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from . import comments_bp, services
from .errors import ApiError
from .schemas import (
    comment_input_schema,
    comment_output_schema,
    comments_output_schema,
)


def _current_user_id():
    return int(get_jwt_identity())


def _load_content():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "Request body must be a JSON object")
    return comment_input_schema.load(data)["content"]  # ValidationError -> 400


@comments_bp.get("/api/cards/<int:card_id>/comments")
@jwt_required()
def list_comments(card_id):
    comments = services.list_comments(card_id, _current_user_id())
    return jsonify(comments_output_schema.dump(comments)), 200


@comments_bp.post("/api/cards/<int:card_id>/comments")
@jwt_required()
def create_comment(card_id):
    user_id = _current_user_id()
    # Existence and permission checks come first so validation errors
    # never reveal anything about cards the user cannot access.
    services.authorize_create(card_id, user_id)
    content = _load_content()
    comment = services.create_comment(card_id, user_id, content)
    return jsonify(comment_output_schema.dump(comment)), 201


@comments_bp.patch("/api/comments/<int:comment_id>")
@jwt_required()
def update_comment(comment_id):
    user_id = _current_user_id()
    services.authorize_modify(comment_id, user_id)
    content = _load_content()
    comment = services.update_comment(comment_id, user_id, content)
    return jsonify(comment_output_schema.dump(comment)), 200


@comments_bp.delete("/api/comments/<int:comment_id>")
@jwt_required()
def delete_comment(comment_id):
    services.delete_comment(comment_id, _current_user_id())
    return jsonify({"message": "Comment deleted"}), 200
```

The routes call `authorize_create` and `authorize_modify`, which the services file above doesn't define. Add these two functions to `app/comments/services.py`:

## `app/comments/services.py` (additions)

```python
def authorize_create(card_id, user_id):
    card = _get_card_or_404(card_id)
    _require_writer(card.board_id, user_id)


def authorize_modify(comment_id, user_id):
    comment = _get_comment_or_404(comment_id)
    _require_owner_writer(comment, user_id)
```

## `app/__init__.py` (registration snippet)

```python
from app.comments import comments_bp, register_error_handlers

# inside create_app(), after db and jwt are initialised:
app.register_blueprint(comments_bp)
register_error_handlers(app, jwt)
```
