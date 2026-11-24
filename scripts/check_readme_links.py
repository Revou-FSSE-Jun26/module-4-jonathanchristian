"""Fail when a relative link or image path in README.md does not resolve (Requirement 36.5, 36.12).

Usage:
    python scripts/check_readme_links.py              # checks README.md at the repository root
    python scripts/check_readme_links.py docs/x.md    # checks the given Markdown files instead

Checks Markdown links `[text](target)`, Markdown images `![alt](target)`, and HTML `src`/`href`
attributes. Targets starting with `http://`, `https://`, `mailto:`, or `#` are external or in-page
and are skipped. A `#fragment` or `?query` is removed before the path is resolved relative to the
Markdown file. Paths inside fenced code blocks and inline code are ignored. Exit status is 1 and
every broken target is listed when one does not exist.
"""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILES = ("README.md",)
SKIPPED_PREFIXES = ("http://", "https://", "mailto:", "#")

FENCE_RE = re.compile(r"^```.*?^```", re.S | re.M)
INLINE_CODE_RE = re.compile(r"`[^`\n]*`")
MD_LINK_RE = re.compile(r"!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
HTML_ATTR_RE = re.compile(r"""\b(?:src|href)\s*=\s*["']([^"']+)["']""", re.I)


def strip_code(text):
    """Blank out code so commands such as `Copy-Item .env.example` are not read as links."""
    text = FENCE_RE.sub(lambda m: "\n" * m.group(0).count("\n"), text)
    return INLINE_CODE_RE.sub("", text)


def targets(text):
    """Yield `(line_number, target)` for every link and image target in `text`."""
    cleaned = strip_code(text)
    for pattern in (MD_LINK_RE, HTML_ATTR_RE):
        for match in pattern.finditer(cleaned):
            yield cleaned.count("\n", 0, match.start()) + 1, match.group(1).strip()


def broken_targets(markdown_path):
    """Return `[(line, target), ...]` for relative targets that do not exist."""
    text = markdown_path.read_text(encoding="utf-8")
    broken = []
    for line, target in targets(text):
        if target.lower().startswith(SKIPPED_PREFIXES):
            continue
        path_part = unquote(re.split(r"[#?]", target, maxsplit=1)[0])
        if not path_part:
            continue
        resolved = (markdown_path.parent / path_part).resolve()
        if not resolved.exists():
            broken.append((line, target))
    return broken


def main(argv):
    files = [REPO_ROOT / name for name in (argv or DEFAULT_FILES)]
    failed = False
    for markdown_path in files:
        relative = markdown_path.relative_to(REPO_ROOT).as_posix()
        if not markdown_path.is_file():
            print(f"FAIL: {relative} does not exist")
            failed = True
            continue
        broken = broken_targets(markdown_path)
        if broken:
            failed = True
            print(f"FAIL: {relative} has {len(broken)} broken link(s) or image path(s):")
            for line, target in broken:
                print(f"  line {line}: {target}")
        else:
            print(f"OK: every relative link and image path in {relative} resolves")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
