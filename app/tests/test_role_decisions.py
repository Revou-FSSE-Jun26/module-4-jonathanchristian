"""Pure tests for the role-change and member-removal decisions (no database)."""
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.permissions import (
    ASSIGNABLE_ROLES,
    ROLE_RANK,
    decide_member_removal,
    decide_role_change,
    role_allows,
)

pytestmark = pytest.mark.unit

CALLERS = ("guest", "member", "manager", "admin", None)  # None = no active membership
TARGETS = ("guest", "member", "manager", "admin")
NEW_ROLES = st.one_of(
    st.sampled_from(("guest", "member", "manager", "admin")),
    st.sampled_from(("owner", "Admin", "", "MANAGER")),
    st.text(max_size=12),
)


def _rank_above(caller, role):
    return ROLE_RANK[caller] > ROLE_RANK[role]


# Feature: kano, Property 72: Role-change and removal decisions (pure part)
@settings(max_examples=300, deadline=None)
@given(
    caller=st.sampled_from(CALLERS),
    target=st.sampled_from(TARGETS),
    new_role=NEW_ROLES,
    target_is_owner=st.booleans(),
)
def test_decide_role_change_follows_the_rank_and_owner_rules(
    caller, target, new_role, target_is_owner
):
    result = decide_role_change(caller, target, new_role, target_is_owner)
    assert result in ("ok", "forbidden", "bad_request")
    if new_role not in ASSIGNABLE_ROLES:
        assert result == "bad_request"  # an invalid role (and `admin`) is a 400, for any caller
    elif caller not in ("admin", "manager"):
        assert result == "forbidden"
    elif target_is_owner:
        assert result == ("bad_request" if caller == "admin" else "forbidden")
    elif _rank_above(caller, target) and _rank_above(caller, new_role):
        assert result == "ok"
    else:
        assert result == "forbidden"


# Feature: kano, Property 72: removal part
@settings(max_examples=200, deadline=None)
@given(
    caller=st.sampled_from(CALLERS),
    target=st.sampled_from(TARGETS),
    target_is_owner=st.booleans(),
)
def test_decide_member_removal_follows_the_rank_and_owner_rules(caller, target, target_is_owner):
    result = decide_member_removal(caller, target, target_is_owner)
    if caller not in ("admin", "manager"):
        assert result == "forbidden"
    elif target_is_owner:
        assert result == ("bad_request" if caller == "admin" else "forbidden")
    elif _rank_above(caller, target):
        assert result == "ok"
    else:
        assert result == "forbidden"


@settings(max_examples=100, deadline=None)
@given(
    caller=st.sampled_from(("admin", "manager")),
    target=st.sampled_from(TARGETS),
    new_role=st.sampled_from(ASSIGNABLE_ROLES),
)
def test_an_ok_change_never_reaches_the_callers_own_rank(caller, target, new_role):
    if decide_role_change(caller, target, new_role, False) == "ok":
        assert role_allows(caller, "manager")
        assert ROLE_RANK[new_role] < ROLE_RANK[caller]
        assert ROLE_RANK[target] < ROLE_RANK[caller]


def test_assignable_roles_never_include_admin():
    assert ASSIGNABLE_ROLES == ("guest", "member", "manager")


def test_the_design_examples_hold():
    assert decide_role_change("admin", "member", "manager", False) == "ok"
    assert decide_role_change("admin", "manager", "guest", False) == "ok"
    assert decide_role_change("admin", "member", "admin", False) == "bad_request"
    assert decide_role_change("admin", "admin", "member", True) == "bad_request"  # the owner
    assert decide_role_change("manager", "admin", "member", True) == "forbidden"
    assert decide_role_change("manager", "member", "manager", False) == "forbidden"  # equal rank
    assert decide_role_change("manager", "manager", "guest", False) == "forbidden"
    assert decide_role_change("manager", "guest", "member", False) == "ok"
    assert decide_role_change("member", "guest", "member", False) == "forbidden"
    assert decide_member_removal("admin", "manager", False) == "ok"
    assert decide_member_removal("manager", "member", False) == "ok"
    assert decide_member_removal("manager", "manager", False) == "forbidden"
    assert decide_member_removal("manager", "admin", True) == "forbidden"
    assert decide_member_removal("admin", "admin", True) == "bad_request"  # removing yourself
