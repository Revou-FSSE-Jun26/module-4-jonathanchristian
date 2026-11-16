"""The 300-line file limit for the backend (task 15.1; the script is reused for web/ later)."""
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "check_file_size.py"

pytestmark = pytest.mark.unit


def run_script(*args, cwd=REPO_ROOT):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args], cwd=cwd, capture_output=True, text=True, timeout=60
    )


def test_no_backend_file_is_over_300_lines():
    result = run_script("app")
    assert result.returncode == 0, result.stdout + result.stderr


def test_script_reports_and_fails_on_an_oversized_file(tmp_path):
    sys.path.insert(0, str(SCRIPT.parent))
    try:
        import check_file_size
    finally:
        sys.path.remove(str(SCRIPT.parent))
    (tmp_path / "app").mkdir()
    (tmp_path / "app" / "venv").mkdir()
    (tmp_path / "app" / "big.py").write_text("x = 1\n" * 301, encoding="utf-8")
    (tmp_path / "app" / "exact.py").write_text("x = 1\n" * 300, encoding="utf-8")
    (tmp_path / "app" / "venv" / "skipped.py").write_text("x = 1\n" * 500, encoding="utf-8")
    (tmp_path / "app" / "notes.txt").write_text("x\n" * 500, encoding="utf-8")
    assert check_file_size.find_oversized(("app", "web"), repo_root=tmp_path) == [("app/big.py", 301)]
