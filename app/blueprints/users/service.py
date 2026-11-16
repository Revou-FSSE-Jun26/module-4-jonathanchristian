"""Business logic for the users feature, plus the JWT user lookup."""
import uuid

from sqlalchemy import select

from app.blueprints.users.schema import User, UserSchema
from app.errors import Conflict
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


def update_profile(user, data):
    """Update only the supplied fields; 409 if the email belongs to another active User."""
    if "email" in data and email_taken(data["email"], exclude_user_id=user.user_id):
        raise Conflict("Email already registered")
    for field in ("name", "email"):
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return user_schema.dump(user)
