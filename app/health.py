"""GET /api/health: liveness check, no database access."""
from flask import Blueprint

from app.errors import ok

bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    return ok({"status": "ok"})
