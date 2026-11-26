"""Model metadata and import-rule tests (no database)."""
import ast
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy.orm import configure_mappers

from env_helpers import make_unit_app

pytestmark = pytest.mark.unit

APP_DIR = Path(__file__).resolve().parents[1]
FEATURES = ("auth", "users", "boards", "columns", "cards", "comments", "notifications", "analytics")
TABLES = {
    "users": "user_id",
    "boards": "board_id",
    "board_memberships": "board_membership_id",
    "columns": "column_id",
    "cards": "card_id",
    "comments": "comment_id",
    "notifications": "notification_id",
    "checklist_items": "checklist_item_id",
    "card_links": "card_link_id",
}
SOFT_DELETE_COLUMNS = ("created_at", "updated_at", "deleted_at", "is_deleted")


@pytest.fixture(scope="module")
def app():
    return make_unit_app()


@pytest.fixture(scope="module")
def tables(app):
    from app.extensions import db

    return db.metadata.tables


def _index(table, name):
    matches = [index for index in table.indexes if index.name == name]
    assert matches, f"index {name} missing on {table.name}"
    return matches[0]


def test_exactly_nine_tables(tables):
    assert len(TABLES) == 9
    assert set(tables) == set(TABLES)


def test_primary_keys_are_named_uuid_columns(tables):
    for table_name, pk_name in TABLES.items():
        pk_columns = list(tables[table_name].primary_key.columns)
        assert [c.name for c in pk_columns] == [pk_name]
        assert isinstance(pk_columns[0].type, sa.Uuid)


@pytest.mark.parametrize("table_name", ["columns", "cards", "checklist_items"])
def test_order_columns_are_not_null_floats(tables, table_name):
    order = tables[table_name].c["order"]
    assert isinstance(order.type, sa.Float)
    assert order.nullable is False
    checks = [c.sqltext.text for c in tables[table_name].constraints if isinstance(c, sa.CheckConstraint)]
    assert any('"order" > 0' in text for text in checks)


def test_foreign_keys_follow_naming_pattern(tables):
    names = set()
    for table in tables.values():
        for fk in table.foreign_key_constraints:
            parent = fk.referred_table.name
            assert fk.name == f"fk_{table.name}_{parent}", fk.name
            names.add(fk.name)
    assert {
        "fk_boards_users",
        "fk_board_memberships_boards",
        "fk_board_memberships_users",
        "fk_columns_boards",
        "fk_cards_boards",
        "fk_cards_columns",
        "fk_cards_users",
        "fk_comments_cards",
        "fk_comments_users",
        "fk_notifications_users",
        "fk_notifications_cards",
        "fk_notifications_boards",
        "fk_checklist_items_cards",
        "fk_card_links_cards",
        "fk_card_links_users",
    } == names


def test_every_model_has_the_four_soft_delete_columns(tables):
    for table in tables.values():
        for name in SOFT_DELETE_COLUMNS:
            assert name in table.c, f"{table.name}.{name}"
        for name in ("created_at", "updated_at", "deleted_at"):
            assert table.c[name].type.timezone is True
        assert table.c["is_deleted"].nullable is False
        assert table.c["deleted_at"].nullable is True


@pytest.mark.parametrize(
    "table_name,index_name,columns",
    [
        ("users", "uq_users_email_active", ["email"]),
        (
            "board_memberships",
            "uq_board_memberships_board_user_active",
            ["board_id", "user_id"],
        ),
    ],
)
def test_partial_unique_indexes(tables, table_name, index_name, columns):
    index = _index(tables[table_name], index_name)
    assert index.unique is True
    assert [c.name for c in index.columns] == columns
    assert "is_deleted = false" in str(index.dialect_options["postgresql"]["where"])


def test_required_filter_and_order_indexes_exist(tables):
    expected = {
        "boards": {"ix_boards_created_by": ["created_by"]},
        "board_memberships": {
            "ix_board_memberships_user_id": ["user_id"],
            "ix_board_memberships_board_id": ["board_id"],
        },
        "columns": {"ix_columns_board_id_order": ["board_id", "order"]},
        "cards": {
            "ix_cards_column_id_order": ["column_id", "order"],
            "ix_cards_board_id": ["board_id"],
            "ix_cards_assignee_id": ["assignee_id"],
            "ix_cards_due_date": ["due_date"],
        },
        "checklist_items": {"ix_checklist_items_card_id_order": ["card_id", "order"]},
        "card_links": {"ix_card_links_card_id": ["card_id"]},
        "comments": {"ix_comments_card_id_created_at": ["card_id", "created_at"]},
        "notifications": {
            "ix_notifications_recipient_created": ["recipient_id", "created_at"],
            "ix_notifications_recipient_unread": ["recipient_id"],
        },
    }
    for table_name, indexes in expected.items():
        for index_name, columns in indexes.items():
            assert [c.name for c in _index(tables[table_name], index_name).columns] == columns


