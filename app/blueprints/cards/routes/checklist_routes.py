"""Checklist routes (thin: parse, call the service, return ok(...))."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.cards.schema import ChecklistCreateSchema, ChecklistUpdateSchema
from app.blueprints.cards.service import checklist_service as service
from app.errors import load_json, ok

create_schema = ChecklistCreateSchema()
update_schema = ChecklistUpdateSchema()


def register(bp):
    @bp.post("/cards/<uuid:card_id>/checklist")
    @jwt_required()
    def add_checklist_item(card_id):
        return ok(
            service.add_item(current_user, card_id, lambda: load_json(create_schema)), 201
        )

    @bp.patch("/checklist/<uuid:item_id>")
    @jwt_required()
    def update_checklist_item(item_id):
        return ok(service.update_item(current_user, item_id, lambda: load_json(update_schema)))

    @bp.delete("/checklist/<uuid:item_id>")
    @jwt_required()
    def delete_checklist_item(item_id):
        return ok(service.delete_item(current_user, item_id))
