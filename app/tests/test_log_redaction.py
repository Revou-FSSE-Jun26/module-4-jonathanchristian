"""Pure tests for Invite_Token log redaction (no database)."""
import logging

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.errors import SensitiveLogFilter, redact_invite_tokens

pytestmark = pytest.mark.unit

_TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
_tokens = st.text(alphabet=_TOKEN_CHARS, min_size=20, max_size=128)
_prefixes = st.sampled_from(["/api/invites/", "/invite/"])
# Surrounding text that contains no URL-safe run long enough to be mistaken for a token and
# none of the token characters, so "the token is absent" is a meaningful check.
_before = st.text(alphabet=" .:,;'\"[]()=?&", max_size=30)
_after = st.text(alphabet=" .:,;'\"[]()=?&/", max_size=30)


# Feature: kano, Property 57: Invite tokens never reach the logs
@settings(max_examples=200, deadline=None)
@given(before=_before, prefix=_prefixes, token=_tokens, after=_after)
def test_invite_tokens_are_removed_and_the_rest_is_kept(before, prefix, token, after):
    message = f"{before}{prefix}{token}{after}"
    redacted = redact_invite_tokens(message)
    assert token not in redacted
    assert redacted == f"{before}{prefix}<redacted>{after}"


@settings(max_examples=200, deadline=None)
@given(token=_tokens, rest=st.sampled_from(["", "/accept", " HTTP/1.1\" 200 -"]))
def test_the_path_after_the_token_is_kept(token, rest):
    message = f'"POST /api/invites/{token}{rest}'
    assert redact_invite_tokens(message) == f'"POST /api/invites/<redacted>{rest}'


@settings(max_examples=200, deadline=None)
@given(text=st.text(max_size=200))
def test_text_without_an_invite_path_is_unchanged(text):
    if "/api/invites/" in text or "/invite/" in text:
        text = text.replace("/", " ")
    assert redact_invite_tokens(text) == text


def test_short_tokens_and_other_paths_are_not_touched():
    for message in (
        "GET /api/invites/short HTTP/1.1",
        f"GET /api/boards/{'a' * 40} HTTP/1.1",
        "GET /invites/" + "a" * 40,
    ):
        assert redact_invite_tokens(message) == message


def test_redaction_is_idempotent():
    once = redact_invite_tokens("GET /invite/" + "a" * 43)
    assert redact_invite_tokens(once) == once


# --- the logging filter applies it -----------------------------------------------------------


def _record(msg, *args):
    return logging.LogRecord("werkzeug", logging.INFO, __file__, 1, msg, args, None)


def test_filter_rewrites_the_request_line_of_a_werkzeug_record():
    token = "Zx9_-" * 9
    record = _record('%s - - "%s %s HTTP/1.1" %d -', "127.0.0.1", "GET", f"/api/invites/{token}", 404)
    assert SensitiveLogFilter().filter(record) is True
    assert token not in record.getMessage()
    assert "/api/invites/<redacted>" in record.getMessage()


def test_filter_keeps_clean_records_untouched_and_still_drops_secrets():
    clean = _record("GET /api/boards %d", 200)
    assert SensitiveLogFilter().filter(clean) is True
    assert clean.getMessage() == "GET /api/boards 200"
    assert SensitiveLogFilter().filter(_record("password=hunter2")) is False
    assert SensitiveLogFilter().filter(_record("Authorization: Bearer abc")) is False
