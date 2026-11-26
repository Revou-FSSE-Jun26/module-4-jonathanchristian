"""Pure tests for the four-value Card_Status transition rule (no database)."""
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from marshmallow import ValidationError

from app.blueprints.cards.schema import CardCreateSchema, CardUpdateSchema
from app.blueprints.cards.service.status import CARD_STATUSES, apply_status_change

pytestmark = pytest.mark.unit

_T0 = datetime(2026, 1, 5, tzinfo=timezone.utc)
_statuses = st.sampled_from(CARD_STATUSES)
_OPEN = ("NOT_STARTED", "IN_PROGRESS", "URGENT")
# One PATCH step: the supplied status (None = omitted) and how many seconds pass before it.
_steps = st.lists(
    st.tuples(st.one_of(st.none(), _statuses), st.integers(min_value=1, max_value=10_000)),
    max_size=30,
)
# Values the schema must reject before the rule runs: wrong case, old names, blanks, non-strings.
_invalid_values = st.one_of(
    st.sampled_from(["urgent", "Done", "done", "in_progress", "BLOCKED", "", " DONE", "DONE "]),
    st.text(max_size=20).filter(lambda text: text not in CARD_STATUSES),
    st.integers(),
    st.booleans(),
    st.none(),
)


# Feature: kano, Property 61: Four-value status state machine
@settings(max_examples=200, deadline=None)
@given(initial=_statuses, steps=_steps)
def test_status_and_completed_at_follow_the_four_value_rule(initial, steps):
    status = initial
    # A Card is never created with a non-null completed_at unless DONE; created Cards are NOT_STARTED.
    completed_at = _T0 if initial == "DONE" else None
    now = _T0
    for supplied, seconds in steps:
        now = now + timedelta(seconds=seconds)
        new_status, new_completed = apply_status_change(status, completed_at, supplied, now)
        if supplied is None or supplied == status:
            # omitted or unchanged, including DONE to DONE: nothing changes
            assert (new_status, new_completed) == (status, completed_at)
        elif supplied == "DONE":
            assert (new_status, new_completed) == ("DONE", now)  # entering DONE sets the time
        elif status == "DONE":
            assert (new_status, new_completed) == (supplied, None)  # leaving DONE clears it
        else:
            # a move among NOT_STARTED, IN_PROGRESS, and URGENT leaves completed_at untouched
            assert status in _OPEN and supplied in _OPEN
            assert (new_status, new_completed) == (supplied, completed_at)
            assert new_completed is None
        assert (new_completed is not None) == (new_status == "DONE")
        status, completed_at = new_status, new_completed


# Feature: kano, Property 61: invalid new values never reach the rule
@settings(max_examples=100, deadline=None)
@given(value=_invalid_values)
def test_update_schema_rejects_every_value_outside_the_four_statuses(value):
    with pytest.raises(ValidationError) as caught:
        CardUpdateSchema().load({"status": value})
    assert "status" in caught.value.messages


@pytest.mark.parametrize("status", CARD_STATUSES)
def test_update_schema_accepts_each_exact_status(status):
    assert CardUpdateSchema().load({"status": status}) == {"status": status}


def test_create_schema_still_rejects_status():
    with pytest.raises(ValidationError) as caught:
        CardCreateSchema().load({"title": "x", "status": "URGENT"})
    assert "status" in caught.value.messages


def test_a_card_that_was_never_changed_keeps_not_started_and_null():
    # Omitting the status, or repeating NOT_STARTED, changes nothing.
    assert apply_status_change("NOT_STARTED", None, None, _T0) == ("NOT_STARTED", None)
    assert apply_status_change("NOT_STARTED", None, "NOT_STARTED", _T0) == ("NOT_STARTED", None)


def test_done_to_done_keeps_the_original_completion_time():
    earlier = _T0
    later = _T0 + timedelta(days=1)
    assert apply_status_change("DONE", earlier, "DONE", later) == ("DONE", earlier)


def test_urgent_moves_do_not_touch_completed_at():
    later = _T0 + timedelta(days=1)
    assert apply_status_change("NOT_STARTED", None, "URGENT", later) == ("URGENT", None)
    assert apply_status_change("URGENT", None, "IN_PROGRESS", later) == ("IN_PROGRESS", None)
    assert apply_status_change("URGENT", None, "DONE", later) == ("DONE", later)
    assert apply_status_change("DONE", _T0, "URGENT", later) == ("URGENT", None)


def test_statuses_are_the_four_exact_strings():
    assert CARD_STATUSES == ("NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE")
