"""Endpoint table (design A11, board-scoped rows plus the V6 invitation rows) and the `world` fixture shared by the
cross-cutting tests (loaded as a pytest plugin by conftest)."""
from dataclasses import dataclass
from types import SimpleNamespace
from typing import Callable, Optional

import pytest
from sqlalchemy import select

# Distinctive text so a leak of resource data into an error body is detectable.
SECRETS = {
    "board": "SecretBoardName",
    "column": "SecretColumnName",
    "card": "SecretCardTitle",
    "comment": "SecretCommentText",
    "member": "SecretMemberName",
    "admin": "SecretAdminName",
}
READERS = frozenset({"guest", "member", "manager", "admin"})  # any role
WRITERS = frozenset({"member", "manager", "admin"})  # a guest gets 403
MANAGERS = frozenset({"manager", "admin"})  # V11: Columns, members, invite links
ADMIN_ONLY = frozenset({"admin"})
OWNER_ONLY = frozenset({"member"})  # the world's comment is written by `member`


@dataclass(frozen=True)
class Endpoint:
    """One Board-scoped endpoint: how to call it and which actors succeed."""

    name: str
    method: str
    path: Callable
    body: Optional[Callable]
    allowed: frozenset
    success: int
    bad_body: Optional[dict] = None  # an invalid body for this endpoint (400), if it has one
    has_id: bool = True  # False when the path has no resource id to break
    validates_first: bool = False  # the body is validated before any permission check (role change)

    @property
    def id(self):
        return self.name


def _b(w):
    return f"/api/boards/{w.board.board_id}"


ENDPOINTS = [
    Endpoint("get_board", "GET", lambda w: _b(w), None, READERS, 200),
    Endpoint("patch_board", "PATCH", lambda w: _b(w), lambda w: {"name": "Renamed"}, ADMIN_ONLY, 200, {"name": ""}),
    Endpoint("delete_board", "DELETE", lambda w: _b(w), None, ADMIN_ONLY, 200),
    Endpoint("add_member", "POST", lambda w: _b(w) + "/members", lambda w: {"email": w.newbie.email}, MANAGERS, 201, {"email": "x"}),
    Endpoint("list_members", "GET", lambda w: _b(w) + "/members", None, READERS, 200),
    Endpoint("remove_member", "DELETE", lambda w: _b(w) + f"/members/{w.extra.user_id}", None, MANAGERS, 200),
    Endpoint(
        "change_role", "PATCH", lambda w: _b(w) + f"/members/{w.extra.user_id}", lambda w: {"role": "guest"},
        MANAGERS, 200, {"role": 5}, validates_first=True,
    ),
    Endpoint("create_column", "POST", lambda w: _b(w) + "/columns", lambda w: {"name": "New"}, MANAGERS, 201, {"name": ""}),
    Endpoint("rename_column", "PATCH", lambda w: f"/api/columns/{w.column.column_id}", lambda w: {"name": "Renamed"}, MANAGERS, 200, {"name": ""}),
    Endpoint("delete_column", "DELETE", lambda w: f"/api/columns/{w.column.column_id}", None, MANAGERS, 200),
    Endpoint(
        "reorder_column", "PATCH", lambda w: _b(w) + "/columns/reorder",
        lambda w: {"column_id": str(w.column.column_id), "order": 5.0}, MANAGERS, 200, {"order": 0},
    ),
    Endpoint("create_card", "POST", lambda w: f"/api/columns/{w.column.column_id}/cards", lambda w: {"title": "New"}, WRITERS, 201, {"title": ""}),
    Endpoint("update_card", "PATCH", lambda w: f"/api/cards/{w.card.card_id}", lambda w: {"title": "Renamed"}, WRITERS, 200, {"title": ""}),
    Endpoint("delete_card", "DELETE", lambda w: f"/api/cards/{w.card.card_id}", None, WRITERS, 200),
    Endpoint(
        "move_card", "PATCH", lambda w: f"/api/cards/{w.card.card_id}/position",
        lambda w: {"column_id": str(w.column2.column_id), "order": 2.0}, WRITERS, 200, {"order": -1},
    ),
    Endpoint("search_cards", "GET", lambda w: f"/api/cards?q=Card&board_id={w.board.board_id}", None, READERS, 200, has_id=False),
    Endpoint("create_comment", "POST", lambda w: f"/api/cards/{w.card.card_id}/comments", lambda w: {"content": "Hello"}, WRITERS, 201, {"content": ""}),
    Endpoint("list_comments", "GET", lambda w: f"/api/cards/{w.card.card_id}/comments", None, READERS, 200),
    Endpoint("update_comment", "PATCH", lambda w: f"/api/comments/{w.comment.comment_id}", lambda w: {"content": "Edited"}, OWNER_ONLY, 200, {"content": ""}),
    Endpoint("delete_comment", "DELETE", lambda w: f"/api/comments/{w.comment.comment_id}", None, OWNER_ONLY, 200),
    Endpoint("get_analytics", "GET", lambda w: _b(w) + "/analytics", None, ADMIN_ONLY, 200),
    Endpoint("get_invite_links", "GET", lambda w: _b(w) + "/invite-links", None, MANAGERS, 200),
    Endpoint(
        "regenerate_invite_link", "POST", lambda w: _b(w) + "/invite-links/member/regenerate",
        None, MANAGERS, 200,
    ),
    # V11 rows 34 to 40
    Endpoint("get_card", "GET", lambda w: f"/api/cards/{w.card.card_id}", None, READERS, 200),
    Endpoint(
        "add_checklist_item", "POST", lambda w: f"/api/cards/{w.card.card_id}/checklist",
        lambda w: {"text": "Step"}, WRITERS, 201, {"text": ""},
    ),
    Endpoint(
        "update_checklist_item", "PATCH", lambda w: f"/api/checklist/{w.item.checklist_item_id}",
        lambda w: {"is_done": True}, WRITERS, 200, {"is_done": "yes"},
    ),
    Endpoint("delete_checklist_item", "DELETE", lambda w: f"/api/checklist/{w.item.checklist_item_id}", None, WRITERS, 200),
    Endpoint(
        "add_card_link", "POST", lambda w: f"/api/cards/{w.card.card_id}/links",
        lambda w: {"url": "https://example.org/a"}, WRITERS, 201, {"url": "javascript:alert(1)"},
    ),
    Endpoint(
        "update_card_link", "PATCH", lambda w: f"/api/links/{w.link.card_link_id}",
        lambda w: {"label": "Renamed"}, WRITERS, 200, {"label": ""},
    ),
    Endpoint("delete_card_link", "DELETE", lambda w: f"/api/links/{w.link.card_link_id}", None, WRITERS, 200),
]
ENDPOINT_IDS = [endpoint.id for endpoint in ENDPOINTS]


