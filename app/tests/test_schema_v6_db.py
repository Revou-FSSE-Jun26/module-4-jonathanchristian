"""Database-level schema tests against the migrated test database (V6 columns; V11 values and tables)."""
import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

pytestmark = pytest.mark.e2e

REVIEW_HINT = (
    "Review the hand-edited check constraints (ck_cards_status, ck_board_memberships_role) "
    "in app/migrations/versions/ (task 45.1) and run `flask db upgrade` on the test database."
)
CHECK_VIOLATION, UNIQUE_VIOLATION = "23514", "23505"


def execute(app, sql, **params):
    """Run one statement in its own transaction; return the pgcode of an IntegrityError or None."""
    from app.extensions import db

    with app.app_context():
        try:
            db.session.execute(text(sql), params)
            db.session.commit()
            return None
        except IntegrityError as error:
            db.session.rollback()
            return error.orig.pgcode


def scalar(app, sql, **params):
    from app.extensions import db

    with app.app_context():
        return db.session.execute(text(sql), params).scalar_one()


INSERT_CARD = (
    'INSERT INTO cards (card_id, board_id, column_id, title, "order", created_at, updated_at, {extra}) '
    "VALUES (:id, :board, :column, 'T', 1.0, now(), now(), {values})"
)


def insert_card(app, board, column, **extra):
    columns = ", ".join(extra) or "title"
    values = ", ".join(f":{key}" for key in extra) or "'T'"
    sql = INSERT_CARD.format(extra=columns, values=values)
    return execute(app, sql, id=uuid.uuid4(), board=board.board_id, column=column.column_id, **extra)


@pytest.fixture
def parents(make_board, make_column):
    board = make_board()
    return board, make_column(board)


@pytest.mark.parametrize("status", ["DONE", "IN_PROGRESS", "NOT_STARTED", "URGENT"])
def test_card_status_check_accepts_the_four_statuses(app, parents, status):
    board, column = parents
    assert insert_card(app, board, column, status=status) is None, REVIEW_HINT


@pytest.mark.parametrize("status", ["done", "urgent", "Urgent", "UNKNOWN", "", "Done "])
def test_card_status_check_rejects_anything_else(app, parents, status):
    board, column = parents
    assert insert_card(app, board, column, status=status) == CHECK_VIOLATION, REVIEW_HINT


def test_card_without_status_gets_not_started_and_null_completed_at(app, parents):
    board, column = parents
    card_id = uuid.uuid4()
    assert execute(
        app,
        'INSERT INTO cards (card_id, board_id, column_id, title, "order", created_at, updated_at) '
        "VALUES (:id, :board, :column, 'T', 1.0, now(), now())",
        id=card_id, board=board.board_id, column=column.column_id,
    ) is None
    assert scalar(app, "SELECT status FROM cards WHERE card_id = :id", id=card_id) == "NOT_STARTED"
    assert scalar(app, "SELECT completed_at FROM cards WHERE card_id = :id", id=card_id) is None


def test_completed_at_is_a_timestamp_with_time_zone(app):
    kind = scalar(
        app,
        "SELECT data_type FROM information_schema.columns "
        "WHERE table_name = 'cards' AND column_name = 'completed_at'",
    )
    assert kind == "timestamp with time zone"


def insert_membership(app, board, user, role):
    return execute(
        app,
        "INSERT INTO board_memberships (board_membership_id, board_id, user_id, role, created_at, updated_at) "
        "VALUES (:id, :board, :user, :role, now(), now())",
        id=uuid.uuid4(), board=board.board_id, user=user.user_id, role=role,
    )


@pytest.mark.parametrize("role", ["admin", "manager", "member", "guest"])
def test_membership_role_check_accepts_the_four_roles(app, make_board, make_user, role):
    assert insert_membership(app, make_board(), make_user(), role) is None, REVIEW_HINT


@pytest.mark.parametrize("role", ["owner", "Guest", "Manager", "viewer", ""])
def test_membership_role_check_rejects_another_value(app, make_board, make_user, role):
    assert insert_membership(app, make_board(), make_user(), role) == CHECK_VIOLATION, REVIEW_HINT


def test_one_active_membership_per_board_and_user_for_every_role(app, make_board, make_user):
    board, user = make_board(), make_user()
    assert insert_membership(app, board, user, "guest") is None
    assert insert_membership(app, board, user, "member") == UNIQUE_VIOLATION


@pytest.mark.parametrize("column", ["member_invite_token", "guest_invite_token"])
def test_token_unique_constraints_allow_many_nulls_and_reject_a_duplicate(app, make_user, column):
    admin = make_user()

    def insert_board(token):
        return execute(
            app,
            f"INSERT INTO boards (board_id, name, created_by, {column}, created_at, updated_at) "
            "VALUES (:id, 'B', :owner, :token, now(), now())",
            id=uuid.uuid4(), owner=admin.user_id, token=token,
        )

    assert insert_board(None) is None and insert_board(None) is None and insert_board(None) is None
    shared = "T" * 43
    assert insert_board(shared) is None
    assert insert_board(shared) == UNIQUE_VIOLATION


def test_a_member_token_may_not_repeat_but_the_two_columns_are_independent(app, make_user):
    admin = make_user()
    sql = (
        "INSERT INTO boards (board_id, name, created_by, member_invite_token, guest_invite_token, "
        "created_at, updated_at) VALUES (:id, 'B', :owner, :m, :g, now(), now())"
    )
    kwargs = {"owner": admin.user_id, "m": "m" * 43, "g": "g" * 43}
    assert execute(app, sql, id=uuid.uuid4(), **kwargs) is None
    assert execute(app, sql, id=uuid.uuid4(), **kwargs) == UNIQUE_VIOLATION


def test_the_schema_has_exactly_the_nine_application_tables(app):
    from app.extensions import db

    with app.app_context():
        rows = db.session.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        ).scalars().all()
    tables = set(rows) - {"alembic_version"}
    assert tables == {
        "users", "boards", "board_memberships", "columns", "cards", "comments", "notifications",
        "checklist_items", "card_links",
    }, f"Unexpected tables {sorted(tables)}. {REVIEW_HINT}"


def test_the_v6_columns_exist_with_the_documented_nullability(app):
    from app.extensions import db

    with app.app_context():
        rows = db.session.execute(
            text(
                "SELECT table_name, column_name, is_nullable FROM information_schema.columns "
                "WHERE (table_name, column_name) IN (('boards','member_invite_token'),"
                "('boards','guest_invite_token'),('cards','status'),('cards','completed_at'))"
            )
        ).all()
    assert {(t, c): n for t, c, n in rows} == {
        ("boards", "member_invite_token"): "YES",
        ("boards", "guest_invite_token"): "YES",
        ("cards", "status"): "NO",
        ("cards", "completed_at"): "YES",
    }