def _checks(tables, table_name):
    return {
        c.name: c.sqltext.text
        for c in tables[table_name].constraints
        if isinstance(c, sa.CheckConstraint)
    }


def test_check_constraints_exist(tables):
    assert "ck_users_email_lowercase" in _checks(tables, "users")
    assert "ck_board_memberships_role" in _checks(tables, "board_memberships")
    assert "ck_cards_description_len" in _checks(tables, "cards")
    assert "ck_cards_status" in _checks(tables, "cards")
    assert "ck_comments_content_len" in _checks(tables, "comments")
    assert "ck_notifications_type" in _checks(tables, "notifications")


# --- V6 columns and constraints (tasks 25.1, 25.2) -------------------------------------------------


def test_cards_status_and_completed_at_columns(tables):
    status = tables["cards"].c["status"]
    assert isinstance(status.type, sa.String) and status.type.length == 20
    assert status.nullable is False
    assert status.default.arg == "NOT_STARTED"
    assert str(status.server_default.arg) == "NOT_STARTED"
    completed_at = tables["cards"].c["completed_at"]
    assert completed_at.nullable is True
    assert completed_at.type.timezone is True


def test_card_status_check_allows_exactly_the_four_statuses(tables):
    text = _checks(tables, "cards")["ck_cards_status"]
    for value in ("NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"):
        assert f"'{value}'" in text
    assert text.count("'") == 8


@pytest.mark.parametrize("column", ["member_invite_token", "guest_invite_token"])
def test_board_invite_token_columns_are_nullable_and_unique(tables, column):
    boards = tables["boards"]
    assert isinstance(boards.c[column].type, sa.String) and boards.c[column].type.length == 128
    assert boards.c[column].nullable is True
    unique = [
        c
        for c in boards.constraints
        if isinstance(c, sa.UniqueConstraint) and [col.name for col in c.columns] == [column]
    ]
    assert [c.name for c in unique] == [f"uq_boards_{column}"]


def test_membership_role_check_allows_the_four_roles(tables):
    text = _checks(tables, "board_memberships")["ck_board_memberships_role"]
    for value in ("admin", "manager", "member", "guest"):
        assert f"'{value}'" in text
    assert text.count("'") == 8


def test_relationships_use_lazy_raise_and_mappers_configure(app):
    from app.extensions import db

    configure_mappers()
    for mapper in db.Model.registry.mappers:
        for relationship in mapper.relationships:
            assert relationship.lazy == "raise", f"{mapper.class_.__name__}.{relationship.key}"


def test_flask_migrate_is_initialised(app):
    assert "migrate" in app.extensions


def test_no_forbidden_directories_and_feature_modules_exist():
    for name in ("models", "routes", "services"):
        assert not (APP_DIR / name).exists(), f"app/{name}/ must not exist"
    for feature in FEATURES:
        package = APP_DIR / "blueprints" / feature
        for module in ("routes.py", "service.py", "schema.py"):
            assert (package / module).exists() or (package / module[:-3]).is_dir()


# --- import rules ---------------------------------------------------------------------------------


def _imports(path):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    found = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found += [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module:
            found.append(node.module)
            found += [f"{node.module}.{alias.name}" for alias in node.names]
    return found


def _feature_of(module_name):
    parts = module_name.split(".")
    if len(parts) >= 3 and parts[:2] == ["app", "blueprints"]:
        return parts[2], parts[3] if len(parts) > 3 else None
    return None, None


def test_no_routes_module_is_imported_across_features():
    for feature in FEATURES:
        for path in (APP_DIR / "blueprints" / feature).rglob("*.py"):
            for name in _imports(path):
                other, module = _feature_of(name)
                if other and other != feature:
                    assert module != "routes", f"{path} imports {name}"


def test_schema_files_import_only_schema_modules_of_other_features():
    # Cross-feature imports from a schema.py are limited to other schema.py files
    # (models, shared field helpers); never a service.py or routes.py.
    for feature in FEATURES:
        package = APP_DIR / "blueprints" / feature
        for path in [*package.glob("schema*.py"), *package.glob("schema/*.py")]:
            for name in _imports(path):
                other, module = _feature_of(name)
                if other and other != feature:
                    assert module in (None, "schema"), f"{path} imports {name}"


def test_permissions_imports_schema_files_only():
    paths = sorted((APP_DIR / "permissions").glob("*.py"))
    assert paths, "app/permissions/ package is missing"
    for path in paths:
        for name in _imports(path):
            other, module = _feature_of(name)
            if other:
                assert module in (None, "schema"), f"{path.name} imports {name}"


def test_permissions_rules_module_is_pure():
    names = _imports(APP_DIR / "permissions" / "rules.py")
    assert not [n for n in names if n.startswith(("flask", "sqlalchemy", "app."))]
