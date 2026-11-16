"""Routes for the analytics feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.analytics import service
from app.errors import ok

bp = Blueprint("analytics", __name__, url_prefix="/api")


@bp.get("/boards/<uuid:board_id>/analytics")
@jwt_required()
def get_analytics(board_id):
    return ok(service.get_analytics(current_user, board_id))
