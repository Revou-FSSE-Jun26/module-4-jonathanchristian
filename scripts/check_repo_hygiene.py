"""Repository hygiene check (Requirements 35.1, 35.2, 35.3, 35.5, 35.7 and 30.1).

Usage:
    python scripts/check_repo_hygiene.py

Checks, all against the Git index (tracked files) of the repository this script lives in:
  1. `.gitignore` has the required rules, and `git check-ignore` agrees: `.env`, `.env.local`,
     and `.env.test` files are ignored, the `.env.example` and `.env.test.example` files are not.
  2. No tracked file is matched by `.gitignore`, and no tracked `.env*` file exists other than
     `.env.example` and `.env.test.example` (so no tracked `.env.test`).
  3. `app/.env.example`, `web/.env.example`, and `web/.env.test.example` are tracked and list
     every environment variable the code reads (`E2E_*` variables belong in `.env.test.example`).
  4. Secrets scan of tracked text files: database URLs with a real password, non-placeholder
     values for secret variables, and common API key and private key formats.
  5. `requirements.md`, `design.md`, `tasks.md`, and `CHANGELOG.md` exist in `.kiro/specs/kano/`.
  6. `guidelines/` has `frontend.md`, `backend.md`, and `database.md`, and `.kiro/steering/`
     holds no copy of them (same file name or same content).
  7. No file in `web/e2e/` contains a literal credential. The patterns are read from
     `web/scripts/scanCredentials.ts`, the scanner of task 31.9, so both checks stay identical.

Exit status is 1 and every finding is listed when a check fails. Secret values are never printed.
"""
import ast
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_GITIGNORE_RULES = (
    ".env", ".env.local", ".env.test", ".env*", "!.env.example", "!.env.test.example",
    "__pycache__/", ".next/", "node_modules/", "app/venv/",
)
MUST_BE_IGNORED = (".env", "app/.env", "web/.env", "web/.env.local", "web/.env.test")
MUST_NOT_BE_IGNORED = ("app/.env.example", "web/.env.example", "web/.env.test.example")
ALLOWED_ENV_FILES = {".env.example", ".env.test.example"}
EXAMPLE_FILES = ("app/.env.example", "web/.env.example", "web/.env.test.example")
E2E_VARIABLES = ("E2E_BASE_URL", "E2E_USER_EMAIL", "E2E_USER_PASSWORD")
# Set by the platform or the toolchain, never by the developer, so not listed in examples.
PLATFORM_VARIABLES = {"VERCEL", "NODE_ENV", "CI", "NEXT_RUNTIME"}
SPEC_FILES = ("requirements.md", "design.md", "tasks.md", "CHANGELOG.md")
GUIDELINE_FILES = ("frontend.md", "backend.md", "database.md")
SKIPPED_DIRS = {"venv", ".venv", "node_modules", ".next", "__pycache__", "migrations"}
BINARY_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".woff", ".woff2",
                   ".ttf", ".pdf", ".zip", ".pyc"}

PY_ENV_RE = re.compile(r"""os\.(?:environ\.get|getenv)\(\s*["']([A-Z][A-Z0-9_]*)["']"""
                       r"""|os\.environ\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]""")
TS_ENV_RE = re.compile(r"process\.env\.([A-Z][A-Z0-9_]*)")
DB_URL_RE = re.compile(r"postgres(?:ql)?(?:\+\w+)?://[^\s:/@'\"]+:([^\s@'\"]+)@([^\s:/'\"]+)")
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "[::1]"}
TEST_DIRS = {"tests", "__tests__", "e2e"}
CODE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".mjs"}
QUOTED_LITERAL_RE = re.compile(r"""^["']([^"']+)["'],?$""")
SECRET_ASSIGN_RE = re.compile(
    r"^\s*(JWT_SECRET_KEY|SECRET_KEY|E2E_USER_PASSWORD|[A-Z_]*API_KEY)\s*=\s*(\S+)", re.M)
KEY_PATTERNS = {
    "AWS access key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "GitHub token": re.compile(r"gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}"),
    "OpenAI-style key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9]{32,}"),
    "Slack token": re.compile(r"xox[abprs]-[A-Za-z0-9-]{10,}"),
    "Google API key": re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
}
PLACEHOLDER_HINTS = ("change", "replace", "your", "example", "placeholder", "secret-here",
                     "<", "${", "xxx", "***")