def call(client, endpoint, world, headers=None, body="default"):
    """Send the endpoint's request; `body="default"` uses the endpoint's own valid body."""
    payload = endpoint.body(world) if (body == "default" and endpoint.body) else (None if body == "default" else body)
    kwargs = {"headers": headers or {}}
    if payload is not None:
        kwargs["json"] = payload
    return getattr(client, endpoint.method.lower())(endpoint.path(world), **kwargs)


def snapshot(app):
    """Every row of every table, as strings, in primary-key order."""
    from app.extensions import db

    with app.app_context():
        return {
            table.name: [
                tuple(map(str, row))
                for row in db.session.execute(select(table).order_by(*table.primary_key.columns)).all()
            ]
            for table in db.metadata.sorted_tables
        }


def build_world(
    make_user, make_board, make_member, make_column, make_card, make_comment, persist=None,
    make_checklist_item=None, make_card_link=None,
):
    """One Board with an admin, a manager, a member (who wrote the comment), a guest, and an outsider.

    With `persist`, the Board also gets both Invite_Tokens (`world.member_token`, `world.guest_token`).
    """
    admin = make_user(name=SECRETS["admin"])
    member = make_user(name=SECRETS["member"])
    board = make_board(admin, name=SECRETS["board"])
    make_member(board, member)
    manager = make_member(board, role="manager").member
    extra = make_member(board).member
    guest = make_member(board, role="guest").member
    column = make_column(board, SECRETS["column"])
    column2 = make_column(board, "Other column")
    card = make_card(column, SECRETS["card"])
    comment = make_comment(card, member, SECRETS["comment"])
    guest_comment = make_comment(card, guest, "Written while the guest could still write")
    item = make_checklist_item(card, "Existing step") if make_checklist_item else None
    link = make_card_link(card, member) if make_card_link else None
    outsider = make_user()
    member_token = guest_token = None
    if persist is not None:
        from app.blueprints.boards.service.invite_service import new_invite_token

        board.member_invite_token, board.guest_invite_token = new_invite_token(), new_invite_token()
        persist(board)
        member_token, guest_token = board.member_invite_token, board.guest_invite_token
    return SimpleNamespace(
        admin=admin, manager=manager, member=member, guest=guest, item=item, link=link, outsider=outsider, newbie=make_user(), extra=extra,
        board=board, column=column, column2=column2, card=card, comment=comment,
        guest_comment=guest_comment, member_token=member_token, guest_token=guest_token,
        actors={"nonmember": outsider, "guest": guest, "member": member, "manager": manager, "admin": admin},
    )


