"""Routes for the cards feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("cards", __name__, url_prefix="/api")
