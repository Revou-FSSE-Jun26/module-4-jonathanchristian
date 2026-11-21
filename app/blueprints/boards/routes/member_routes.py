"""Board member routes (thin: parse, call the service, return ok(...))."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.boards import service
from app.blueprints.boards.schema import MemberAddSchema
from app.errors import load_json, ok

member_add_schema = MemberAddSchema()


def register(bp):
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
