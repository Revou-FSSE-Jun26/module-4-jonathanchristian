"""Routes for the comments feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("comments", __name__, url_prefix="/api")
