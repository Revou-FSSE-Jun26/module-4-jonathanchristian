"""Card link routes (thin: parse, call the service, return ok(...))."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.cards.schema import CardLinkCreateSchema, CardLinkUpdateSchema
from app.blueprints.cards.service import link_service as service
from app.errors import load_json, ok

create_schema = CardLinkCreateSchema()
update_schema = CardLinkUpdateSchema()


def register(bp):
    @bp.post("/cards/<uuid:card_id>/links")
    @jwt_required()
    def add_card_link(card_id):
        return ok(service.add_link(current_user, card_id, lambda: load_json(create_schema)), 201)

    @bp.patch("/links/<uuid:link_id>")
    @jwt_required()
    def update_card_link(link_id):
        return ok(service.update_link(current_user, link_id, lambda: load_json(update_schema)))

    @bp.delete("/links/<uuid:link_id>")
    @jwt_required()
    def delete_card_link(link_id):
        return ok(service.delete_link(current_user, link_id))
