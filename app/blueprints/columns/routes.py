"""Routes for the columns feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.columns import service
from app.blueprints.columns.schema import (
    ColumnCreateSchema,
    ColumnReorderSchema,
    ColumnUpdateSchema,
)
from app.errors import load_json, ok

bp = Blueprint("columns", __name__, url_prefix="/api")

create_schema = ColumnCreateSchema()
update_schema = ColumnUpdateSchema()
reorder_schema = ColumnReorderSchema()


@bp.post("/boards/<uuid:board_id>/columns")
@jwt_required()
def create_column(board_id):
    return ok(service.create_column(current_user, board_id, load_json(create_schema)), 201)


@bp.patch("/columns/<uuid:column_id>")
@jwt_required()
def rename_column(column_id):
    return ok(service.rename_column(current_user, column_id, load_json(update_schema)))


@bp.delete("/columns/<uuid:column_id>")
@jwt_required()
def delete_column(column_id):
    return ok(service.delete_column(current_user, column_id))


@bp.patch("/boards/<uuid:board_id>/columns/reorder")
@jwt_required()
def reorder_column(board_id):
    return ok(service.reorder_column(current_user, board_id, load_json(reorder_schema)))
