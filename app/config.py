"""Application configuration read from the environment (G-BE-11)."""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

REQUIRED_VARIABLES = (
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "JWT_ACCESS_TOKEN_EXPIRES",
    "JWT_REFRESH_TOKEN_EXPIRES",
    "CORS_ORIGINS",
)
POSITIVE_INTEGER_VARIABLES = ("JWT_ACCESS_TOKEN_EXPIRES", "JWT_REFRESH_TOKEN_EXPIRES")


class ConfigError(Exception):
    """Raised at startup when the environment is incomplete or invalid."""


def _positive_int(name, raw):
    try:
        value = int(raw.strip())
    except ValueError:
        raise ConfigError(f"Environment variable {name} must be a positive integer") from None
    if value <= 0:
        raise ConfigError(f"Environment variable {name} must be a positive integer")
    return value


@dataclass(frozen=True)
class Config:
    database_url: str
    jwt_secret_key: str
    jwt_access_token_expires: int
    jwt_refresh_token_expires: int
    cors_origins: tuple

    @classmethod
    def from_env(cls):
        """Build the configuration, naming every missing variable (never its value)."""
        load_dotenv()
        values = {name: (os.environ.get(name) or "").strip() for name in REQUIRED_VARIABLES}
        missing = [name for name, value in values.items() if not value]
        if missing:
            raise ConfigError(
                "Missing required environment variable: " + ", ".join(missing)
            )
        origins = tuple(
            origin.strip().rstrip("/")
            for origin in values["CORS_ORIGINS"].split(",")
            if origin.strip()
        )
        if not origins:
            raise ConfigError("Missing required environment variable: CORS_ORIGINS")
        return cls(
            database_url=values["DATABASE_URL"],
            jwt_secret_key=values["JWT_SECRET_KEY"],
            jwt_access_token_expires=_positive_int(
                "JWT_ACCESS_TOKEN_EXPIRES", values["JWT_ACCESS_TOKEN_EXPIRES"]
            ),
            jwt_refresh_token_expires=_positive_int(
                "JWT_REFRESH_TOKEN_EXPIRES", values["JWT_REFRESH_TOKEN_EXPIRES"]
            ),
            cors_origins=origins,
        )
