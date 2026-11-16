"""Routes for the columns feature (thin: parse, call the service, return ok(...))."""
from flask import Blueprint

bp = Blueprint("columns", __name__, url_prefix="/api")
