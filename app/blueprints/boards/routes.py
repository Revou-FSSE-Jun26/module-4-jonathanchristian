"""Routes for the boards feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("boards", __name__, url_prefix="/api")
