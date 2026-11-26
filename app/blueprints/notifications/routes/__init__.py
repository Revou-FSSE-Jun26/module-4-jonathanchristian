"""Routes of the notifications feature, split by topic (G-BE-18); `bp` is registered by `create_app`.

Each module exposes `register(bp)` and defines thin handlers.
"""
from flask import Blueprint

from app.blueprints.notifications.routes import notification_routes, overdue_routes

bp = Blueprint("notifications", __name__, url_prefix="/api")

for _module in (notification_routes, overdue_routes):
    _module.register(bp)
