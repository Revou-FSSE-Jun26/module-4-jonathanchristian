"""Unit tests for app.config (no database)."""
import os
import re
from pathlib import Path
from unittest import mock

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.config import REQUIRED_VARIABLES, Config, ConfigError

pytestmark = pytest.mark.unit

ENV_EXAMPLE = Path(__file__).resolve().parents[1] / ".env.example"


def _load(env):
    """Run Config.from_env() against exactly `env`, ignoring any real .env file."""
    with mock.patch("app.config.load_dotenv", lambda *a, **k: False):
        with mock.patch.dict(os.environ, env, clear=True):
            return Config.from_env()


def _valid_env():
    return {
        "DATABASE_URL": "postgresql+psycopg2://a:b@localhost/db",
        "JWT_SECRET_KEY": "secret-value",
        "JWT_ACCESS_TOKEN_EXPIRES": "3600",
        "JWT_REFRESH_TOKEN_EXPIRES": "604800",
        "CORS_ORIGINS": "http://localhost:3000, https://kano.example.com/",
    }


@st.composite
def _env_with_missing(draw):
    missing = draw(
        st.lists(st.sampled_from(REQUIRED_VARIABLES), min_size=1, unique=True)
    )
    env = {}
    for name in REQUIRED_VARIABLES:
        if name in missing:
            if draw(st.booleans()):  # missing entirely, or present but empty
                env[name] = draw(st.sampled_from(["", "   "]))
        elif name.endswith("_EXPIRES"):
            env[name] = str(draw(st.integers(min_value=1, max_value=10**6)))
        else:
            env[name] = "val_" + draw(st.text("abcdef0123456789", min_size=12, max_size=24))
    return missing, env


# Feature: kano, Property 5: Configuration fails fast
@settings(max_examples=100, deadline=None)
@given(_env_with_missing())
def test_missing_variables_are_named_and_no_value_is_leaked(case):
    missing, env = case
    with pytest.raises(ConfigError) as caught:
        _load(env)
    message = str(caught.value)
    for name in missing:
        assert name in message
    for name, value in env.items():
        if name not in missing:
            assert value not in message


def test_valid_environment_loads():
    cfg = _load(_valid_env())
    assert cfg.jwt_access_token_expires == 3600
    assert cfg.jwt_refresh_token_expires == 604800
    assert cfg.cors_origins == ("http://localhost:3000", "https://kano.example.com")


def test_single_missing_variable_message_format():
    env = _valid_env()
    del env["JWT_SECRET_KEY"]
    with pytest.raises(ConfigError) as caught:
        _load(env)
    assert str(caught.value) == "Missing required environment variable: JWT_SECRET_KEY"


@pytest.mark.parametrize("name", ["JWT_ACCESS_TOKEN_EXPIRES", "JWT_REFRESH_TOKEN_EXPIRES"])
@pytest.mark.parametrize("bad", ["0", "-5", "abc", "1.5"])
def test_non_positive_or_non_integer_expiry_is_rejected(name, bad):
    env = _valid_env()
    env[name] = bad
    with pytest.raises(ConfigError) as caught:
        _load(env)
    assert name in str(caught.value)
    assert bad not in str(caught.value).replace(name, "")


def test_env_example_lists_every_variable_the_config_reads():
    text = ENV_EXAMPLE.read_text(encoding="utf-8")
    listed = set(re.findall(r"^([A-Z][A-Z0-9_]*)=", text, flags=re.MULTILINE))
    for name in (*REQUIRED_VARIABLES, "TEST_DATABASE_URL"):
        assert name in listed
    assert "JWT_ACCESS_TOKEN_EXPIRES=3600" in text
    assert "JWT_REFRESH_TOKEN_EXPIRES=604800" in text
