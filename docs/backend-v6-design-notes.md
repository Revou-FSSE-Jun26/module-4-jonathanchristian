# Backend V6: Design Choices and Known Issues

Notes from implementing tasks 25 to 28 (card status, guest role, invitation links, profile password change, analytics rewrite). Guideline violations are in [`violation-report.md`](violation-report.md); this file covers design choices, deviations from the task text, limitations, and test-suite weaknesses. Verified state: `933 passed, 3 skipped` against `kano_test` at revision `16c87666d8d7`.

## 1. Deviations from the task text and design

| Spec says | What was built | Why |
|---|---|---|
| Task 25.1: `CARD_STATUSES` lives in `cards/service/status.py`, "no database import" | `CARD_STATUSES` is defined in `cards/schema.py`; `status.py` re-exports it. `apply_status_change` itself uses no database, but importing the module loads SQLAlchemy through the schema. | `CardUpdateSchema` needs the list at import time. Importing `status.py` from `schema.py` would load the whole `cards/service` package, whose `card_service` imports the schema (a cycle), and a schema importing a service breaks the layering. |
| Task 25.5: `accept.py` holds the pure `resolve_accept` | `accept.py` also holds the accept transaction (task 27.8, design A14). | The design places both in `accept.py`. `resolve_accept` stays pure and is tested without a database, but the module imports SQLAlchemy. |
| Design A3: an explicit `email` field with a validator that always raises | `UserUpdateSchema._clean` (a `pre_load` hook) raises `ValidationError("email cannot be changed", "email")` when the key is present. | Marshmallow skips field validators for `null`, so a declared field would not give the clear message for `{"email": null}`. The hook covers every value; the response still names `email`. |
| Design: `boards/schema.py` and `routes.py` single files, split "when they near 300 lines" | Split early into `boards/schema/` (`models`, `board_schemas`, `member_schemas`, `invite_schemas`) and `boards/routes/` (`board_routes`, `member_routes`, `invite_routes`). | Tasks 25.2 and 27.8 name `invite_schemas.py` and `invite_routes.py` explicitly. `__init__.py` re-exports keep `from app.blueprints.boards.schema import Board` and `routes.bp` working. |
| Design A14: `generate_unique_token` retries up to 3 times | Implemented as specified, but a failure raises `RuntimeError` (a 500). | The unique constraints are the real guarantee; a collision between two 256-bit tokens is not a realistic event. |
| Property tests with at least 100 Hypothesis examples | Most V6 properties use 100. The analytics model property (Property 46) uses 60, the perf query-count property 15, and the serialization property 50. | Inherited from the V5 tests, which use these counts because each example builds a database tree. Property 46 can be raised to 100 if the extra runtime is acceptable. |

## 2. Known limitations

1. **Token-uniqueness race.** `generate_unique_token` checks then inserts. Two simultaneous board creations could, in theory, pick the same token; the unique constraint would then raise `IntegrityError`, which the global handler maps to **409** (wrong for "create board"). Probability is about 2^-256, so no retry loop was added. Regenerate has the same shape.
2. **Redaction covers log messages, not tracebacks.** `redact_invite_tokens` rewrites `record.msg` and `args`. A token inside an exception message or a formatted traceback would not be redacted. Services never put a token into an exception message (checked for `invite_service.py` and `accept.py`), but a future change could. Platform request logs on Vercel are outside the application and cannot be filtered (design open issue 22).
3. **Password change does not invalidate tokens.** By requirement (stateless tokens, 6.15), an access token or refresh token issued before the change keeps working until it expires. A stolen refresh token survives a password change for up to 7 days.
4. **No rate limiting on invite endpoints.** Guessing a 256-bit token is infeasible, but `GET /api/invites/<token>` and the accept endpoint can be called without limit by any logged-in user (design open issue 26).
5. **`SELECT ... FOR UPDATE` does not lock a missing row.** For the "create" path nothing is locked; two concurrent accepts rely on the partial unique index and the local `IntegrityError` retry in `accept_invite`. The concurrent test (`test_two_simultaneous_accepts_end_with_one_active_membership`) runs 5 rounds; it passes, but a race test is probabilistic and cannot prove the absence of the bug.
6. **Guest data can remain after a role change.** A guest who authored a comment earlier (possible after being removed and rejoining as guest) keeps the comment but cannot edit or delete it (403). This is the specified behavior (12.11) and is covered by a test.
7. **Cards created before V6 count as `NOT_STARTED`.** Analytics no longer counts cards in a column named `Done` unless the optional backfill (task 26.2) was run. This is a breaking change in the numbers, called out in the design.

## 3. Behavior changes worth knowing about

- `PATCH /api/users/me` no longer accepts `email` (400) and now accepts `password` with `current_password`. A V5 client that sends `email` will break.
- `require_board_member`, `get_column_for_member`, `get_card_for_member`, `get_comment_for_member`, and `assert_assignee_is_member` no longer exist. Any code outside `app/` that imported them would fail; none did.
- `assert_assignee_is_writer` rejects a guest, a removed member, and a non-participant with 400. Before, any active member could be an assignee.
- Boards made by the `make_board` factory have NULL invite tokens, and cards made by `make_card` get the default `NOT_STARTED`. This models pre-V6 rows on purpose, and the lazy token-creation tests depend on it.
- The OpenAPI document is now version 2.0.0 because of the `PATCH /api/users/me` and analytics changes.

## 4. Test-suite weaknesses

- **Property tests with cheap hashing.** `test_users_properties.py` patches `users.service.hash_password` with a fast pbkdf2 (`fast_hash` fixture) to keep 100 examples quick. The rule under test (current password needed, email fixed) is unaffected, but those properties do not exercise the real scrypt cost. Separate example tests use the real hash.
- **Log assertions use `caplog`, not a real server.** Flask's test client does not emit werkzeug request lines, so `test_invites_accept.py` and `test_v6_deletes_and_logs.py` log a werkzeug-style line themselves and check it is redacted. That proves the filter is installed on the `werkzeug` logger, not what a live `flask run` prints.
- **Duplicated helpers.** `links_url`, `regen_url`, `active_memberships`, and the `tokens` fixture exist in `test_invites.py` and `test_invites_accept.py`; a `members_url` helper is defined in both `test_members.py` and `test_boards_roles.py`. They were duplicated to stay under 300 lines per file. A shared module would be cleaner.
- **Time-dependent tests.** The analytics week-boundary tests compute Monday 00:00 UTC at run time; a run that straddles that instant could flake. Not seen in any run.
- **Runtime.** The full suite takes about 11 minutes, mostly the Hypothesis database tests. `pytest -m "not perf"` and `pytest -m unit` remain the quick options.

## 5. Suggested follow-ups

1. Add `active(Board)` to `_read_tokens` and the lazy `UPDATE` (violation report, G-DB-05).
2. Move `_source_files` and `_is_dynamic_sql` to `tests/helpers.py`.
3. Decide whether the G-BE-09 and G-BE-08 exceptions should become guideline text (a `permissions.get_membership_for_update` helper and a `load_path` helper).
4. Reword G-DB-12 to allow owner-requested migration edits.
5. Consider catching `IntegrityError` on token writes and retrying, if invitation traffic ever grows.
