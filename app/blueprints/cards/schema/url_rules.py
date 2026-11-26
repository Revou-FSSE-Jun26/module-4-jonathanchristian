"""Pure link URL rule (design A17, Open issue 48). No database, no Flask."""
from urllib.parse import urlsplit

MAX_URL = 2048
MAX_LABEL = 100
ALLOWED_SCHEMES = ("http", "https")


def validate_link_url(raw):
    """Return the trimmed URL, or raise `ValueError` when it is not an acceptable link.

    Accepted: 1 to 2048 characters after trimming, no whitespace or control character, scheme
    `http` or `https` in any letter case, and a non-empty hostname.
    """
    if not isinstance(raw, str):
        raise ValueError("URL must be a string")
    url = raw.strip()
    if not url or len(url) > MAX_URL:
        raise ValueError("URL must have 1 to 2048 characters")
    if any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in url):
        raise ValueError("URL must not contain whitespace or control characters")
    parts = urlsplit(url)  # a ValueError raised here is also a rejection
    if parts.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError("URL must start with http:// or https://")
    if not parts.hostname:
        raise ValueError("URL must have a host name")
    return url


def default_label(url):
    """Label used when none is given: the lower-case hostname cut to 100 characters."""
    return urlsplit(url).hostname[:MAX_LABEL]