@pytest.fixture
def world(
    make_user, make_board, make_member, make_column, make_card, make_comment, persist,
    make_checklist_item, make_card_link,
):
    return build_world(
        make_user, make_board, make_member, make_column, make_card, make_comment, persist,
        make_checklist_item, make_card_link,
    )


# --- user-level endpoints (design A11 rows 1 to 7, 27, 28, 3a) -------------------------------------
# Acting user is `world.member`; `auth` says which credential the request carries.
USER_ENDPOINTS = [
    (Endpoint("health", "GET", lambda w: "/api/health", None, frozenset(), 200, has_id=False), "none"),
    (
        Endpoint(
            "register", "POST", lambda w: "/api/auth/register",
            lambda w: {"name": "Fresh", "email": "fresh@example.com", "password": "password123"},
            frozenset(), 201, {"email": "x"}, has_id=False,
        ),
        "none",
    ),
    (
        Endpoint(
            "login", "POST", lambda w: "/api/auth/login",
            lambda w: {"email": w.member.email, "password": w.member.password},
            frozenset(), 200, {"email": "x"}, has_id=False,
        ),
        "none",
    ),
    (Endpoint("refresh", "POST", lambda w: "/api/auth/refresh", None, frozenset(), 200, has_id=False), "refresh"),
    (Endpoint("get_me", "GET", lambda w: "/api/users/me", None, frozenset(), 200, has_id=False), "member"),
    (
        Endpoint(
            "patch_me", "PATCH", lambda w: "/api/users/me", lambda w: {"name": "New Name"},
            frozenset(), 200, {"password": "x"}, has_id=False,
        ),
        "member",
    ),
    (
        Endpoint(
            "create_board", "POST", lambda w: "/api/boards", lambda w: {"name": "Fresh board"},
            frozenset(), 201, {"name": ""}, has_id=False,
        ),
        "member",
    ),
    (Endpoint("list_boards", "GET", lambda w: "/api/boards", None, frozenset(), 200, has_id=False), "member"),
    (
        Endpoint("get_invite_info", "GET", lambda w: f"/api/invites/{w.member_token}", None, frozenset(), 200, has_id=False),
        "member",
    ),
    (
        Endpoint(
            "accept_invite", "POST", lambda w: f"/api/invites/{w.member_token}/accept", None,
            frozenset(), 200, has_id=False,
        ),
        "member",
    ),
    (Endpoint("get_overdue", "GET", lambda w: "/api/notifications/overdue", None, frozenset(), 200, has_id=False), "member"),
    (Endpoint("list_notifications", "GET", lambda w: "/api/notifications", None, frozenset(), 200, has_id=False), "member"),
    (
        Endpoint("mark_read", "PATCH", lambda w: f"/api/notifications/{w.note.notification_id}/read", None, frozenset(), 200),
        "member",
    ),
]


def with_auth():
    """Every endpoint (33 rows plus 3a) as `(endpoint, auth)`; `auth` is none, refresh, member, or admin."""
    board_level = [(e, "admin" if "admin" in e.allowed else "member") for e in ENDPOINTS]
    return USER_ENDPOINTS + board_level


CREATING_POSTS = {
    "register", "create_board", "add_member", "create_column", "create_card", "create_comment",
    "add_checklist_item", "add_card_link",
}
