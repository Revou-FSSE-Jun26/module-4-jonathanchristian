"""Accept decision and the accept transaction for a board invitation link (design A14)."""
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.blueprints.boards.schema import AcceptResultSchema, BoardMembership
from app.blueprints.boards.service.invite_service import find_board_by_token
from app.extensions import db
from app.soft_delete import active

CREATE = "create"
UPGRADE = "upgrade"
NONE = "none"

result_schema = AcceptResultSchema()
MAX_ATTEMPTS = 3


def resolve_accept(existing_role, token_role):
    """Return `(resulting_role, action)` with action in {"create", "upgrade", "none"}.

    Pure: `existing_role` is the caller's active role on the Board, or None (a soft-deleted
    membership counts as none). An accept never lowers a role.
    """
    if existing_role is None:
        return token_role, CREATE
    if existing_role == "guest" and token_role == "member":
        return "member", UPGRADE
    return existing_role, NONE  # admin stays admin, member stays member, guest + guest stays


def _attempt(user, board_id, token_role):
    """One pass: lock the caller's active membership, decide, write. Returns the result."""
    existing = db.session.execute(
        select(BoardMembership)
        .where(
            BoardMembership.board_id == board_id,
            BoardMembership.user_id == user.user_id,
            active(BoardMembership),
        )
        .with_for_update()
    ).scalar_one_or_none()
    role, action = resolve_accept(existing.role if existing else None, token_role)
    if action == CREATE:
        # A soft-deleted row of the same pair stays untouched; the partial unique index
        # only covers active rows, so a new row is allowed.
        db.session.add(BoardMembership(board_id=board_id, user_id=user.user_id, role=role))
    elif action == UPGRADE:
        db.session.execute(  # conditional, so it can never lower a role
            update(BoardMembership)
            .where(
                BoardMembership.board_membership_id == existing.board_membership_id,
                BoardMembership.role == "guest",
            )
            .values(role="member")
            .execution_options(synchronize_session=False)
        )
    db.session.commit()
    return role


def accept_invite(user, token):
    """Join (or upgrade on) the Board of a valid token. 200 in every case; token not consumed.

    Two simultaneous accepts of the same pair both try to insert; the partial unique index
    makes one fail with an IntegrityError. It is caught here, the transaction is rolled back,
    and the second pass re-reads the membership, so the global 409 mapping is never reached.
    """
    board, token_role = find_board_by_token(token)
    board_id = board.board_id
    for attempt_number in range(MAX_ATTEMPTS):
        try:
            role = _attempt(user, board_id, token_role)
            break
        except IntegrityError:
            db.session.rollback()
            if attempt_number == MAX_ATTEMPTS - 1:
                raise
    return result_schema.dump({"board_id": board_id, "role": role})
