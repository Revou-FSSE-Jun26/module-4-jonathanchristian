"""Routes for the users feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("users", __name__, url_prefix="/api")
