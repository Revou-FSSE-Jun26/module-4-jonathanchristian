"""Routes of the cards feature, split by topic (G-BE-18); `bp` is registered by `create_app`.

Each module exposes `register(bp)` and defines thin handlers: parse, call the service,
return `ok(...)`.
"""
from flask import Blueprint

from app.blueprints.cards.routes import card_routes, search_routes

bp = Blueprint("cards", __name__, url_prefix="/api")

for _module in (card_routes, search_routes):
    _module.register(bp)
