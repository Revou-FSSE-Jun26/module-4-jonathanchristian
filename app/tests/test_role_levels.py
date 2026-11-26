"""Pure tests for role levels and the helper level table (no database)."""
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app import permissions
from app.permissions import LEVEL_RANK, ROLE_RANK, role_allows

pytestmark = pytest.mark.unit

ROLES = ("guest", "member", "manager", "admin", None)  # None = no active membership
LEVELS = ("reader", "writer", "manager", "admin")

# design A15: the outcome of each role at each level, written out in full.
EXPECTED = {
    "admin": {"reader": True, "writer": True, "manager": True, "admin": True},
    "manager": {"reader": True, "writer": True, "manager": True, "admin": False},
    "member": {"reader": True, "writer": True, "manager": False, "admin": False},
    "guest": {"reader": True, "writer": False, "manager": False, "admin": False},
    None: {"reader": False, "writer": False, "manager": False, "admin": False},
}


# Feature: kano, Property 73: V11 permission matrix (pure part)
@settings(max_examples=100, deadline=None)
@given(role=st.sampled_from(ROLES), level=st.sampled_from(LEVELS))
def test_role_allows_iff_rank_reaches_the_level(role, level):
    expected = role is not None and ROLE_RANK[role] >= LEVEL_RANK[level]
    assert role_allows(role, level) is expected
    assert role_allows(role, level) is EXPECTED[role][level]


def test_the_full_matrix_is_covered():
    assert set(EXPECTED) == set(ROLES)
    assert all(set(row) == set(LEVELS) for row in EXPECTED.values())


def test_guest_never_reaches_writer_manager_or_admin():
    assert role_allows("guest", "reader") is True
    for level in ("writer", "manager", "admin"):
        assert role_allows("guest", level) is False


def test_a_member_cannot_manage_but_a_manager_cannot_administer():
    assert role_allows("member", "writer") is True
    assert role_allows("member", "manager") is False
    assert role_allows("manager", "manager") is True
    assert role_allows("manager", "admin") is False


def test_rank_tables_are_ordered_and_defined_once():
    assert ROLE_RANK == {"guest": 0, "member": 1, "manager": 2, "admin": 3}
    assert LEVEL_RANK == {"reader": 0, "writer": 1, "manager": 2, "admin": 3}
    assert ROLE_RANK["guest"] < ROLE_RANK["member"] < ROLE_RANK["manager"] < ROLE_RANK["admin"]
    assert permissions.rules.ROLE_RANK is ROLE_RANK


def test_v11_helpers_exist_and_v5_helpers_are_gone():
    for name in (
        "require_board_reader",
        "require_board_writer",
        "require_board_manager",
        "require_board_admin",
        "get_column_for_writer",
        "get_column_for_manager",
        "get_card_for_reader",
        "get_card_for_writer",
        "get_checklist_item_for_writer",
        "get_card_link_for_writer",
        "get_comment_for_reader",
        "get_comment_for_writer",
        "assert_assignee_is_writer",
        "decide_role_change",
        "decide_member_removal",
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
