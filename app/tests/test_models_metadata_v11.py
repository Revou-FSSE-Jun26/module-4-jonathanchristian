"""V11 model metadata tests: checklist_items and card_links (no database)."""
import pytest
import sqlalchemy as sa

from env_helpers import make_unit_app

pytestmark = pytest.mark.unit


@pytest.fixture(scope="module")
def tables():
    make_unit_app()
    from app.extensions import db

    return db.metadata.tables


def _checks(tables, table_name):
    return {
        c.name: c.sqltext.text
        for c in tables[table_name].constraints
        if isinstance(c, sa.CheckConstraint)
    }



def test_checklist_items_columns_and_checks(tables):
    table = tables["checklist_items"]
    assert set(table.c.keys()) >= {"checklist_item_id", "card_id", "text", "is_done", "order"}
    assert table.c["card_id"].nullable is False
    assert isinstance(table.c["text"].type, sa.String) and table.c["text"].type.length == 200
    assert table.c["text"].nullable is False
    assert isinstance(table.c["is_done"].type, sa.Boolean) and table.c["is_done"].nullable is False
    assert str(table.c["is_done"].server_default.arg) == "false"
    assert isinstance(table.c["order"].type, sa.Float) and table.c["order"].nullable is False
    checks = _checks(tables, "checklist_items")
    assert set(checks) == {"ck_checklist_items_text_len", "ck_checklist_items_order_positive"}
    assert "BETWEEN 1 AND 200" in checks["ck_checklist_items_text_len"]
    assert '"order" > 0' in checks["ck_checklist_items_order_positive"]


def test_card_links_columns_and_checks(tables):
    table = tables["card_links"]
    assert set(table.c.keys()) >= {"card_link_id", "card_id", "created_by", "url", "label"}
    for name in ("card_id", "created_by", "url", "label"):
        assert table.c[name].nullable is False, name
    assert table.c["url"].type.length == 2048
    assert table.c["label"].type.length == 100
    checks = _checks(tables, "card_links")
    assert set(checks) == {"ck_card_links_url_len", "ck_card_links_label_len"}
    assert "BETWEEN 1 AND 2048" in checks["ck_card_links_url_len"]
    assert "BETWEEN 1 AND 100" in checks["ck_card_links_label_len"]


def test_foreign_keys_have_no_on_delete_cascade(tables):
    for table in tables.values():
        for fk in table.foreign_key_constraints:
            assert fk.ondelete is None, fk.name
