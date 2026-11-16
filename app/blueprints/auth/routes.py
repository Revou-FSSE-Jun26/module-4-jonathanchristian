"""Routes for the auth feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.blueprints.auth import service
from app.blueprints.auth.schema import LoginSchema, RegisterSchema
from app.errors import load_json, ok

bp = Blueprint("auth", __name__, url_prefix="/api")

register_schema = RegisterSchema()
login_schema = LoginSchema()


@bp.post("/auth/register")
def register():
    return ok(service.register(load_json(register_schema)), 201)


@bp.post("/auth/login")
def login():
    return ok(service.login(load_json(login_schema)))


@bp.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    return ok(service.refresh(get_jwt_identity()))
