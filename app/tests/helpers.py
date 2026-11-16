"""Shared test helpers: envelope assertions and a SQL statement counter."""
from sqlalchemy import event


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
