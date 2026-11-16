"""Routes for the notifications feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("notifications", __name__, url_prefix="/api")
