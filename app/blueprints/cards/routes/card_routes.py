"""Card create, update, delete, and position routes (thin: parse, call the service, return ok)."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.cards import service
from app.blueprints.cards.schema import CardCreateSchema, CardPositionSchema, CardUpdateSchema
from app.errors import load_json, ok

create_schema = CardCreateSchema()
update_schema = CardUpdateSchema()
position_schema = CardPositionSchema()


def register(bp):
    @bp.post("/columns/<uuid:column_id>/cards")
    @jwt_required()
    def create_card(column_id):
        return ok(
            service.create_card(current_user, column_id, lambda: load_json(create_schema)), 201
        )

    @bp.patch("/cards/<uuid:card_id>")
    @jwt_required()
    def update_card(card_id):
        return ok(service.update_card(current_user, card_id, lambda: load_json(update_schema)))

    @bp.delete("/cards/<uuid:card_id>")
    @jwt_required()
    def delete_card(card_id):
        return ok(service.delete_card(current_user, card_id))

    @bp.patch("/cards/<uuid:card_id>/position")
    @jwt_required()
    def move_card(card_id):
        return ok(service.move_card(current_user, card_id, lambda: load_json(position_schema)))
