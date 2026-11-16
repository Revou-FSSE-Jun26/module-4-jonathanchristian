"""Routes for the auth feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("auth", __name__, url_prefix="/api")
