"""WSGI entry point: `flask run` from app/, gunicorn "app.wsgi:app", and Vercel."""
import os
import sys

# app/ is the package `app`; put the repository root on sys.path so `import app` works
# whether this file is loaded as `wsgi` (flask CLI inside app/) or as `app.wsgi`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402

app = create_app()
