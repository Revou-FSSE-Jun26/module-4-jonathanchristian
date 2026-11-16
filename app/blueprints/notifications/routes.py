"""Routes for the notifications feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.notifications import service
from app.blueprints.notifications.schema import NotificationQuerySchema
from app.errors import load_query, ok

bp = Blueprint("notifications", __name__, url_prefix="/api")

query_schema = NotificationQuerySchema()


@bp.get("/notifications")
@jwt_required()
def list_notifications():
    return ok(service.list_notifications(current_user, load_query(query_schema)))


@bp.patch("/notifications/<uuid:notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    return ok(service.mark_read(current_user, notification_id))
