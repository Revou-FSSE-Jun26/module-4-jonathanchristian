"""Boards service package: keeps `service.<function>` importable (G-BE-15)."""
from app.blueprints.boards.service.board_service import (
    create_board,
    delete_board,
    get_board_detail,
    list_boards,
    update_board,
)
from app.blueprints.boards.service.member_service import (
    add_member,
    list_members,
    remove_member,
)

__all__ = [
    "add_member",
    "create_board",
    "delete_board",
    "get_board_detail",
    "list_boards",
    "list_members",
    "remove_member",
    "update_board",
]
