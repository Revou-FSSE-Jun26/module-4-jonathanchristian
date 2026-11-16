"""Unit tests for ordering, soft-delete helpers, serializers, and the envelope (no database)."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.errors import UtcDateTime, UuidField, fail, ok
from app.ordering import before_first_order, midpoint_order, next_last_order
from app.soft_delete import start_of_week_utc
from env_helpers import make_unit_app

pytestmark = pytest.mark.unit

_offsets = st.builds(
    timezone,
    st.timedeltas(min_value=timedelta(hours=-23), max_value=timedelta(hours=23)),
)
_aware_datetimes = st.datetimes(
    min_value=datetime(1990, 1, 1), max_value=datetime(2100, 1, 1), timezones=_offsets
)
_orders = st.floats(min_value=1e-6, max_value=1e9, allow_nan=False, allow_infinity=False)


@pytest.fixture(scope="module")
def app():
    return make_unit_app()


# --- ordering ---------------------------------------------------------------------------


def test_next_last_order_of_empty_parent_is_one():
    assert next_last_order(None) == 1.0


@settings(max_examples=100, deadline=None)
@given(_orders)
def test_next_last_order_is_max_plus_one(current_max):
    assert next_last_order(current_max) == current_max + 1.0


@settings(max_examples=100, deadline=None)
@given(_orders, st.floats(min_value=1e-3, max_value=1e6))
def test_midpoint_lies_between_neighbours(prev, gap):
    nxt = prev + gap
    middle = midpoint_order(prev, nxt)
    assert prev <= middle <= nxt


@settings(max_examples=100, deadline=None)
@given(_orders)
def test_before_first_is_positive_and_smaller(first):
    result = before_first_order(first)
    assert 0 < result < first


def test_ordering_examples():
    assert midpoint_order(1.0, 2.0) == 1.5
    assert before_first_order(1.0) == 0.5
    assert next_last_order(3.0) == 4.0


# --- start_of_week_utc ---------------------------------------------------------------------


def test_start_of_week_examples():
    wednesday = datetime(2026, 11, 18, 15, 30, 12, tzinfo=timezone.utc)
    assert start_of_week_utc(wednesday) == datetime(2026, 11, 16, tzinfo=timezone.utc)
    monday_midnight = datetime(2026, 11, 16, tzinfo=timezone.utc)
    assert start_of_week_utc(monday_midnight) == monday_midnight
    sunday_late = datetime(2026, 11, 22, 23, 59, 59, tzinfo=timezone.utc)
    assert start_of_week_utc(sunday_late) == monday_midnight
    # a non-UTC instant is converted before the week is computed
    plus_two = timezone(timedelta(hours=2))
    assert start_of_week_utc(datetime(2026, 11, 16, 1, 0, tzinfo=plus_two)) == datetime(
        2026, 11, 9, tzinfo=timezone.utc
    )


@settings(max_examples=100, deadline=None)
@given(_aware_datetimes)
def test_start_of_week_is_monday_midnight_within_seven_days(now):
    start = start_of_week_utc(now)
    assert start.tzinfo is not None and start.utcoffset() == timedelta(0)
    assert start.weekday() == 0
    assert (start.hour, start.minute, start.second, start.microsecond) == (0, 0, 0, 0)
    assert start <= now
    assert now - start < timedelta(days=7)


# --- serializers ---------------------------------------------------------------------------


# Feature: kano, Property 3: Serialization format
@settings(max_examples=100, deadline=None)
@given(st.uuids())
def test_uuid_serializes_lowercase_hyphenated(value):
    text = UuidField()._serialize(value, "id", None)
    assert len(text) == 36
    assert text == text.lower()
    assert uuid.UUID(text) == value
    assert text.count("-") == 4


# Feature: kano, Property 3: Serialization format
@settings(max_examples=100, deadline=None)
@given(_aware_datetimes)
def test_timestamp_serializes_iso_utc_with_z(value):
    text = UtcDateTime()._serialize(value, "created_at", None)
    assert text.endswith("Z")
    assert datetime.fromisoformat(text.replace("Z", "+00:00")) == value


def test_serializers_pass_none_through():
    assert UuidField()._serialize(None, "id", None) is None
    assert UtcDateTime()._serialize(None, "at", None) is None


def test_naive_datetime_is_treated_as_utc():
    assert UtcDateTime()._serialize(datetime(2026, 1, 2, 3, 4, 5), "at", None) == (
        "2026-01-02T03:04:05Z"
    )


# --- envelope ---------------------------------------------------------------------------------


def test_ok_wraps_data_with_status(app):
    with app.app_context():
        response = ok({"a": 1}, 201)
    assert response.status_code == 201
    assert response.get_json() == {"data": {"a": 1}}


def test_ok_defaults_to_200(app):
    with app.app_context():
        assert ok([]).status_code == 200


def test_fail_has_only_error_key_and_truncates(app):
    with app.app_context():
        response = fail("x" * 900, 400)
    body = response.get_json()
    assert response.status_code == 400
    assert list(body) == ["error"]
    assert len(body["error"]) == 500
