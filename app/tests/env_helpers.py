"""Helpers for tests that need an app object but no database connection."""
import pytest

DEFAULT_ORIGINS = "http://localhost:3000,https://kano.example.com"

BASE_ENV = {
    "DATABASE_URL": "postgresql+psycopg2://unit:unit@localhost:5432/unit_unused",
    "JWT_SECRET_KEY": "unit-test-secret-key-that-is-long-enough-for-hs256",
    "JWT_ACCESS_TOKEN_EXPIRES": "3600",
    "JWT_REFRESH_TOKEN_EXPIRES": "604800",
    "CORS_ORIGINS": DEFAULT_ORIGINS,
}


def make_unit_app(origins=DEFAULT_ORIGINS):
    """Create an app from a throwaway environment. The engine is lazy, so no DB is used."""
    from app import create_app

    patch = pytest.MonkeyPatch()
    try:
        for name, value in BASE_ENV.items():
            patch.setenv(name, value)
        patch.setenv("CORS_ORIGINS", origins)
        # keep a developer's app/.env from filling in values
        patch.setattr("app.config.load_dotenv", lambda *args, **kwargs: False)
        return create_app()
    finally:
        patch.undo()
