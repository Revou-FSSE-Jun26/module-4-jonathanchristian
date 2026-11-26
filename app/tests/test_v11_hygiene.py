"""Static scan and log capture over the V11 code: checklist, links, overdue, and role change (task 46.18)."""
import ast
import logging

import pytest

from helpers import APP_DIR, assert_envelope, is_dynamic_sql, source_files

V11_MODULES = (
    "blueprints/cards/service/checklist_service.py",
    "blueprints/cards/service/link_service.py",
    "blueprints/cards/service/counts.py",
    "blueprints/cards/routes/checklist_routes.py",
    "blueprints/cards/routes/link_routes.py",
    "blueprints/notifications/service/overdue_service.py",
    "blueprints/notifications/routes/overdue_routes.py",
    "blueprints/boards/service/role_service.py",
    "permissions/helpers.py",
    "permissions/rules.py",
)


@pytest.mark.unit
def test_every_v11_module_is_covered_by_the_static_scan_and_builds_no_sql_by_formatting():
    scanned = {path.relative_to(APP_DIR).as_posix() for path in source_files()}
    for module in V11_MODULES:
        assert module in scanned, module
        tree = ast.parse((APP_DIR / module).read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and node.args:
                func = node.func
                name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
                if name in ("text", "execute", "exec_driver_sql"):
                    assert not is_dynamic_sql(node.args[0]), f"{module}:{node.lineno}"


@pytest.mark.unit
def test_no_v11_module_logs_or_prints():
    for module in V11_MODULES:
        source = (APP_DIR / module).read_text(encoding="utf-8")
        assert "print(" not in source and "logger." not in source and "logging." not in source, module


@pytest.mark.e2e
def test_v11_requests_never_log_passwords_tokens_or_stored_urls(
    client, make_board, make_manager, make_member, make_column, make_card, auth_header, caplog
):
    board = make_board()
    manager = make_manager(board).member
    member = make_member(board).member
    card = make_card(make_column(board), assignee=manager, due_date=None)
    headers = auth_header(board.owner)
    token = headers["Authorization"].split()[1]
    secret_url = "https://secret-host.example.com/private/path?key=abc123"
    with caplog.at_level(logging.DEBUG):
        item = assert_envelope(client.post(f"/api/cards/{card.card_id}/checklist", json={"text": "step"}, headers=headers), 201)
        link = assert_envelope(client.post(f"/api/cards/{card.card_id}/links", json={"url": secret_url}, headers=headers), 201)
        assert_envelope(client.post(f"/api/cards/{card.card_id}/links", json={"url": "javascript:alert(1)"}, headers=headers), 400)
        assert_envelope(client.patch(f"/api/checklist/{item['checklist_item_id']}", json={"is_done": True}, headers=headers), 200)
        assert_envelope(client.delete(f"/api/links/{link['card_link_id']}", headers=headers), 200)
        assert_envelope(client.get(f"/api/cards/{card.card_id}", headers=headers), 200)
        assert_envelope(client.get("/api/notifications/overdue", headers=headers), 200)
        assert_envelope(
            client.patch(f"/api/boards/{board.board_id}/members/{member.user_id}", json={"role": "manager"}, headers=headers), 200
        )
        assert_envelope(client.get("/api/notifications/overdue", headers={"Authorization": "Bearer bad-token"}), 401)
    text = caplog.text
    for forbidden in (token, "bad-token", "Bearer", secret_url, "secret-host"):
        assert forbidden not in text
