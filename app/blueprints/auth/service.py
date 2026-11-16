"""Business logic for registration, login, and token refresh."""
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.blueprints.users import service as users_service
from app.blueprints.users.schema import User
from app.errors import Conflict, Unauthorized
from app.extensions import db

INVALID_LOGIN_MESSAGE = "Invalid email or password"
# Checked when the email is unknown so both login failures take similar time.
_DUMMY_HASH = generate_password_hash("kano-dummy-password")


def _seconds(config_key):
    return int(current_app.config[config_key].total_seconds())


def register(data):
    if users_service.email_taken(data["email"]):
        raise Conflict("Email already registered")
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)
    db.session.commit()
    return users_service.get_profile(user)


def login(data):
    user = users_service.find_active_user_by_email(data["email"])
    if user is None:
        check_password_hash(_DUMMY_HASH, data["password"])
        raise Unauthorized(INVALID_LOGIN_MESSAGE)
    if not check_password_hash(user.password_hash, data["password"]):
        raise Unauthorized(INVALID_LOGIN_MESSAGE)
    identity = str(user.user_id)
    return {
        "access_token": create_access_token(identity=identity),
        "refresh_token": create_refresh_token(identity=identity),
        "token_type": "Bearer",
        "expires_in": _seconds("JWT_ACCESS_TOKEN_EXPIRES"),
        "refresh_expires_in": _seconds("JWT_REFRESH_TOKEN_EXPIRES"),
        "user": users_service.get_profile(user),
    }


def refresh(identity):
    """Issue a new access token only. Refresh tokens are stateless: no rotation."""
    user = users_service.get_active_user(identity)
    if user is None:
        raise Unauthorized()
    return {
        "access_token": create_access_token(identity=str(user.user_id)),
        "token_type": "Bearer",
        "expires_in": _seconds("JWT_ACCESS_TOKEN_EXPIRES"),
    }
