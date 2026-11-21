"""Shared test helpers: envelope assertions, a SQL statement counter, and the source scan."""
import ast
from pathlib import Path

from sqlalchemy import event

APP_DIR = Path(__file__).resolve().parents[1]


def assert_envelope(response, status):
    """Assert the status and the single-key envelope; return the `data` or `error` value."""
    body = response.get_json()
    assert response.status_code == status, (response.status_code, body)
    assert isinstance(body, dict) and len(body) == 1, body
    if status < 400:
        assert list(body) == ["data"], body
        return body["data"]
    assert list(body) == ["error"], body
    message = body["error"]
    assert isinstance(message, str) and 0 < len(message) <= 500
    return message


class QueryCounter:
    """Counts SQL statements sent through an engine (SQLAlchemy before_cursor_execute)."""

    def __init__(self, engine):
        self.engine = engine
        self.statements = []

    def _record(self, conn, cursor, statement, parameters, context, executemany):
        self.statements.append(statement)

    def __enter__(self):
        event.listen(self.engine, "before_cursor_execute", self._record)
        return self

    def __exit__(self, *exc_info):
        event.remove(self.engine, "before_cursor_execute", self._record)

    @property
    def count(self):
        return len(self.statements)


def source_files():
    for path in APP_DIR.rglob("*.py"):
        relative = path.relative_to(APP_DIR).parts
        if relative[0] in ("venv", "migrations", "__pycache__") or ".venv" in relative:
            continue
        yield path


def is_dynamic_sql(node):
    """True for an f-string, `%` or `+` formatting, or `.format(...)` used as SQL text."""
    if isinstance(node, ast.JoinedStr):
        return True
    if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Mod, ast.Add)):
        return any(isinstance(side, (ast.Constant, ast.JoinedStr)) for side in (node.left, node.right))
    return (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "format"
        and isinstance(node.func.value, ast.Constant)
    )
