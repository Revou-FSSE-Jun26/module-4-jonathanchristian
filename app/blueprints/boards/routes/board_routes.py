"""Board routes (thin: parse, call the service, return ok(...))."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.boards import service
from app.blueprints.boards.schema import BoardCreateSchema, BoardUpdateSchema
from app.errors import load_json, ok

create_schema = BoardCreateSchema()
update_schema = BoardUpdateSchema()


def register(bp):
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
