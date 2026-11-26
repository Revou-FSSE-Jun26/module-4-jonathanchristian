"""Overdue Cards route (thin)."""
from datetime import datetime, timezone

from flask_jwt_extended import current_user, jwt_required

from app.blueprints.notifications import service
from app.errors import ok


def register(bp):
    @bp.get("/notifications/overdue")
    @jwt_required()
    def list_overdue():
        today_utc = datetime.now(timezone.utc).date()  # computed once, passed to the service
        return ok(service.list_overdue(current_user.user_id, today_utc))
