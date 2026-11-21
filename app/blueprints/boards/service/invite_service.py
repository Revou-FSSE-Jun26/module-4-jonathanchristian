"""Invite_Token generation and format check (design A12-V6, A14)."""
import re
import secrets

INVITE_TOKEN_PATTERN = r"^[A-Za-z0-9_-]{43,128}$"
INVITE_TOKEN_RE = re.compile(INVITE_TOKEN_PATTERN)


def new_invite_token():
    """A random URL-safe token: 32 random bytes, 43 characters from A-Z a-z 0-9 _ -."""
    return secrets.token_urlsafe(32)


def is_valid_invite_token(value):
    """Format check that runs before any query; `fullmatch` also rejects a trailing newline."""
    return isinstance(value, str) and INVITE_TOKEN_RE.fullmatch(value) is not None
