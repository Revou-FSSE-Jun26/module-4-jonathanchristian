"""pytest fixtures: guarded test database, app, per-test cleanup, and data factories (G-BE-14)."""
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

APP_DIR = Path(__file__).resolve().parents[1]
load_dotenv(APP_DIR / ".env")

EXPECTED_TABLES = {
    "users",
    "boards",
    "board_memberships",
    "columns",
    "cards",
    "comments",
    "notifications",
}
TRUNCATE_SQL = (
    "TRUNCATE users, boards, board_memberships, columns, cards, comments, notifications "
    "RESTART IDENTITY CASCADE"
)
# --- database guard -------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def test_database_url():
    """Refuse to run unless TEST_DATABASE_URL is a reachable `*_test` database with the schema."""
    test_url = os.environ.get("TEST_DATABASE_URL", "").strip()
    dev_url = os.environ.get("DATABASE_URL", "").strip()
    if not test_url:
        pytest.exit("TEST_DATABASE_URL is not set; refusing to run tests", returncode=2)
    name = make_url(test_url).database or ""
    if dev_url and (test_url == dev_url or make_url(test_url) == make_url(dev_url)):
        pytest.exit(
            f"TEST_DATABASE_URL must differ from DATABASE_URL (test database {name})",
            returncode=2,
        )
    if not name.endswith("_test"):
        pytest.exit(f"Test database name '{name}' must end with _test", returncode=2)
    engine = create_engine(test_url)
    try:
        existing = set(inspect(engine).get_table_names())
        if not EXPECTED_TABLES <= existing:
            raise RuntimeError("schema missing")
    except Exception:
        pytest.exit(f"Test database {name} unavailable or schema not applied", returncode=2)
    finally:
        engine.dispose()
    return test_url


@pytest.fixture(scope="session")
def app(test_database_url):
    from app import create_app
    from app.extensions import db

    flask_app = create_app({"DATABASE_URL": test_database_url, "TESTING": True})
    with flask_app.app_context():
        db.session.execute(text(TRUNCATE_SQL))
        db.session.commit()
    return flask_app


@pytest.fixture
def reset_database(app):
    """Callable that truncates every table (for use inside Hypothesis test bodies)."""
    from app.extensions import db

    def reset():
        with app.app_context():
            db.session.execute(text(TRUNCATE_SQL))
            db.session.commit()

    return reset


@pytest.fixture(autouse=True)
def _truncate_after_test(request):
    """Empty the 7 tables after every database test so tests are order independent."""
    if request.node.get_closest_marker("unit"):
        yield
        return
    reset = request.getfixturevalue("reset_database")
    yield
    reset()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def query_counter(app):
    """Factory: `with query_counter() as counter: ...` counts SQL statements."""
    from app.extensions import db
    from helpers import QueryCounter

    def build():
        with app.app_context():
            engine = db.engine
        return QueryCounter(engine)

    return build




pytest_plugins = ["data_fixtures"]
