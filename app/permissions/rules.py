"""Pure role rules (design A15). No database access, no Flask, no model imports."""

ADMIN = "admin"
MANAGER = "manager"
MEMBER = "member"
GUEST = "guest"

# Single source of the role order (Requirement 43.1); no other module defines a role table.
ROLE_RANK = {GUEST: 0, MEMBER: 1, MANAGER: 2, ADMIN: 3}
# Levels: "reader" = any role, "writer" = admin, manager, member, "manager" = admin or manager.
LEVEL_RANK = {"reader": 0, "writer": 1, "manager": 2, "admin": 3}
# A role change can never assign `admin` (Requirement 43.8).
ASSIGNABLE_ROLES = (GUEST, MEMBER, MANAGER)

OK = "ok"
FORBIDDEN = "forbidden"
BAD_REQUEST = "bad_request"


def role_allows(role, level):
    """Does `role` (None = no active membership) reach `level`?"""
    return role is not None and ROLE_RANK[role] >= LEVEL_RANK[level]


def decide_role_change(caller, target, new_role, target_is_owner):
    """Return "ok", "forbidden" (403), or "bad_request" (400) for a member role change.

    The owner check runs before the rank rule (Open issue 47): an admin who targets the Board
    creator gets 400, a manager gets 403. A caller may act only on a strictly lower rank and may
    assign only a rank strictly below its own.
    """
    if new_role not in ASSIGNABLE_ROLES:
        return BAD_REQUEST
    if not role_allows(caller, "manager"):
        return FORBIDDEN
    if target_is_owner:
        return BAD_REQUEST if caller == ADMIN else FORBIDDEN
    if ROLE_RANK[caller] <= ROLE_RANK[target]:
        return FORBIDDEN
    if ROLE_RANK[new_role] >= ROLE_RANK[caller]:
        return FORBIDDEN
    return OK


def decide_member_removal(caller, target, target_is_owner):
    """Return "ok", "forbidden", or "bad_request" for removing a member."""
    if not role_allows(caller, "manager"):
        return FORBIDDEN
    if target_is_owner:
        return BAD_REQUEST if caller == ADMIN else FORBIDDEN
    return OK if ROLE_RANK[caller] > ROLE_RANK[target] else FORBIDDEN
