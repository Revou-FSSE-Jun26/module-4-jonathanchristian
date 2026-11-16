"""Routes for the analytics feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("analytics", __name__, url_prefix="/api")
