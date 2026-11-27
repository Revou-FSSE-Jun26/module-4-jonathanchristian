"""Vercel entrypoint for the Flask API.

It lives at the repository root so Vercel deploys the package `app` as the folder `app/`
and `from app import create_app` keeps working. Local runs still use `app/wsgi.py`."""
from app.wsgi import app  # noqa: F401
