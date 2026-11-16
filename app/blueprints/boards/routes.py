"""Routes for the boards feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.boards import service
from app.blueprints.boards.schema import BoardCreateSchema, BoardUpdateSchema, MemberAddSchema
from app.errors import load_json, ok

bp = Blueprint("boards", __name__, url_prefix="/api")

create_schema = BoardCreateSchema()
update_schema = BoardUpdateSchema()
member_add_schema = MemberAddSchema()


@bp.post("/boards")
@jwt_required()
def create_board():
    return ok(service.create_board(current_user, load_json(create_schema)), 201)


@bp.get("/boards")
@jwt_required()
def list_boards():
    return ok(service.list_boards(current_user))


@bp.get("/boards/<uuid:board_id>")
@jwt_required()
def get_board(board_id):
    return ok(service.get_board_detail(current_user, board_id))


@bp.patch("/boards/<uuid:board_id>")
@jwt_required()
def update_board(board_id):
    return ok(service.update_board(current_user, board_id, lambda: load_json(update_schema)))


@bp.delete("/boards/<uuid:board_id>")
@jwt_required()
def delete_board(board_id):
    return ok(service.delete_board(current_user, board_id))


@bp.post("/boards/<uuid:board_id>/members")
@jwt_required()
def add_member(board_id):
    return ok(service.add_member(current_user, board_id, lambda: load_json(member_add_schema)), 201)


@bp.get("/boards/<uuid:board_id>/members")
@jwt_required()
def list_members(board_id):
    return ok(service.list_members(current_user, board_id))


@bp.delete("/boards/<uuid:board_id>/members/<uuid:user_id>")
@jwt_required()
def remove_member(board_id, user_id):
    return ok(service.remove_member(current_user, board_id, user_id))
