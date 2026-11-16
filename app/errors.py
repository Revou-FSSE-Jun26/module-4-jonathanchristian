"""Response envelope, ApiError family, serializers, and error handlers (G-BE-05, G-BE-07)."""
import logging
import re
import uuid
from datetime import timezone

from flask import jsonify, request
from marshmallow import ValidationError, fields
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from werkzeug.exceptions import HTTPException

from app.extensions import db, jwt

logger = logging.getLogger(__name__)

MAX_MESSAGE_LENGTH = 500
INTERNAL_ERROR_MESSAGE = "Internal server error"
_UUID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


# --- envelope helpers -------------------------------------------------------------------


def ok(data, status=200):
    """Success response: `{ "data": ... }`. The status lives only on the status line."""
    response = jsonify({"data": data})
    response.status_code = status
    return response


def fail(message, status):
    """Error response: `{ "error": "<message up to 500 chars>" }`."""
    text = str(message) or "Error"
    response = jsonify({"error": text[:MAX_MESSAGE_LENGTH]})
    response.status_code = status
    return response


# --- ApiError family ----------------------------------------------------------------------


class ApiError(Exception):
    status = 500
    default_message = INTERNAL_ERROR_MESSAGE

    def __init__(self, message=None):
        self.message = message or self.default_message
        super().__init__(self.message)


class BadRequest(ApiError):
    status = 400
    default_message = "Bad request"


class Unauthorized(ApiError):
    status = 401
    default_message = "Authentication required"


class Forbidden(ApiError):
    status = 403
    default_message = "You do not have permission to perform this action"


class NotFound(ApiError):
    status = 404
    default_message = "Resource not found"


class Conflict(ApiError):
    status = 409
    default_message = "Resource already exists"


# --- serialization helpers -----------------------------------------------------------------


class UuidField(fields.UUID):
    """UUID as a lowercase hyphenated 36-character string (G-DB-02)."""

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        return str(value).lower()

    def _deserialize(self, value, attr, data, **kwargs):
        if not isinstance(value, str) or not _UUID_PATTERN.match(value):
            raise ValidationError("Not a valid UUID.")
        return uuid.UUID(value)


class UtcDateTime(fields.Field):
    """Timestamp as an ISO 8601 UTC string ending in `Z`."""

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# --- request loading -------------------------------------------------------------------------


def load_json(schema):
    """Validate the JSON body with `schema`; a non-object body is a 400."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise BadRequest("Request body must be a JSON object")
    return schema.load(data)


def load_query(schema):
    """Validate the query string with `schema`."""
    return schema.load(request.args.to_dict(flat=True))


def _flatten_messages(messages, prefix=""):
    parts = []
    if isinstance(messages, dict):
        for key, value in messages.items():
            path = prefix if key == "_schema" else (f"{prefix}.{key}" if prefix else str(key))
            parts.extend(_flatten_messages(value, path))
    elif isinstance(messages, (list, tuple)):
        for item in messages:
            if isinstance(item, (dict, list, tuple)):
                parts.extend(_flatten_messages(item, prefix))
            else:
                parts.append(f"{prefix}: {item}" if prefix else str(item))
    else:
        parts.append(f"{prefix}: {messages}" if prefix else str(messages))
    return parts


# --- handlers -----------------------------------------------------------------------------------


def _handle_api_error(error):
    db.session.rollback()
    return fail(error.message, error.status)


def _handle_validation_error(error):
    db.session.rollback()
    message = "; ".join(_flatten_messages(error.messages)) or "Validation failed"
    return fail(message, 400)


def _handle_http_exception(error):
    status = error.code or 500
    if status == 404:
        return fail("Resource not found", 404)
    if status == 405:
        return fail("Method not allowed", 405)
    if status >= 500:
        return fail(INTERNAL_ERROR_MESSAGE, status)
    return fail(error.description or error.name, status)


def _handle_integrity_error(error):
    db.session.rollback()
    pgcode = getattr(error.orig, "pgcode", None)
    if pgcode == "23505":
        return fail("Resource already exists", 409)
    if pgcode in ("23503", "23502"):
        return fail("Request references missing data or omits a required value", 400)
    logger.exception("Unexpected integrity error")
    return fail(INTERNAL_ERROR_MESSAGE, 500)


def _handle_database_error(error):
    db.session.rollback()
    logger.exception("Database failure")
    return fail(INTERNAL_ERROR_MESSAGE, 500)


def _handle_unexpected_error(error):
    db.session.rollback()
    logger.exception("Unhandled exception")
    return fail(INTERNAL_ERROR_MESSAGE, 500)


# --- logging hygiene (G-BE-12) ------------------------------------------------------------------


class SensitiveLogFilter(logging.Filter):
    """Drops records whose message mentions a password or a Bearer token."""

    BLOCKED = ("password", "bearer")

    def filter(self, record):
        try:
            text = record.getMessage().lower()
        except Exception:  # a malformed record is dropped rather than risk a leak
            return False
        return not any(word in text for word in self.BLOCKED)


def install_log_filter(app):
    """Attach the filter to the loggers and handlers that carry application records."""
    targets = [
        app.logger,
        logging.getLogger("app"),
        logging.getLogger("app.errors"),
        logging.getLogger("werkzeug"),
    ]
    targets += list(logging.getLogger().handlers) + list(app.logger.handlers)
    for target in targets:
        if not any(isinstance(f, SensitiveLogFilter) for f in target.filters):
            target.addFilter(SensitiveLogFilter())


def register_error_handlers(app):
    """Register the envelope handlers and JWT callbacks (all JWT failures are 401)."""
    app.register_error_handler(ApiError, _handle_api_error)
    app.register_error_handler(ValidationError, _handle_validation_error)
    app.register_error_handler(HTTPException, _handle_http_exception)
    app.register_error_handler(IntegrityError, _handle_integrity_error)
    app.register_error_handler(OperationalError, _handle_database_error)
    app.register_error_handler(ProgrammingError, _handle_database_error)
    app.register_error_handler(Exception, _handle_unexpected_error)


@jwt.unauthorized_loader
def _missing_token(reason):
    return fail("Authentication required", 401)


@jwt.invalid_token_loader
def _invalid_token(reason):
    # Also fires for a token of the wrong type (refresh token on a protected endpoint).
    return fail("Invalid or wrong-type token", 401)


@jwt.expired_token_loader
def _expired_token(header, payload):
    return fail("Token has expired", 401)


@jwt.revoked_token_loader
def _revoked_token(header, payload):
    return fail("Token has been revoked", 401)


@jwt.user_lookup_error_loader
def _unknown_user(header, payload):
    return fail("Authentication required", 401)
