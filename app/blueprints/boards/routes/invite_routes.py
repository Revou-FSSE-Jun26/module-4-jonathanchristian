"""Invitation link routes (thin). Regenerate and accept return 200, not 201 (Requirement 4.3)."""
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.boards import service
from app.errors import ok


def register(bp):
    @bp.get("/boards/<uuid:board_id>/invite-links")
    @jwt_required()
    def get_invite_links(board_id):
        return ok(service.get_invite_links(current_user, board_id))

    @bp.post("/boards/<uuid:board_id>/invite-links/<role>/regenerate")
    @jwt_required()
    def regenerate_invite_link(board_id, role):
        # The Board is checked first (404, 403); the role is validated by the service (400).
        return ok(
            service.regenerate_invite_link(
                current_user, board_id, lambda role_schema: role_schema.load({"role": role})
            )
        )

    @bp.get("/invites/<token>")
    @jwt_required()
    def get_invite_info(token):
        return ok(service.get_invite_info(current_user, token))

    @bp.post("/invites/<token>/accept")
    @jwt_required()
    def accept_invite(token):
        return ok(service.accept_invite(current_user, token))
