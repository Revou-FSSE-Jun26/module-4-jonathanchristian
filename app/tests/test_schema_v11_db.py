"""Database-level V11 tests: indexes, named foreign keys, and the new tables' constraints (task 46.17)."""
import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

pytestmark = pytest.mark.e2e

REVIEW_HINT = (
    "Review the hand-edited check constraints and the generated objects of the V11 migration "
    "(task 45.1) in app/migrations/versions/ and run `flask db upgrade` on the test database."
)
CHECK_VIOLATION = "23514"


def rows(app, sql, **params):
    from app.extensions import db

    with app.app_context():
        return db.session.execute(text(sql), params).all()


def execute(app, sql, **params):
    from app.extensions import db

    with app.app_context():
        try:
            db.session.execute(text(sql), params)
            db.session.commit()
            return None
        except DBAPIError as error:
            db.session.rollback()
            return error.orig.pgcode


def test_the_required_indexes_exist(app):
    found = {name for (name,) in rows(app, "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'")}
    for name in (
        "ix_cards_due_date", "ix_checklist_items_card_id_order", "ix_card_links_card_id",
        "ix_cards_column_id_order", "uq_board_memberships_board_user_active",
    ):
        assert name in found, f"index {name} is missing. {REVIEW_HINT}"


def test_the_named_foreign_keys_exist_without_on_delete_cascade(app):
    result = rows(
        app,
        "SELECT conname, confdeltype FROM pg_constraint WHERE contype = 'f' AND conname IN "
        "('fk_checklist_items_cards', 'fk_card_links_cards', 'fk_card_links_users')",
    )
    assert {name for name, _ in result} == {"fk_checklist_items_cards", "fk_card_links_cards", "fk_card_links_users"}, REVIEW_HINT
    assert all(kind == "a" for _, kind in result)  # 'a' = NO ACTION, never CASCADE


def test_the_new_check_constraints_exist(app):
    found = {
        name for (name,) in rows(app, "SELECT conname FROM pg_constraint WHERE contype = 'c'")
    }
    for name in (
        "ck_checklist_items_text_len", "ck_checklist_items_order_positive",
        "ck_card_links_url_len", "ck_card_links_label_len", "ck_cards_status", "ck_board_memberships_role",
    ):
        assert name in found, f"{name} is missing. {REVIEW_HINT}"


def test_both_new_tables_have_the_four_soft_delete_columns(app):
    for table in ("checklist_items", "card_links"):
        columns = {name for (name,) in rows(
            app, "SELECT column_name FROM information_schema.columns WHERE table_name = :t", t=table
        )}
        assert {"created_at", "updated_at", "deleted_at", "is_deleted"} <= columns


@pytest.fixture
def card(make_board, make_column, make_card):
    board = make_board()
    return board, make_card(make_column(board))


def insert_item(app, card_row, text_value, order=1.0):
    return execute(
        app,
        'INSERT INTO checklist_items (checklist_item_id, card_id, text, is_done, "order", created_at, updated_at) '
        "VALUES (:id, :card, :text, false, :order, now(), now())",
        id=uuid.uuid4(), card=card_row.card_id, text=text_value, order=order,
    )


@pytest.mark.parametrize("value,expected", [("a", None), ("a" * 200, None), ("", CHECK_VIOLATION), ("a" * 201, "22001")])
def test_checklist_text_length_is_checked(app, card, value, expected):
    assert insert_item(app, card[1], value) == expected


@pytest.mark.parametrize("order,expected", [(0.5, None), (0.0, CHECK_VIOLATION), (-1.0, CHECK_VIOLATION)])
def test_checklist_order_must_be_positive(app, card, order, expected):
    assert insert_item(app, card[1], "x", order) == expected


def insert_link(app, board, card_row, url, label):
    return execute(
        app,
        "INSERT INTO card_links (card_link_id, card_id, created_by, url, label, created_at, updated_at) "
        "VALUES (:id, :card, :user, :url, :label, now(), now())",
        id=uuid.uuid4(), card=card_row.card_id, user=board.owner.user_id, url=url, label=label,
    )


@pytest.mark.parametrize("url,label,expected", [
    ("https://a.com", "a", None), ("", "a", CHECK_VIOLATION), ("https://a.com", "", CHECK_VIOLATION),
    ("https://a.com", "x" * 101, "22001"), ("h" * 2049, "a", "22001"),
])
def test_link_length_checks(app, card, url, label, expected):
    assert insert_link(app, card[0], card[1], url, label) == expected


def test_a_link_with_an_unknown_card_or_user_is_rejected_by_the_foreign_keys(app, card):
    board, card_row = card
    code = execute(
        app,
        "INSERT INTO card_links (card_link_id, card_id, created_by, url, label, created_at, updated_at) "
        "VALUES (:id, :card, :user, 'https://a.com', 'a', now(), now())",
        id=uuid.uuid4(), card=uuid.uuid4(), user=board.owner.user_id,
    )
    assert code == "23503"
