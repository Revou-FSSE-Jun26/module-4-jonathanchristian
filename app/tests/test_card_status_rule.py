"""Pure tests for the Card_Status transition rule (no database)."""
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.blueprints.cards.service.status import CARD_STATUSES, apply_status_change

pytestmark = pytest.mark.unit

_T0 = datetime(2026, 1, 5, tzinfo=timezone.utc)
_statuses = st.sampled_from(CARD_STATUSES)
# One PATCH step: the supplied status (None = omitted) and how many seconds pass before it.
_steps = st.lists(
    st.tuples(st.one_of(st.none(), _statuses), st.integers(min_value=1, max_value=10_000)),
    max_size=30,
)


# Feature: kano, Property 44: Status and completed_at transition rule
@settings(max_examples=200, deadline=None)
@given(initial=_statuses, steps=_steps)
def test_status_and_completed_at_follow_the_transition_rule(initial, steps):
    status = initial
    # A Card is never created with a non-null completed_at unless DONE; created Cards are NOT_STARTED.
    completed_at = _T0 if initial == "DONE" else None
    now = _T0
    for supplied, seconds in steps:
        now = now + timedelta(seconds=seconds)
        new_status, new_completed = apply_status_change(status, completed_at, supplied, now)
        if supplied is None or supplied == status:
            assert (new_status, new_completed) == (status, completed_at)  # unchanged, incl. DONE->DONE
        elif supplied == "DONE":
            assert (new_status, new_completed) == ("DONE", now)  # entering DONE sets the time
        elif status == "DONE":
            assert (new_status, new_completed) == (supplied, None)  # leaving DONE clears it
        else:
            assert (new_status, new_completed) == (supplied, None)  # NOT_STARTED <-> IN_PROGRESS
        assert (new_completed is not None) == (new_status == "DONE")
        status, completed_at = new_status, new_completed


def test_a_card_that_was_never_changed_keeps_not_started_and_null():
    # Omitting the status, or repeating NOT_STARTED, changes nothing.
    assert apply_status_change("NOT_STARTED", None, None, _T0) == ("NOT_STARTED", None)
    assert apply_status_change("NOT_STARTED", None, "NOT_STARTED", _T0) == ("NOT_STARTED", None)


def test_done_to_done_keeps_the_original_completion_time():
    earlier = _T0
    later = _T0 + timedelta(days=1)
    assert apply_status_change("DONE", earlier, "DONE", later) == ("DONE", earlier)


def test_statuses_are_the_three_exact_strings():
    assert CARD_STATUSES == ("NOT_STARTED", "IN_PROGRESS", "DONE")
