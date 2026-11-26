# Guideline Violation Report

Violations of `guidelines/backend.md`, `guidelines/database.md`, and `guidelines/frontend.md` found in AI-generated code.
At least 3 entries are required (Requirement 30.5). The backend entries come from the V6 review. The frontend section at the end comes from the task 23.1 review. A separate before/after experiment is in [`guideline-comparison.md`](guideline-comparison.md).

**Scope of the entries below:** the backend V6 work of tasks 25 to 28 (card status, guest role, invitation links, profile password change, analytics rewrite), checked against the guideline checklists after the full test run (`933 passed, 3 skipped`). Design choices and limitations that are not guideline violations are in [`backend-v6-design-notes.md`](backend-v6-design-notes.md).

Status values: **Fixed** (the code now conforms), **Accepted** (a conscious exception, reason given), **Open** (not fixed, recommendation given). No entry is Open at the time of writing.

| Guideline id | File | Violation | Fix applied |
|---|---|---|---|
| G-BE-18 (300-line limit) | `app/tests/test_users.py` (348 lines), `app/tests/test_card_status.py` (424), `app/tests/test_invites.py` (336) | Three new or rewritten test files went over 300 lines. `scripts/check_file_size.py` and `tests/test_file_size.py` caught them. | **Fixed.** Split into `test_users.py` + `test_users_properties.py`, `test_card_status.py` + `test_card_status_properties.py`, and `test_invites.py` + `test_invites_accept.py` + `test_invites_properties.py`. The `fast_hash` fixture moved to `tests/data_fixtures.py`. Check passes (largest backend file: `errors.py`, 282 lines). |
| G-DB-12 (migrations are user-owned) | `app/migrations/versions/16c87666d8d7_v6_schema_update.py` | The agent edited a file in `app/migrations/` (added `ck_cards_status` and the three-role `ck_board_memberships_role`, with reverse steps in `downgrade()`). The guideline says never to create, edit, or delete files there. | **Accepted.** The project owner asked for the edit explicitly, and task 26.1 expects these hand-added constraints because Alembic autogenerate does not detect check constraints. No `flask db` command was run by the agent. Suggest rewording G-DB-12: "never, unless the owner asks for a specific edit". |
| G-DB-05 (active-only reads) | `app/blueprints/boards/service/invite_service.py`: `_read_tokens` and the lazy-creation `UPDATE ... COALESCE` in `get_invite_links` | Both statements select or update `boards` by `board_id` without `is_deleted = false`. | **Fixed.** `active(Board)` added to both statements, so the rule no longer relies on `require_board_admin` running first. Regression test: `test_token_reads_and_lazy_creation_never_touch_a_soft_deleted_board` in `tests/test_invites.py`. |
| G-DB-05 (active-only reads) | `invite_service.generate_unique_token` | The uniqueness probe over `member_invite_token` and `guest_invite_token` deliberately includes soft-deleted boards. | **Accepted.** The unique constraints also cover deleted rows (tokens of a deleted board stay in the table), so ignoring deleted rows would let the probe pass and the insert fail. |
| G-BE-09 (access checks only via `permissions.py`) | `invite_service.current_role` and `accept._attempt` | Both query `board_memberships` directly instead of through a helper in `permissions.py`. | **Accepted, review.** They do not enforce access: the invitation token is the credential, and `current_role` is informational. Accept needs `SELECT ... FOR UPDATE` and the create/upgrade decision in one place. If the guideline is read strictly, move a `get_membership_for_update(board_id, user_id)` helper into `permissions.py`. |
| G-BE-08 (validate input with `load_json`) | `blueprints/boards/routes/invite_routes.py` and `invite_service.regenerate_invite_link` | The `<role>` path segment is validated with `InviteRoleSchema.load(...)` directly, not through `load_json(schema)` (which reads a body or query). | **Accepted.** `load_json` only reads `request.get_json`/`request.args`; a path segment has no equivalent. The schema is still used, and the check runs after the 404/403 checks as the guideline's order requires. Suggest adding a `load_path(schema, **values)` helper to `errors.py` if more path validation appears. |
| G-BE-17 (tests are independent) | `app/tests/test_v6_deletes_and_logs.py` | The module imports `_source_files` and `_is_dynamic_sql` from another test module (`test_hygiene`). Tests do not depend on each other's data, but the modules now depend on each other's private helpers. | **Fixed.** `source_files` and `is_dynamic_sql` (and `APP_DIR`) now live in `tests/helpers.py`; `test_hygiene.py` and `test_v6_deletes_and_logs.py` both import them from there. |

## Frontend and whole-repository review (task 23.1, 2026-11-24)

**Scope:** all of `web/app/`, `web/components/`, `web/hooks/`, `web/lib/`, and `web/e2e/` (including the V6 to V9 components: role context, invite join page, member panel, status control, welcome page, footer), checked against the `guidelines/frontend.md` checklist, plus a repeat of the file-size check for `app/` and `web/`.

**Checks that found nothing:**

| Guideline id | Check | Result |
|---|---|---|
| G-BE-18 | `scripts/check_file_size.py` over `app/` and `web/` | No file over 300 lines. The largest are `app/errors.py` (282) and `web/components/boards/BoardView.tsx` (253). |
| G-FE-03 | Files that define more than one PascalCase function | Two hits, both false positives. `BoardRoleContext.tsx` defines the provider and the `useBoardRole` hook, and `BoardView.tsx` has one component plus the helper `sortColumns`. |
| G-FE-04 (buttons) | Raw `<button>` outside `web/components/shared/` | None. |
| G-FE-06 | Raw `fetch(` outside the client | Only `lib/apiClient.ts` and `lib/refreshSession.ts`, which are the two places the guideline allows. |
| G-FE-08 | Direct `react-hot-toast` imports | Only `lib/toast.ts` and the `<Toaster>` mount in `app/layout.tsx`. |
| G-FE-09 | `document.cookie` writes | Only `lib/authCookie.ts`. |
| G-FE-20 | `dangerouslySetInnerHTML` or `innerHTML` | None. |
| G-FE-22 | `waitForTimeout` in `web/e2e/` | None. |

**Violation found:**

| Guideline id | File | Violation | Fix applied |
|---|---|---|---|
| G-FE-04 (every form inside `BaseModal`) | `web/components/auth/LoginForm.tsx`, `auth/RegisterForm.tsx`, `users/ProfileForm.tsx`, `boards/AddColumnForm.tsx`, `cards/AddCardForm.tsx`, `boards/ColumnHeader.tsx` | These six components render a `<form>` that is not inside a `BaseModal`. The first three are full pages (`/login`, `/register`, `/profile`). The last three are inline board forms (add column, quick-add card, rename column). The forms in `CardDetailModal`, `MemberPanel`, and `CreateBoardModal` do sit inside `BaseModal`. | **Fixed (guideline reworded, V10).** The requirements ask for these forms to be pages or inline: Requirement 21 (inline quick-add card and add column), Requirement 19 (register and login pages), and Requirement 26 (profile page). Moving them into modals would break those requirements, so the guideline was changed instead of the code. G-FE-04 now reads "...and every dialog form inside `BaseModal`...; page forms and inline board forms are exempt from `BaseModal`", and the checklist line matches. The six forms conform, and no code changed. |

**Not re-run:** no code changed in this review, so no test suite needed re-running. The backend entries above were last verified with `933 passed, 3 skipped`.