PLACEHOLDER_WORDS = {"password", "pass", "postgres", "secret", "choose-a-password", "pw"}


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO_ROOT, capture_output=True, text=True)


def tracked_files():
    output = git("ls-files", "-z").stdout
    return [name for name in output.split("\0") if name]


def is_placeholder(value):
    lowered = value.strip().strip("'\"").lower()
    return (not lowered or lowered in PLACEHOLDER_WORDS
            or any(hint in lowered for hint in PLACEHOLDER_HINTS))


def read_text(relative):
    path = REPO_ROOT / relative
    if path.suffix.lower() in BINARY_SUFFIXES or not path.is_file():
        return None
    data = path.read_bytes()
    if b"\0" in data[:4096]:
        return None
    return data.decode("utf-8", errors="replace")


def source_files(root, suffixes):
    base = REPO_ROOT / root
    for path in sorted(base.rglob("*")):
        relative = path.relative_to(REPO_ROOT)
        if path.is_file() and path.suffix in suffixes and not SKIPPED_DIRS.intersection(relative.parts):
            yield path


def example_variables(relative):
    path = REPO_ROOT / relative
    if not path.is_file():
        return None
    names = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"\s*([A-Z][A-Z0-9_]*)\s*=", line)
        if match:
            names.add(match.group(1))
    return names


def check_gitignore(tracked):
    findings = []
    gitignore = REPO_ROOT / ".gitignore"
    rules = set()
    if gitignore.is_file():
        rules = {line.strip() for line in gitignore.read_text(encoding="utf-8").splitlines()}
    findings += [f".gitignore is missing the rule {rule!r}" for rule in REQUIRED_GITIGNORE_RULES
                 if rule not in rules]
    findings += [f"{path} is not ignored by Git" for path in MUST_BE_IGNORED
                 if git("check-ignore", "-q", "--no-index", path).returncode != 0]
    findings += [f"{path} is ignored by Git but must be committed" for path in MUST_NOT_BE_IGNORED
                 if git("check-ignore", "-q", "--no-index", path).returncode == 0]
    ignored_but_tracked = git("ls-files", "-ci", "--exclude-standard").stdout.split()
    findings += [f"{path} is tracked but matches .gitignore" for path in ignored_but_tracked]
    for path in tracked:
        name = Path(path).name
        if name.startswith(".env") and name not in ALLOWED_ENV_FILES:
            findings.append(f"{path} is a tracked environment file")
    findings += [f"{path} is not tracked" for path in EXAMPLE_FILES if path not in tracked]
    return findings


