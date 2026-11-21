"""Routes for the users feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.blueprints.users import service
from app.blueprints.users.schema import UserUpdateSchema
from app.errors import load_json, ok

bp = Blueprint("users", __name__, url_prefix="/api")

update_schema = UserUpdateSchema()


@bp.get("/users/me")
@jwt_required()
def get_me():
    return ok(service.get_profile(current_user))


@bp.patch("/users/me")
@jwt_required()
def update_me():
    data = load_json(update_schema)
    return ok(service.update_me(current_user, data))
