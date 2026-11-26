"""Kano API application factory."""
import os
from datetime import timedelta

from flask import Flask
from flask_cors import CORS
from sqlalchemy.pool import NullPool

from app.config import Config
from app.errors import install_log_filter, register_error_handlers
from app.extensions import db, jwt, migrate

_TOKEN_LIFETIME_KEYS = ("JWT_ACCESS_TOKEN_EXPIRES", "JWT_REFRESH_TOKEN_EXPIRES")


def _engine_options():
    # hide_parameters keeps bound values (password hashes, emails) out of logged DB errors.
    if os.environ.get("VERCEL"):
        return {"poolclass": NullPool, "hide_parameters": True}
    return {"pool_size": 5, "pool_pre_ping": True, "hide_parameters": True}


def create_app(config_overrides=None):
    """Build the Flask app. Tests pass overrides (for example a test database URL)."""
    cfg = Config.from_env()
    app = Flask(__name__)
    app.config.update(
        SQLALCHEMY_DATABASE_URI=cfg.database_url,
        SQLALCHEMY_ENGINE_OPTIONS=_engine_options(),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=cfg.jwt_secret_key,
        JWT_ACCESS_TOKEN_EXPIRES=cfg.jwt_access_token_expires,
        JWT_REFRESH_TOKEN_EXPIRES=cfg.jwt_refresh_token_expires,
        CORS_ORIGINS=list(cfg.cors_origins),
    )
    overrides = dict(config_overrides or {})
    if "DATABASE_URL" in overrides:
        overrides["SQLALCHEMY_DATABASE_URI"] = overrides.pop("DATABASE_URL")
    app.config.update(overrides)
    for key in _TOKEN_LIFETIME_KEYS:
        value = app.config[key]
        if not isinstance(value, timedelta):
            app.config[key] = timedelta(seconds=value)

    db.init_app(app)
    jwt.init_app(app)

    # Import every model-defining schema.py before migrate.init_app so that
    # `flask db migrate` detects all 9 tables (G-DB-12). Migrations are user-owned.
    from app.blueprints.boards import schema as boards_schema  # noqa: F401
    from app.blueprints.cards import schema as cards_schema  # noqa: F401
    from app.blueprints.columns import schema as columns_schema  # noqa: F401
    from app.blueprints.comments import schema as comments_schema  # noqa: F401
    from app.blueprints.notifications import schema as notifications_schema  # noqa: F401
    from app.blueprints.users import schema as users_schema  # noqa: F401

    migrate.init_app(app, db)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": list(cfg.cors_origins),
                "allow_headers": ["Authorization", "Content-Type"],
            }
        },
        supports_credentials=False,
    )
    install_log_filter(app)
    register_error_handlers(app)

    from app import health
    from app.blueprints.analytics import routes as analytics_routes
    from app.blueprints.auth import routes as auth_routes
    from app.blueprints.boards import routes as boards_routes
    from app.blueprints.cards import routes as cards_routes
    from app.blueprints.columns import routes as columns_routes
    from app.blueprints.comments import routes as comments_routes
    from app.blueprints.notifications import routes as notifications_routes
    from app.blueprints.users import routes as users_routes

    app.register_blueprint(health.bp)
    for module in (
        auth_routes,
        users_routes,
        boards_routes,
        columns_routes,
        cards_routes,
        comments_routes,
        notifications_routes,
        analytics_routes,
    ):
        app.register_blueprint(module.bp)
    return app