def app_variables():
    names = set()
    config = REPO_ROOT / "app" / "config.py"
    for node in ast.walk(ast.parse(config.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Assign) and any(
                isinstance(t, ast.Name) and t.id == "REQUIRED_VARIABLES" for t in node.targets):
            names.update(ast.literal_eval(node.value))
    for path in source_files("app", {".py"}):
        for match in PY_ENV_RE.finditer(path.read_text(encoding="utf-8", errors="replace")):
            names.add(match.group(1) or match.group(2))
    return names - PLATFORM_VARIABLES


def web_variables():
    names = set()
    for path in source_files("web", {".ts", ".tsx", ".js", ".mjs"}):
        names.update(TS_ENV_RE.findall(path.read_text(encoding="utf-8", errors="replace")))
    return names - PLATFORM_VARIABLES


def check_examples():
    findings = []
    listed = {path: example_variables(path) for path in EXAMPLE_FILES}
    for path, names in listed.items():
        if names is None:
            findings.append(f"{path} does not exist")
    app_listed = listed["app/.env.example"] or set()
    web_listed = listed["web/.env.example"] or set()
    test_listed = listed["web/.env.test.example"] or set()
    findings += [f"app/.env.example does not list {name}" for name in sorted(app_variables() - app_listed)]
    for name in sorted(web_variables()):
        if name.startswith("E2E_") and name not in test_listed:
            findings.append(f"web/.env.test.example does not list {name}")
        elif not name.startswith("E2E_") and name not in web_listed:
            findings.append(f"web/.env.example does not list {name}")
    findings += [f"web/.env.test.example does not list {name}" for name in E2E_VARIABLES
                 if name not in test_listed]
    return findings


def is_test_fixture_url(relative, password, host):
    """Dummy credentials for a local database inside a test folder are fixtures, not secrets."""
    return host.lower() in LOCAL_HOSTS and bool(TEST_DIRS.intersection(Path(relative).parts))


def assigned_secret(relative, raw_value):
    """Return the literal value of a secret assignment, or None when it is code or a placeholder.

    In code files only a quoted string literal counts (`KEY=cfg.value` is an expression).
    """
    value = raw_value.strip()
    if Path(relative).suffix in CODE_SUFFIXES:
        literal = QUOTED_LITERAL_RE.match(value)
        if not literal:
            return None
        value = literal.group(1)
    return None if is_placeholder(value) else value


def check_secrets(tracked):
    findings = []
    for relative in tracked:
        text = read_text(relative)
        if text is None:
            continue
        for number, line in enumerate(text.splitlines(), start=1):
            for match in DB_URL_RE.finditer(line):
                password, host = match.group(1), match.group(2)
                if not is_placeholder(password) and not is_test_fixture_url(relative, password, host):
                    findings.append(f"{relative}:{number}: database URL with a real-looking password")
            for label, pattern in KEY_PATTERNS.items():
                if pattern.search(line):
                    findings.append(f"{relative}:{number}: possible {label}")
        for match in SECRET_ASSIGN_RE.finditer(text):
            if assigned_secret(relative, match.group(2)) is not None:
                number = text.count("\n", 0, match.start()) + 1
                findings.append(f"{relative}:{number}: {match.group(1)} has a non-placeholder value")
    return findings


def check_specs_and_guidelines():
    findings = []
    spec_dir = REPO_ROOT / ".kiro" / "specs" / "kano"
    findings += [f".kiro/specs/kano/{name} is missing" for name in SPEC_FILES
                 if not (spec_dir / name).is_file()]
    guideline_dir = REPO_ROOT / "guidelines"
    steering_dir = REPO_ROOT / ".kiro" / "steering"
    steering = [p for p in steering_dir.glob("*") if p.is_file()] if steering_dir.is_dir() else []
    for name in GUIDELINE_FILES:
        source = guideline_dir / name
        if not source.is_file():
            findings.append(f"guidelines/{name} is missing")
            continue
        content = source.read_bytes()
        for copy in steering:
            if copy.name == name or copy.read_bytes() == content:
                findings.append(f".kiro/steering/{copy.name} is a copy of guidelines/{name}")
    return findings


def credential_patterns():
    source = (REPO_ROOT / "web" / "scripts" / "scanCredentials.ts").read_text(encoding="utf-8")
    patterns = []
    for match in re.finditer(r"const\s+\w+_RE\s*=\s*/((?:\\/|[^/\n])+)/([a-z]*)\s*;", source):
        flags = re.I if "i" in match.group(2) else 0
        patterns.append(re.compile(match.group(1), flags))
    return patterns


def check_e2e_credentials():
    patterns = credential_patterns()
    if len(patterns) < 2:
        return ["web/scripts/scanCredentials.ts: expected 2 credential patterns, found "
                f"{len(patterns)}"]
    findings = []
    for path in source_files("web/e2e", {".ts", ".js"}):
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in patterns:
            for match in pattern.finditer(text):
                number = text.count("\n", 0, match.start()) + 1
                findings.append(f"{path.relative_to(REPO_ROOT).as_posix()}:{number}: literal credential")
    return findings


CHECKS = (
    (".gitignore and tracked environment files", lambda t: check_gitignore(t)),
    ("environment variable examples", lambda t: check_examples()),
    ("secrets in tracked files", lambda t: check_secrets(t)),
    ("specification and guideline files", lambda t: check_specs_and_guidelines()),
    ("literal credentials in web/e2e", lambda t: check_e2e_credentials()),
)


def main():
    tracked = tracked_files()
    if not tracked:
        print("FAIL: git ls-files returned no files (is this a Git checkout?)")
        return 1
    failed = False
    for label, check in CHECKS:
        findings = check(tracked)
        if findings:
            failed = True
            print(f"FAIL: {label}")
            for finding in findings:
                print(f"  {finding}")
        else:
            print(f"OK: {label}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
