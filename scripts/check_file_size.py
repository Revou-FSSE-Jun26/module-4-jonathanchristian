"""Fail when a source file is longer than 300 lines (guideline G-BE-18, Requirement 30.6/30.7).

Usage:
    python scripts/check_file_size.py            # scan app/ and web/
    python scripts/check_file_size.py app        # scan only the given top-level folders

Scans `.py`, `.ts`, and `.tsx` files. `venv/`, `migrations/`, `node_modules/`, `.next/`, and
`__pycache__/` are skipped. Exit status is 1 and each offender is listed when a file is too long.
"""
import sys
from pathlib import Path

MAX_LINES = 300
EXTENSIONS = {".py", ".ts", ".tsx"}
SKIPPED_DIRS = {"venv", ".venv", "migrations", "node_modules", ".next", "__pycache__"}
DEFAULT_ROOTS = ("app", "web")
REPO_ROOT = Path(__file__).resolve().parents[1]


def count_lines(path):
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def find_oversized(roots=DEFAULT_ROOTS, repo_root=REPO_ROOT, max_lines=MAX_LINES):
    """Return `[(relative_path, line_count), ...]` for every file over `max_lines`."""
    offenders = []
    for root in roots:
        base = Path(repo_root) / root
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            relative = path.relative_to(repo_root)
            if path.suffix not in EXTENSIONS or not path.is_file():
                continue
            if SKIPPED_DIRS.intersection(relative.parts):
                continue
            lines = count_lines(path)
            if lines > max_lines:
                offenders.append((relative.as_posix(), lines))
    return offenders


def main(argv):
    roots = tuple(argv) or DEFAULT_ROOTS
    offenders = find_oversized(roots)
    if offenders:
        print(f"Files over {MAX_LINES} lines:")
        for name, lines in offenders:
            print(f"  {name}: {lines} lines")
        return 1
    print(f"OK: no file over {MAX_LINES} lines in {', '.join(roots)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
