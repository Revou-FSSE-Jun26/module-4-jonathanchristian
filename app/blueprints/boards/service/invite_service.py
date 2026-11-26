"""Invite_Tokens: generation, lazy creation, regenerate, and lookup (design A12-V6, A14).

No exception message in this module ever contains a token.
"""
import re
import secrets

from sqlalchemy import or_, select, update

from app.blueprints.boards.schema import (
    INVITE_TOKEN_PATTERN,
    Board,
    BoardMembership,
    InviteInfoSchema,
    InviteLinkSchema,
    InviteLinksSchema,
    InviteRoleSchema,
    InviteTokenSchema,
)
from app.errors import NotFound
from app.extensions import db
from app.permissions import require_board_manager
from app.soft_delete import active

INVITE_TOKEN_RE = re.compile(INVITE_TOKEN_PATTERN)
MAX_TOKEN_ATTEMPTS = 3
ROLE_COLUMNS = {"member": "member_invite_token", "guest": "guest_invite_token"}

links_schema = InviteLinksSchema()
link_schema = InviteLinkSchema()
info_schema = InviteInfoSchema()
role_schema = InviteRoleSchema()
token_schema = InviteTokenSchema()


def new_invite_token():
    """A random URL-safe token: 32 random bytes, 43 characters from A-Z a-z 0-9 _ -."""
    return secrets.token_urlsafe(32)


def is_valid_invite_token(value):
    """Format check that runs before any query; `fullmatch` also rejects a trailing newline."""
    return isinstance(value, str) and INVITE_TOKEN_RE.fullmatch(value) is not None


def generate_unique_token(session, exclude=()):
    """A token that neither Invite_Token column of any Board holds (retries up to 3 times).

    A collision is practically impossible with 256 random bits; the unique constraints are
    the real guarantee.
    """
    for _ in range(MAX_TOKEN_ATTEMPTS):
        token = new_invite_token()
        if token in exclude:
            continue
        taken = session.execute(
            select(Board.board_id).where(
                or_(Board.member_invite_token == token, Board.guest_invite_token == token)
            )
        ).first()
        if taken is None:
            return token
    raise RuntimeError("Could not generate a unique invite token")


def _read_tokens(board_id):
    return db.session.execute(
        select(Board.member_invite_token, Board.guest_invite_token).where(
            Board.board_id == board_id, active(Board)
        )
    ).one()


def get_invite_links(user, board_id):
    """Admin or manager. Missing tokens (Boards created before V6) are created lazily.

    The UPDATE keeps an existing token (COALESCE), so two concurrent first requests end with
    one stored pair and both responses carry it.
    """
    require_board_manager(board_id, user.user_id)
    member_token, guest_token = _read_tokens(board_id)
    if member_token is None or guest_token is None:
        fresh_member = generate_unique_token(db.session)
        fresh_guest = generate_unique_token(db.session, exclude=(fresh_member,))
        db.session.execute(
            update(Board)
            .where(Board.board_id == board_id, active(Board))
            .values(
                member_invite_token=db.func.coalesce(Board.member_invite_token, fresh_member),
                guest_invite_token=db.func.coalesce(Board.guest_invite_token, fresh_guest),
                updated_at=Board.updated_at,  # creating a token is not a Board change
            )
            .execution_options(synchronize_session=False)
        )
        db.session.commit()
        member_token, guest_token = _read_tokens(board_id)
    return links_schema.dump(
        {
            "member": {"role": "member", "token": member_token},
            "guest": {"role": "guest", "token": guest_token},
        }
    )


def regenerate_invite_link(user, board_id, load_role):
    """Admin or manager (404 and 403 first), then the role (400). Replaces one token only."""
    board, _membership = require_board_manager(board_id, user.user_id)
    role = load_role(role_schema)["role"]
    token = generate_unique_token(db.session)
    setattr(board, ROLE_COLUMNS[role], token)
    db.session.commit()
    return link_schema.dump({"role": role, "token": token})


def find_board_by_token(token):
    """Return `(board, token_role)` or raise 404 for a malformed, unknown, replaced, or
    soft-deleted-Board token. The format check runs before any query."""
    if not is_valid_invite_token(token) or token_schema.validate({"token": token}):
        raise NotFound("Invitation not found")
    board = db.session.execute(
        select(Board).where(
            or_(Board.member_invite_token == token, Board.guest_invite_token == token),
            active(Board),
        )
    ).scalar_one_or_none()
    if board is None:
        raise NotFound("Invitation not found")
    return board, ("member" if board.member_invite_token == token else "guest")


def current_role(board_id, user_id):
    """The caller's active role on the Board, or None."""
    return db.session.execute(
        select(BoardMembership.role).where(
            BoardMembership.board_id == board_id,
            BoardMembership.user_id == user_id,
            active(BoardMembership),
        )
    ).scalar_one_or_none()


def get_invite_info(user, token):
    board, token_role = find_board_by_token(token)
    return info_schema.dump(
        {
            "board_id": board.board_id,
            "board_name": board.name,
            "role": token_role,
            "current_role": current_role(board.board_id, user.user_id),
        }
    )
