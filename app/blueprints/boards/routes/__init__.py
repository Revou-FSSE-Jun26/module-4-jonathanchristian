"""Routes of the boards feature, split by topic (G-BE-18); `bp` is registered by `create_app`.

Each module exposes `register(bp)` and defines thin handlers: parse, call the service,
return `ok(...)`.
"""
from flask import Blueprint

from app.blueprints.boards.routes import board_routes, invite_routes, member_routes

bp = Blueprint("boards", __name__, url_prefix="/api")

for _module in (board_routes, member_routes, invite_routes):
    _module.register(bp)
