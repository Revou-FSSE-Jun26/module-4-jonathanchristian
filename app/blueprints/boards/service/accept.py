"""Accept decision for a board invitation link (design A14). Pure: no database access."""

CREATE = "create"
UPGRADE = "upgrade"
NONE = "none"


def resolve_accept(existing_role, token_role):
    """Return `(resulting_role, action)` with action in {"create", "upgrade", "none"}.

    `existing_role` is the caller's active role on the Board, or None (a soft-deleted
    membership counts as none). An accept never lowers a role.
    """
    if existing_role is None:
        return token_role, CREATE
    if existing_role == "guest" and token_role == "member":
        return "member", UPGRADE
    return existing_role, NONE  # admin stays admin, member stays member, guest + guest stays
