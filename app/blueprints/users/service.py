"""Business logic for the users feature, plus the JWT user lookup."""
import uuid

from sqlalchemy import select
from werkzeug.security import check_password_hash, generate_password_hash

from app.blueprints.users.schema import User, UserSchema
from app.errors import BadRequest
from app.extensions import db, jwt
from app.soft_delete import active

user_schema = UserSchema()


@jwt.user_lookup_loader
def load_user_from_token(_header, payload):
    """Load the non-deleted User of the token subject once per request.

    Flask-JWT-Extended caches the result on `flask.g`. Returning None (unknown, malformed,
    or soft-deleted subject) makes the lookup-error callback answer 401.
    """
    return get_active_user(payload.get("sub"))


def get_active_user(user_id):
    """Return the non-deleted User for an id (UUID or string), or None."""
    try:
        user_id = uuid.UUID(str(user_id))
    except ValueError:
        return None
    return db.session.execute(
        select(User).where(User.user_id == user_id, active(User))
    ).scalar_one_or_none()


def get_profile(user):
    return user_schema.dump(user)


def find_active_user_by_email(email):
    """Return the non-deleted User with the (already lowercased) email, or None."""
    return db.session.execute(
        select(User).where(User.email == email, active(User))
    ).scalar_one_or_none()


def email_taken(email, exclude_user_id=None):
    query = select(User.user_id).where(User.email == email, active(User))
    if exclude_user_id is not None:
        query = query.where(User.user_id != exclude_user_id)
    return db.session.execute(query).first() is not None


def hash_password(password):
    """Salted adaptive hash, shared by registration and the password change."""
    return generate_password_hash(password)


def update_me(user, data):
    """Change `name` and/or `password`. The current password is verified before any write.

    A wrong `current_password` is 400 (never 403) and nothing is saved, not even a name sent
    in the same request. No token is invalidated: tokens are stateless (Requirement 6.15).
    """
    if "password" in data and not check_password_hash(user.password_hash, data["current_password"]):
        raise BadRequest("current_password: does not match")
    if "name" in data:
        user.name = data["name"]
    if "password" in data:
        user.password_hash = hash_password(data["password"])
    db.session.commit()
    return user_schema.dump(user)
