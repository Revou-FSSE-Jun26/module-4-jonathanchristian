"""Card search and My Tasks route (thin)."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.cards import service
from app.blueprints.cards.schema import CardQuerySchema
from app.errors import load_query, ok

query_schema = CardQuerySchema()


def register(bp):
    @bp.get("/cards")
    @jwt_required()
    def search_cards():
        return ok(service.search_cards(current_user, load_query(query_schema)))
