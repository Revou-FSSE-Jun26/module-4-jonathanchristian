"""Pure tests for `validate_link_url` and `default_label` (no database)."""
from urllib.parse import urlsplit

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from marshmallow import ValidationError

from app.blueprints.cards.schema import (
    CardLinkCreateSchema,
    CardLinkUpdateSchema,
    default_label,
    validate_link_url,
)

pytestmark = pytest.mark.unit


def _oracle(raw):
    """The accepted set of design A17, written independently of the implementation."""
    url = raw.strip()
    if not 1 <= len(url) <= 2048:
        return False
    if any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in url):
        return False
    try:
        parts = urlsplit(url)
        return parts.scheme.lower() in ("http", "https") and bool(parts.hostname)
    except ValueError:
        return False


def _accepts(raw):
    try:
        validate_link_url(raw)
    except ValueError:
        return False
    return True


def _case_mix(text):
    return st.lists(st.booleans(), min_size=len(text), max_size=len(text)).map(
        lambda flags: "".join(ch.upper() if up else ch for ch, up in zip(text, flags))
    )


_hosts = st.from_regex(r"[a-z0-9]([a-z0-9-]{0,20}[a-z0-9])?(\.[a-z]{2,6}){1,2}", fullmatch=True)
_tails = st.from_regex(r"(/[A-Za-z0-9._~%-]{0,15}){0,3}(\?[a-z0-9=&]{0,10})?", fullmatch=True)
_scheme = st.sampled_from(("http", "https", "javascript", "data", "file", "ftp", "mailto", ""))


# Feature: kano, Property 68: Link URL validation and cap (pure part)
@settings(max_examples=300, deadline=None)
@given(raw=st.text(max_size=3000))
def test_arbitrary_text_is_accepted_iff_it_meets_the_rule(raw):
    assert _accepts(raw) is _oracle(raw)


@settings(max_examples=300, deadline=None)
@given(scheme=_scheme, host=_hosts, tail=_tails, sep=st.sampled_from(("://", ":", ":/", "//", "")))
def test_generated_scheme_prefixes_follow_the_rule(scheme, host, tail, sep):
    raw = f"{scheme}{sep}{host}{tail}"
    assert _accepts(raw) is _oracle(raw)
    if scheme in ("http", "https") and sep == "://":
        assert _accepts(raw) is True
    if scheme not in ("http", "https"):
        assert _accepts(raw) is False


@settings(max_examples=150, deadline=None)
@given(
    scheme=st.sampled_from(("http", "https")).flatmap(_case_mix),
    host=_hosts,
    tail=_tails,
    pad=st.sampled_from(("", " ", "\t", "  \n")),
)
def test_http_and_https_in_any_letter_case_are_accepted_and_trimmed(scheme, host, tail, pad):
    url = f"{scheme}://{host}{tail}"
    assert validate_link_url(f"{pad}{url}{pad}") == url


@settings(max_examples=100, deadline=None)
@given(
    host=_hosts,
    bad=st.sampled_from((" ", "\t", "\n", "\r", "\x00", "\x1f", "\x7f", " ", " ")),
    where=st.integers(min_value=0, max_value=2),
)
def test_whitespace_and_control_characters_inside_are_rejected(host, bad, where):
    parts = [f"https://{host}", "/a", "/b"]
    parts[where] = parts[where] + bad
    assert _accepts("".join(parts) + "x") is False


@pytest.mark.parametrize(
    "raw",
    [
        "javascript:alert(1)",
        "JavaScript:alert(1)",
        "data:text/html,<b>x</b>",
        "file:///etc/passwd",
        "ftp://example.com/a",
        "example.com/path",
        "//example.com/path",
        "http:///x",
        "https://",
        "http://:80/x",
        "http:example.com",
        "",
        "   ",
        "http://exa mple.com",
    ],
)
def test_the_listed_unsafe_or_malformed_urls_are_rejected(raw):
    with pytest.raises(ValueError):
        validate_link_url(raw)


def test_length_boundary_is_2048_after_trimming():
    prefix = "https://example.com/"
    assert _accepts(prefix + "a" * (2048 - len(prefix)))
    assert not _accepts(prefix + "a" * (2049 - len(prefix)))
    assert _accepts("  " + prefix + "a" * (2048 - len(prefix)) + "  ")


def test_a_non_string_is_rejected():
    for value in (None, 5, ["https://example.com"], {"url": "x"}):
        with pytest.raises(ValueError):
            validate_link_url(value)


# Feature: kano, Property 68: default label
@settings(max_examples=100, deadline=None)
@given(host=_hosts, tail=_tails, scheme=st.sampled_from(("http", "https")).flatmap(_case_mix))
def test_default_label_is_the_lower_case_hostname(host, tail, scheme):
    url = validate_link_url(f"{scheme}://{host.upper()}{tail}")
    assert default_label(url) == host.lower()[:100]
    assert 1 <= len(default_label(url)) <= 100


def test_default_label_is_cut_to_100_characters():
    host = ".".join(["a" * 60, "b" * 60, "com"])
    label = default_label(validate_link_url(f"https://{host}/x"))
    assert label == host[:100] and len(label) == 100


def test_create_schema_trims_url_and_label_and_rejects_bad_input():
    schema = CardLinkCreateSchema()
    assert schema.load({"url": "  https://example.com/a  ", "label": "  Docs  "}) == {
        "url": "https://example.com/a",
        "label": "Docs",
    }
    assert schema.load({"url": "HTTPS://Example.com"}) == {"url": "HTTPS://Example.com"}
    for body in (
        {},
        {"url": "javascript:alert(1)"},
        {"url": "https://example.com", "label": "   "},
        {"url": "https://example.com", "label": "x" * 101},
        {"url": "https://example.com", "label": None},
        {"url": 5},
        {"url": "https://example.com", "created_by": "x"},
    ):
        with pytest.raises(ValidationError):
            schema.load(body)


def test_update_schema_needs_at_least_one_valid_field():
    schema = CardLinkUpdateSchema()
    assert schema.load({"label": " New "}) == {"label": "New"}
    assert schema.load({"url": "http://example.org"}) == {"url": "http://example.org"}
    for body in ({}, {"url": "data:text/plain,x"}, {"label": ""}, {"label": "x" * 101}):
        with pytest.raises(ValidationError):
            schema.load(body)
