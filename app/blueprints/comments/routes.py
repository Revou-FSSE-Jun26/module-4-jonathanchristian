"""Routes for the comments feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.comments import service
from app.blueprints.comments.schema import CommentCreateSchema, CommentUpdateSchema
from app.errors import load_json, ok

bp = Blueprint("comments", __name__, url_prefix="/api")

create_schema = CommentCreateSchema()
update_schema = CommentUpdateSchema()


@bp.post("/cards/<uuid:card_id>/comments")
@jwt_required()
def create_comment(card_id):
    return ok(service.create_comment(current_user, card_id, lambda: load_json(create_schema)), 201)


@bp.get("/cards/<uuid:card_id>/comments")
@jwt_required()
def list_comments(card_id):
    return ok(service.list_comments(current_user, card_id))


@bp.patch("/comments/<uuid:comment_id>")
@jwt_required()
def update_comment(comment_id):
    return ok(service.update_comment(current_user, comment_id, lambda: load_json(update_schema)))


@bp.delete("/comments/<uuid:comment_id>")
@jwt_required()
def delete_comment(comment_id):
    return ok(service.delete_comment(current_user, comment_id))
