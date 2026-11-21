"""Pure tests for role levels and the helper level table (no database)."""
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app import permissions
from app.permissions import LEVEL_RANK, ROLE_RANK, role_allows

pytestmark = pytest.mark.unit

ROLES = ("guest", "member", "admin", None)  # None = no active membership
LEVELS = ("reader", "writer", "admin")

# design A4-V6: the outcome of each role at each level, written out in full.
EXPECTED = {
    "admin": {"reader": True, "writer": True, "admin": True},
    "member": {"reader": True, "writer": True, "admin": False},
    "guest": {"reader": True, "writer": False, "admin": False},
    None: {"reader": False, "writer": False, "admin": False},
}


# Feature: kano, Property 47: Guest never writes (role by endpoint matrix), pure part
@settings(max_examples=100, deadline=None)
@given(role=st.sampled_from(ROLES), level=st.sampled_from(LEVELS))
def test_role_allows_iff_rank_reaches_the_level(role, level):
    expected = role is not None and ROLE_RANK[role] >= LEVEL_RANK[level]
    assert role_allows(role, level) is expected
    assert role_allows(role, level) is EXPECTED[role][level]


def test_guest_never_reaches_writer_or_admin():
    assert role_allows("guest", "reader") is True
    assert role_allows("guest", "writer") is False
    assert role_allows("guest", "admin") is False


def test_rank_tables_are_ordered():
    assert ROLE_RANK["guest"] < ROLE_RANK["member"] < ROLE_RANK["admin"]
    assert LEVEL_RANK["reader"] < LEVEL_RANK["writer"] < LEVEL_RANK["admin"]


def test_v6_helpers_exist_and_v5_helpers_are_gone():
    for name in (
        "require_board_reader",
        "require_board_writer",
        "require_board_admin",
        "get_column_for_writer",
        "get_card_for_reader",
        "get_card_for_writer",
        "get_comment_for_reader",
        "get_comment_for_writer",
        "assert_assignee_is_writer",
    ):
        assert callable(getattr(permissions, name)), name
    for name in (
        "require_board_member",
        "get_column_for_member",
        "get_card_for_member",
        "get_comment_for_member",
        "assert_assignee_is_member",
    ):
        assert not hasattr(permissions, name), name
