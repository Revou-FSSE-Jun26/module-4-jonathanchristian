"""Pure tests for the invitation accept decision and token helpers (no database)."""
import re

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.blueprints.boards.service.accept import resolve_accept
from app.blueprints.boards.service.invite_service import (
    INVITE_TOKEN_PATTERN,
    is_valid_invite_token,
    new_invite_token,
)
from app.permissions import ROLE_RANK

pytestmark = pytest.mark.unit

EXISTING_ROLES = (None, "guest", "member", "manager", "admin")
TOKEN_ROLES = ("member", "guest")

# The table of design A14, written out in full.
EXPECTED = {
    (None, "member"): ("member", "create"),
    (None, "guest"): ("guest", "create"),
    ("guest", "member"): ("member", "upgrade"),
    ("guest", "guest"): ("guest", "none"),
    ("member", "member"): ("member", "none"),
    ("member", "guest"): ("member", "none"),
    ("manager", "member"): ("manager", "none"),
    ("manager", "guest"): ("manager", "none"),
    ("admin", "member"): ("admin", "none"),
    ("admin", "guest"): ("admin", "none"),
}


# Feature: kano, Property 75: Manager accept and invite links (pure part), Property 50
@settings(max_examples=100, deadline=None)
@given(existing=st.sampled_from(EXISTING_ROLES), token_role=st.sampled_from(TOKEN_ROLES))
def test_accept_decision_never_lowers_a_role(existing, token_role):
    role, action = resolve_accept(existing, token_role)
    assert (role, action) == EXPECTED[(existing, token_role)]
    if existing is None:
        assert (role, action) == (token_role, "create")
    elif existing == "guest" and token_role == "member":
        assert (role, action) == ("member", "upgrade")
    else:
        assert (role, action) == (existing, "none")
    if existing is not None:
        assert ROLE_RANK[role] >= ROLE_RANK[existing]
    if existing in ("manager", "admin"):
        assert role == existing  # a manager and an admin never lose rank


def test_every_pair_is_covered_by_the_table():
    assert {(e, t) for e in EXISTING_ROLES for t in TOKEN_ROLES} == set(EXPECTED)


# --- token helpers used by the same accept flow ----------------------------------------------


def test_new_invite_token_is_43_url_safe_characters_and_matches_the_pattern():
    for _ in range(50):
        token = new_invite_token()
        assert len(token) == 43
        assert re.fullmatch(INVITE_TOKEN_PATTERN, token)
        assert is_valid_invite_token(token)


def test_new_invite_tokens_do_not_repeat():
    assert len({new_invite_token() for _ in range(200)}) == 200


@pytest.mark.parametrize(
    "value",
    ["", "short", "a" * 42, "a" * 129, "a" * 43 + "\n", "a" * 42 + "!", "a" * 42 + " ", None, 123],
)
def test_malformed_tokens_are_rejected(value):
    assert is_valid_invite_token(value) is False


@pytest.mark.parametrize("length", [43, 64, 128])
def test_well_formed_tokens_of_allowed_lengths_are_accepted(length):
    assert is_valid_invite_token(("aB3_-" * 26)[:length])
