# Implementation Plan: Kano

**Version:** V11 (V11 adds tasks 44 to 56 for the URGENT status and label colors, the overdue notification, the card checklist, workspace links, and the Manager role, with 9 tables; V10 relaxed the screenshot set of tasks 23.4 and 23.5 to at least three images in `docs/screenshots/`; V1 to V5 tasks 1 to 22.2 preserved as history; V6 tasks added as 25 to 33; V7 narrows task 33.1; V8 frontend-only tasks added as 34 to 39; V9 footer tasks added as 40 to 43)

## Overview

Kano is built backend first, then frontend, as the user ordered. Phases: 0 foundation and guidelines, 1 backend setup, 2 backend models, 3 manual migrations, 4 backend features with pytest, 5 backend checkpoint, 6 frontend setup, 7 frontend pages, 8 frontend checkpoint, 9 Playwright, 10 deployment, 11 documentation. The design uses concrete languages (Python and TypeScript), so no language question was needed.

**Deviations from the suggested phase order (explained):**

- Phase 0 (guidelines) precedes the backend because the Guidelines govern all later code generation (Requirement 30). Every implementation task must follow `guidelines/backend.md`, `guidelines/database.md`, or `guidelines/frontend.md`. Read the matching file before generating code.
- `permissions.py` is built after the models (task 3.3) because its helpers import the `schema.py` files (design D5). It still comes before the manual migration task because it needs no tables to be written.
- The notifications service (task 10) comes before cards and comments, because `cards/service` and `comments/service` call `notifications/service` (design rule 3 of the module dependency graph). Notification routes and tests are done in the same task.
- Users (task 6) come before auth (task 7), because `auth/service` calls `users/service`.

**Dependency syntax.** Kiro tasks have no per-task dependency field, so ordering is expressed in two ways: `Depends on:` lines in the task text, and the `Task Dependency Graph` waves at the end (a task runs only after all earlier waves finish). Manual tasks carry the `[MANUAL]` prefix and are never run by the agent. Every task that needs database tables says `Depends on: 4.3`. No task generates Flask migration files (Requirement 3.2).

**File size rule.** Every Python and TSX file stays at or below 300 lines (Requirement 30.6, 30.7). Where design section "File size and split rule" plans a package split (boards service, cards service, boards schema, cards routes), split as soon as a file nears 300 lines.

**V6 revision (requirements V6, design V6).** Tasks 1 to 22.2 are completed and stay in this file exactly as written, as history documentation of what was built for V1 to V5. They are not renumbered, reworded, unchecked, or deleted. The pending tasks 22.3 to 22.9, 23.1 to 23.8, and 24 keep their numbers and text; V6 only adds `Depends on:` entries and short "V6 note" lines to them. All new V6 work is added as new top-level phases 25 to 33, because 23 and 24 already exist. Their order is backend first, then frontend: 25 backend models, schema, and permissions; 26 manual V6 migration (user-owned, no agent-generated migration script); 27 backend features with pytest and property tests 44 to 58; 28 backend V6 checkpoint; 29 frontend libraries and shared pieces; 30 frontend pages and components; 31 Playwright and `.env.test` work; 32 V6 frontend checkpoint; 33 final repository rules and pre-deployment manual verification. Because nothing is deployed yet, V6 needs only the local and test database migrations (task 26.1); the production schema created in task 22.4 already includes the V6 columns. Task 22.3 and everything after it now depend on the V6 checkpoint and the V6 repository tasks, so nothing is deployed before the V6 features are complete. Where a V6 task changes code or tests produced by an earlier task, it says "Supersedes the V5 behaviour of task X.Y; X.Y stays as history". Every V6 task follows the same rules as before: read `guidelines/backend.md`, `guidelines/database.md`, or `guidelines/frontend.md` before generating code, keep every file at or below 300 lines, and use the `[MANUAL]` prefix for user-owned tasks.

**V8 revision (requirements V8, design V8, frontend only).** V8 changes the Header logo link, the Welcome_Page, and the board toolbar separator, with their tests and Playwright scenarios. There is no backend task, no migration, and no API change. All tasks 1 to 33.5 stay exactly as written. The new tasks 34 to 39 are appended below task 33.5 and are all unchecked: 34 Header logo and shared authentication check, 35 Welcome_Page, 36 board toolbar and separator, 37 V8 tests, Playwright scenarios, and repository checks, 38 V8 frontend checkpoint, 39 manual browser verification. In the dependency graph the V8 waves run before the deployment waves (22.3 onward), whose entries are unchanged and only moved to later wave ids. Every V8 task reads `guidelines/frontend.md` and `guidelines/design-system.md` first (read only, `guidelines/` is never modified).

**V9 revision (requirements V9, design V9, frontend only).** V9 redesigns the shared Footer (brand group, portfolio text, GitHub and LinkedIn icon links). There is no backend task, migration, or API change. All tasks 1 to 39 stay exactly as written. The new tasks 40 to 43 are appended below task 39 and are all unchecked. Every V9 task starts by reading `guidelines/frontend.md` and `guidelines/design-system.md` (read only) and notes `web/AGENTS.md`: read the relevant Next.js docs in `web/node_modules/next/dist/docs/` before using any Next API (the Footer uses none).

**V11 revision (requirements V11, design V11).** V11 adds Part G of the requirements: the fourth card status `URGENT` and deterministic label colors (R39), a compute-on-read overdue endpoint and UI (R40), the card checklist (R41), workspace links (R42), the Manager role with rank rules (R43), and the V11 schema, migration, and query budget (R44). All tasks 1 to 43 stay exactly as written (text, checkboxes, waves). The new tasks 44 to 56 are appended below task 43 and are all unchecked, in the V6 style: 44 backend models, schema, and permissions; 45 [MANUAL] V11 migration (user-owned, no agent-generated migration script, hand-edited check constraints); 46 backend features with pytest and property tests (including the updates to earlier tests that the V11 rules invalidate); 47 backend V11 checkpoint; 48 [MANUAL] design-system token check; 49 frontend libraries; 50 frontend components; 51 frontend tests; 52 Playwright updates; 53 README and documentation; 54 final checkpoint; 55 [MANUAL] browser verification; 56 [MANUAL] production schema and verification. Breaking change to keep in mind: the role `member` loses Column management (R10.11), so earlier tests and UI that let a `member` create, rename, delete, or reorder Columns are superseded by named V11 tasks. Where a V11 task changes work from an earlier task it says "Supersedes ... task X.Y; X.Y stays as history". Every V11 task reads `guidelines/backend.md` and `guidelines/database.md` (backend) or `guidelines/frontend.md` and `guidelines/design-system.md` (frontend, read only: `guidelines/` is never modified by an agent task) before generating code, keeps every file at or below 300 lines, and notes `web/AGENTS.md` (read the relevant Next.js docs in `web/node_modules/next/dist/docs/` before using any Next API). The new wave ids 86 to 115 are append-only, so they come after the pending deployment waves 67 to 79; see the V11 Notes for the deployment ordering recommendation.

## Tasks

- [x] 1. Phase 0: Repository foundation and guidelines
  - [x] 1.1 Create root `.gitignore` and `.vercelignore`
    - `.gitignore` excludes `.env`, `.env.local`, every `.env*` except `.env.example`, `__pycache__/`, `.next/`, `node_modules/`, `app/venv/`
    - `.vercelignore` excludes `web/`, `app/venv/`, `.kiro/`
    - Do not exclude `web/playwright-report/` (it must be committed)
    - _Requirements: 35.1, 35.3, 35.7_
    - _Design: D1 (Part D), D10_

  - [x] 1.2 Write `guidelines/backend.md`
    - Entries in the fixed format `### G-BE-nn: title` with Rule (one sentence), Rationale (1 to 3 sentences), Kano Example (a path to a concrete Kano file or endpoint)
    - Topics: blueprint package layout and import rules, thin routes and service ownership, Response_Envelope and status mapping, Marshmallow validation at the boundary, permissions through `permissions.py`, 300-line split rule, PEP 8 naming, secrets and CORS from environment
    - _Requirements: 30.1, 30.2, 30.3, 1.15_
    - _Design: D2 (Part D)_

  - [x] 1.3 Write `guidelines/database.md`
    - Entries `### G-DB-nn` in the same three-part format
    - Topics: `<table>_id` UUID keys, named `fk_<child>_<parent>` constraints, SoftDeleteMixin and active-only queries, partial unique indexes, FLOAT order columns, indexes, cascade transactions, migrations are manual
    - No topic may repeat a topic from backend.md or frontend.md
    - _Requirements: 30.1, 30.2, 30.3_
    - _Design: D2 (Part D)_

  - [x] 1.4 Write `guidelines/frontend.md`
    - Entries `### G-FE-nn` in the same three-part format
    - Topics: Server versus Client split, one directory per API resource, one component per file, shared components and `BaseButton` only, `apiClient` only for HTTP, `useErrorHandler` for failures, Tailwind mobile-first and 44 px targets, no `dangerouslySetInnerHTML`
    - Do not add copies under `.kiro/steering/`
    - _Requirements: 30.1, 30.2, 30.3, 28.9_
    - _Design: D2 (Part D)_

  - [x] 1.5 Create placeholder documents for the guideline evidence
    - Create `docs/violation-report.md` with a table header (Guideline id, File, Violation, Fix applied) and `docs/guideline-comparison.md` with a header for before and after violation counts
    - Both are filled in task 23.1 and 23.2; add a short note on how the "without guidelines" sample will be produced
    - _Requirements: 30.4, 30.5_
    - _Design: D2 (Part D)_
    - Depends on: 1.2, 1.3, 1.4

- [x] 2. Phase 1: Backend setup (no database needed)
  - [x] 2.1 Install dependencies and create `app/requirements.txt`
    - Run `py -m pip install` inside the existing `app/venv` for Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, flask-cors, psycopg2-binary, python-dotenv, Gunicorn, pytest, plus Hypothesis (property tests)
    - Write `app/requirements.txt` with each package pinned `name==version` (use `py -m pip freeze` for the chosen set)
    - Create `app/.env.example` with placeholders for `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES=3600`, `JWT_REFRESH_TOKEN_EXPIRES=604800`, `CORS_ORIGINS`, `TEST_DATABASE_URL`
    - Create `app/pytest.ini` with markers `unit`, `e2e`, `perf`
    - Note in a comment or the README draft the Python 3.14 and `psycopg2-binary` wheel risk (design D1 serverless risks)
    - Do not recreate the venv and do not create `app/app.py`
    - _Requirements: 1.10, 1.11, 1.14, 35.2_
    - _Design: A1, Backend folder layout_

  - [x] 2.2 Implement `app/config.py` and `app/extensions.py`
    - `Config.from_env()` loads python-dotenv, requires `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES` (positive integers), `CORS_ORIGINS` (comma-separated list)
    - Raise `ConfigError("Missing required environment variable: NAME")` naming each missing variable and never printing values
    - `extensions.py` holds `db`, `migrate`, `jwt` instances
    - _Requirements: 1.5, 1.12, 1.13, 28.5, 28.6_
    - _Design: A1_

  - [x] 2.3 Implement `app/soft_delete.py` and `app/ordering.py`
    - `SoftDeleteMixin` (`created_at`, `updated_at` with onupdate, `deleted_at`, `is_deleted` default false), `utcnow()`, `active(model)`, `soft_delete_where(...)`, `start_of_week_utc(now)`
    - `ordering.py`: `next_last_order`, `midpoint_order`, `before_first_order`
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 10.1, 11.1, 14.2_
    - _Design: A5, A6, A8_

  - [x] 2.4 Implement `app/errors.py`
    - `ok`, `fail`, `ApiError` family (400, 401, 403, 404, 409), `load_json(schema)` and query loader, error handlers for `ApiError`, `ValidationError`, werkzeug 404 and 405, `IntegrityError` (pgcode mapping), `OperationalError`, `ProgrammingError`, generic `Exception` (rollback, log, generic 500), JWT callbacks (unauthorized, invalid token incl. wrong type, expired, user lookup error) all returning 401 envelopes
    - Messages at most 500 characters, generic for 500, no SQL text
    - `UuidField` and `UtcDateTime` serialization helpers (lowercase 36-character UUID, ISO 8601 ending `Z`)
    - _Requirements: 3.6, 3.7, 4.1, 4.2, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.18, 2.14_
    - _Design: A2_

  - [x] 2.5 Create the eight Blueprint_Package skeletons, `health.py`, and `create_app`
    - Create `app/blueprints/{auth,users,boards,columns,cards,comments,notifications,analytics}/` each with `__init__.py`, `routes.py` (a Blueprint), `service.py`, `schema.py`
    - `app/health.py`: `GET /api/health` returns `{ "data": { "status": "ok" } }` with no database access
    - `app/__init__.py`: `create_app(config_overrides=None)` builds Config, sets JWT lifetimes as `timedelta`, inits db and jwt, registers error handlers, health blueprint and the 8 feature blueprints under `/api`
    - Engine options: `NullPool` when `VERCEL` is set, else `pool_size=5` and `pool_pre_ping=True`
    - Migrate init is added in task 3.4 together with the model imports
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.1, 5.2, 5.3, 5.4_
    - _Design: A1, Backend folder layout_
    - Depends on: 2.2, 2.3, 2.4

  - [x] 2.6 Add `app/wsgi.py`, CORS, and the log filter
    - `wsgi.py` inserts the repository root into `sys.path` and exposes `app = create_app()`
    - `CORS(app, resources={r"/api/*": {...}})` with the configured origins, headers `Authorization` and `Content-Type`, `supports_credentials=False`
    - Logging filter that drops records containing `password` or `Bearer` text; never log request bodies or Authorization headers
    - _Requirements: 1.5, 4.16, 4.17, 28.2_
    - _Design: A1 step 4 and 6, D10_
    - Depends on: 2.5

  - [x] 2.7 Write unit tests for configuration (no database)
    - Property test (Hypothesis, at least 100 examples): **Property 5: Configuration fails fast**
    - Example tests: missing variable named in the message, no value leaked, non-positive expiry rejected, `.env.example` lists every variable the config reads
    - Tag comments `# Feature: kano, Property 5: ...`
    - **Validates: Requirements 1.13, 28.6, 1.12, 1.14**
    - _Requirements: 1.12, 1.13, 1.14, 28.6, 31.1_
    - Depends on: 2.6

  - [x] 2.8 Write unit tests for helpers, envelope, health, and CORS (no database)
    - Tests in `app/tests/`: ordering formulas and edge cases, `start_of_week_utc` (Monday 00:00 UTC, within 7 days), serializers, `ok` and `fail`, unknown path 404 and wrong method 405 envelopes, health 200 within budget and 405 for POST, CORS allow-origin present only for configured origins
    - Property tests: **Property 3: Serialization format**, **Property 4: CORS origin filtering**; partial **Property 1** and **Property 2** on routes that need no database (health, 404, 405)
    - **Validates: Requirements 4.1, 4.2, 4.15, 4.16, 4.17, 4.18, 5.1, 5.3**
    - _Requirements: 4.1, 4.2, 4.15, 4.16, 4.17, 4.18, 5.1, 5.2, 5.3, 5.4, 14.2, 31.1_
    - Depends on: 2.6

- [x] 3. Phase 2: Backend models and permissions (code only, no database needed)
  - [x] 3.1 Define the User, Board, and Board_Membership models
    - `users/schema.py`: `User` with `user_id` UUID PK (`uuid.uuid4`), `name`, `email` (always lowercase), `password_hash`, mixin; check `ck_users_email_lowercase`; partial unique index `uq_users_email_active` where `is_deleted = false`; `normalize_email()` helper
    - `boards/schema.py`: `Board` (`board_id`, `name`, `created_by`) and `BoardMembership` (`board_membership_id`, `board_id`, `user_id`, `role`) with named FKs (`fk_boards_users`, `fk_board_memberships_boards`, `fk_board_memberships_users`), role check constraint, partial unique index on (`board_id`, `user_id`), indexes on `user_id` and `board_id`
    - Relationships use string names and `lazy="raise"`; plan the `boards/schema/` package split when Marshmallow schemas are added
    - Follow G-DB entries
    - _Requirements: 1.4, 1.7, 1.8, 2.2, 2.3, 2.4, 2.5, 2.12, 29.3_
    - _Design: Data Models, D3, D7_
    - Depends on: 2.5

  - [x] 3.2 Define the Column, Card, Comment, and Notification models
    - `columns/schema.py`: `Column` with `order` `db.Float` not null, check `order > 0`, index (`board_id`, `order`)
    - `cards/schema.py`: `Card` with `db.Column(db.Float)` order, `board_id` (denormalized), `column_id`, `assignee_id`, `labels` ARRAY, checks, indexes (`column_id`, `order`), `board_id`, `assignee_id`
    - `comments/schema.py`: `Comment` (content check 1 to 2000, index `card_id`, `created_at`)
    - `notifications/schema.py`: `Notification` (`recipient_id`, `card_id`, `board_id`, `type`, `message` varchar 255, `is_read`), type check, recipient indexes
    - All FKs named `fk_<child>_<parent>`; PKs `<table_singular>_id` UUID
    - _Requirements: 1.4, 2.2, 2.3, 2.4, 2.5, 2.6, 13.4, 29.3_
    - _Design: Data Models, ER diagram, D11_
    - Depends on: 2.5

  - [x] 3.3 Implement `app/permissions.py`
    - `get_board_or_404`, `require_board_member`, `require_board_admin`, `get_column_for_member`, `get_card_for_member`, `get_comment_for_member`, `assert_assignee_is_member`
    - One joined query per helper selecting the resource, its Board, and the caller's active membership; order: 404, then 403 non-member, then 403 non-admin; generic 403 message with no resource data
    - Imports only `schema.py` modules, never a `service.py`
    - _Requirements: 1.6, 28.10, 28.11, 8.6, 8.7, 8.9, 9.12_
    - _Design: A4, D5_
    - Depends on: 3.1, 3.2

  - [x] 3.4 Wire model imports and Flask-Migrate into `create_app`
    - Import every model-defining `schema.py` (users, boards, columns, cards, comments, notifications) before `migrate.init_app(app, db)` so `flask db migrate` detects all 7 tables
    - Do not create any migration file
    - _Requirements: 1.9, 3.1, 3.2_
    - _Design: A1 step 2, Module dependency rule 5_
    - Depends on: 3.1, 3.2, 2.6

  - [x] 3.5 Write model metadata tests (no database)
    - Inspect `db.metadata`: exactly 7 tables, PK names, UUID types, `Card.order` and `Column.order` are Float and not nullable, FK names follow the pattern, partial unique indexes and the indexes of Requirement 29.3 exist, every model has the four soft-delete columns, no `app/models/` directory
    - Import-rule test: no `routes.py` is imported across features; no `service.py` is imported by `permissions.py`
    - _Requirements: 1.4, 1.7, 1.9, 2.2, 2.3, 2.4, 2.5, 2.6, 2.12, 29.3, 31.1_
    - _Design: Data Models, Module dependency direction_
    - Depends on: 3.4

- [x] 4. Phase 3: Manual database setup and migrations (user-owned)
  - [x] 4.1 [MANUAL] Create the local PostgreSQL databases
    - NOT executed by the agent. The user creates the development database and a separate test database whose name ends in `_test`, then copies `app/.env.example` to `app/.env` and sets `DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES`, `CORS_ORIGINS`
    - `TEST_DATABASE_URL` must differ from `DATABASE_URL`
    - Depends on: 3.5
    - _Requirements: 3.3, 31.10_

  - [x] 4.2 [MANUAL] Run `flask db init`, `flask db migrate`, `flask db upgrade` against the development database
    - NOT executed by the agent. From `app/` with the venv active, in that order, against the local development database
    - Check that the 7 tables exist: users, boards, board_memberships, columns, cards, comments, notifications
    - Commit the generated `app/migrations/` yourself; no task generates or edits migration scripts
    - Depends on: 4.1
    - _Requirements: 3.2, 3.3, 3.5_

  - [x] 4.3 [MANUAL] Apply the schema to the test database
    - NOT executed by the agent. Run `flask db upgrade` with `DATABASE_URL` pointed at the `*_test` database
    - When this task is checked, every task marked `Depends on: 4.3` is unblocked
    - Depends on: 4.2
    - _Requirements: 3.3, 3.4, 3.5, 31.9_

- [x] 5. Phase 4a: Backend test infrastructure
  - [x] 5.1 Create `app/tests/conftest.py` and test factories
    - Session start: read `TEST_DATABASE_URL`; refuse to run if it equals `DATABASE_URL` or the database name does not end with `_test`; `pytest.exit("Test database <name> unavailable or schema not applied")` when unreachable or the 7 tables are missing; never use `db.create_all()`
    - Autouse fixture: `TRUNCATE ... RESTART IDENTITY CASCADE` on the 7 tables after each test, so tests are order independent and re-runnable
    - Factories: `make_user`, `make_board` (with admin membership), `make_member`, `make_column`, `make_card`, `make_comment`, `make_notification`, `auth_header(user)` (access token), `refresh_header(user)`, `make_deleted_user(email)` (inserts a `User` row with `is_deleted = true` and `deleted_at` directly)
    - Helper `assert_envelope(response, status)` and a `QueryCounter` using the SQLAlchemy `before_cursor_execute` event
    - _Requirements: 31.2, 31.3, 31.7, 31.8, 31.9, 31.10, 7.7_
    - _Design: Testing Strategy (Backend)_
    - Depends on: 4.3

- [x] 6. Phase 4b: Users
  - [x] 6.1 Implement the users Blueprint_Package
    - `schema.py`: `UserSchema`, `UserUpdateSchema` (`unknown = RAISE`, so `password` fails with 400, at least one of name or email, email normalized by `pre_load`)
    - `service.py`: get profile, update profile (lowercased email, 409 on duplicate among non-deleted users), plus the `jwt.user_lookup_loader` that loads the non-deleted User once per request into `flask.g`
    - `routes.py`: `GET /api/users/me`, `PATCH /api/users/me`
    - No endpoint to delete a user
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 6.9, 2.12_
    - _Design: A3, A11 rows 4 and 5_
    - Depends on: 4.3

  - [x] 6.2 Write pytest tests for users
    - Success and error paths with envelope and status assertions: GET and PATCH profile, 400 for password field, empty name, malformed email, empty body; 409 duplicate email in a different letter case; 401 for no token, wrong-type token, token of a soft-deleted user (via `make_deleted_user`)
    - Property tests: **Property 17: Partial update** (user), **Property 43: Deleted or unknown token subject yields 401**, user part of **Property 9**
    - **Validates: Requirements 7.1 to 7.6, 6.9**
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 31.2, 31.3_
    - Depends on: 6.1, 5.1

- [x] 7. Phase 4c: Authentication
  - [x] 7.1 Implement the auth Blueprint_Package
    - `schema.py`: `RegisterSchema`, `LoginSchema` (email normalized, name 1 to 100, email at most 254, password 8 to 128, `unknown = RAISE`)
    - `service.py`: register (salted `generate_password_hash`, 409 case-insensitive), login (dummy hash check for unknown email, identical 401 message for unknown, wrong password, soft-deleted), refresh (loads non-deleted user, issues access token only), calls `users/service`
    - `routes.py`: `POST /api/auth/register` (201), `POST /api/auth/login` (200 with `access_token`, `refresh_token`, `token_type`, `expires_in`, `refresh_expires_in`, `user`), `POST /api/auth/refresh` with `@jwt_required(refresh=True)` returning `access_token`, `token_type`, `expires_in`
    - Refresh tokens stateless: no rotation, no server storage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 28.1_
    - _Design: A3, A11 rows 2, 3, 3a_
    - Depends on: 6.1

  - [x] 7.2 Write pytest tests for register and login
    - Register: 201, 400 per invalid field (boundaries: name 0, 1, 100, 101; password 7, 8, 128, 129; email 254 and 255), 409 for the same email in another letter case, response has no `password` or `password_hash`
    - Login: 200 shape, 401 identical message for unknown email, wrong password, and soft-deleted user email, 400 for missing or malformed fields
    - Property tests: **Property 9** (email normalization and soft-deleted uniqueness), **Property 10: Password handling**, **Property 11: Register then login round trip**, **Property 12** (auth fields)
    - **Validates: Requirements 6.1 to 6.8, 28.1**
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.8, 28.1, 31.1, 31.2, 31.3_
    - Depends on: 7.1, 5.1

  - [x] 7.3 Write pytest tests for tokens and refresh
    - Login returns access (`type=access`, 3600 s) and refresh (`type=refresh`, 604800 s) tokens with `sub = user_id`, plus `expires_in = 3600` and `refresh_expires_in = 604800`
    - Refresh: 200 and the new token works on `GET /api/users/me`; 401 for an expired token (short test lifetime or patched clock), missing token, malformed token, access token, and refresh token of a soft-deleted user (seed data)
    - A refresh token is rejected with 401 on `GET /api/users/me` and on every other protected endpoint (parametrized); an access token of a soft-deleted user gets 401 on `GET` and `PATCH /api/users/me` and one more protected endpoint
    - Property tests: **Property 36: Token types and lifetimes**, **Property 37: Token type enforcement**, **Property 38: Refresh yields a working access token**, **Property 43**
    - **Validates: Requirements 6.4, 6.5, 6.9 to 6.15, 31.11**
    - _Requirements: 6.4, 6.5, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 4.6, 4.13, 31.11_
    - Depends on: 7.1, 5.1

- [x] 8. Phase 4d: Boards and members
  - [x] 8.1 Implement boards (create, list, detail, update, delete)
    - `boards/schema.py`: `BoardCreateSchema`, `BoardUpdateSchema` (name 1 to 100, not blank), `BoardSchema`, `BoardDetailSchema` with `my_role`
    - `boards/service.py`: create Board and admin membership in one transaction (rollback on failure); list by `created_at` descending; detail with exactly 4 queries (user lookup, board plus membership, columns, cards with assignee `joinedload`); update and delete admin-only; delete cascades Memberships, Columns, Cards, Comments with one `deleted_at` in one transaction (`cascade.py`); read Column, Card, Comment models directly from their `schema.py` (design D4)
    - `routes.py`: `POST/GET /api/boards`, `GET/PATCH/DELETE /api/boards/<uuid:id>`; planned split into `boards/service/` and `boards/schema/` packages when over 300 lines
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 11.16, 2.9, 2.13, 29.2_
    - _Design: A5, A9, A11 rows 6 to 10, D4_
    - Depends on: 3.3, 4.3, 6.1

  - [x] 8.2 Implement board members
    - `MemberAddSchema` (email normalized, at most 254), `MemberSchema`
    - `service`: add by lowercased email (404 unknown, 409 duplicate, 400 invalid), list by creation ascending, remove (400 for self, 404 for non-member); on removal set `assignee_id` to null on that user's non-deleted Cards of the Board in the same transaction
    - `routes`: `POST/GET /api/boards/<uuid:id>/members`, `DELETE /api/boards/<uuid:id>/members/<uuid:user_id>`; admin-only for POST and DELETE, member for GET
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12_
    - _Design: A4, A11 rows 11 to 13_
    - Depends on: 8.1

  - [x] 8.3 Write pytest tests for boards
    - Create makes the creator admin, list order and role, detail columns and cards ordered, 403 for non-member and for non-admin on PATCH and DELETE, 404 for missing, soft-deleted, and non-UUID ids, 400 name boundaries (0, whitespace, 1, 100, 101)
    - Atomic creation test (fault injection after the Board insert leaves no rows, 500 envelope)
    - Property tests: **Property 14: Board creation makes the creator admin**, **Property 15: Server order allocation** (listing order), **Property 8: Cascade atomicity** (Board create part)
    - **Validates: Requirements 8.1 to 8.10**
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 11.16, 31.2, 31.3_
    - Depends on: 8.1, 5.1

  - [x] 8.4 Write pytest tests for members and roles
    - Add (201), 400, 404, 409, list order, remove (200, 400 self, 404), 403 for non-admin and non-member, a removed member gets 403 afterwards, assignee cleared on removal
    - Property tests: **Property 9** (membership uniqueness ignores soft-deleted rows), **Property 18: Assignee must be a member and removal clears assignment** (removal part)
    - **Validates: Requirements 9.1 to 9.12**
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 31.2, 31.3_
    - Depends on: 8.2, 5.1

- [x] 9. Phase 4e: Columns
  - [x] 9.1 Implement the columns Blueprint_Package
    - `schema.py`: `ColumnCreateSchema`, `ColumnUpdateSchema`, `ColumnReorderSchema` (`column_id` UUID, `order` finite float > 0), `ColumnSchema`
    - `service.py`: create with `next_last_order` (1.0 for the first), rename, delete (soft delete Column, its Cards, and their Comments with one `deleted_at`), reorder (400 if the Column is of another Board)
    - `routes.py`: `POST /api/boards/<uuid:id>/columns` (201), `PATCH/DELETE /api/columns/<uuid:id>`, `PATCH /api/boards/<uuid:id>/columns/reorder`; all member-level
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 2.10_
    - _Design: A5, A6, A11 rows 14 to 17_
    - Depends on: 3.3, 4.3, 8.1

  - [x] 9.2 Write pytest tests for columns
    - 201 first order 1.0 and later greater than the maximum, rename, delete cascade to Cards and Comments, reorder success, 400 for another Board's Column, non-UUID id, order 0 or negative, 403 non-member, 404 missing or soft-deleted
    - Property tests: **Property 15: Server order allocation** (columns), **Property 16: Position and reorder persistence** (reorder), **Property 12** (column name boundaries 0, 1, 100, 101)
    - **Validates: Requirements 10.1 to 10.9**
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 31.1, 31.2, 31.3_
    - Depends on: 9.1, 5.1

- [x] 10. Phase 4f: Notifications (before cards and comments, which call it)
  - [x] 10.1 Implement the notifications Blueprint_Package
    - `schema.py`: `NotificationQuerySchema` (`page`, `per_page` integers 1 to 2147483647, `per_page` at most 100, defaults 1 and 20), `NotificationSchema`, `NotificationPageSchema`
    - `service.py`: `create_notification(recipient_id, type, card, message)` with message shortened to at most 255 characters; pure `comment_recipients(author_id, assignee_id, admin_id)`; paginated list newest first (`created_at` desc, `notification_id` desc) with `total` and `unread_count`; idempotent mark read (403 for another user, 404 missing)
    - `routes.py`: `GET /api/notifications`, `PATCH /api/notifications/<uuid:id>/read`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11_
    - _Design: A7, A11 rows 27 and 28_
    - Depends on: 3.3, 4.3

  - [x] 10.2 Write pytest tests for notifications
    - Pure tests of `comment_recipients` (no duplicates, never the author, assignee and admin rules), pagination (defaults, page beyond last, `per_page` 101, `page` 0, non-integer, 2147483648), only own notifications, mark read idempotent, 403 other user, 404 missing, 401
    - Notification rows are seeded through factories
    - Property tests: **Property 21: Notification recipients** (pure part), **Property 22: Notification pagination**, **Property 23: Mark-read idempotence**
    - **Validates: Requirements 13.4 to 13.11**
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 31.2, 31.3_
    - Depends on: 10.1, 5.1

- [x] 11. Phase 4g: Cards
  - [x] 11.1 Implement card create, update, delete, and position
    - `schema.py`: `CardCreateSchema`, `CardUpdateSchema` (partial; title 1 to 200, description at most 5000, ISO due date, labels at most 10 of 1 to 30), `CardPositionSchema` (`column_id` UUID, `order` float > 0), `CardSchema`
    - `service.py`: create with `next_last_order` and `board_id` set from the Column; update only supplied fields; delete soft-deletes the Card and its Comments; position validates the target Column belongs to the same Board and is not deleted (400); assignee must be a member (`assert_assignee_is_member`, 400); assignment notification through `notifications/service` in the same transaction
    - `routes.py`: `POST /api/columns/<uuid:id>/cards` (201), `PATCH/DELETE /api/cards/<uuid:id>`, `PATCH /api/cards/<uuid:id>/position`
    - Plan the split into `cards/service/` (`card_service.py`, `position_service.py`, `search_service.py`) and `cards/routes/`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.15, 13.1, 2.11_
    - _Design: A6, A7, A11 rows 18 to 21_
    - Depends on: 9.1, 10.1

  - [x] 11.2 Implement card search and My Tasks (`GET /api/cards`)
    - `CardQuerySchema`: valid combinations only `assignee=me`, or `q` (1 to 100) with optional `board_id`; anything else 400
    - `search_service.py`: LIKE-escape `\`, `%`, `_`; `ilike` on title or description; join Column, Board, and the caller's active membership; return `board_id`, `board_name`, `column_name`; `board_id` with non-member gives 403; `assignee=me` excludes soft-deleted Cards and Boards
    - _Requirements: 11.10, 11.11, 11.12, 11.13, 11.14, 28.3, 28.4_
    - _Design: A10, A11 row 22_
    - Depends on: 11.1

  - [x] 11.3 Write pytest tests for card CRUD and position
    - 201 order rules, partial update, delete cascade, validation boundaries (title 0, 1, 200, 201; description 5000 and 5001; labels 10 and 11; label length 0, 30, 31; invalid date), assignee not a member 400, position to another Board's Column 400, to a soft-deleted Column 400, non-UUID `column_id` 400, order 0 or negative 400, 403 non-member, 404
    - Property tests: **Property 12** (card fields), **Property 15** (cards), **Property 16** (position), **Property 17** (card partial update), **Property 18** (assignee must be a member)
    - **Validates: Requirements 11.1 to 11.9, 11.15**
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.15, 31.1, 31.2, 31.3_
    - Depends on: 11.1, 5.1

  - [x] 11.4 Write pytest tests for search, My Tasks, and SQL metacharacters
    - Search matches title or description case-insensitively across the caller's Boards only, `board_id` restriction, 403 for a non-member Board, 400 for empty `q`, `q` of 101 characters, invalid `board_id`, no parameters; empty list when none match; `assignee=me` result shape
    - Values containing `%`, `_`, `\`, `'`, `;`, `--` are treated as literal data
    - Property test: **Property 19: Search and My Tasks semantics**
    - **Validates: Requirements 11.10 to 11.14, 28.3, 28.4**
    - _Requirements: 11.10, 11.11, 11.12, 11.13, 11.14, 28.3, 28.4, 31.2_
    - Depends on: 11.2, 5.1

  - [x] 11.5 Write pytest tests for assignment notifications
    - Notification created on create with assignee other than the current user and on assignee change; none for self-assignment or an unchanged assignee; message contains the Card title and is at most 255 characters
    - Property test: **Property 21: Notification recipients** (assignment part)
    - **Validates: Requirements 13.1**
    - _Requirements: 13.1, 13.4, 31.2_
    - Depends on: 11.1, 10.1, 5.1

- [x] 12. Phase 4h: Comments
  - [x] 12.1 Implement the comments Blueprint_Package
    - `schema.py`: `CommentCreateSchema`, `CommentUpdateSchema` (1 to 2000 characters with a non-whitespace character), `CommentSchema` with `author`
    - `service.py`: create (member of the Card's Board), list by creation ascending, update and delete only for the owner (403 for everyone else, including the Board_Admin), notifications through `notifications/service` using `comment_recipients` in the same transaction
    - `routes.py`: `POST/GET /api/cards/<uuid:id>/comments`, `PATCH/DELETE /api/comments/<uuid:id>`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 13.2, 13.3_
    - _Design: A7, A11 rows 23 to 26_
    - Depends on: 11.1, 10.1

  - [x] 12.2 Write pytest tests for comments
    - 201 success, 400 missing content, 400 empty content, 400 whitespace-only, 400 content 2001 characters, 401 unauthenticated, 403 non-owner edit and delete including the Board_Admin, 403 non-member create and list, 404 missing or soft-deleted, empty list 200, ordering
    - Property tests: **Property 20: Comment ownership**, **Property 12** (comment content)
    - **Validates: Requirements 12.1 to 12.9**
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 31.4_
    - Depends on: 12.1, 5.1

  - [x] 12.3 Write pytest tests for comment notifications
    - Assignee notified unless author; Board_Admin notified unless author or already notified as assignee; at most one notification per recipient; author never notified
    - **Validates: Requirements 13.2, 13.3**
    - _Requirements: 13.2, 13.3, 13.4, 31.2_
    - Depends on: 12.1, 5.1

- [x] 13. Phase 4i: Analytics
  - [x] 13.1 Implement the analytics Blueprint_Package
    - `schema.py`: `AnalyticsSchema`
    - `service.py`: SQLAlchemy joins and aggregates only: cards per non-deleted Column (outer join, 0 for empty), completed this week (Column named `Done` case-insensitive, `updated_at` from Monday 00:00 UTC to now, 0 when there is no Done Column), member activity (assigned Cards and Comments per active member); exclude soft-deleted rows everywhere
    - `routes.py`: `GET /api/boards/<uuid:id>/analytics` (admin only)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_
    - _Design: A8, A11 row 29_
    - Depends on: 3.3, 4.3, 11.1, 12.1

  - [x] 13.2 Write pytest tests for analytics
    - Counts per Column including empty Columns, no Done Column gives 0, Done with different letter case, week boundary (Monday 00:00 UTC included, earlier excluded, future excluded), member activity zeros, soft-deleted rows excluded, 403 for a non-admin member, 404, 401
    - Property test: **Property 24: Analytics equals a naive model**
    - **Validates: Requirements 14.1 to 14.9**
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 31.2, 31.3_
    - Depends on: 13.1, 5.1

- [x] 14. Phase 4j: Cross-cutting backend tests
  - [x] 14.1 Write the role and membership enforcement matrix
    - Parametrized non-member, member, admin over Board, Column, Card, Comment, member, update, delete, and analytics endpoints; 403 body contains no data of the target resource; data unchanged after 403
    - Property test: **Property 13: Role and membership enforcement**
    - **Validates: Requirements 28.10, 28.11, 8.6, 8.7, 9.9, 9.10, 10.7, 11.15, 12.8, 14.7**
    - _Requirements: 28.10, 28.11, 31.5_
    - Depends on: 12.1, 13.1, 8.2, 5.1

  - [x] 14.2 Write soft-delete exclusion and cascade tests
    - Soft deleting a Board, a Column, and a Card sets `is_deleted` and the same `deleted_at` on the children, leaves other columns and unrelated rows unchanged, and later GETs return 404; every list, search, count, analytics, and notification query excludes soft-deleted rows; a failed cascade (fault injection) leaves all rows unchanged with a 500 envelope; a soft-deleted email or membership does not block a new row
    - Property tests: **Property 6: Soft-deleted rows never appear**, **Property 7: Soft delete is a cascade that preserves data**, **Property 8: Cascade atomicity**, **Property 9**
    - **Validates: Requirements 2.7 to 2.13, 8.9, 12.9, 13.5, 14.6**
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 31.6_
    - Depends on: 12.1, 13.1, 5.1

  - [x] 14.3 Write envelope, status code, and serialization tests across all endpoints
    - Parametrized over the 29 endpoints (design A11) plus `3a`: assert the body has exactly one top-level key (`data` or `error`), 201 only for the six creating POSTs, 200 elsewhere (DELETE returns a JSON object), each failure type maps to the right status, error messages at most 500 characters, UUID and timestamp formats
    - Unique violation gives 409, FK and NOT NULL violations give 400, no database details in any error body
    - Property tests: **Property 1: Envelope shape**, **Property 2: Status code by outcome**, **Property 3**
    - **Validates: Requirements 4.1 to 4.15**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.18, 2.14, 31.3_
    - Depends on: 12.1, 13.1, 5.1

  - [x] 14.4 Write database failure and server-side hygiene tests
    - Missing table (using a connection to an empty schema or patched session) and unreachable database return the generic 500 envelope, the process keeps serving later requests, the exception is logged
    - Log output contains no `password`, `Bearer`, or token text for 400, 401, and 500 requests; static check that no SQL is built by string formatting (search the `app/` sources for f-strings or `%` formatting passed to `text(`/`execute(`)
    - Test `dangerous` input values (SQL metacharacters) in register and board name fields are stored as literal data
    - _Requirements: 3.6, 3.7, 28.2, 28.3, 28.4, 4.11_
    - _Design: A1 step 6, A2_
    - Depends on: 12.1, 5.1

  - [x] 14.5 Write performance and query-count tests (marker `perf`)
    - Seed 20 Columns and 500 Cards; 100 consecutive `GET /api/boards/<id>` requests, p95 under 500 ms, at most 5 queries and an identical count for 10 and 500 Cards
    - Seed 20 Boards with 2000 Cards for the caller; 100 requests each of `GET /api/cards?q=` and `GET /api/cards?assignee=me`, p95 under 500 ms
    - On failure print the measured p95 in ms and mark the check failed
    - Property test: **Property 25: Constant query count for board detail**
    - **Validates: Requirements 29.1, 29.2, 29.4, 29.5**
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5_
    - Depends on: 11.2, 8.1, 5.1

- [x] 15. Phase 5a: Backend gates
  - [x] 15.1 Add the 300-line file-size check
    - `scripts/check_file_size.py` scans `app/` (excluding `venv/`, `migrations/`) and `web/` (excluding `node_modules/`, `.next/`) for `.py`, `.ts`, `.tsx` files over 300 lines and exits non-zero listing them
    - A pytest wrapper `app/tests/test_file_size.py` runs the script on `app/`; the same script is reused in task 19.1 for `web/`
    - Split any backend file that fails the check into a package whose `__init__.py` keeps `routes`, `service`, and `schema` importable
    - _Requirements: 30.6, 30.7_
    - _Design: File size and split rule_
    - Depends on: 14.5

  - [x] 15.2 [MANUAL] Run the API locally and sanity check it
    - NOT executed by the agent. From `app/`, run `flask run`, then call `GET /api/health`, register, login, and one board call from Postman or `curl`
    - Confirm the responses use the envelope and the status codes of Requirement 4
    - Depends on: 14.5
    - _Requirements: 5.1, 6.1, 6.4, 4.1_

- [x] 16. Backend checkpoint
  - Run `pytest -v` from `app/` against the test database: 0 failures and 0 errors (Requirement 31.8); the file-size test passes
  - Ensure all tests pass, ask the user if questions arise
  - Frontend tasks (17 onward) depend on this checkpoint
  - _Requirements: 31.8_

- [x] 17. Phase 6: Frontend setup, libraries, shared components, and hooks
  - [x] 17.1 Scaffold `web/` and configure tooling
    - Scaffold Next.js (App Router, TypeScript, Tailwind) inside `web/` with no `src/` directory; add `react-hot-toast`, Vitest, jsdom, React Testing Library, fast-check, and Playwright as dependencies
    - `package.json` script `test` is `vitest --run` (no watch); Tailwind scans `app/`, `components/`, `hooks/` (`@source` lines in `globals.css` for Tailwind v4)
    - Create `web/.env.example` with exactly `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL`; create the directories `components/shared`, `components/{auth,boards,cards,comments,notifications,users}`, `hooks`, `lib`, `__tests__`, `e2e`
    - Check the installed Next.js version for the `middleware.ts` versus `proxy.ts` name and record the result in a code comment of task 17.8
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 32.10_
    - _Design: B1, Open issue 9_
    - Depends on: 16

  - [x] 17.2 Create `lib/errors.ts`, `lib/types.ts`, `lib/toast.ts`, and `lib/format.ts`
    - `ApiError` with numeric `statusCode` and string `message`; typed API models of design B10
    - `toast.ts`: `showSuccess`, `showError`, `showLoading` for messages of 1 to 200 characters
    - `format.ts`: `formatBadge(n)` (empty for 0, decimal 1 to 99, `"99+"` above 99), `groupByBoard(cards)`, `diffCardFields(original, edited)`
    - _Requirements: 16.9, 16.10, 24.2, 24.3, 25.1, 23.2_
    - _Design: B5, B10_
    - Depends on: 17.1

  - [x] 17.3 Create `lib/validation.ts` with unit and property tests
    - Validators for name (1 to 100 after trim), email (`local@domain.tld`, at most 254), password (8 to 128), board name, column name, card title (1 to 200), comment text (non-whitespace, at most 2000), profile fields; each mirrors the server rule
    - fast-check test: **Property 29: Client validators mirror server rules**
    - **Validates: Requirements 19.2, 19.7, 20.3, 21.3, 21.7, 23.3, 23.9, 26.3**
    - _Requirements: 19.2, 19.7, 20.3, 21.3, 21.7, 23.3, 23.9, 26.3_
    - Depends on: 17.1

  - [x] 17.4 Create `lib/order.ts` with unit and property tests
    - `computeDropOrder`, `isValidOrder`, `moveCardInState`, `restoreCardInState`, `computeDropIndex`, `LONG_PRESS_MS`, `MOVE_TOLERANCE_PX`, and the pure `touchGestureStep` state machine
    - fast-check tests: **Property 30: Client drop order computation**, **Property 31: Optimistic move and revert**, **Property 41: Touch drop index from the touch point**, **Property 42: Touch gesture state machine**
    - **Validates: Requirements 22.2 to 22.5, 22.8, 22.12 to 22.16**
    - _Requirements: 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.12, 22.13, 22.14, 22.15, 22.16_
    - _Design: B6_
    - Depends on: 17.1

  - [x] 17.5 Create `lib/authCookie.ts` and `lib/serverAuth.ts` with tests
    - Constants `ACCESS_COOKIE` and `REFRESH_COOKIE`; `setAccessCookie(token, expiresIn)`, `setRefreshCookie(token, refreshExpiresIn)`, `getAccessToken`, `getRefreshToken`, `clearAuthCookies`, `decodeJwtExp`, pure `guardDecision`; cookies path `/`, `SameSite=Lax`, not httpOnly; lifetimes come only from the response values (no constants)
    - `serverAuth.ts`: `getServerToken()` using `cookies()` from `next/headers`
    - fast-check test: **Property 28: Route guard decision**; example tests with lifetimes other than 3600 and 604800
    - **Validates: Requirements 17.2, 17.7, 17.8, 17.9, 28.7**
    - _Requirements: 17.2, 17.7, 17.8, 17.9, 17.10, 28.7_
    - _Design: B4_
    - Depends on: 17.1

  - [x] 17.6 Create `lib/refreshSession.ts` and `lib/apiClient.ts` with tests
    - `apiRequest<T>`: base URL from `NEXT_PUBLIC_API_BASE_URL` (browser) or `API_BASE_URL` (server), `ApiError(0, ...)` when missing without sending a request, Bearer header only when a token exists, 10 s timeout and network error as `ApiError(0, ...)`, returns `data`, throws `ApiError(status, error)` or `"Unexpected server response"`
    - Browser only: on 401 with a refresh token (not for login, register, refresh), call single-flight `refreshAccessToken()` once and retry once; refresh 401 or retry 401 calls `sessionExpired()` and throws `ApiError(401)`; network error or 5xx on refresh keeps the cookies
    - Server runtime: never refresh, never write or delete cookies, throw `ApiError(401)` on 401
    - Vitest tests with mocked `fetch`: Authorization present or omitted, `data` returned, ApiError for 400, 401 (no refresh token), 403, 404, 409, 500, one refresh and one retry, concurrent 401s share one refresh, refresh 401 clears both cookies and redirects, login 401 does not refresh, server runtime never refreshes or writes cookies
    - Property tests: **Property 26: API client behavior**, **Property 39: Failed refresh clears the session, shared refresh runs once**, **Property 40: Server-side apiClient never renews**
    - **Validates: Requirements 16.1 to 16.8, 16.14 to 16.18, 32.7, 32.12, 32.14**
    - _Requirements: 15.7, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.14, 16.15, 16.16, 16.17, 16.18, 32.7, 32.9, 32.12, 32.14_
    - _Design: B5_
    - Depends on: 17.2, 17.5

  - [x] 17.7 Create `AuthProvider`, `lib/authContext.ts`, and `hooks/useAuth.ts` with tests
    - `components/auth/AuthProvider.tsx` receives `initialAccessToken` and `initialRefreshToken`; exposes `login`, `logout` (no API call), `updateUser`, `setAccessToken`, `status`; session restore through `GET /api/users/me` (refresh first when only the refresh cookie exists); 401 after the refresh flow clears everything and redirects to `/login`; network error or 5xx keeps cookies and triggers the error handler; registers hooks with `refreshSession`
    - Tests: login sets access cookie lifetime from `expires_in` and refresh cookie lifetime from `refresh_expires_in` (use values other than 3600 and 604800), logout clears both and sends no request, `updateUser` changes only the user, restore success and failure paths
    - **Validates: Requirements 17.1 to 17.6, 17.11, 32.14**
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.11, 32.14_
    - _Design: B4_
    - Depends on: 17.6

  - [x] 17.8 Create `middleware.ts` (or `proxy.ts` if the installed Next version requires it) with tests
    - Matcher excludes `_next`, static files, `favicon.ico`; uses `guardDecision`; on `refresh` posts to `${API_BASE_URL}/api/auth/refresh` with the refresh token, forwards the new access cookie on the request and sets it on the response with `Max-Age` from `expires_in`; 401 redirects to `/login` and deletes both cookies; network error or 5xx redirects to `/login?expired=1`; `/login?expired=1` always allowed and deletes both cookies
    - Tests with a mocked fetch for each decision branch, unauthenticated redirect, authenticated redirect from `/login` and `/register` to `/`
    - **Validates: Requirements 17.7, 17.8, 17.9, 26.7**
    - _Requirements: 17.7, 17.8, 17.9, 26.7_
    - _Design: B4, Open issues 9 and 15_
    - Depends on: 17.5, 17.7

  - [x] 17.9 Create `hooks/useErrorHandler.ts` with tests
    - `handleError(err)`: one toast per call; distinct messages for 400, 401, 403, 404, 409, 500 from a constant map; generic message for any other status or non-ApiError; for 401 clear both cookies and auth state and push `/login`
    - fast-check test: **Property 27: Error handler mapping**
    - **Validates: Requirements 16.11, 16.12, 16.13**
    - _Requirements: 16.11, 16.12, 16.13_
    - _Design: B5_
    - Depends on: 17.7

  - [x] 17.10 Create shared components with tests
    - `components/shared/BaseButton.tsx` (variants `primary` default, `secondary`, `destructive`; disabled ignores click and sets `aria-disabled`; 44 px minimum), `BaseBadge.tsx` (at least 4 color variants, one class map), `BaseModal.tsx` (portal, Escape and backdrop close, content click stays open, focus first focusable or container, Tab trap, focus restore, `role="dialog"`, mobile `max-h-[100dvh] overflow-y-auto`, width inside the viewport), `ConfirmDialog.tsx`, `ErrorPanel.tsx`
    - RTL tests: each BaseButton variant has a distinct class and `onClick` fires once, disabled click ignored; BaseModal absent when closed, present when open, Escape, backdrop, content click, focus in, focus restore
    - **Validates: Requirements 18.1 to 18.12, 32.1, 32.2**
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10, 18.11, 18.12, 27.4, 27.5, 27.6, 32.1, 32.2_
    - _Design: B3, B9_
    - Depends on: 17.1

  - [x] 17.11 Create `Header`, `Footer`, `UserMenu`, and the root layout
    - `components/Header.tsx` (app link, My Tasks link, `UserMenu`, login and register links for anonymous visitors; `NotificationBell` slot added in 17.12), `components/Footer.tsx`, `components/users/UserMenu.tsx` (profile link and logout)
    - `app/layout.tsx` (Server Component): reads both cookies, renders `AuthProvider`, react-hot-toast `Toaster`, one Header and one Footer per page
    - RTL tests: exactly one Header and one Footer, anonymous versus authenticated links, logout action
    - _Requirements: 18.13, 18.6, 15.3_
    - _Design: B1, B3_
    - Depends on: 17.7, 17.10

  - [x] 17.12 Create `useNotifications`, `NotificationBell`, `NotificationList` with tests
    - `hooks/useNotifications.ts`: poll `GET /api/notifications?page=1&per_page=20` on mount and every 30 s while authenticated, keep the previous state silently on a poll error, clear the timer on unmount and logout; `markRead(id)` sets the item read and decreases the count to at least 0, on error the item stays unread and `handleError` fires
    - `NotificationBell` shows `formatBadge(unreadCount)`; `NotificationList` newest first, unread styled differently, empty state; add the bell to `Header`
    - Tests (fake timers): count 1 and 99 shown, hidden at 0, `"99+"`, polling interval, stop on unmount, mark read success and failure
    - Property test: **Property 32: Notification badge and unread count**
    - **Validates: Requirements 24.1 to 24.9, 32.6**
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9, 32.6_
    - _Design: B8_
    - Depends on: 17.9, 17.11

  - [x] 17.13 Create `hooks/useDebouncedValue.ts` with a test
    - Returns the value after a delay (300 ms default)
    - fast-check test with fake timers: **Property 33: Search debounce** (keystroke gaps under 300 ms produce at most one request carrying the final text; clearing sends no request)
    - **Validates: Requirements 21.9, 21.10**
    - _Requirements: 21.9, 21.10_
    - _Design: B6_
    - Depends on: 17.1

  - [x] 17.14 Create `hooks/useDragAndDrop.ts` (mouse and touch) with tests
    - API `{ onDragStart, onDragOver, onDrop, onTouchStart, pendingIds, touchDrag }` with one shared `commitDrop(cardId, columnId, index)`; mouse uses HTML5 drag events; touch uses `touchGestureStep`, a 300 ms long-press, `touchmove` default-prevented only while dragging (non-passive document listeners), `document.elementFromPoint`, throttled by `requestAnimationFrame`, cancels native `dragstart` on touch, cleans listeners and timers on every exit path
    - Drop rules: outside a column or same position sends nothing, invalid order does nothing and calls `handleError`, pending card ignored, otherwise optimistic update then `PATCH /api/cards/<id>/position`, revert and one toast on failure
    - Cards use no `touch-action` that blocks panning (`select-none`, `-webkit-touch-callout: none`)
    - RTL tests (fake timers, mocked `elementFromPoint`, failing mocked request): card moved before the request resolves, revert and one toast on failure, no request outside a column or same position, 300 ms hold starts a drag and `touchmove` is default-prevented, move over 10 px or end or cancel before 300 ms starts nothing, touch end over a column moves the card, touch end outside or `touchcancel` sends nothing
    - **Validates: Requirements 22.1 to 22.17, 32.8, 32.13**
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.10, 22.12, 22.13, 22.14, 22.15, 22.16, 22.17, 32.8, 32.13_
    - _Design: B6_
    - Depends on: 17.4, 17.9

- [x] 18. Phase 7: Frontend pages
  - [x] 18.1 Build `/register` with `RegisterForm`
    - `app/(auth)/register/page.tsx` (Server) and `components/auth/RegisterForm.tsx` (Client, controlled inputs name, email, password)
    - Field errors for empty name after trim, name over 100, bad email, password under 8; no request on invalid input; submit button disabled while pending; 201 redirects to `/login` with a success toast; 409 shows an email-in-use error on the email field; 400, 500, and network errors use `useErrorHandler`; entered values kept
    - RTL tests: empty name, malformed email, 7-character password each show an error and send no request; valid form with 8 characters submits; 409 handling
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 32.3_
    - _Design: B2_
    - Depends on: 17.11, 17.3

  - [x] 18.2 Build `/login` with `LoginForm`
    - `app/(auth)/login/page.tsx` and `components/auth/LoginForm.tsx`; field errors for invalid email and empty password; on 200 call `AuthProvider.login(...)` and push `/`; 401 shows one generic invalid-credentials message and clears the password; other failures use `useErrorHandler` and keep the email
    - RTL tests: empty email, empty password blocked; valid form submits; 401 message and cleared password
    - _Requirements: 19.6, 19.7, 19.8, 19.9, 19.10, 17.2, 32.4_
    - _Design: B2_
    - Depends on: 17.11, 17.3

  - [x] 18.3 Build the `/` Dashboard
    - `app/(boards)/page.tsx` (Server Component, fetches `GET /api/boards` with the access cookie token; a 401 calls `redirect("/login?expired=1")`), `components/boards/BoardList.tsx` (name, role `BaseBadge`, link to `/boards/<id>`), `CreateBoardModal.tsx` (BaseModal, one input, 1 to 100 validation, POST `/api/boards`, close on 201, show the new Board with the admin badge, success toast, keep modal and text on error), empty state with a create button, `ErrorPanel` with retry (`router.refresh()`) for non-401 failures
    - RTL tests: list rendering with badges, validation error with retained text, empty state, error panel
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 17.10_
    - _Design: B2_
    - Depends on: 17.11, 17.3

  - [x] 18.4 Build the Board Detail page shell and Kanban rendering
    - `app/(boards)/boards/[id]/page.tsx` (Server fetch of `GET /api/boards/<id>`), `components/boards/BoardAccessMessage.tsx` (403 access-denied or 404 not-found message with a link to `/`, no columns or cards), `BoardView.tsx` (Client, owns columns state), `KanbanColumn.tsx`, `ColumnHeader.tsx`, `components/cards/CardItem.tsx`
    - Columns and cards sorted by ascending order; Kanban container `flex gap-4 overflow-x-auto`; column `w-72 min-w-[240px] shrink-0`; cards carry `data-column-id` and drag handles wired in 18.5
    - RTL tests: ordering, 403 and 404 messages render no cards
    - _Requirements: 21.1, 21.15, 27.3_
    - _Design: B2, B6, B9_
    - Depends on: 18.3

  - [x] 18.5 Add column and card mutations and drag and drop to the board
    - `AddColumnForm.tsx`, rename and delete controls in `ColumnHeader` (confirm through `ConfirmDialog`), `components/cards/AddCardForm.tsx`; state updates only after success; validation (name 1 to 100, title 1 to 200) with field errors and no request; errors leave state unchanged and call `handleError`
    - Wire `useDragAndDrop` into `BoardView`, `KanbanColumn`, and `CardItem` (mouse and touch); reload shows the new position
    - RTL tests: add, rename, delete column; add card; validation errors; error keeps state
    - _Requirements: 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 22.1, 22.6, 22.11, 22.12_
    - _Design: B6_
    - Depends on: 18.4, 17.14

  - [x] 18.6 Add card search to the board
    - `components/boards/CardSearchInput.tsx` using `useDebouncedValue(…, 300)`; send `GET /api/cards?q=<text>&board_id=<id>` after the debounce, cancel the previous request with `AbortController`, ignore stale responses, show only matches, show a no-results message, and restore the full board when cleared without a request
    - RTL tests with fake timers: one request after 300 ms, clear restores, empty result message
    - _Requirements: 21.9, 21.10, 21.11_
    - _Design: B6_
    - Depends on: 18.5, 17.13

  - [x] 18.7 Add the member management panel
    - `components/boards/MemberPanel.tsx` shown only when `my_role === "admin"`: list members, add by email (validation, 404, 409, 400 messages), remove with confirmation; members controls and analytics link hidden for non-admin members
    - RTL tests: panel visible for admin only, add and remove flows, error handling
    - _Requirements: 21.12, 21.13, 9.1, 9.5, 9.6_
    - _Design: B6_
    - Depends on: 18.5

  - [x] 18.8 Add the analytics view
    - `components/boards/AnalyticsView.tsx` opened from the admin-only link; fetches `GET /api/boards/<id>/analytics` and shows cards per column, completed this week, and per-member assigned cards and comments; an error shows an inline message and calls `useErrorHandler`
    - RTL tests: rendering and error state
    - _Requirements: 21.14, 21.16_
    - _Design: B6_
    - Depends on: 18.5

  - [x] 18.9 Build `CardDetailModal` and the comments UI
    - `components/cards/CardDetailModal.tsx` (BaseModal, shows title, description, due date, labels, assignee within 300 ms; edit form sends only changed fields with `diffCardFields`; title 1 to 200 validation; keeps modal and values on error; delete with `ConfirmDialog`; assignee select from the members list)
    - `components/comments/CommentList.tsx`, `CommentItem.tsx`, `CommentForm.tsx`: load, loading, empty and error states; add appends and clears the input; whitespace-only blocked; edit and delete only for owned comments (also hidden for the Board_Admin when not the author); state changes only after success
    - RTL tests: owned versus not owned controls, add, edit, delete, errors, empty state
    - Property tests: **Property 34: Owned-comment controls and My Tasks grouping** (comment part), **Property 35: Changed-fields diff** (component use)
    - **Validates: Requirements 23.1 to 23.16, 32.5**
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9, 23.10, 23.11, 23.12, 23.13, 23.14, 23.15, 23.16, 32.5_
    - _Design: B7_
    - Depends on: 18.5

  - [x] 18.10 Build `/my-tasks`
    - `app/(cards)/my-tasks/page.tsx` (Server fetch of `GET /api/cards?assignee=me`), `components/cards/MyTasksList.tsx` grouped by `board_name`; each task shows title, local due date or a "no due date" indicator, column name, and a link to `/boards/<id>`; loading indicator, empty state, and error message with toast
    - RTL tests and **Property 34** (grouping part)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_
    - _Design: B2_
    - Depends on: 17.11, 17.2

  - [x] 18.11 Build `/profile`
    - `app/(users)/profile/page.tsx` and `components/users/ProfileForm.tsx`: pre-filled name and email from AuthContext, no password field, validation (name 1 to 100, email at most 254), PATCH `/api/users/me`, button disabled while pending, `updateUser` on success with a toast, 409 shows an email-in-use error and leaves the user unchanged, other errors use `useErrorHandler` and keep the values
    - RTL tests for each branch
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7_
    - _Design: B2_
    - Depends on: 17.11, 17.3

  - [x] 18.12 Responsive pass at 375 px
    - Review every page and component against design B9: no horizontal overflow except in the Kanban container, `flex-wrap` and `min-w-0`, stacked form controls below `md`, 44 px tap targets, modal limits, content reachable below 375 px
    - Add RTL class-based assertions where practical (full viewport checks are done by Playwright in 21.4)
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8_
    - _Design: B9_
    - Depends on: 18.6, 18.7, 18.8, 18.9, 18.10, 18.11

- [x] 19. Phase 8a: Frontend gates
  - [x] 19.1 Add frontend repository rule tests
    - `web/__tests__/repo-rules.test.ts`: no `dangerouslySetInnerHTML` under `web/`, no native `<button` outside `BaseButton`, one component per file in `components/`, call `scripts/check_file_size.py` for `web/` (300 lines)
    - Split any failing file
    - _Requirements: 28.9, 18.6, 30.6, 30.7_
    - _Design: B1, File size rule_
    - Depends on: 18.12, 15.1

- [x] 20. Frontend checkpoint
  - Run `npm test` from `web/` (single run, exit code 0, no network and no running API) and `npm run build` (exit code 0 with `.env.local` from `.env.example`, zero TypeScript errors)
  - Ensure all tests pass, ask the user if questions arise
  - Playwright and later phases depend on this checkpoint
  - _Requirements: 15.6, 32.9, 32.10, 32.11_

- [x] 21. Phase 9: Playwright end-to-end suite
  - [x] 21.1 Create `web/playwright.config.ts`
    - Read `E2E_BASE_URL`; throw before any test starts with a message naming the variable when it is missing or not an absolute http or https URL
    - `use.baseURL`, `expect.timeout = 10_000`, `timeout = 60_000`, `retries` at most 2, HTML reporter to `playwright-report` with `open: "never"`; a second project with a 375 px viewport
    - Add npm scripts for `npx playwright test` and the report
    - _Requirements: 33.1, 33.2, 33.7, 33.8_
    - _Design: Testing Strategy (Playwright)_
    - Depends on: 20

  - [x] 21.2 Write the auth E2E scenarios (4 tests)
    - Valid login redirects to `/`; invalid credentials show the error and stay on `/login`; an unauthenticated visit to `/` redirects to `/login`; logout redirects to `/login` and a following visit to `/` redirects again
    - Use unique users created per run; only auto-waiting locators and web-first assertions
    - _Requirements: 33.3, 33.6_
    - Depends on: 21.1

  - [x] 21.3 Write the Kanban journey E2E (8 steps, mouse drag)
    - One serial test with 8 `test.step` blocks: register a unique user (`e2e+<timestamp>@example.com`), log in, create a Board, add 2 Columns, create a Card in the first, drag it to the second with `dragTo`, reload and confirm the Card is in the second Column, add a Comment then edit it and confirm the new text
    - `test.describe.configure({ mode: "serial" })` so remaining steps skip after a failure
    - _Requirements: 33.4, 33.5, 33.6, 22.11_
    - _Design: Testing Strategy (Playwright)_
    - Depends on: 21.1

  - [x] 21.4 Write the mobile viewport E2E checks (375 px)
    - Assert no horizontal overflow outside the Kanban container on Dashboard, Board Detail, My Tasks, Profile, Register, Login; no overlapping interactive elements; tap targets at least 44 by 44 px; modal height within the viewport
    - Do not repeat the drag step on mobile (touch drag is checked manually in 22.8)
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6_
    - _Design: B9_
    - Depends on: 21.1

  - [x] 21.5 Add a check that forbids `waitForTimeout`
    - Unit test or script `web/__tests__/no-wait-for-timeout.test.ts` that fails when any file in `web/e2e/` contains `waitForTimeout`
    - _Requirements: 33.6_
    - Depends on: 21.2, 21.3, 21.4

- [ ] 22. Phase 10: Deployment
  - [x] 22.1 Add deployment configuration files
    - Root `vercel.json` routing `/(.*)` to `app/wsgi.py` with `@vercel/python`; confirm `NullPool` is used when `VERCEL` is set; add a `.python-version` or runtime pin if the Python 3.14 and `psycopg2-binary` check shows Vercel does not support it
    - Ensure `app/.env.example` and `web/.env.example` list every variable read
    - _Requirements: 34.1, 34.7, 35.2, 1.14, 15.5_
    - _Design: D1, D10_
    - Depends on: 20

  - [x] 22.2 Write the deployment guide `docs/deployment.md`
    - Two Vercel projects (backend project root is the repository root with `vercel.json`; frontend root directory `web/`), environment variable table of design D1, manual migration steps, verification order, serverless risks (pooling, cold start for the 500 ms health check, Python 3.14 wheels), and the optional Railway section (Gunicorn start command `gunicorn "app.wsgi:app" --bind 0.0.0.0:$PORT --workers 2`, env variable names, generated public URL)
    - Note that Vercel deployment protection must be off so both URLs work without a Vercel login
    - _Requirements: 34.1, 34.2, 34.3, 34.7_
    - _Design: D1_
    - Depends on: 22.1

  - [ ] 22.3 [MANUAL] Create the Vercel projects and the production database
    - NOT executed by the agent. Create a managed PostgreSQL database with a pooled `DATABASE_URL` (`sslmode=require`), the `kano-api` Vercel project (repository root) and the `kano-web` project (root `web/`), and set the environment variables of design D1 (`DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES=3600`, `JWT_REFRESH_TOKEN_EXPIRES=604800`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`)
    - Make both URLs reachable over HTTPS without a Vercel login
    - V6 note: nothing is deployed before the V6 features are complete. Deployment starts only after the V6 checkpoint (32), the V6 repository tasks 33.1 and 33.2, and the manual verification 33.3.
    - Depends on: 32, 33.1, 33.2, 33.3
    - Depends on: 22.2
    - _Requirements: 34.1, 34.7_

  - [ ] 22.4 [MANUAL] Apply the schema to the production database
    - NOT executed by the agent. Run `flask db upgrade` from a local shell with `DATABASE_URL` pointed at the production database, before verifying the deployed API
    - Until this is done, database endpoints return the generic 500 envelope
    - V6 note: the migration history in `app/migrations/` already contains the V6 migration of task 26.1 (new `boards` and `cards` columns, hand-added check constraints `ck_cards_status` and the three-role `ck_board_memberships_role`), so this single `flask db upgrade` creates the complete V6 schema on the empty production database. No separate V6 production migration exists.
    - Depends on: 26.1
    - Depends on: 22.3
    - _Requirements: 34.3, 34.10_

  - [ ] 22.5 [MANUAL] Set the CORS origin and redeploy
    - NOT executed by the agent. Set `CORS_ORIGINS` on `kano-api` to the exact public URL of `kano-web` (no trailing slash), set both API URLs on `kano-web`, and redeploy both projects
    - A blocked CORS request makes the verification fail until this is corrected
    - Depends on: 22.4
    - _Requirements: 34.7, 34.9_

  - [ ] 22.6 [MANUAL] Verify the deployed API with Postman
    - NOT executed by the agent. Against the public API URL: `GET /api/health` (200), `POST /api/auth/register` (201), `POST /api/auth/login` (200 with `access_token` and `refresh_token`), then one request for each of the eight groups (auth, boards, columns, cards, comments, notifications, analytics, users), each with the envelope body
    - Save the Postman run screenshot for task 23.4 (optional since V10: Requirement 36.10 needs at least three screenshots of any Kano_Web subjects)
    - V6 note: also call GET `/api/boards/<id>/invite-links` as the admin, GET `/api/invites/<token>` and POST `/api/invites/<token>/accept` with a second account, PATCH `/api/cards/<id>` with `status`, and PATCH `/api/users/me` with `current_password`; every response keeps the envelope.
    - Depends on: 22.5
    - _Requirements: 34.4, 34.5_

  - [ ] 22.7 [MANUAL] Verify the deployed web app at desktop and mobile widths
    - NOT executed by the agent. Open Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, and Login against the deployed API with no failed network requests and no console errors; run the full journey (register, login, board, columns, card, drag, comment add and edit, search, notification bell) at 1280 px and at 375 px without an error toast or error page
    - V6 note: the walk-through also covers the welcome page, the invite link join (member and guest) and the guest read-only board, card status, and the profile password change, at 1280 px and at 375 px.
    - Depends on: 22.6
    - _Requirements: 34.6, 34.8_

  - [ ] 22.8 [MANUAL] Check touch drag in browser device mode
    - NOT executed by the agent. In browser DevTools device mode at 375 px (and on a real phone if available) hold a Card for about 300 ms, drag to another Column, confirm the move persists after reload, and confirm that plain swipes still scroll the page and the board
    - Depends on: 22.7
    - _Requirements: 22.12, 22.13, 22.14, 22.15, 22.17, 27.8, 34.8_

  - [ ] 22.9 [MANUAL] Run Playwright against the live URL and commit the report
    - NOT executed by the agent (needs the live URL). Set `E2E_BASE_URL` to the Vercel frontend URL, run `npx playwright install` and `npx playwright test` from `web/`; all tests pass with exit code 0; commit `web/playwright-report/`; confirm `npx playwright show-report` opens it
    - V6 note: the run needs `web/.env.test` (copy of `web/.env.test.example`) with `E2E_BASE_URL` set to the Vercel frontend URL, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` of an account that already exists on the production database (manual task 33.5). The V6 specs of tasks 31.2 to 31.9 run in this suite.
    - Depends on: 22.8, 21.5, 31.9, 33.4, 33.5
    - _Requirements: 33.1, 33.8, 33.9_

- [ ] 23. Phase 11: Documentation and repository hygiene
  - [x] 23.1 Complete `docs/violation-report.md`
    - Review the generated code in `app/` and `web/` against the Guidelines; list at least 3 violations found, each with the violated guideline id, the file, and the fix applied; apply the fixes in code and re-run the affected tests
    - Record only violations that were actually found
    - _Requirements: 30.5_
    - V6 note: the review also covers the V6 code (tasks 25 to 31), for example the role helpers, the invitation module, and the new frontend components.
    - Depends on: 22.9, 1.5, 32

  - [x] 23.2 Complete `docs/guideline-comparison.md`
    - Compare at least one AI-generated output produced without the Guidelines with the same output produced with the Guidelines; show the violation count of each version, with the count lower in the "after" version
    - Save the "without guidelines" sample in `docs/samples/`
    - _Requirements: 30.4_
    - Depends on: 23.1

  - [ ] 23.3 Write `README.md` (all sections except final screenshots)
    - Sections Overview (what Kano is in 1 to 5 sentences, the two public URLs), AI Workflow Summary (seven subsections of at least 3 sentences: project brief, Kiro specifications, Guidelines authoring and use, review against the Guidelines, violations, Antigravity, Claude Code tests and documentation, with links to `guidelines/`, `docs/violation-report.md`, `docs/guideline-comparison.md`), Features (all 12 feature entries), Technologies (full list incl. Railway as optional, Kiro, Antigravity, Claude Code), Local Run Steps (9 numbered steps in the required order, prerequisite versions, local URLs, `flask db upgrade` marked as a manual step), Test Steps (`pytest -v`, `npm test`, `npx playwright install`, `npx playwright test`, `npx playwright show-report`, and the `E2E_BASE_URL` variable), Security note (non-httpOnly access and refresh cookies, XSS exposure of both tokens, the 7-day refresh token raises the impact, stateless refresh tokens cannot be revoked on logout, mitigations)
    - The Antigravity subsection must describe how it was actually used; ask the user if this is unknown
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 36.6, 36.7, 36.8, 36.9, 36.11, 28.8, 6.15_
    - _Design: D3_
    - V6 note: the Features list must also name card status, board invitation links with the guest role, and the welcome page. Test Steps must document `web/.env.test` (created from `web/.env.test.example`) with `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` and the need for a pre-existing account. Local Run Steps must state that the V6 schema changes need `flask db migrate` and `flask db upgrade` as a manual Migration_Step, including the hand-added check constraints. The Security note adds the invite-token exposure (design open issue 22). Requirements 36.13.
    - Depends on: 23.2, 22.9, 26.1, 31.9
    - Status (2026-11-24): `README.md` written with every section. Open until the owner fills in the three TODO placeholders: the two public URLs (needs 22.3), the Antigravity subsection, and the Claude Code subsection.

  - [x] 23.4 [MANUAL] Capture the screenshots
    - NOT executed by the agent. Save into `docs/screenshots/`: Postman run covering all eight groups against the public URL, Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, Login, a Card being dragged between Columns, the notification bell with an unread count above zero, and the Playwright HTML report with all tests passed
    - Depends on: 22.9
    - _Requirements: 36.10_
    - V6 note: the screenshots may also include the welcome page, the invite links panel in the member panel, and the status control in the Card Detail Modal.
    - Depends on: 33.3
    - V10 note: Requirement 36.10 now needs at least three screenshots of Kano_Web in use, so the list above is optional. The three captured images (welcome page, Dashboard, Board Detail) are in `docs/screenshots/`. They were first saved in `documentations/` and moved in V10.

  - [x] 23.5 Embed the screenshots in the README and check links
    - Add the Screenshots section with each image and a caption naming its subject; add a script or test that verifies every relative link and image path in `README.md` resolves to an existing file
    - _Requirements: 36.10, 36.12, 36.5_
    - Depends on: 23.3, 23.4
    - Status (2026-11-24, V9): the Screenshots section embedded the 3 images from `documentations/`, and `scripts/check_readme_links.py` passed. The task stayed open because Requirement 36.10 V9 listed 11 subjects.
    - V10 status (2026-11-24): complete. Requirement 36.10 now needs at least three screenshots, the images are in `docs/screenshots/`, the README paths point there, and `scripts/check_readme_links.py` passes.

  - [x] 23.6 Verify and complete the CHANGELOG refinement history
    - `CHANGELOG.md` must hold at least 5 refinement entries, each with the before text, the after text, the version number, and the date (V2 to V5 already contain entries; count them and add the missing before and after text if fewer than 5 qualify)
    - Never remove historical entries
    - _Requirements: 35.6_
    - Depends on: 22.9

  - [x] 23.7 Add a repository hygiene check script
    - `scripts/check_repo_hygiene.py`: `.gitignore` rules present, both `.env.example` files list every variable the code reads, no tracked `.env*` file other than `.env.example`, a secrets scan of tracked files (JWT secret, database password, API key patterns), spec documents exist in `.kiro/specs/kano/`, `guidelines/` has the three files and `.kiro/steering/` has no copies
    - Run it and fix findings
    - V6 note: the script also checks that `.env.test` is git-ignored and `.env.test.example` is tracked (`git check-ignore` semantics), that `web/.env.test.example` lists `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`, that no tracked `.env.test` exists, and that no file in `web/e2e/` contains a literal credential (reuse the scanner of task 31.9).
    - Depends on: 33.1, 33.2, 31.9
    - _Requirements: 35.1, 35.2, 35.3, 35.5, 35.7, 30.1_
    - Depends on: 22.9

  - [x] 23.8 [MANUAL] Check the Git history and rotate secrets if needed
    - NOT executed by the agent. Confirm each of the six phases (specification writing, guideline authoring, backend implementation, frontend implementation, testing, deployment) has at least one commit whose message names the phase, and that no real secret exists in any commit; if one does, remove it from history and rotate it
    - Depends on: 23.7, 23.5
    - _Requirements: 35.3, 35.4, 35.7_
    - V6 note: also confirm that no commit contains `web/.env.test` or real E2E credentials, and that the V6 work (tasks 25 to 33) appears in commits whose messages name the phase.

- [x] 24. Final checkpoint
  - Run `pytest -v` from `app/`, `npm test` and `npm run build` from `web/`, `scripts/check_file_size.py`, and `scripts/check_repo_hygiene.py`; confirm the committed Playwright report and the README links
  - V6 note: the run includes the V6 backend and frontend tests (properties 44 to 58) and the no-literal-credentials check of `web/e2e/`.
  - Depends on: 32, 23.8
  - Ensure all tests pass, ask the user if questions arise

- [x] 25. Phase 12 (V6): Backend models, schema, and permissions (code only)
  - [x] 25.1 Add the V6 Card columns and the pure status rule
    - `cards/schema.py`: add `status` (String(20), not null, default and server default `NOT_STARTED`), nullable `completed_at` (timestamptz), and the check constraint `ck_cards_status` (`status IN ('NOT_STARTED','IN_PROGRESS','DONE')`)
    - Create `cards/service/status.py` with `CARD_STATUSES` and the pure function `apply_status_change(old_status, old_completed_at, new_status, now)` (no database import); if the cards service is still one `service.py`, convert it to the `cards/service/` package of the split rule and keep `from app.blueprints.cards import service` importable
    - Supersedes the V5 Card model of task 3.2; 3.2 stays as history
    - Read `guidelines/backend.md` and `guidelines/database.md` first
    - _Requirements: 2.16, 11.2, 11.19, 11.24_
    - _Design: A13, D14, Data Models (Card model)_
    - Depends on: 3.2, 11.1

  - [x] 25.2 Add the V6 Board token columns and the three-role membership check
    - `boards/schema`: add `member_invite_token` and `guest_invite_token` (varchar(128), nullable) with the named unique constraints `uq_boards_member_invite_token` and `uq_boards_guest_invite_token`; change the `ck_board_memberships_role` definition to allow `admin`, `member`, and `guest`; keep the partial unique index `uq_board_memberships_board_user_active` unchanged
    - Add no table; split `boards/schema` into the planned package (`models.py`, `board_schemas.py`, `member_schemas.py`, `invite_schemas.py`) when it nears 300 lines
    - Supersedes the V5 Board and Board_Membership models of task 3.1; 3.1 stays as history
    - _Requirements: 2.15, 2.17, 37.1, 37.2_
    - _Design: D13, A14 (storage), Data Models (V6 schema changes)_
    - Depends on: 3.1, 8.1

  - [x] 25.3 Add role levels and role-aware helpers to `permissions.py`
    - Add `ROLE_RANK`, `LEVEL_RANK`, and the pure `role_allows(role, level)`; add `require_board_reader`, `require_board_writer`, `get_column_for_writer`, `get_card_for_reader`, `get_card_for_writer`, `get_comment_for_reader`, `get_comment_for_writer`, and `assert_assignee_is_writer`; keep `require_board_admin`
    - One joined query per helper; check order 404, then 403 without membership, then 403 for role; generic 403 message with no resource data; the old helper names stay until task 25.4 migrates every call site
    - Supersedes the V5 helpers of task 3.3; 3.3 stays as history
    - _Requirements: 8.11, 8.12, 9.13, 9.14, 10.10, 11.22, 11.23, 12.10, 12.11, 28.14, 37.14_
    - _Design: A4-V6, D12_
    - Depends on: 3.3, 25.2

  - [x] 25.4 Migrate every service call site to the V6 helpers
    - boards: detail and members list use the reader helper; board update and delete, member add and remove use the admin helper; columns, cards (create, update, delete, position), and comments (create) use the writer helpers; comment update and delete run the writer check and then the owner check; comment and card reads use the reader helpers; card search joins a membership of any role; assignee checks use `assert_assignee_is_writer`
    - Remove `require_board_member`, `get_column_for_member`, `get_card_for_member`, `get_comment_for_member`, and `assert_assignee_is_member` after the last call site is migrated
    - V5 tests that assert the old behaviour are updated by the V6 test tasks 27.2, 27.4, 27.10, and 27.11
    - Supersedes the role checks of tasks 8.1, 8.2, 9.1, 11.1, 11.2, 12.1; those stay as history
    - _Requirements: 8.11, 8.12, 9.13, 9.14, 10.10, 11.11, 11.13, 11.22, 11.23, 12.8, 12.10, 12.11, 28.10, 28.14_
    - _Design: A4-V6 (helper and matrix tables), A10, D12_
    - Depends on: 25.3, 25.1

  - [x] 25.5 Add the pure invitation helpers and the invite-token log redaction
    - `boards/service/accept.py`: pure `resolve_accept(existing_role, token_role)` returning `(resulting_role, action)`; `boards/service/invite_service.py`: `new_invite_token()` (`secrets.token_urlsafe(32)`) and the token format regex `^[A-Za-z0-9_-]{43,128}$`
    - `redact_invite_tokens(text)` replaces `/api/invites/<token>` and `/invite/<token>` (20 or more URL-safe characters) with the same prefix plus `<redacted>`; extend the logging filter of task 2.6 so it applies this function to the formatted message of every record on the root and `werkzeug` loggers
    - _Requirements: 28.12, 28.13, 37.2, 37.11, 37.12_
    - _Design: A12-V6, A14 (accept decision), A1 step 6_
    - Depends on: 2.6, 25.2

  - [x] 25.6 Update the model metadata tests for the V6 columns and role check (no database)
    - Update `app/tests/` metadata tests: still exactly 7 tables; `cards.status` (not null, default `NOT_STARTED`) and `cards.completed_at` (nullable); `boards` token columns nullable with the two unique constraints; the `ck_cards_status` and the three-role `ck_board_memberships_role` constraints are defined on the models; no new table
    - Supersedes the V5 assertions of task 3.5 about the role check and the column list; 3.5 stays as history
    - _Requirements: 1.9, 2.15, 2.16, 2.17, 31.1_
    - _Design: Data Models, ER diagram_
    - Depends on: 25.1, 25.2

  - [x] 25.7 Write property test for the status transition rule (pure)
    - **Property 44: Status and completed_at transition rule**
    - Hypothesis, at least 100 examples, over statuses, optional new status, and increasing timestamps; assert `completed_at` set on entering `DONE`, cleared on leaving `DONE`, unchanged for `DONE` to `DONE` and for omitted status, and `completed_at is not None` iff status is `DONE`
    - **Validates: Requirements 11.18, 11.19, 11.24**
    - _Requirements: 11.18, 11.19, 11.24, 31.17_
    - Depends on: 25.1

  - [x] 25.8 Write property test for the accept decision (pure)
    - **Property 50: Accept decision never lowers a role**
    - Hypothesis over all pairs of existing role (none, guest, member, admin) and token role (member, guest); assert the table of design A14, no downgrade, admin stays admin
    - **Validates: Requirements 37.11, 37.12**
    - _Requirements: 37.11, 37.12, 31.17_
    - Depends on: 25.5

  - [x] 25.9 Write tests for `role_allows` and the helper level table (pure part)
    - **Property 47: Guest never writes (role by endpoint matrix)**, pure part: `role_allows(role, level)` is true iff the rank of the role is at least the rank of the level, over roles guest, member, admin, and none and levels reader, writer, and admin
    - The database-backed endpoint matrix is task 27.11
    - **Validates: Requirements 8.11, 8.12, 28.14**
    - _Requirements: 8.11, 8.12, 28.14, 31.15, 31.17_
    - Depends on: 25.3

  - [x] 25.10 Write property test for invite-token log redaction (pure)
    - **Property 57: Invite tokens never reach the logs**
    - Hypothesis over messages containing `/api/invites/<token>` or `/invite/<token>` with tokens of 20 or more URL-safe characters: the token is absent from the output and the rest of the message is kept; strings without such a path are unchanged
    - **Validates: Requirements 28.13**
    - _Requirements: 28.13, 31.16_
    - Depends on: 25.5

- [x] 26. Phase 13 (V6): Manual database migration (user-owned)
  - [x] 26.1 [MANUAL] Run the V6 `flask db migrate` and `flask db upgrade` on the development and test databases
    - NOT executed by the agent, and no agent-generated migration script. From `app/` with the venv active, run `flask db migrate -m "v6 status invites guest"` against the development database
    - Review the generated script and add by hand what Alembic autogenerate does not detect: the check constraint `ck_cards_status` (`op.create_check_constraint("ck_cards_status", "cards", "status IN ('NOT_STARTED','IN_PROGRESS','DONE')")`) and the replacement of `ck_board_memberships_role` with the three-role version (`op.drop_constraint("ck_board_memberships_role", "board_memberships")` then `op.create_check_constraint(...)` allowing `admin`, `member`, `guest`), with the reverse steps in `downgrade()`; confirm the new `boards` token columns with their unique constraints and the `cards.status` server default `NOT_STARTED`
    - Run `flask db upgrade` on the development database, then run `flask db upgrade` with `DATABASE_URL` pointed at the `*_test` database; check that exactly the 7 tables exist and commit `app/migrations/` yourself
    - When this task is checked, every task marked `Depends on: 26.1` is unblocked. No production migration is needed for V6: the first production `flask db upgrade` (task 22.4) applies the whole history including this migration
    - Depends on: 25.1, 25.2, 25.4, 25.6
    - _Requirements: 3.8, 3.9, 2.15, 2.16, 2.17_
    - _Design: Manual migration dependency (V6), Data Models (V6 schema changes and migration)_

  - [x] 26.2 [MANUAL] Optional: backfill `status` and `completed_at` for cards in a Column named `Done`
    - NOT executed by the agent and not required. Run the SQL of design "V6 schema changes and migration" only if cards that sit in a Column named `Done` (case-insensitive) should count as completed in the analytics; skip it on an empty database
    - Without it, existing cards keep `NOT_STARTED` and null `completed_at`
    - Depends on: 26.1
    - _Requirements: 3.10, 11.24_
    - _Design: Data Models (optional backfill SQL), Open issue 24_

- [x] 27. Phase 14 (V6): Backend features and pytest tests
  - [x] 27.1 Rewrite PATCH `/api/users/me` (name and password with `current_password`, email fixed)
    - `users/schema.py`: `UserUpdateSchema` with `name` (1 to 100), `password` (8 to 128), `current_password` (load only, non-empty), and an explicit `email` field whose validator always raises `email cannot be changed`; `@validates_schema` rejects a body with neither `name` nor `password`, a `current_password` without `password`, and a `password` without `current_password`
    - `users/service.update_me`: verify `current_password` with `check_password_hash` first (400 naming `current_password`, nothing saved, never 403), then set `name`, then `password_hash` through `users/service.hash_password`, one commit; no token invalidation; the log filter keeps dropping `password` and `current_password`
    - Supersedes the V5 behaviour of task 6.1 (email update accepted, password rejected); 6.1 stays as history
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.8, 2.12_
    - _Design: A3 (V6 change), A11 row 5_
    - Depends on: 26.1, 25.4

  - [x] 27.2 Update the users tests for the V6 PATCH contract
    - Supersedes the V5 behaviour tested in task 6.2 (email update, 409 duplicate email on PATCH, password field rejected); 6.2 stays as history
    - Cover: name boundaries 0, 1, 100, 101; password boundaries 7, 8, 128, 129 with a correct `current_password`, then a login with the new password and a failing login with the old one; 400 naming `current_password` for a wrong or missing value with the name unchanged even when the body also has a valid name; 400 naming `email` for any `email` value including the current email; empty body 400; GET still 401 for deleted-user and wrong-type tokens; no password, `current_password`, or hash in responses or captured logs
    - Property tests: **Property 54: Profile update never changes the email and needs the current password**; **Property 17: Partial update** (user part: only `name` and `password` are updatable); **Property 9** user part reduced to registration and add-member matching; **Property 43** re-run for both user endpoints
    - **Validates: Requirements 7.2 to 7.8**
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 31.12, 31.17_
    - _Design: A3, Correctness Properties 9, 17, 43, 54_
    - Depends on: 27.1

  - [x] 27.3 Add card status to the cards service and schemas
    - `CardCreateSchema` does not declare `status` (so `unknown = RAISE` returns 400 naming `status`); the service always stores `NOT_STARTED` and null `completed_at` on create
    - `CardUpdateSchema.status` is `fields.String(validate=OneOf(CARD_STATUSES), allow_none=False)`; the update calls `apply_status_change` once inside the same UPDATE and transaction as the other fields; `completed_at` is never accepted from the client
    - `position_service` never reads or writes `status` or `completed_at`, including a move into a Column named `Done`; `CardSchema`, `CardSearchSchema`, and the board detail include `status` and `completed_at`; assignee checks use `assert_assignee_is_writer`
    - Supersedes the V5 behaviour of tasks 11.1 and 11.2 for Card fields and assignee; 11.1 and 11.2 stay as history
    - _Requirements: 11.2, 11.4, 11.5, 11.17, 11.18, 11.19, 11.20, 11.21, 11.22, 11.23, 11.24_
    - _Design: A13, A10, A11 rows 18, 19, 22_
    - Depends on: 25.4, 26.1

  - [x] 27.4 Update and extend the cards tests for status, assignee, and guests
    - Supersedes the V5 tests of tasks 11.3 and 11.5 where they assume that any member can be assignee, that the card fields have no status, or that a partial update changes only the supplied fields; 11.3, 11.4, and 11.5 stay as history
    - Cover: default `NOT_STARTED` and null `completed_at`; 400 for `status` in the create body; 400 for `done`, an empty string, null, and an unknown value on PATCH; `completed_at` rules including `DONE` to `DONE`; `status` and `completed_at` in board detail, search, and My Tasks; a position change (including into a Column named `Done`, any letter case) leaves both unchanged; guest as assignee 400; removed member and non-participant as assignee 400; no Notification row for a user whose only role is `guest`; accepting an invitation creates no Notification
    - Property tests: **Property 44** (stateful PATCH sequences against the database), **Property 45: Status validation and position independence**, **Property 48: Assignee must be admin or member, guests are never notified**, **Property 17** (card part: a status change also moves `completed_at`), **Property 12** (status values)
    - **Validates: Requirements 11.4, 11.17 to 11.24, 13.12**
    - _Requirements: 11.4, 11.5, 11.17, 11.18, 11.19, 11.20, 11.21, 11.22, 11.24, 13.12, 31.13, 31.17_
    - _Design: A13, A7 (V6 change), Correctness Properties 12, 17, 44, 45, 48_
    - Depends on: 27.3

  - [x] 27.5 Rewrite the analytics service for the status rule and guests
    - `analytics/service.py`: completed this week counts non-deleted Cards with `status = 'DONE'` and `completed_at` from `start_of_week_utc(now)` (inclusive) to `now` (inclusive), whatever their Column, with no join to `columns`; cards per Column still count every non-deleted Card; member activity lists only memberships with role `admin` or `member`
    - Supersedes the V5 behaviour of task 13.1 (Column named `Done` and `updated_at`); 13.1 stays as history
    - _Requirements: 14.2, 14.3, 14.4, 14.6, 14.10_
    - _Design: A8 (V6 change), D14_
    - Depends on: 25.1, 26.1

  - [x] 27.6 Update the analytics tests for the V6 definition
    - Supersedes the V5 tests of task 13.2 (completed through the Column named `Done`); 13.2 stays as history
    - Cover: `DONE` at Monday 00:00:00 UTC counted and one second earlier not; `DONE` in a Column not named `Done` counted; a Column named `Done` with another status not counted; soft-deleted `DONE` not counted; no `DONE` card gives 0; guests excluded from member activity; 403 for member, guest, and non-participant; 404; 401
    - Property test: **Property 46: Analytics equals a naive model (V6 definition)**
    - **Validates: Requirements 14.1 to 14.10**
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6, 14.7, 14.10, 31.14_
    - _Design: A8, Correctness Property 46_
    - Depends on: 27.5

  - [x] 27.7 Create both invite tokens with the Board and expose the guest role in Board responses
    - `boards/service.create_board` generates both tokens (retrying on a unique collision up to 3 times) and inserts the admin membership in one transaction; any failure rolls back all of them
    - Board detail returns `my_role` `guest` for guests; the members list returns the role `guest`; removing a guest membership follows the member removal rules; Board detail still runs exactly 4 queries
    - Supersedes the V5 behaviour of tasks 8.1 and 8.2 for creation and roles; 8.1 and 8.2 stay as history
    - _Requirements: 8.10, 8.11, 9.13, 9.15, 37.3_
    - _Design: A14 (generation), A9, A11 rows 6, 8, 12_
    - Depends on: 25.4, 26.1

  - [x] 27.8 Implement the invitation links and accept endpoints
    - `invite_schemas.py`: `InviteLinksSchema`, `InviteRoleSchema` (`member` or `guest`), `InviteTokenSchema`, `InviteInfoSchema`, `AcceptResultSchema`
    - `invite_service.py`: lazy creation with `COALESCE` for NULL tokens, regenerate (new token for one role only, old token invalid at once), `find_board_by_token` (format check first, 404 for malformed, unknown, replaced, or soft-deleted Board), `accept.py` accept transaction (`SELECT ... FOR UPDATE`, `resolve_accept`, create, conditional upgrade, `IntegrityError` caught locally and re-read so concurrent accepts end with one active membership)
    - `invite_routes.py` on the boards blueprint: GET `/api/boards/<uuid:id>/invite-links` (admin), POST `/api/boards/<uuid:id>/invite-links/<role>/regenerate` (admin, 200), GET `/api/invites/<token>` (200), POST `/api/invites/<token>/accept` (200 in every case); services never put a token into an exception message
    - _Requirements: 37.3 to 37.13, 37.21, 37.23, 4.3, 28.12_
    - _Design: A14, A11 rows 30 to 33, A12-V6_
    - Depends on: 27.7, 25.5

  - [x] 27.9 Write pytest tests for invitations and accept
    - Tokens created with the Board and lazily for a Board with NULL tokens; token format and uniqueness; invite-links and regenerate for the admin and 403 for member, guest, and non-participant; 400 for a bad role; regenerate invalidates the old token (404) and leaves the other role's token and all memberships; accept creates `member` and `guest` memberships; guest upgraded by the member token; no downgrade of member or admin; repeated accept idempotent; accept after a soft-deleted membership creates a new active row and leaves the old row unchanged; 404 for unknown, malformed, and soft-deleted-Board tokens; 401 without a token and with a refresh token; no Notification created; a two-thread concurrent accept ends with one active row; log capture contains no token for 400, 401, 403, 404, and 500 invite requests
    - Property tests: **Property 49: Invite tokens are well formed, unique, and regeneration invalidates**, **Property 51: Accept is idempotent and keeps one active membership**, **Property 57** (integration: captured logs)
    - **Validates: Requirements 37.2 to 37.13, 37.21, 37.23, 28.13**
    - _Requirements: 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.9, 37.10, 37.11, 37.12, 37.13, 37.21, 37.23, 28.13, 31.16, 31.17_
    - _Design: A14, Correctness Properties 49, 51, 57_
    - Depends on: 27.8

  - [x] 27.10 Update the board and member tests for roles, tokens, and guests
    - Supersedes the V5 tests of tasks 8.3 and 8.4; 8.3 and 8.4 stay as history
    - Cover: creation also creates both tokens and the atomic-creation fault injection leaves no Board, membership, or token; detail returns `my_role` `guest` and the same Columns and Cards; members list includes `guest` rows; the admin removes a guest (200) and a guest cannot add or remove (403); a removed guest gets 403 afterwards; assignee cleared on removal; membership uniqueness ignores soft-deleted rows for all three roles
    - Property tests: **Property 14**, **Property 8** (Board creation part including tokens), **Property 9** (membership uniqueness), **Property 18** (removal part)
    - **Validates: Requirements 8.1, 8.10, 8.11, 9.1 to 9.15**
    - _Requirements: 8.1, 8.10, 8.11, 8.12, 9.5, 9.13, 9.14, 9.15, 31.15_
    - _Design: A4-V6, A14, Correctness Properties 8, 9, 14, 18_
    - Depends on: 27.7

  - [x] 27.11 Update the role and membership enforcement matrix for the guest role
    - Supersedes the V5 matrix of task 14.1 (non-member, member, admin only); 14.1 stays as history
    - Parametrize admin, member, guest, and non-participant over every endpoint of the matrix in design A4-V6 (Board, members, Columns, Cards, Comments, analytics, invite-links, regenerate, search): a guest gets 403 on every write endpoint with the data unchanged and the body free of resource data, 200 on the read endpoints; a guest who authored an old Comment still gets 403 on PATCH and DELETE
    - Property tests: **Property 47: Guest never writes (role by endpoint matrix)** (database-backed part), **Property 13: Role and membership enforcement** (updated: member means admin or member)
    - **Validates: Requirements 8.11, 8.12, 9.13, 9.14, 10.10, 11.23, 12.10, 12.11, 14.10, 28.14, 37.14**
    - _Requirements: 8.12, 9.14, 10.10, 11.23, 12.10, 12.11, 14.10, 28.14, 37.5, 37.14, 31.15_
    - _Design: A4-V6 (matrix), Correctness Properties 13, 47_
    - Depends on: 27.8, 27.3, 27.5

  - [x] 27.12 Write database-level V6 schema tests
    - Against the test database after task 26.1: `ck_cards_status` rejects an unknown status, the three-role `ck_board_memberships_role` accepts `guest` and rejects another value, the two token unique constraints allow many NULLs and reject a duplicate token, a `cards` insert without status gets `NOT_STARTED`, and `information_schema` lists exactly the 7 tables
    - A failure message tells the user to review the hand-added check constraints of task 26.1
    - _Requirements: 2.15, 2.16, 2.17, 3.9, 31.16_
    - _Design: Data Models (V6 schema changes and migration), Open issue 24_
    - Depends on: 26.1

  - [x] 27.13 Update the envelope, status code, and serialization tests for the V6 endpoints
    - Supersedes the V5 endpoint list of task 14.3 (29 endpoints plus 3a); 14.3 stays as history
    - Parametrize over the 33 endpoint rows of design A11 plus 3a: exactly one top-level key, 201 only for the six creating POSTs (regenerate and accept return 200), 200 elsewhere, each failure type maps to the right status (including 400 for `email` in PATCH `/api/users/me` and for `status` on card create), UUID and timestamp formats, `completed_at` format
    - Property tests: **Property 1: Envelope shape**, **Property 2: Status code by outcome**, **Property 3: Serialization format** (updated)
    - **Validates: Requirements 4.1 to 4.18**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.15, 31.3_
    - _Design: A11, Correctness Properties 1, 2, 3_
    - Depends on: 27.8, 27.1, 27.3

  - [x] 27.14 Update the soft-delete, hygiene, and log tests for V6
    - Supersedes the V5 coverage of tasks 14.2 and 14.4 where V6 adds behaviour; 14.2 and 14.4 stay as history
    - Cover: soft-deleting a Board makes its invite tokens answer 404 and cascades guest memberships; soft-deleted `DONE` cards are excluded from analytics; log capture contains no `current_password`, password, token, or hash for failing PATCH `/api/users/me` requests; the static scan for SQL built by string formatting also covers the new invite and analytics code
    - Property tests: **Property 6** and **Property 7** re-run with Cards that have a status and Boards that have tokens
    - _Requirements: 2.7 to 2.11, 7.8, 28.2, 28.3, 28.13, 37.10, 31.6_
    - _Design: A5, A12-V6, Correctness Properties 6, 7_
    - Depends on: 27.8

  - [x] 27.15 Update the performance and query-count tests for V6
    - Supersedes the V5 tests of task 14.5; 14.5 stays as history
    - Board detail with 20 Columns and 500 Cards still runs at most 5 queries with the V6 role helper and the extra card fields, and the count is identical for 10 and 500 Cards; p95 under 500 ms for 100 requests; GET invite-links with lazy token creation stays within a fixed query count; search and `assignee=me` stay under 500 ms for 2000 Cards with status
    - Property test: **Property 25: Constant query count for board detail** (re-run)
    - _Requirements: 29.1, 29.2, 29.4, 29.5_
    - _Design: A9, Correctness Property 25_
    - Depends on: 27.7, 27.3, 25.4

- [x] 28. V6 backend checkpoint
  - Run `pytest -v` from `app/` against the test database after task 26.1: 0 failures and 0 errors, including the file-size test of task 15.1 (split any backend file over 300 lines)
  - Ensure all tests pass, ask the user if questions arise
  - Frontend V6 tasks (29 onward) depend on this checkpoint
  - Depends on: 25.7, 25.8, 25.9, 25.10, 27.2, 27.4, 27.6, 27.9, 27.10, 27.11, 27.12, 27.13, 27.14, 27.15
  - _Requirements: 31.8, 30.6, 30.7_

- [x] 29. Phase 15 (V6): Frontend libraries and shared pieces
  - [x] 29.1 Add the V6 types and the pure libraries `status.ts`, `roles.ts`, `inviteRoles.ts`, and `nextParam.ts`
    - `lib/types.ts`: `Role` includes `guest`, `CardStatus`, `Card` gains `status` and `completed_at`, plus `InviteLink`, `InviteLinks`, `InviteInfo`, `AcceptResult`, `ProfileUpdate` (never `email`)
    - `lib/status.ts` (`CARD_STATUSES`, `STATUS_LABEL`, `STATUS_VARIANT`, `isCardStatus`), `lib/roles.ts` (`canEdit`, `isAdmin`, `isGuest`, `ROLE_VARIANT`), `lib/inviteRoles.ts` (`acceptOutcome`, the twin of `resolve_accept`), `lib/nextParam.ts` (`safeNext`, `withNext`)
    - Supersedes the V5 types of task 17.2; 17.2 stays as history
    - _Requirements: 19.11, 21.22, 23.17, 37.15, 37.18_
    - _Design: B10 (V6 additions), B7-V6 (`lib/status.ts`), B6-V6 (`lib/roles.ts`), B4-V6 (`safeNext`)_
    - Depends on: 28

  - [x] 29.2 Write property test for `safeNext`
    - **Property 52: Safe `next` parameter**
    - fast-check: valid `/invite/<1 to 128 URL-safe characters>` accepted; absolute and protocol-relative URLs, backslashes, extra slashes, query strings, fragments, percent sequences, whitespace, and other paths return null; the post-login target is `safeNext(next) ?? "/"`
    - **Validates: Requirements 19.8, 19.11, 28.15**
    - _Requirements: 19.8, 19.11, 28.15, 32.19_
    - Depends on: 29.1

  - [x] 29.3 Write tests for `status.ts`, `roles.ts`, and `inviteRoles.ts`
    - **Property 50** (TypeScript twin): `acceptOutcome` equals the Python `resolve_accept` table over all role pairs; **Property 56: Status labels, badges, and moves** (label and variant part): the three labels "Not started", "In progress", "Done" and the three variants are pairwise distinct; `canEdit`, `isAdmin`, `isGuest` over all roles
    - **Validates: Requirements 21.22, 23.17, 37.12, 37.19**
    - _Requirements: 21.22, 23.17, 25.2, 37.12, 37.19, 32.19_
    - Depends on: 29.1

  - [x] 29.4 Update `lib/validation.ts` for the profile and re-run the validator property test
    - Add `validateNewPassword` (8 to 128), `validateCurrentPassword` (non-empty), and `validatePasswordSection(cur, next)` (both empty ok; exactly one filled errors on the empty one; both filled validate each); the email validator stays for register and login and is no longer used by the profile page
    - Supersedes the V5 behaviour of task 17.3 (profile email validator); 17.3 stays as history
    - Property test: **Property 29: Client validators mirror server rules** (updated with the new validators)
    - **Validates: Requirements 26.3**
    - _Requirements: 26.3, 26.6, 32.15_
    - _Design: B11, Correctness Property 29_
    - Depends on: 28

  - [x] 29.5 Replace `guardDecision` with `decideRoute` and add the welcome cookie helpers
    - `lib/decideRoute.ts`: `classifyPath`, `INVITE_PATH_RE`, and the pure `decideRoute({ pathname, auth, welcomeSeen })` with the table of design B4-V6; `lib/authCookie.ts`: add `WELCOME_COOKIE`, `getWelcomeSeen`, `setWelcomeCookie` (`kano_welcome_seen=1`, Max-Age 31536000, path `/`, `SameSite=Lax`, not httpOnly); `clearAuthCookies` never touches the welcome cookie
    - Delete `guardDecision` from `lib/authCookie.ts` and move its test cases to `decideRoute`, so only one decision function exists
    - Supersedes the V5 behaviour of task 17.5 (`guardDecision`, Property 28); 17.5 stays as history
    - _Requirements: 17.8, 17.9, 17.12, 17.13, 38.4 to 38.13_
    - _Design: B4-V6, D15, Open issue 28_
    - Depends on: 28

  - [x] 29.6 Write property test for `decideRoute`
    - **Property 53: Route decision with welcome cookie and invite paths**
    - fast-check over every combination of path class (`/`, `/welcome`, `/login`, `/register`, `/invite/<token>` with generated tokens, malformed invite path, other protected path), auth state, and cookie flag; plus tests that logout keeps the welcome cookie
    - **Validates: Requirements 17.7, 17.8, 17.9, 17.12, 17.13, 37.20, 38.5 to 38.12**
    - _Requirements: 17.12, 17.13, 37.20, 38.5, 38.6, 38.7, 38.8, 38.9, 38.10, 38.11, 38.12, 38.13, 32.19_
    - Depends on: 29.5

  - [x] 29.7 Update the proxy (`web/proxy.ts`) to use `decideRoute`
    - Compute `auth` from the cookies, call `decideRoute`, perform `refresh-then-continue` (forward the new access cookie on the request and the response), re-evaluate with `auth: "unauthenticated"` after a 401 refresh (delete both auth cookies, invite paths keep `next`, `/` goes to `/welcome` or `/login` by the cookie), network error or 5xx still goes to `/login?expired=1`, and set `kano_welcome_seen` when `setWelcomeCookie` is true; `/login?expired=1` keeps the loop guard
    - Update the proxy tests with a mocked fetch for every decision branch including the invite path with an expired access cookie and a valid refresh cookie
    - Supersedes the V5 behaviour of task 17.8; 17.8 stays as history
    - _Requirements: 17.7, 17.8, 17.9, 17.13, 37.20, 38.5 to 38.12_
    - _Design: B4-V6, Open issue 32_
    - Depends on: 29.5

  - [x] 29.8 Add the invite page headers in `next.config.ts` with a test
    - `headers()` sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/invite/:path*`; a unit test reads the exported config and asserts both headers for that source
    - _Requirements: 28.13, 37.18_
    - _Design: B1 (`next.config.ts`), Open issue 22_
    - Depends on: 28

  - [x] 29.9 Create the shared `StatusBadge` component with a test
    - `components/shared/StatusBadge.tsx` renders `BaseBadge` with `STATUS_LABEL` and `STATUS_VARIANT`; it is the only place a status becomes text
    - RTL test: each of the three statuses renders its label and a distinct variant class
    - _Requirements: 21.22, 25.2, 18.4_
    - _Design: B3 (`StatusBadge`), B7-V6_
    - Depends on: 29.1

  - [x] 29.10 Update `diffCardFields` and the order reducers for status
    - `lib/format.ts`: `diffCardFields` also compares `status`, so a status-only change produces exactly `{ status }`; `lib/order.ts`: `moveCardInState` and `restoreCardInState` copy every field except `column_id` and `order` unchanged
    - Supersedes the V5 behaviour of tasks 17.2 (`diffCardFields`) and 17.4 (reducers); 17.2 and 17.4 stay as history
    - Property tests: **Property 35: Changed-fields diff** (updated), **Property 56: Status labels, badges, and moves** (move part), **Property 31** re-run
    - **Validates: Requirements 23.2, 23.18, 21.23, 22.19**
    - _Requirements: 23.2, 23.18, 21.23, 22.19_
    - _Design: B6-V6, B7-V6, Correctness Properties 31, 35, 56_
    - Depends on: 29.1

  - [x] 29.11 Add `enabled` to `useDragAndDrop` and test the guest case
    - `useDragAndDrop({ enabled })`: when false return the same shape with every handler undefined and `touchDrag = null`, and `commitDrop` returns early, so no drag starts, no state changes, and no request is sent for any mouse or touch sequence; when true behave as before and send only `column_id` and `order`
    - Supersedes the V5 behaviour of task 17.14; 17.14 stays as history
    - Property test: **Property 55: Guest UI has no edit controls and starts no drag** (hook part)
    - **Validates: Requirements 22.18, 22.19**
    - _Requirements: 22.18, 22.19, 21.23_
    - _Design: B6-V6, Correctness Property 55_
    - Depends on: 29.10

- [x] 30. Phase 16 (V6): Frontend pages and components
  - [x] 30.1 Add `BoardRoleContext` and role gating to the board components
    - `components/boards/BoardRoleContext.tsx` provides `{ role, canEdit, isAdmin }` from `my_role`; `BoardView`, `KanbanColumn`, `ColumnHeader`, `AddColumnForm`, `AddCardForm`, `CardSearchInput`, and `CardItem` read it; a guest sees the "Guest" `BaseBadge`, no add-column, add-card, rename, delete, or drag controls (no `draggable`, no touch handler), keeps the search input, and `CardItem` shows `StatusBadge`
    - Pass `enabled = canEdit` to `useDragAndDrop`
    - RTL tests: admin and member see the controls, guest does not, drag of a card changes no badge
    - Supersedes the V5 behaviour of tasks 18.4 and 18.5; 18.4 and 18.5 stay as history
    - Property test: **Property 55: Guest UI has no edit controls and starts no drag** (render part)
    - **Validates: Requirements 21.20, 21.22, 21.23, 22.18**
    - _Requirements: 21.12, 21.13, 21.20, 21.22, 21.23, 22.18, 37.17_
    - _Design: B6-V6, B2, Correctness Property 55_
    - Depends on: 29.9, 29.11, 29.1

  - [x] 30.2 Rebuild `CardDetailModal` with the status control and the guest read-only view
    - Split into `CardDetailModal.tsx` (shell and save logic), `CardDetailForm.tsx`, and `StatusSelect.tsx` (native select with exactly "Not started", "In progress", "Done", preselected); the PATCH sends only changed fields including `status`; on 200 call `onCardUpdated(card)` so the board badge updates; on error keep the modal open, the entered values, and the previous status
    - Assignee options are `members.filter(m => m.role !== "guest")`; when `canEdit` is false every field and the status select are disabled and the save, delete, comment form, and comment edit and delete controls are hidden (`CommentList readOnly`) while comments still load; support `isNew` with a single Save button and an empty diff closing without a request
    - RTL tests: three options with the current status preselected, status-only PATCH body, badge update, failing PATCH keeps the previous status, guest view
    - Supersedes the V5 behaviour of task 18.9; 18.9 stays as history
    - Property tests: **Property 35**, **Property 55** (modal part), **Property 56** (badge part)
    - **Validates: Requirements 23.17 to 23.22**
    - _Requirements: 23.1, 23.2, 23.17, 23.18, 23.19, 23.20, 23.21, 23.22, 32.16_
    - _Design: B7-V6, Correctness Properties 35, 55, 56_
    - Depends on: 30.1, 29.9, 29.10

  - [x] 30.3 Implement the new-card flow
    - `AddCardForm` still asks only for the title and returns the created Card to `BoardView`, which appends it to its column and opens `CardDetailModal` with `isNew`; a failed creation opens no modal and shows no card; closing the modal without saving keeps the title-only card with status `NOT_STARTED`
    - RTL tests for the three states of the diagram in design B6-V6
    - Supersedes the V5 add-card behaviour of task 18.5 (no modal after creation); 18.5 stays as history
    - _Requirements: 21.6, 21.7, 21.17, 21.18, 21.19, 23.22, 32.17_
    - _Design: B6-V6 (new-card flow state diagram)_
    - Depends on: 30.2

  - [x] 30.4 Rebuild the member panel with the invitation links
    - Split `MemberPanel.tsx` into `MemberPanel.tsx` (shell), `MemberList.tsx` (role `BaseBadge` per row and remove control for every non-admin row including guests), `AddMemberForm.tsx`, `InviteLinksPanel.tsx`, and `InviteLinkRow.tsx`; the panel renders only for the admin
    - `InviteLinksPanel` calls GET `/api/boards/<id>/invite-links` on mount and shows "Member link: can edit" and "Guest link: view only" with the full URL in a read-only selectable field, a copy `BaseButton` (`navigator.clipboard.writeText` in `try/catch`: success toast, failure error toast with the URL still visible), and a regenerate `BaseButton` that opens `ConfirmDialog` and replaces the token only after a 200 (error: old link stays, `handleError`)
    - RTL tests: panel and links only for the admin, copy success and failure, regenerate confirm and error, guest rows removable
    - Supersedes the V5 behaviour of task 18.7; 18.7 stays as history
    - _Requirements: 21.12, 21.13, 21.21, 37.15, 37.16, 37.17, 32.18_
    - _Design: B6-V6 (member panel and invitation links), B1_
    - Depends on: 30.1, 29.1

  - [x] 30.5 Build the `/invite/[token]` page
    - `app/invite/[token]/page.tsx` (Server: reject a token that fails the token format with the not-found message, else fetch GET `/api/invites/<token>` with the server token; 401 calls `redirect("/login?expired=1")`) and `components/boards/InviteJoinCard.tsx` (Client): board name, "Member: can edit" or "Guest: view only", a Join `BaseButton` disabled while POST accept runs, redirect to `/boards/<board_id>` with a success toast on 200; when `acceptOutcome` is `none` and `current_role` is set show the current role and an open-board link instead; a 404 shows the not-found message with a link to `/` and no Join button
    - RTL tests for each branch
    - _Requirements: 37.18, 37.19, 27.9, 32.18_
    - _Design: B2 (`/invite/[token]`), B6-V6 (invite page)_
    - Depends on: 29.1, 29.5

  - [x] 30.6 Build the `/welcome` page
    - `app/welcome/page.tsx` (public Server Component, no API call), `components/welcome/WelcomeContent.tsx` (1 to 5 sentences and the eight listed capabilities), `components/welcome/WelcomeActions.tsx` (Client: "Log in" and "Create account" `BaseButton`s that call `setWelcomeCookie` and navigate); one Header and one Footer from the layout; single-column responsive layout `mx-auto w-full max-w-xl px-4`
    - RTL tests: both buttons present, the cookie is set on click, navigation targets `/login` and `/register`
    - _Requirements: 38.1, 38.2, 38.3, 38.10, 27.9_
    - _Design: B2 (`/welcome`), B4-V6, B9 (V6 responsive note)_
    - Depends on: 29.5

  - [x] 30.7 Make the login and register forms honor `next`
    - `LoginForm` redirects with `router.push(safeNext(next) ?? "/")`; `RegisterForm` redirects to `withNext("/login", safeNext(next))` after the 201; the two pages link to each other with `withNext`; invalid `next` values are ignored
    - RTL tests: valid invite `next` followed after login and kept through register, absolute URL and other-path `next` ignored
    - Supersedes the V5 redirect behaviour of tasks 18.1 and 18.2; 18.1 and 18.2 stay as history
    - _Requirements: 19.3, 19.8, 19.11, 19.12, 28.15_
    - _Design: B4-V6 (`safeNext`, `withNext`)_
    - Depends on: 29.1, 29.2

  - [x] 30.8 Show guest role badges on the Dashboard and status badges in My Tasks
    - `BoardList` role badge uses `ROLE_VARIANT` for `admin`, `member`, and `guest`; `MyTasksList` renders `StatusBadge` after the Column name, keeps `DONE` cards with the "Done" badge, and adds no status filter
    - Update the Dashboard and My Tasks RTL tests accordingly
    - Supersedes the V5 behaviour of tasks 18.3 and 18.10; 18.3 and 18.10 stay as history
    - Property tests: **Property 34** (grouping, re-run with status), **Property 56** (badge part)
    - **Validates: Requirements 20.1, 25.2, 25.7**
    - _Requirements: 20.1, 25.2, 25.7_
    - _Design: B2 (V6 other pages), B7-V6 (badges)_
    - Depends on: 29.9, 29.1

  - [x] 30.9 Rebuild the Profile page (fixed email, change password)
    - `components/users/ProfileForm.tsx` (name input pre-filled), `ReadOnlyEmail.tsx` (email as text, no input), `ChangePasswordForm.tsx` (masked current and new password inputs, `autoComplete` values, never pre-populated); the body never contains `email` and contains `password` and `current_password` only when both are filled and valid; on 200 call `updateUser`, show a success toast, and clear both password inputs; a 400 that names `current_password` (`errorNamesField`) shows the field error and keeps the name; other errors use `useErrorHandler`
    - RTL tests: no email input exists, name 0 and 101 error, one-filled password section error, 7 characters error and 8 characters submitted with `current_password`, the `current_password` error branch, the request body check
    - Supersedes the V5 behaviour of task 18.11 (editable email, no password); 18.11 stays as history
    - Property test: **Property 29** (profile validators, component use)
    - **Validates: Requirements 26.1 to 26.8**
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.8, 32.15_
    - _Design: B11, B2 (`/profile` V6 change)_
    - Depends on: 29.4

  - [x] 30.10 Responsive pass for the V6 pages and guest view
    - Review `/welcome`, `/invite/[token]`, `InviteLinksPanel` (URL field, copy, and regenerate stacked below `md`, `break-all`), the guest badge (`flex-wrap`), and `ConfirmDialog` at 375 px against design B9; 44 px tap targets for Join, Log in, and Create account; add class-based RTL assertions where practical
    - Supersedes the V5 coverage of task 18.12 for the new pages; 18.12 stays as history
    - _Requirements: 27.1, 27.2, 27.6, 27.9, 22.17_
    - _Design: B9 (V6 responsive note)_
    - Depends on: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6

  - [x] 30.11 Update the frontend repository-rule tests for the V6 files
    - Supersedes the V5 coverage of task 19.1 for the new and split files; 19.1 stays as history
    - `web/__tests__/repo-rules.test.ts`: no `dangerouslySetInnerHTML`, no native `<button` outside `BaseButton`, one component per file in `components/` (including `MemberList`, `InviteLinkRow`, `StatusSelect`, `WelcomeActions`), and `scripts/check_file_size.py` over `web/` (300 lines); split any failing file
    - _Requirements: 28.9, 18.6, 30.6, 30.7_
    - _Design: B1, File size and split rule_
    - Depends on: 30.10

- [x] 31. Phase 17 (V6): Playwright and `.env.test` work
  - [x] 31.1 Update `playwright.config.ts` and add the credential and welcome helpers
    - Load `web/.env.test` with dotenv (`override: false`, so process variables win) before reading any variable; validate `E2E_BASE_URL` (absolute http or https URL, error names the variable) before any test starts; create `web/.env.test.example` with placeholders for `E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`
    - `web/e2e/support/credentials.ts`: `requireCredentials()` throws `Missing required environment variable: <NAME>` (never a value), builds the wrong password at run time (`password + "-wrong-" + Date.now()`), and builds the unique registration email by plus-addressing the local part of `E2E_USER_EMAIL`; `web/e2e/support/welcome.ts`: `setWelcomeSeen(context, baseURL)` adds the `kano_welcome_seen` cookie
    - Unit tests: missing variable named in the error, no value printed, dotenv does not override an existing variable
    - Supersedes the V5 behaviour of task 21.1 (live URL from the shell only); 21.1 stays as history
    - _Requirements: 33.2, 33.10, 33.11, 35.2_
    - _Design: Testing Strategy V6 additions (Playwright), D1 (V6 credentials note)_
    - Depends on: 30.11

  - [x] 31.2 Update the auth E2E scenarios (no literal credentials, welcome cookie)
    - Supersedes the V5 specs of task 21.2; 21.2 stays as history
    - Four scenarios: login with `requireCredentials()` redirects to `/`; the wrong password built at run time shows the invalid-credentials error and stays on `/login`; an unauthenticated visit to `/` (after `setWelcomeSeen`) redirects to `/login`; logout redirects to `/login` and a following visit to `/` redirects again
    - _Requirements: 33.3, 33.6, 33.10, 33.11, 33.14_
    - _Design: Testing Strategy V6 additions (Playwright)_
    - Depends on: 31.1

  - [x] 31.3 Update the Kanban journey E2E (generated email, password from the environment)
    - Supersedes the V5 spec of task 21.3; 21.3 stays as history
    - Step 1 registers a unique generated email with the password from `E2E_USER_PASSWORD` through the helper; the 8 steps, serial mode, and mouse `dragTo` stay
    - _Requirements: 33.4, 33.5, 33.6, 33.10_
    - Depends on: 31.1

  - [x] 31.4 Update the mobile viewport E2E checks (375 px) for the new pages
    - Supersedes the V5 specs of task 21.4; 21.4 stays as history
    - Remove hardcoded credentials (use the helper), set the welcome cookie before visiting `/`, and add `/welcome` and an invite page to the overflow, overlap, and 44 px checks
    - _Requirements: 27.1, 27.2, 27.6, 27.9, 33.10_
    - _Design: B9, Testing Strategy V6 additions_
    - Depends on: 31.1

  - [x] 31.5 Write the welcome E2E scenario
    - Fresh browser context: a visit to `/` lands on `/welcome`; the page shows "Log in" and "Create account"; "Log in" leads to `/login` and `context.cookies()` contains `kano_welcome_seen`; "Create account" leads to `/register`; a second visit to `/` lands on `/login`
    - _Requirements: 33.13, 38.5, 38.6, 38.10, 38.14_
    - Depends on: 31.1

  - [x] 31.6 Write the status and new-card E2E scenarios
    - Status: open a card, choose "In progress", save, see the badge on the board; set "Done" and see "Done" in `/my-tasks`. New card: add a card by title, the Card Detail Modal opens with the title, fill the description, save
    - _Requirements: 21.17, 21.22, 23.17, 23.18, 25.2, 33.3_
    - Depends on: 31.1

  - [x] 31.7 Write the invite-join E2E scenario
    - The pre-existing user creates a Board and reads the member and guest links in the member panel; a second browser context registers a generated user and joins through the member link and sees edit controls; a third context joins through the guest link and sees the "Guest" badge and no add-column control
    - _Requirements: 37.15, 37.18, 37.20, 21.20, 33.14_
    - Depends on: 31.1

  - [x] 31.8 Write the profile E2E scenario
    - `/profile` shows the email as text equal to `E2E_USER_EMAIL` (read through the helper) and has no email input
    - _Requirements: 26.1, 33.10_
    - Depends on: 31.1

  - [x] 31.9 Extend the E2E checks with the no-literal-credentials scan
    - `web/scripts/scanCredentials.ts` exports the pure `findCredentialLiterals(source)` (reports an e-mail address string literal or a string literal passed to a password or email input fill); extend `web/__tests__/no-wait-for-timeout.test.ts` (task 21.5) so it also fails on any finding in `web/e2e/`
    - Supersedes the V5 check of task 21.5 (only `waitForTimeout`); 21.5 stays as history
    - Property test: **Property 58: E2E sources contain no literal credentials** (generated sources, plus the real files under `web/e2e/`)
    - **Validates: Requirements 33.10, 33.12**
    - _Requirements: 33.6, 33.10, 33.12, 32.19_
    - _Design: Correctness Property 58, Testing Strategy V6 additions_
    - Depends on: 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8

- [x] 32. V6 frontend checkpoint
  - Run `npm test` from `web/` (single run, exit code 0, no network and no running API), `npm run build` (exit code 0, zero TypeScript errors), `pytest -v` from `app/`, and `scripts/check_file_size.py` over `app/` and `web/`
  - Ensure all tests pass, ask the user if questions arise
  - Final repository and verification tasks (33) and the deployment tasks (22.3 onward) depend on this checkpoint
  - Depends on: 28, 29.2, 29.3, 29.4, 29.6, 29.7, 29.8, 30.11, 31.9
  - _Requirements: 32.9, 32.10, 32.11, 31.8_

- [ ] 33. Phase 18 (V6): Final repository rules and pre-deployment verification
  - [x] 33.1 Update `.gitignore` for `.env.test` and `.env.test.example`
    - Keep ignoring `.env`, `.env.local`, and every other `.env*`; add `.env.test` to the ignored files and keep `.env.example` and `.env.test.example` tracked with the exceptions placed after the `.env*` rule (`!.env.example`, `!.env.test.example`)
    - ~~Add a test or script that runs `git check-ignore web/.env.test` (must be ignored) and `git check-ignore web/.env.test.example` and `git check-ignore app/.env.example` (must not be)~~ V7: removed at the user's request. The `git check-ignore` results were checked once by hand; the automated check stays in task 23.7
    - V7 note: `web/.gitignore` also has its own `.env*` rule, so it gets the `!.env.test.example` exception too
    - Supersedes the V5 rules of task 1.1; 1.1 stays as history
    - _Requirements: 35.1, 35.2, 35.7_
    - _Design: D1 (V6 credentials note), Testing Strategy V6 additions (Files)_
    - Depends on: 32

  - [x] 33.2 Check the ignore files and the `.env.example` files for V6
    - Confirm `.vercelignore` still excludes `web/`, `app/venv/`, and `.kiro/` and that `web/.env.test` is never part of an upload; add a test that each `.env.example` lists every variable read by its project (V6 adds no environment variable) and that `web/.env.test.example` lists exactly `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` with placeholder values
    - Supersedes the V5 coverage of `.vercelignore` and the `.env.example` files in tasks 1.1, 2.1, and 17.1; those stay as history
    - _Requirements: 35.2, 1.14, 15.5_
    - _Design: D1 (V6 deployment notes)_
    - Depends on: 33.1

  - [x] 33.3 [MANUAL] Verify the invite links and the welcome flow in the browser before deployment
    - NOT executed by the agent. Run the API with `flask run` and the web app with `npm run dev` against the development database, at a desktop width and at 375 px (browser device mode)
    - Check: a first visit to `/` lands on `/welcome` and a later visit goes to `/login`; an anonymous visit to an invite link goes to `/login?next=...` and returns to the invite page after login or register; the member link joins as a member who can edit; the guest link joins as a guest with the "Guest" badge, no edit controls, and no drag; regenerate makes the old link show the not-found message; the status control updates the badge; the profile password change works and the email is read-only
    - Depends on: 32, 26.1
    - _Requirements: 37.15 to 37.20, 38.5 to 38.13, 34.8_

  - [ ] 33.4 [MANUAL] Create `web/.env.test` and a local E2E account
    - NOT executed by the agent. Copy `web/.env.test.example` to `web/.env.test` (git-ignored, never commit it), set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, create that account on the development database (register it through the app), and optionally run `npx playwright test` from `web/` against `E2E_BASE_URL` set to the local web URL as a smoke check
    - Depends on: 33.1, 32
    - _Requirements: 33.10, 33.14, 35.1_

  - [ ] 33.5 [MANUAL] Create the E2E account on the production database and point `web/.env.test` at the live URL
    - NOT executed by the agent. After the production schema exists, register the account named by `E2E_USER_EMAIL` on the deployed application and set `E2E_BASE_URL` in `web/.env.test` to the Vercel frontend URL
    - Depends on: 22.5, 33.1
    - _Requirements: 33.1, 33.10, 33.14_

- [x] 34. Phase 19 (V8): Header logo link and shared authentication check (frontend only)
  - [x] 34.1 Create `lib/logoTarget.ts` with the property test
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only)
    - `isVisitorAuthenticated(status)` returns true only for the AuthContext status `authenticated` (no cookie, token, user, or path input); `logoTarget(isAuthenticated)` returns `/` or `/welcome`, never `/login`
    - fast-check test, at least 100 runs: **Property 59: Logo target depends only on authentication** (all three statuses, random status sequences, never `/login`)
    - Supersedes the V8-prior behaviour of the fixed `/` brand link of task 17.11; 17.11 stays as history
    - **Validates: Requirements 18.14, 18.15, 17.14**
    - _Requirements: 17.14, 18.14, 18.15, 32.20_
    - _Design: B12, D16, Correctness Property 59_
    - Depends on: 32

  - [x] 34.2 Make `AuthProvider` never stay `loading` after a restore failure
    - Read `guidelines/frontend.md` first. When the session restoration fails with a 5xx or a network error, keep both cookies, leave the User unset, set `status` to `anonymous` (not `loading`), and call `useErrorHandler`; a 401 that survives the refresh flow still clears everything
    - Add tests: restore 5xx and network error end in `anonymous` with cookies kept; restore success ends in `authenticated`; logout and session expiry end in `anonymous`
    - Supersedes the V8-prior behaviour of task 17.7 (status after a failed restore); 17.7 stays as history
    - _Requirements: 17.5, 18.15, 32.20_
    - _Design: B12 (restore failure with 5xx or network error), B4_
    - Depends on: 34.1

  - [x] 34.3 Update `Header.tsx`: logo link and navigation share one check
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. In the Header Client Component compute `isAuth = isVisitorAuthenticated(status)` once and use it for the brand link target (`logoTarget(isAuth)`), "My Tasks", `NotificationBell`, `UserMenu`, "Log in", and "Register"; the Header reads no cookie, token, or `user` object
    - Brand link: one `Link` with the accessible name "Kano" (mark `aria-hidden="true"`), 44 px target, sets no cookie, sends no request; "Log in" and "Register" are anchor elements, not `BaseButton`; `decideRoute` and `proxy.ts` stay unchanged
    - Keep the file at or below 300 lines, one component per file
    - Supersedes the V8-prior behaviour of tasks 17.11, 17.12 (Header) and 30.8; 17.11, 17.12 and 30.8 stay as history
    - _Requirements: 17.14, 18.13, 18.14, 18.15, 27.10, 38.2_
    - _Design: B12, B3 (V8 change), D16_
    - Depends on: 34.1, 34.2

- [x] 35. Phase 20 (V8): Welcome_Page (frontend only)
  - [x] 35.1 Create `lib/welcomeContent.ts` and `lib/forbiddenClaims.ts` with the property test
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only)
    - `welcomeContent.ts`: `WELCOME_COPY` (all texts and link targets exactly as Requirement 38 criteria 16 and 17), `FEATURES` (icon name, title, description of the four cards), `PREVIEW_SAMPLE` (generic sample titles, labels, initials, status chips using only "Not started", "In progress", "Done")
    - `forbiddenClaims.ts` (outside `components/welcome/`): `FORBIDDEN_CLAIMS` of Requirement 38 criterion 19 and `findForbiddenClaims(text)`: case-insensitive substring match for every entry except "free", which is a whole-word match
    - fast-check test: **Property 60: Forbidden-claims scan**, plus fixed examples: "operating", "integrating", "generating" report "rating"; "freedom" does not report "free"; "free" as a whole word (also next to punctuation, any case) is reported; `WELCOME_COPY`, `FEATURES`, and `PREVIEW_SAMPLE` return an empty list
    - Supersedes the V8-prior copy of task 30.6 (1 to 5 sentences and eight capabilities); 30.6 stays as history
    - **Validates: Requirements 38.16, 38.17, 38.18, 38.19**
    - _Requirements: 38.1, 38.16, 38.17, 38.18, 38.19, 32.21_
    - _Design: B13, D17, Correctness Property 60_
    - Depends on: 32

  - [x] 35.2 Build the decorative board preview
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Create `components/welcome/BoardPreview.tsx`, `PreviewColumn.tsx`, `PreviewCard.tsx` (one component per file, Server Components)
    - Outer wrapper `overflow-x-auto` with `tabIndex={-1}` lies outside the `aria-hidden="true"` container that holds the preview content; no focusable element, link, button, input, `[tabindex]`, `onClick`, or `draggable` inside the container; three Columns with sample Cards, label chips, initials, status chips; one Card shown as dragged (`rotate-2 border-primary-200 shadow-overlay`) next to a dashed placeholder; no other element of the page has a shadow
    - Complete static Tailwind class strings (lookup objects, no template-built classes); Columns `w-72` below 768 px, three-column grid from 768 px; no ticket ids, counts, metrics, or usage claims
    - Supersedes the V8-prior behaviour of task 30.6 (no preview); 30.6 stays as history
    - _Requirements: 38.18, 38.20, 38.21, 27.10_
    - _Design: B13 (decorative board preview), D17_
    - Depends on: 35.1

  - [x] 35.3 Rebuild the Welcome_Page sections and actions
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Create `WelcomeHero.tsx`, `FeaturesSection.tsx`, `FeatureCard.tsx`, `WelcomeCta.tsx`; rewrite `WelcomeContent.tsx` (order: hero, preview, features, bottom call to action) and `WelcomeActions.tsx` (Client, prop `placement` `hero` or `cta`: "Get started" primary; "Create account" primary and "Log in" secondary, all `BaseButton`, each sets the welcome cookie then navigates); `app/welcome/page.tsx` exports `metadata` and renders no Header or Footer
    - Exactly one `h1`, the four feature cards with icons from the design-system icon library, no testimonial, quote, rating, metrics bar, or trust note; texts only from `WELCOME_COPY` and `FEATURES`; no API call
    - Supersedes the V8-prior behaviour of task 30.6 (`WelcomeContent`, `WelcomeActions` with two buttons); 30.6 stays as history
    - _Requirements: 38.1, 38.2, 38.10, 38.15, 38.16, 38.17, 38.20, 18.13_
    - _Design: B13 (files, sections, copy), D17, B2 (V8 change)_
    - Depends on: 35.1, 35.2

  - [x] 35.4 Design-system and responsive pass for the Welcome_Page
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Check Inter weights 400, 500, 600 only, tokens only, flat surfaces with 1 px `line` borders, `rounded-md` and `rounded-lg` only, headline in the Display role from 768 px and the H1 role below, one primary button per region, contrast at least 4.5:1, no `shadow-*` except `shadow-overlay` on the dragged preview Card
    - Below 768 px: single column, hero and bottom buttons full width with at least 44 px height, feature cards stacked, preview Columns at least 240 px inside the scroller; from 768 px: centered hero, feature cards in two columns, bottom buttons side by side; no horizontal page scroll from 375 px to 1920 px
    - Supersedes the V8-prior responsive note of task 30.10 for `/welcome`; 30.10 stays as history
    - _Requirements: 38.3, 38.20, 38.21, 27.1, 27.2, 27.9, 27.10_
    - _Design: B13 (design-system approach, layout by width)_
    - Depends on: 35.3

- [x] 36. Phase 21 (V8): Board toolbar and the single separator (frontend only)
  - [x] 36.1 Extract `BoardToolbar.tsx`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. New Client Component with root `data-testid="board-toolbar"`: back link, `h1` title, role `BaseBadge` ("Guest" for a guest), `CardSearchInput`, and for the admin the Members and Analytics `BaseButton`s; no `border-*` class; no add-column prop and no add-column control
    - Supersedes the V8-prior inline toolbar of tasks 18.4 and 30.1 in `BoardView.tsx`; 18.4 and 30.1 stay as history
    - _Requirements: 21.12, 21.13, 21.20, 21.24, 21.28_
    - _Design: B14, D17_
    - Depends on: 30.1

  - [x] 36.2 Render the single separator in `BoardView.tsx`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Replace the inline toolbar with `<BoardToolbar />`, then exactly one `<hr data-testid="board-separator" className="m-0 h-px w-full border-0 bg-line" />`, then `<div data-testid="board-content" className="pt-6 min-w-0">` holding the search results or the Kanban row; the add-column control stays at the end of the Kanban row, outside the toolbar; the separator shows for admin, member, and guest and in the search-results state, and never in the 403 and 404 states (`BoardAccessMessage`)
    - Remove any toolbar-side or columns-side border so no second line exists; move the search results list to `SearchResultList.tsx` if `BoardView.tsx` would exceed 300 lines
    - Supersedes the V8-prior behaviour of tasks 18.4, 18.5, 30.1 and 30.4 (`BoardView` markup); those stay as history
    - _Requirements: 21.24, 21.25, 21.26, 21.27, 21.28, 27.10, 30.6_
    - _Design: B14, D17_
    - Depends on: 36.1

- [x] 37. Phase 22 (V8): V8 unit tests, Playwright scenarios, and repository checks
  - [x] 37.1 Write the Header logo and layout unit tests
    - Read `guidelines/frontend.md` first. Render `Header` inside a test AuthContext provider and assert: anonymous gives `/welcome` with the welcome cookie present and absent and on the mocked `/login` and `/register` paths; status `authenticated` gives `/`; a visitor with only a refresh cookie gets `/welcome` while the status is `loading` or `anonymous` (including a 5xx restore failure that keeps the cookies) and `/` once the mocked restore succeeds; logo target and navigation (Log in and Register anchors versus My Tasks, bell, user menu) match in every status; the target changes to `/welcome` after `logout()`; the link name is "Kano" and `href` is never `/login`; a click calls no `fetch` and writes no cookie
    - Assert one `banner` and one `contentinfo` for stand-in pages of the layout and add a static test that fails when a file other than `layout.tsx` renders `<Header` or `<Footer`
    - Property test: **Property 59** (component use)
    - Supersedes the V8-prior Header tests of tasks 17.11 and 17.12; those stay as history
    - **Validates: Requirements 18.13, 18.14, 18.15, 17.14**
    - _Requirements: 17.14, 18.13, 18.14, 18.15, 32.20_
    - _Design: B12, Testing Strategy V8 additions, Correctness Property 59_
    - Depends on: 34.3

  - [x] 37.2 Write the Welcome_Page unit tests
    - Read `guidelines/frontend.md` first. Assert: sections in the order hero, preview, features, bottom call to action; Header "Log in" and "Register" are anchors to `/login` and `/register` and not `BaseButton`; hero has the eyebrow, one `h1`, the subheadline, and "Get started" to `/register`; four feature cards with the exact titles and descriptions; bottom "Create account" to `/register` and "Log in" to `/login`; the preview content container has `aria-hidden="true"` and no focusable element (`a[href], button, input, select, textarea, summary, [tabindex]`), its scroller is the parent outside the container with `tabindex="-1"`; exactly one element carries `shadow-overlay` and no other `shadow-*` class; no `fetch`; no `blockquote`, `q`, `cite`, star, or rating element
    - Scan the rendered text and every `aria-label`, `alt`, and `title` value, the page `metadata.description`, and the source of `components/welcome/**`, `app/welcome/page.tsx`, and `lib/welcomeContent.ts` with `findForbiddenClaims`
    - Property test: **Property 60** (DOM and source use)
    - Supersedes the V8-prior tests of task 30.6; 30.6 stays as history
    - **Validates: Requirements 38.2, 38.15 to 38.20**
    - _Requirements: 32.21, 38.2, 38.15, 38.16, 38.17, 38.18, 38.19, 38.20_
    - _Design: B13, Testing Strategy V8 additions, Correctness Property 60_
    - Depends on: 35.3, 35.4

  - [x] 37.3 Write the board separator unit tests
    - Read `guidelines/frontend.md` first. Render `BoardView` for admin, member, and guest with a `BoardDetail` fixture and mocked `apiRequest`: exactly one element with the role `separator`; it follows `[data-testid="board-toolbar"]` and precedes `[data-testid="board-content"]` in document order, also in the search-results state; neither the toolbar nor the content wrapper has `border-t`, `border-b`, or `border` classes; the separator has `h-px` and `bg-line`; the add-column form is not inside the toolbar and is the last item of the Kanban row for admin and member and absent for guest; `BoardAccessMessage` (403 and 404) renders no separator
    - Supersedes the V8-prior board tests of tasks 18.4 and 30.1; those stay as history
    - **Validates: Requirements 21.24 to 21.28**
    - _Requirements: 21.24, 21.25, 21.26, 21.27, 21.28, 32.22_
    - _Design: B14, Testing Strategy V8 additions_
    - Depends on: 36.2

  - [x] 37.4 Update the welcome Playwright scenario (amended R33.13)
    - Read `guidelines/frontend.md` first. Fresh context: `/` lands on `/welcome`; section-scoped locators (Header `banner`, hero region, bottom region) find Header "Log in" and "Register" links, hero "Get started", bottom "Create account" and "Log in"; the Header "Log in" leads to `/login` and `context.cookies()` contains `kano_welcome_seen`; then `/` lands on `/login`; a visit to `/welcome` and the bottom "Create account" leads to `/register`
    - Use only `requireCredentials()` and the helpers of task 31.1; no literal credentials, no `waitForTimeout`
    - Supersedes the V8-prior behaviour of task 31.5 (unscoped "Log in" and "Create account"); 31.5 stays as history
    - _Requirements: 33.13, 33.6, 33.10, 38.5, 38.6, 38.10_
    - _Design: Testing Strategy V8 additions (Playwright)_
    - Depends on: 35.4, 34.3

  - [x] 37.5 Write the logo Playwright scenarios (R33.15)
    - Read `guidelines/frontend.md` first. (1) Anonymous: open `/login` (the proxy sets the welcome cookie), click the Header logo, expect `/welcome`; (2) the same from `/register`; (3) logged in through `requireCredentials()`: create a Board with a unique name through the UI, open it, click the logo, expect the Dashboard `/` and neither `/welcome` nor `/login`
    - No literal credentials, no `waitForTimeout`, web-first assertions only
    - _Requirements: 33.15, 33.6, 33.10, 18.14_
    - _Design: Testing Strategy V8 additions (Playwright), B12_
    - Depends on: 34.3, 31.1

  - [x] 37.6 Write the layout Playwright scenarios (R33.16)
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. At 375x812 and 1920x1080 (`setViewportSize`): `/welcome` has no horizontal scroll and, at 375 px, the logo link, Header "Log in" and "Register", hero "Get started", bottom "Create account" and "Log in" have bounding boxes of at least 44 by 44 px; on a board page (user from `requireCredentials()` with a Board and two Columns) exactly one visible separator, the toolbar controls do not overlap pairwise, the separator top is at least the largest toolbar control bottom and at most the first Column top, its height is 1 px, and the page `scrollWidth` does not exceed the viewport (the Kanban container may scroll)
    - No literal credentials, no `waitForTimeout`
    - _Requirements: 33.16, 33.6, 33.10, 27.10, 21.25, 21.26_
    - _Design: Testing Strategy V8 additions (Playwright), B13, B14_
    - Depends on: 35.4, 36.2, 31.1

  - [x] 37.7 Extend the no-literal-credentials check over the V8 specs
    - Read `guidelines/frontend.md` first. Confirm the scan of `web/e2e/` (task 31.9, Property 58) covers the new spec files of 37.4 to 37.6 and fails on a literal e-mail address or a literal password passed to a fill; add a test case that lists the V8 spec files and asserts each imports `requireCredentials` or uses no credentials
    - Supersedes the V8-prior file list of task 31.9; 31.9 stays as history
    - **Validates: Requirements 33.10, 33.12**
    - _Requirements: 33.6, 33.10, 33.12, 32.19_
    - _Design: Correctness Property 58, Testing Strategy V8 additions_
    - Depends on: 37.4, 37.5, 37.6

  - [x] 37.8 Add the documentation check for the example HTML files (R36.14)
    - Read `guidelines/frontend.md` first. Add `web/__tests__/docs-no-example-files.test.ts` (or a script run by the same test): list the example HTML files in the `improvements/` folder at run time (read the names from the folder listing, never hardcode them) and fail when `README.md` or any file in `.kiro/specs/kano/` mentions one of those file names, links to it, or embeds it; the test passes when the folder has no such files
    - _Requirements: 36.14_
    - _Design: Traceability (V8 amendments, requirement 36), D3_
    - Depends on: 32

  - [x] 37.9 Update the frontend repository-rule tests for the V8 files
    - Read `guidelines/frontend.md` first. Extend `web/__tests__/repo-rules.test.ts`: no `dangerouslySetInnerHTML`, no native `<button` outside `BaseButton`, one component per file in `components/welcome/` and `BoardToolbar.tsx`, and `scripts/check_file_size.py` over `web/` (300 lines); split any failing file
    - Supersedes the V8-prior file list of task 30.11; 30.11 stays as history
    - _Requirements: 28.9, 18.6, 30.6, 30.7_
    - _Design: B1, File size and split rule_
    - Depends on: 34.3, 35.4, 36.2

- [x] 38. V8 frontend checkpoint
  - Run `npm test` from `web/` (single run, exit code 0, no network and no running API), `npm run build` (exit code 0, zero TypeScript errors), and `scripts/check_file_size.py` over `web/`; no backend test is needed because V8 changes no backend file
  - Ensure all tests pass, ask the user if questions arise
  - The V8 manual verification (39) and the deployment tasks (22.3 onward) run only after this checkpoint
  - Depends on: 34.1, 34.2, 34.3, 35.1, 35.2, 35.3, 35.4, 36.1, 36.2, 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.8, 37.9
  - _Requirements: 32.9, 32.10, 32.11_

- [ ] 39. [MANUAL] Verify the Header logo, the Welcome_Page, and the board separator in the browser
  - NOT executed by the agent. Run the API with `flask run` and the web app with `npm run dev` against the development database; check at 375 px and at 1920 px (browser device mode)
  - Check: the logo from `/login` and `/register` (anonymous) lands on `/welcome` and from a board page (logged in) on the Dashboard; the logo and the Header navigation always show the same state, also after logout; `/welcome` shows the sections in order with no horizontal scroll and 44 px targets at 375 px; the preview is decorative and the scroller is not a tab stop; only the dragged preview card has a shadow; a board shows exactly one 1 px line between the toolbar and the columns for admin, member, and guest, with no overlap and no second line; the add-column control stays at the end of the column row
  - Depends on: 38
  - _Requirements: 18.14, 18.15, 21.25, 21.26, 21.27, 27.10, 38.15 to 38.21, 33.15, 33.16_
  - _Design: B12, B13, B14_

- [x] 40. Phase 23 (V9): Footer (frontend only)
  - [x] 40.1 Create `lib/footerContent.ts`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only). Note `web/AGENTS.md`: read the relevant Next.js docs in `web/node_modules/next/dist/docs/` before using any Next API (this task uses none)
    - Export `FOOTER_CONTENT` (pure, no Tailwind classes): `wordmark` "Kano", `portfolioPrefix` "Portfolio project built in 2026 by ", `author` "JC" (fixed strings, no `new Date()`), and `links` for GitHub (`https://github.com`, aria-label "Kano on GitHub") and LinkedIn (`https://www.linkedin.com`, aria-label "Kano on LinkedIn")
    - The two URLs are placeholders (design Open issue 41); constants and tests change together when real profile links are set
    - Supersedes the V8 plain one-line text footer of task 17.11; 17.11 stays as history
    - _Requirements: 18.17, 18.18, 18.19, 18.21_
    - _Design: B15 (files), D18_
    - Depends on: 38

  - [x] 40.2 Create `components/shared/KanoMark.tsx` and use it in `Header.tsx`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md` (this task uses no Next API)
    - `KanoMark`: `<span aria-hidden="true">` with the classes the Header "K" span already has (`inline-flex items-center justify-center size-6 rounded-md bg-primary-500 text-white text-xs font-semibold`), no hooks; replace the inline "K" `span` in `Header.tsx` with `<KanoMark />` so the look and the Header link name "Kano" stay unchanged
    - The existing Header logo tests (tasks 37.1) must keep passing
    - Supersedes the inline mark of the V8 Header (tasks 34.3 and 17.11); those stay as history
    - _Requirements: 18.14, 18.17_
    - _Design: B15 (files, `KanoMark`), B3 (V9 change), D18_
    - Depends on: 38

  - [x] 40.3 Create `GithubIcon.tsx` and `LinkedinIcon.tsx`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md` (this task uses no Next API)
    - One inline SVG component per file under `components/shared/icons/`: `viewBox="0 0 24 24"`, `fill="currentColor"`, `aria-hidden="true"`, `focusable="false"`, `className="size-5"`, one `<path>` (path data from the CC0 Simple Icons set, checked at implementation time); `lucide-react` 1.75.0 has no brand icons, so add no dependency
    - _Requirements: 18.18, 18.19_
    - _Design: B15 (icon source check, files), D18, Open issue 39_
    - Depends on: 38

  - [x] 40.4 Rewrite `components/Footer.tsx` as a Server Component
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md` (the Footer uses no Next API, so no Next docs are needed)
    - No `"use client"`, no hooks, no handlers. `<footer className="bg-surface border-t border-line px-4 py-3 min-w-0">` with a `max-w-7xl mx-auto flex flex-wrap items-center justify-between` container: brand group (`KanoMark`, wordmark `text-sm font-semibold text-ink`, `aria-hidden` dot, portfolio text `text-sm text-ink-muted` with "JC" in its own `span` `font-medium text-ink`), brand group plain text and never a link
    - Link group `ml-auto`: two plain `<a>` (not `next/link`) with `target="_blank"`, `rel="noopener noreferrer"`, `aria-label` from `FOOTER_CONTENT`, one complete static class string `inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (44 px at every width), each wrapping its icon
    - Tokens only; no shadow, gradient, blur, arbitrary value, hex, or `font-bold`; no request, cookie, or environment variable; one row from 768 px, may wrap below; file at or below 300 lines
    - Supersedes the V8 plain text footer of task 17.11; 17.11 stays as history
    - _Requirements: 18.13, 18.16, 18.17, 18.18, 18.19, 18.20, 18.21, 27.11, 27.12_
    - _Design: B15 (markup and classes, layout by width, security), D18_
    - Depends on: 40.1, 40.2, 40.3

  - [x] 40.5 Write the Footer unit tests (`web/__tests__/Footer.test.tsx`)
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md`
    - Assert: brand mark "K", wordmark "Kano", and the text "Portfolio project built in 2026 by JC" with "JC" in its own element; locate links inside `within(screen.getByRole("contentinfo"))` or by exact names; exactly two links, "Kano on GitHub" (`https://github.com`) and "Kano on LinkedIn" (`https://www.linkedin.com`), each with `target="_blank"` and `rel` containing `noopener` and `noreferrer`; icons `aria-hidden`; link classes contain `hover:text-ink`, `hover:bg-sunken`, `transition-colors`, `duration-150`, `focus-visible:outline-2`, `focus-visible:outline-primary-500`, and `size-11`; brand group not inside an `a`; no `shadow-`, `bg-[`, `text-[`, `bg-gradient`, or `font-bold` class; `fetch` and the `document.cookie` setter are not called
    - Scan `FOOTER_CONTENT`, the footer text, and every `aria-label`, `alt`, and `title` with `findForbiddenClaims` (empty result)
    - One `contentinfo` on each stand-in page of the layout harness including the Welcome_Page (footer after the bottom call-to-action section); rendering Header and Footer together has exactly one link named exactly "Kano" (the logo target of task 34.1); `KanoMark` has the same classes in both
    - No new Correctness Property (example-based, design Testing Strategy V9)
    - **Validates: Requirements 18.13, 18.16 to 18.21, 38.19**
    - _Requirements: 32.23, 18.13, 18.14, 18.17, 18.18, 18.19, 18.20, 18.21, 38.19_
    - _Design: Testing Strategy V9 additions (unit tests), B15_
    - Depends on: 40.4

  - [x] 40.6 Update the frontend repository-rule tests for the V9 files
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md`
    - Extend `web/__tests__/repo-rules.test.ts`: one component per file for `KanoMark.tsx`, `GithubIcon.tsx`, `LinkedinIcon.tsx`, and `Footer.tsx`; no native `<button` outside `BaseButton`; no `dangerouslySetInnerHTML`; `scripts/check_file_size.py` over `web/` (300 lines); the Footer has no `"use client"`; split any failing file
    - Supersedes the V8 file list of task 37.9; 37.9 stays as history
    - _Requirements: 28.9, 18.6, 30.6, 30.7_
    - _Design: B1 (V9 change), File size and split rule_
    - Depends on: 40.4

- [x] 41. Playwright footer spec and banner-scoped logo locators (V9)
  - Read `guidelines/frontend.md` and `guidelines/design-system.md` first. Note `web/AGENTS.md`
  - Create `web/e2e/footer.spec.ts`: at `{ width: 375, height: 812 }` and `{ width: 1920, height: 1080 }` (`setViewportSize`) on `/welcome` and `/login` as an anonymous visitor (use `requireCredentials()` and the Dashboard only if a logged-in check is added; prefer the anonymous pages); `const footer = page.getByRole("contentinfo")`; footer contains "Portfolio project built in 2026 by JC" and "Kano"; `footer.getByRole("link", { name: "Kano on GitHub", exact: true })` and the LinkedIn equivalent are visible with `href` `https://github.com` and `https://www.linkedin.com`, `target` `_blank`, `rel` matching `/noopener/` and `/noreferrer/`; `expect.poll` shows `scrollWidth <= clientWidth`; at 375 px each link `boundingBox()` is at least 44 by 44 px and the boxes do not overlap each other or the brand text; at 1920 px the hover changes the link background and color (compare before and after, no hard-coded color)
  - Never click a footer link and never navigate to an external site; no `waitForTimeout`; no literal credentials (Property 58 scan covers the new file); set the welcome cookie through the task 31.1 helper before visiting `/` if needed
  - Also update the logo locators of the V8 logo scenarios to `page.getByRole("banner").getByRole("link", { name: "Kano", exact: true })`. This new task supersedes the locator part of task 37.5; 37.5 stays as history
  - **Validates: Requirements 33.17, 27.11, 27.12, 33.15**
  - _Requirements: 33.17, 33.15, 33.6, 33.10, 27.11, 27.12, 18.19, 18.20_
  - _Design: Testing Strategy V9 additions (Playwright footer scenario), B15_
  - Depends on: 40.4, 40.5, 37.5, 31.1

- [x] 42. V9 frontend checkpoint
  - Run `npm test` from `web/` (single run, exit code 0, no network and no running API), `npm run build` (exit code 0, zero TypeScript errors), and `scripts/check_file_size.py` over `web/`; no backend test is needed because V9 changes no backend file
  - Ensure all tests pass, ask the user if questions arise
  - Depends on: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 41
  - _Requirements: 32.9, 32.10, 32.11, 32.23, 30.6_
  - _Design: Testing Strategy V9 additions_

- [x] 43. [MANUAL] Verify the footer in the browser and later set the real profile links
  - NOT executed by the agent. Run the web app with `npm run dev` and check at 375 px and at 1920 px (browser device mode), on `/welcome` and on the Dashboard
  - Check the look in words: one row from 768 px with a small rounded blue square holding a white "K", the wordmark "Kano", a small separator dot, and the muted text "Portfolio project built in 2026 by JC" with "JC" in the darker ink color on the left, and the GitHub and LinkedIn icons on the right; below 768 px the content may wrap onto two lines with no overlap and no horizontal scroll; hovering an icon darkens it and shows a light gray background; keyboard focus shows a 2 px outline; each icon link opens in a new tab; the Header logo is still the only link named "Kano"
  - Later, when the real profile URLs are known, replace the two placeholder URLs in `lib/footerContent.ts`, and in the same change update the tests that pin them (task 40.5, task 41) and requirements 18.18, 32.23, and 33.17 (design Open issue 41); constants and tests must change together
  - Depends on: 42
  - _Requirements: 18.16, 18.17, 18.18, 18.19, 18.20, 27.11, 27.12, 33.17_
  - _Design: B15, Open issue 41_

- [x] 44. Phase 24 (V11): Backend models, schema, and permissions (code only)
  - [x] 44.1 Convert the `cards` schema, service, and routes into packages (no behaviour change)
    - Read `guidelines/backend.md` and `guidelines/database.md` first
    - `cards/schema/` (`card_model.py`, `card_schemas.py`; the checklist and link modules come in 44.3 and 44.4), `cards/service/` (`card_service.py`, `position_service.py`, `search_service.py`, `status.py`; keep the package from task 25.1 if it already exists), `cards/routes/` (`card_routes.py`, `search_routes.py`); each `__init__.py` keeps `routes`, `service`, and `schema` importable under those names (Requirement 30.7), and `boards` and `columns` keep importing `Card` from `cards/schema`
    - Pure refactor: every existing backend test still passes against the V6 database
    - Supersedes the single-file layout of tasks 11.1 and 11.2; those stay as history
    - _Requirements: 1.2, 1.4, 1.7, 30.6, 30.7, 44.6_
    - _Design: A17 (file split plan), D20, Open issue 56_
    - Depends on: 28

  - [x] 44.2 Add the `URGENT` status and the due-date index to the Card model and schemas
    - `CARD_STATUSES = ("NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE")`; `CardUpdateSchema.status` keeps `validate.OneOf(CARD_STATUSES)` (exact, case-sensitive); `CardCreateSchema` still rejects `status`
    - Model: `ck_cards_status` now `status IN ('NOT_STARTED','IN_PROGRESS','URGENT','DONE')`; new `db.Index("ix_cards_due_date", "due_date")`
    - `apply_status_change` code is unchanged (its last branch already keeps `completed_at` for every move among the three non-completed values); analytics and overdue treat only `DONE` as completed
    - Supersedes the three-value status of task 25.1; 25.1 stays as history
    - _Requirements: 2.16, 11.4, 11.19, 39.1, 39.2, 39.3, 40.7, 44.3_
    - _Design: A16, A13 (V11 note), Data Models (V11)_
    - Depends on: 44.1

  - [x] 44.3 Define the `ChecklistItem` and `CardLink` models in `cards/schema/`
    - `checklist_model.py` and `link_model.py` exactly as design Data Models (V11): PKs `checklist_item_id` and `card_link_id` (UUID), named FKs `fk_checklist_items_cards`, `fk_card_links_cards`, `fk_card_links_users`, check constraints (`ck_checklist_items_text_len`, `ck_checklist_items_order_positive`, `ck_card_links_url_len`, `ck_card_links_label_len`), indexes `ix_checklist_items_card_id_order` and `ix_card_links_card_id`, soft-delete mixin, no `ON DELETE CASCADE`, cross-package relationships by string name with `lazy="raise"`
    - `cards/schema/__init__.py` imports both modules so `create_app` registers them before `Migrate.init_app` and `flask db migrate` detects all 9 tables (Requirement 1.9)
    - _Requirements: 1.4, 1.8, 1.9, 2.2, 2.3, 2.4, 2.5, 41.1, 42.1, 44.2, 44.3_
    - _Design: Data Models (V11 models), D20_
    - Depends on: 44.1

  - [x] 44.4 Add the URL rule and the checklist, link, and card-detail schemas
    - `cards/schema/url_rules.py`: pure `validate_link_url(raw)` (trim, 1 to 2048 characters, no whitespace or control character, scheme `http` or `https` in any letter case, non-empty hostname; `ValueError` on rejection) and `default_label(url)` (lower-case hostname cut to 100 characters, design Open issue 48)
    - `checklist_schemas.py`: `ChecklistCreateSchema` (`text` stripped, 1 to 200, not blank), `ChecklistUpdateSchema` (`text`, strict JSON boolean `is_done`, finite float `order` > 0, at least one field), `ChecklistItemSchema`; `link_schemas.py`: `CardLinkCreateSchema`, `CardLinkUpdateSchema` (at least one field; `label` 1 to 100 after trimming), `CardLinkSchema`; `CardDetailSchema`; all with `unknown = RAISE`
    - _Requirements: 41.2, 41.3, 41.6, 41.9, 42.2, 42.3, 42.5, 42.6, 4.9_
    - _Design: A17 (pure URL rule, schemas), Open issue 48_
    - Depends on: 44.3

  - [x] 44.5 Allow the role `manager` in the Board_Membership model and add `MemberRoleSchema`
    - `boards/schema`: `ck_board_memberships_role` now allows `admin`, `manager`, `member`, `guest`; the partial unique index `uq_board_memberships_board_user_active` is unchanged; add `MemberRoleSchema` (`role` required string, validated before any permission check, Open issue 59) to `member_schemas.py`; split the schema package if it nears 300 lines
    - Supersedes the three-role check of task 25.2; 25.2 stays as history
    - _Requirements: 2.15, 43.5, 43.8, 44.1_
    - _Design: A15, A20, Data Models (V11 changed constraints)_
    - Depends on: 28

  - [x] 44.6 Extend `permissions.py` with the manager rank and the pure role-decision functions
    - `ROLE_RANK = {guest: 0, member: 1, manager: 2, admin: 3}` and `LEVEL_RANK = {reader: 0, writer: 1, manager: 2, admin: 3}` defined once (no second role table in another module); `role_allows` keeps its formula and returns False for None; `ASSIGNABLE_ROLES = ("guest", "member", "manager")`
    - Pure `decide_role_change(caller, target, new_role, target_is_owner)` and `decide_member_removal(caller, target, target_is_owner)` exactly as design A15: the owner check runs before the rank rule (admin who targets the owner gets `bad_request`, a manager gets `forbidden`), a new role outside the assignable set is `bad_request`, a caller rank not above the target rank or not above the new role rank is `forbidden`
    - If `permissions.py` nears 300 lines convert it to a package `app/permissions/` (`rules.py` pure, `helpers.py` queries) whose `__init__.py` re-exports every public name
    - _Requirements: 43.1, 43.3, 43.6, 43.7, 43.8, 9.6, 9.7, 1.6_
    - _Design: A15, D19, Open issue 47_
    - Depends on: 28

  - [x] 44.7 Add the manager-level and new resource helpers to `permissions.py`
    - `require_board_manager(board_id, user_id)` (404, 403 without membership, 403 below manager), `get_column_for_manager(column_id, user_id)`, `get_card_for_reader` and `get_card_for_writer(card_id, user_id, lock=False)` (`lock=True` runs `SELECT ... FOR UPDATE` on the Card row for the cap checks, Open issue 54), `get_checklist_item_for_writer`, `get_card_link_for_writer`; one joined query each; check order 404, then 403 without membership, then 403 for role; generic 403 message with no resource data; `assert_assignee_is_writer` accepts `admin`, `manager`, `member` and rejects a guest (400)
    - `permissions.py` imports `ChecklistItem` and `CardLink` from `cards/schema` (models only, never a `service.py`)
    - _Requirements: 1.6, 28.10, 28.11, 28.14, 11.5, 11.22, 41.7, 41.8, 42.8, 43.2, 43.9_
    - _Design: A15 (helpers table)_
    - Depends on: 44.3, 44.6

  - [x] 44.8 Move the Column, add-member, and invite-link call sites to the manager helpers
    - Create column, rename, delete, and reorder use `require_board_manager` or `get_column_for_manager` (so the role `member` gets 403 on all four, R10.11); `get_column_for_writer` stays only for creating a Card; POST members and the invite-links GET and regenerate use `require_board_manager`; analytics member activity lists roles `admin`, `manager`, and `member`; the analytics endpoint stays admin-only
    - V6 tests that assume a `member` manages Columns or that only the admin reads invite links are updated by 46.13, 46.14, 46.15, and 46.16, and are not expected to pass before those tasks
    - Supersedes the V6 writer-level Column guards and admin-only invite guards of tasks 25.4 and 27.8; those stay as history
    - _Requirements: 9.1, 9.9, 10.1, 10.2, 10.3, 10.4, 10.7, 10.11, 14.7, 14.10, 37.3, 37.5, 37.6, 28.12, 43.3_
    - _Design: A15 (endpoint-by-role matrix), A20, A12-V6 (V11 note)_
    - Depends on: 44.5, 44.7

  - [x] 44.9 Extend the soft-delete cascades to checklist items and links
    - Board delete (`boards/service/cascade.py`), Column delete (`columns/service`), and Card delete (`cards/service/card_service.py`) also soft delete the Checklist_Items and Card_Links below with the same `deleted_at`, using the parent-id subquery pattern and `is_deleted = false` in each bulk UPDATE, inside the one transaction; a failure rolls back everything
    - Supersedes the cascade tables of tasks 8.1, 9.1, and 11.1; those stay as history
    - _Requirements: 2.9, 2.10, 2.11, 2.13_
    - _Design: A5 (cascade table), A17 (soft-delete cascades)_
    - Depends on: 44.1, 44.3

  - [x] 44.10 Implement the combined count query and the count fields
    - `cards/service/counts.py`: one grouped query that left-joins a checklist subquery (`done`, `total`) and a links subquery (`n`) onto the non-deleted Cards of a Board (design A18), plus `counts_for_card(card_id)`; `CardSchema` gains `checklist_done`, `checklist_total`, `link_count` for board detail, create, update, and position responses; `CardSearchSchema` and the My Tasks output do not carry them (Open issue 58)
    - Supersedes the four-query board plan of task 8.1; 8.1 stays as history
    - _Requirements: 44.4, 44.5, 41.10, 42.15, 29.2_
    - _Design: A18, D21, Open issue 57_
    - Depends on: 44.3, 44.4

  - [x] 44.11 Update the model metadata tests for 9 tables, the new constraints, and the new indexes (no database)
    - Assert exactly 9 tables; `cards.status` check lists four values and `ix_cards_due_date` exists; `checklist_items` and `card_links` columns, named FKs, checks, and indexes; the four-role `ck_board_memberships_role`; no `ON DELETE CASCADE`; every new model has the four soft-delete columns; import-rule test still passes (no `routes.py` imported across features, `permissions.py` imports no `service.py`)
    - Supersedes the 7-table assertions of tasks 3.5 and 25.6; those stay as history
    - _Requirements: 1.4, 1.9, 2.2, 2.15, 2.16, 44.2, 44.3, 31.1_
    - _Design: Data Models (V11), Module dependency direction, Open issue 65_
    - Depends on: 44.2, 44.3, 44.5

  - [x] 44.12 Write property test for the four-value status rule (pure)
    - **Property 61: Four-value status state machine**
    - Hypothesis, at least 100 examples, over the four statuses, omitted or invalid new values, and increasing timestamps; assert `completed_at` set only on entering `DONE`, cleared only on leaving `DONE`, unchanged for every move among `NOT_STARTED`, `IN_PROGRESS`, `URGENT` and for `DONE` to `DONE`, and `completed_at is not None` iff status is `DONE`
    - Supersedes the three-value generator of task 25.7; 25.7 stays as history
    - **Validates: Requirements 11.19, 39.1, 39.2, 39.3**
    - _Requirements: 11.19, 39.2, 39.3, 31.17_
    - _Design: Correctness Property 61_
    - Depends on: 44.2

  - [x] 44.13 Write property test for the role-change and removal decisions (pure)
    - **Property 72: Role-change and removal decisions**, pure part: over every caller role (including none), target role, new role (including `admin` and invalid values), and owner flag, `decide_role_change` returns `ok` iff the caller is `admin` or `manager`, the new role is assignable, the target is not the owner, the caller rank is above the target rank and above the new role rank; `bad_request` for an invalid new role and for an admin who targets the owner; `forbidden` otherwise; `decide_member_removal` returns `ok` iff the caller is `admin` or `manager`, the target is not the owner, and the caller rank is above the target rank
    - **Validates: Requirements 43.5, 43.6, 43.7, 43.8, 9.6, 9.7**
    - _Requirements: 43.6, 43.7, 43.8, 31.23_
    - _Design: Correctness Property 72, A15_
    - Depends on: 44.6

  - [x] 44.14 Write property test for `validate_link_url` (pure)
    - **Property 68: Link URL validation and cap**, pure part: Hypothesis over generated strings and generated scheme prefixes; accepted iff after trimming it has 1 to 2048 characters, no whitespace or control character, scheme `http` or `https` in any letter case, and a non-empty hostname; `javascript:`, `data:`, `file:`, scheme-less, `//host`, and `http:///x` rejected; `default_label` is the hostname cut to 100 characters
    - **Validates: Requirements 42.2, 42.5, 42.6**
    - _Requirements: 42.5, 42.6, 31.18_
    - _Design: Correctness Property 68, A17_
    - Depends on: 44.4

  - [x] 44.15 Write tests for `role_allows` and `resolve_accept` with the manager role (pure)
    - **Property 73: V11 permission matrix**, pure part: `role_allows(role, level)` is true iff `ROLE_RANK[role] >= LEVEL_RANK[level]` over guest, member, manager, admin, and none and the four levels
    - **Property 75: Manager accept and invite links**, pure part: `resolve_accept` over existing role in {none, guest, member, manager, admin} and token role in {member, guest}: `create` iff none, `upgrade` to `member` iff guest and member token, otherwise the existing role is kept (a manager and an admin never lose rank)
    - Supersedes the three-role sets of tasks 25.8 and 25.9; those stay as history
    - **Validates: Requirements 43.2, 43.3, 37.12**
    - _Requirements: 37.12, 43.3, 31.17, 31.23_
    - _Design: Correctness Properties 73, 75_
    - Depends on: 44.6

- [x] 45. Phase 25 (V11): Manual database migration (user-owned)
  - [x] 45.1 [MANUAL] Run the V11 `flask db migrate` and `flask db upgrade` on the development and test databases
    - NOT executed by the agent, and no agent-generated migration script. From `app/` with the venv active run `flask db migrate -m "v11 urgent manager checklist links"` against the development database
    - Review the generated script and add by hand what Alembic autogenerate does not detect: replace `ck_cards_status` (`op.drop_constraint("ck_cards_status", "cards")` then `op.create_check_constraint("ck_cards_status", "cards", "status IN ('NOT_STARTED','IN_PROGRESS','URGENT','DONE')")`) and replace `ck_board_memberships_role` the same way with `'admin','manager','member','guest'`, with the reverse steps in `downgrade()` (a downgrade fails while an `URGENT` row exists, so set those rows to another status first); confirm the generated index `ix_cards_due_date`, the tables `checklist_items` and `card_links` with their named FKs, check constraints, and indexes; no existing row changes
    - Run `flask db upgrade` on the development database, then with `DATABASE_URL` pointed at the `*_test` database; check that exactly the 9 tables exist and commit `app/migrations/` yourself
    - When this task is checked, every task marked `Depends on: 45.1` is unblocked. Production is not deployed, so its first `flask db upgrade` applies the whole history (see task 56)
    - Depends on: 44.2, 44.3, 44.5, 44.11
    - _Requirements: 3.11, 44.1, 44.2, 2.15, 2.16_
    - _Design: Data Models (V11 migration table), Manual migration dependency_

- [x] 46. Phase 26 (V11): Backend features and pytest tests
  - [x] 46.1 Update `conftest.py` and the factories for 9 tables and the new roles
    - Read `guidelines/backend.md` and `guidelines/database.md` first. The session-start check expects the 9 tables; the autouse `TRUNCATE ... RESTART IDENTITY CASCADE` lists `checklist_items` and `card_links` too; new factories `make_checklist_item`, `make_card_link`, and a role argument or `make_manager` for memberships; the test-database safety rules stay
    - Supersedes the 7-table check and truncate list of task 5.1; 5.1 stays as history
    - _Requirements: 31.2, 31.7, 31.9, 31.10, 44.2_
    - _Design: Testing Strategy (Test database safety), Open issue 65_
    - Depends on: 45.1

  - [x] 46.2 Implement GET `/api/cards/<id>` and the counts in the board detail and Card write responses
    - `GET /api/cards/<uuid:id>` for any Board_Participant (`get_card_for_reader`; guest 200, non-participant 403, missing or soft-deleted 404): Card, `checklist` ordered by `order` then `created_at`, `checklist_done`, `checklist_total`, `links` ordered by `created_at`, `link_count`; two extra queries
    - `GET /api/boards/<id>` runs the fifth query of `counts.py` and merges the counts by `card_id` (at most 5 queries, identical for 10 and 500 Cards); create returns `0, 0, 0` without a query; update and position return `counts_for_card`
    - Supersedes the exactly-four-query board detail of tasks 8.1 and 27.7; those stay as history
    - _Requirements: 41.9, 42.9, 44.4, 44.5, 43.12, 29.2_
    - _Design: A18, A21 row 34, A9 (V11 note), Open issues 49, 57, 58_
    - Depends on: 44.10, 46.1

  - [x] 46.3 Write pytest tests for card detail, the counts, and the query budget
    - GET card detail 200 for admin, manager, member, and guest, 403 for a non-participant, 404 for missing, soft-deleted, and non-UUID ids; counts correct and exclude soft-deleted items and links; create, update, and position responses carry the three counts; query counter: board detail at most 5 and identical for 10 and 500 Cards with items and links (marker `perf`, p95 under 500 ms over 100 requests)
    - Property test: **Property 71: Board payload counts and constant query count**
    - Supersedes the query-count assertions of tasks 14.5 and 27.15; those stay as history
    - **Validates: Requirements 29.2, 44.4, 44.5, 41.9**
    - _Requirements: 29.1, 29.2, 41.9, 44.4, 44.5, 31.22_
    - _Design: Correctness Property 71, A18_
    - Depends on: 46.2

  - [x] 46.4 Implement the checklist service and routes
    - `cards/service/checklist_service.py`: `add_item` (`get_card_for_writer(..., lock=True)`, 400 when 50 non-deleted items exist, `order = next_last_order(max)` or 1.0, `is_done` false), `update_item` (only supplied fields), `delete_item` (soft delete, returns `{ "checklist_item_id" }`); `cards/routes/checklist_routes.py`: POST `/api/cards/<uuid:id>/checklist` (201), PATCH and DELETE `/api/checklist/<uuid:id>` (200); register on the cards blueprint; no Notification and no change to `status` or `completed_at`; counts never stored
    - _Requirements: 41.2, 41.3, 41.4, 41.5, 41.6, 41.7, 41.8, 41.10, 41.11, 4.3_
    - _Design: A17 (checklist service), A21 rows 35 to 37, Open issue 54_
    - Depends on: 44.4, 44.7, 46.2

  - [x] 46.5 Write pytest tests for the checklist
    - 201 and `order` rules, partial update, soft delete with `{ "checklist_item_id" }`, the 50th item accepted and the 51st 400, a soft-deleted item does not count, a two-thread add at 49 items ends with 50 items, text boundaries 0, blank, 1, 200, 201, non-boolean `is_done`, bad `order`, empty PATCH body, 403 for a guest and a non-participant, 404 for missing or soft-deleted, 401, no Notification and no `status` or `completed_at` change
    - Property test: **Property 66: Checklist rules** (generated add, toggle, edit, and delete sequences against a naive model)
    - **Validates: Requirements 41.2 to 41.10**
    - _Requirements: 41.2, 41.3, 41.4, 41.5, 41.6, 41.7, 41.8, 41.10, 31.19, 31.20_
    - _Design: Correctness Property 66_
    - Depends on: 46.4

  - [x] 46.6 Implement the link service and routes
    - `cards/service/link_service.py`: `add_link` (row lock, 400 for the 11th non-deleted link, `created_by` the current user, label defaults to the hostname via `default_label`), `update_link` (re-validates a supplied `url` and `label`), `delete_link` (soft delete, `{ "card_link_id" }`); `cards/routes/link_routes.py`: POST `/api/cards/<uuid:id>/links` (201), PATCH and DELETE `/api/links/<uuid:id>` (200); no Notification and no outbound request to the stored URL
    - _Requirements: 42.2, 42.3, 42.4, 42.5, 42.6, 42.7, 42.8, 42.9, 42.10, 4.3_
    - _Design: A17 (link service), A21 rows 38 to 40, Open issues 48, 54, 55_
    - Depends on: 44.4, 44.7, 46.4

  - [x] 46.7 Write pytest tests for workspace links
    - 201, default label from the hostname (including a hostname over 100 characters cut to 100), label boundaries 0, 1, 100, 101, PATCH validation, delete, the 10th link accepted and the 11th 400, soft-deleted link not counted, `javascript:`, `data:`, `file:`, scheme-less, whitespace, and 2049-character values give 400, 403 for a guest and a non-participant, 404, 401, links listed by creation time in card detail, no Notification
    - Property test: **Property 68: Link URL validation and cap** (endpoint part)
    - **Validates: Requirements 42.2 to 42.9**
    - _Requirements: 42.2, 42.3, 42.5, 42.6, 42.7, 42.8, 42.9, 31.18, 31.19, 31.20_
    - _Design: Correctness Property 68_
    - Depends on: 46.6

  - [x] 46.8 Write the cascade tests for checklist items and links
    - Soft deleting a Board, a Column, and a Card sets `is_deleted` and the same `deleted_at` on the Checklist_Items and Card_Links below, leaves rows deleted earlier and unrelated rows unchanged, later GET of the deleted Card is 404, and an injected failure part-way leaves every row unchanged with a 500 envelope
    - Property test: **Property 70: Soft-delete cascade covers checklist and links**
    - Supersedes the cascade assertions of tasks 14.2 and 27.14 for Boards, Columns, and Cards; those stay as history
    - **Validates: Requirements 2.9, 2.10, 2.11, 2.13**
    - _Requirements: 2.9, 2.10, 2.11, 2.13, 31.21_
    - _Design: Correctness Property 70, A17_
    - Depends on: 44.9, 46.4, 46.6

  - [x] 46.9 Implement the overdue endpoint
    - Convert `notifications/service` to a package (`notification_service.py` with the V5 logic, `overdue_service.py`) and `notifications/routes` to a package (`notification_routes.py`, `overdue_routes.py`) keeping `routes`, `service`, and `schema` importable; pure `days_overdue(due, today_utc)`; `list_overdue(user_id, today_utc)` with the query of design A19 (due date before today, status not `DONE`, assigned to the user with role `admin`, `manager`, or `member`, or unassigned where the user is `admin` or `manager`; order by due date, `created_at`, `card_id`; limit 100; `total` counts all matches); `today_utc` computed once in the route; `OverdueItemSchema` and `OverdueResultSchema`; GET `/api/notifications/overdue` (200); no Notification row, no change to `GET /api/notifications` or its unread count
    - _Requirements: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 40.7, 40.9, 4.9_
    - _Design: A19, D22, A21 row 41, Open issues 61, 64_
    - Depends on: 44.2, 46.1

  - [x] 46.10 Write pytest tests for the overdue endpoint
    - Cover the list of Requirement 31.25: due yesterday and not `DONE` returned with `days_overdue` 1, due today not returned, `DONE` not returned, `URGENT` past due returned, a Card assigned to another user not returned, an unassigned Card returned to the admin and a manager and not to a `member` or a `guest`, soft-deleted Cards, Columns, and Boards not returned, at most 100 items with the full `total`, no Notification row created, `GET /api/notifications` unread count unchanged, 401 without a token and with a refresh token; fixed `today` passed to the service; marker `perf`: 20 Boards and 2,000 Cards, p95 under 500 ms over 100 requests
    - Property test: **Property 64: Overdue selection equals a naive model**
    - **Validates: Requirements 40.2 to 40.9**
    - _Requirements: 40.2, 40.3, 40.4, 40.5, 40.6, 40.8, 40.9, 31.25_
    - _Design: Correctness Property 64, A19_
    - Depends on: 46.9

  - [x] 46.11 Implement the role-change endpoint and the manager rank rules for members
    - `boards/service/role_service.py` `change_role`: validate the body (`MemberRoleSchema`, 400 first), `require_board_manager` (404, 403), load the target membership `FOR UPDATE` (404 when none), `target_is_owner = board.created_by == target.user_id`, `decide_role_change` (`forbidden` gives 403, `bad_request` gives 400), a role equal to the current role returns 200 and changes nothing (Open issue 59), set the role, and when the new role is `guest` set `assignee_id` to NULL on the user's non-deleted Cards of the Board in the same transaction; no Notification; response `user_id`, name, email, role
    - `member_service.py`: DELETE a member uses `decide_member_removal` (admin self-target 400, manager on admin or manager 403, the V5 assignee clearing stays); POST members by a manager always creates the role `member`; route PATCH `/api/boards/<uuid:id>/members/<uuid:user_id>` (200); `GET /api/boards/<id>` returns `my_role` with any of the four values
    - Supersedes the admin-only removal and the V5 and V6 member-removal rules of tasks 8.2 and 27.7; those stay as history
    - _Requirements: 9.1, 9.6, 9.7, 9.9, 43.5, 43.6, 43.7, 43.8, 43.9, 43.10, 43.11, 43.12_
    - _Design: A20, A15, A21 row 42, Open issues 47, 59, 63_
    - Depends on: 44.5, 44.6, 44.8, 46.1

  - [x] 46.12 Write pytest tests for the role change and member removal
    - Cover Requirement 31.23: a manager cannot change or remove a manager or the admin, only the admin grants `manager`, the admin cannot be demoted or removed (admin self-target 400, manager on the admin 403), a manager can change and remove `member` and `guest`, `role` missing or `admin` or invalid gives 400 before any 403 (invalid body from a `member` still 400), 404 when the target has no active membership, 403 for `member`, `guest`, and non-participants, a change to `guest` clears the assignee of that user's Cards in the same transaction, a change to `manager` keeps assignments, same-role change returns 200, no Notification, the user keeps exactly one active membership
    - Property test: **Property 72: Role-change and removal decisions**, endpoint part (generated caller, target, and new role against the database and against `decide_role_change`)
    - Supersedes the member-removal assertions of tasks 8.4 and 27.10 where only the admin removed members; those stay as history
    - **Validates: Requirements 9.6, 9.7, 43.5 to 43.11**
    - _Requirements: 9.6, 9.7, 43.5, 43.6, 43.7, 43.8, 43.9, 43.10, 43.11, 31.23_
    - _Design: Correctness Property 72, A20_
    - Depends on: 46.11

  - [x] 46.13 Write the Column tests by role
    - Supersedes the V5 and V6 Column tests of tasks 9.2 and 27.11 wherever a `member` creates, renames, deletes, or reorders Columns; 9.2 and 27.11 stay as history
    - A `member` gets 403 on the four Column endpoints with the data unchanged while keeping full Card, Checklist_Item, Card_Link, Comment, and status access; a manager and the admin succeed on all four; a guest and a non-participant get 403; 404 and 400 paths as before
    - **Validates: Requirements 10.1 to 10.11**
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7, 10.10, 10.11, 31.24_
    - _Design: A15 (matrix), Correctness Property 73_
    - Depends on: 44.8, 46.1

  - [x] 46.14 Write the invite-link tests for managers
    - Supersedes the admin-only assertions of task 27.9; 27.9 stays as history
    - GET invite-links and regenerate succeed for the admin and every manager, return 403 for a `member`, a `guest`, and a non-participant without disclosing a token; regenerate by a manager invalidates the old token and leaves the other role's token; accept keeps `manager` and `admin` for any token and upgrades a guest only through the member token; add member by email by a manager creates `member`
    - Property test: **Property 75: Manager accept and invite links** (endpoint part)
    - **Validates: Requirements 37.3, 37.5, 37.6, 37.12, 28.12, 9.1**
    - _Requirements: 37.3, 37.5, 37.6, 37.12, 28.12, 9.1, 31.16_
    - _Design: Correctness Property 75, A12-V6 (V11 note), A20_
    - Depends on: 44.8, 46.1

  - [x] 46.15 Update the status, analytics, and assignee tests for URGENT and the manager role
    - Supersedes the three-value tests and generators of tasks 27.4 and 27.6 and the role sets of Properties 46 and 48; those stay as history
    - Status: `URGENT` accepted on PATCH and `urgent`, `""`, null, unknown rejected with 400, stateful Hypothesis test over four-value PATCH sequences against the database, `URGENT` to `NOT_STARTED` leaves `completed_at` unchanged, a position change leaves both unchanged; analytics: an `URGENT` Card is not counted as completed, a manager appears in member activity, a manager gets 403 on analytics; assignee: a manager is accepted, a guest is rejected, no Notification for a guest
    - Property tests: **Property 61: Four-value status state machine** (database part), **Property 46** (role set `admin`, `manager`, `member`), **Property 48** (role set includes `manager`)
    - **Validates: Requirements 11.4, 11.19, 14.2, 14.10, 39.1 to 39.4**
    - _Requirements: 11.4, 11.5, 11.19, 14.2, 14.7, 14.10, 39.1, 39.2, 39.3, 39.4, 31.13, 31.14_
    - _Design: Correctness Properties 46, 48, 61_
    - Depends on: 44.2, 44.8, 46.1

  - [x] 46.16 Write the V11 role and permission matrix tests
    - Supersedes the V6 matrix of tasks 27.11 and 14.1 (three roles, `member` managing Columns); those stay as history
    - Parametrize admin, manager, member, guest, and non-participant over every endpoint of the V11 matrix in design A15 (Board, members, role change, Columns, Cards, status, checklist, links, comments, invite-links, regenerate, analytics, search, card detail, overdue, invite info and accept): each cell equals the matrix, every 403 leaves the data unchanged and the body free of resource data, a guest gets 200 on GET `/api/cards/<id>` and 403 on every write
    - Property tests: **Property 73: V11 permission matrix** (database part), **Property 13** (updated role set), **Property 47** (updated role set)
    - **Validates: Requirements 9.9, 10.7, 10.10, 10.11, 37.5, 41.7, 42.8, 43.2, 43.3, 43.9**
    - _Requirements: 9.9, 10.10, 10.11, 28.14, 37.5, 37.14, 41.7, 42.8, 43.3, 43.9, 31.5, 31.20_
    - _Design: Correctness Properties 13, 47, 73, A15 (matrix)_
    - Depends on: 46.5, 46.7, 46.12, 46.13, 46.14, 46.2

  - [x] 46.17 Write database-level V11 schema tests
    - Against the test database after task 45.1: `information_schema` lists exactly the 9 tables; inserting `status = 'URGENT'` and `role = 'manager'` succeeds and `'urgent'` and `'owner'` fail; `ix_cards_due_date`, `ix_checklist_items_card_id_order`, and `ix_card_links_card_id` exist; named FKs exist; a failure message tells the user to review the hand-edited check constraints of task 45.1
    - Supersedes the 7-table and three-role schema tests of task 27.12; 27.12 stays as history
    - _Requirements: 2.15, 2.16, 44.1, 44.2, 44.3, 31.16_
    - _Design: Data Models (V11 migration table), Testing Strategy V11 additions_
    - Depends on: 45.1

  - [x] 46.18 Update the envelope, status code, and serialization tests for the V11 endpoints
    - Supersedes the 33-row endpoint list of tasks 14.3 and 27.13; those stay as history
    - Parametrize over the 42 rows of design A11 and A21 plus 3a: exactly one top-level key, 201 only for the eight creating POSTs (register, boards, members, columns, cards, comments, checklist, links), 200 elsewhere (regenerate, accept, role change, overdue), each failure type maps to the right status, UUID and timestamp formats; extend the static scan for SQL built by string formatting and the log-capture test over the new checklist, link, overdue, and role-change code
    - Property tests: **Property 1**, **Property 2**, **Property 3** (updated)
    - **Validates: Requirements 4.1 to 4.18**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.15, 28.2, 28.3, 31.3_
    - _Design: A11, A21, Correctness Properties 1, 2, 3_
    - Depends on: 46.2, 46.4, 46.6, 46.9, 46.11

- [x] 47. V11 backend checkpoint
  - Run `pytest -v` from `app/` against the test database after task 45.1: 0 failures and 0 errors, including the file-size test of task 15.1 (split any backend file over 300 lines)
  - Ensure all tests pass, ask the user if questions arise
  - Frontend V11 tasks (49 onward) depend on this checkpoint
  - Depends on: 44.12, 44.13, 44.14, 44.15, 46.3, 46.5, 46.7, 46.8, 46.10, 46.12, 46.13, 46.14, 46.15, 46.16, 46.17, 46.18
  - _Requirements: 31.8, 30.6, 30.7_

- [x] 48. [MANUAL] Confirm the design-system tokens for statuses, label colors, and chips
  - NOT executed by the agent, and `guidelines/` is never modified by an agent task. Compare `web/app/globals.css` and `guidelines/design-system.md` for: the four status chips (neutral gray, primary blue, danger red with `bg-danger-soft text-danger-ink`, success green with `bg-success-soft text-success-ink`), the eight label pairs `gray`, `blue`, `green`, `yellow`, `orange`, `red`, `purple`, `pink` (contrast at least 4.5:1), and the four role badge variants
  - If a pair is missing, add it to `guidelines/design-system.md` first (Requirement 39.10); then tell the agent, and task 49.5 adds the matching tokens to `web/app/globals.css`. If everything exists, just check this task
  - Depends on: 47
  - _Requirements: 39.5, 39.9, 39.10, 40.14, 43.15_
  - _Design: B17, Open issues 46, 62_

- [x] 49. Phase 27 (V11): Frontend libraries and shared pieces
  - [x] 49.1 Add the V11 types
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `lib/types.ts`: `Role` includes `manager`, `CardStatus` includes `URGENT`, new `BoardCard` (Card plus `checklist_done`, `checklist_total`, `link_count`), `ChecklistItem`, `CardLink`, `CardDetail`, `OverdueItem`, `OverdueResult`, `MemberRoleUpdate`; `Column.cards` becomes `BoardCard[]`; search and My Tasks results stay `Card`; update fixtures and compile errors with minimal edits
    - Supersedes the V6 `Role` and `CardStatus` types of task 29.1; 29.1 stays as history
    - _Requirements: 2.15, 2.16, 41.9, 42.9, 44.5, 40.1, 43.5_
    - _Design: B20, B10_
    - Depends on: 47

  - [x] 49.2 Rewrite `lib/status.ts` for four statuses and update `StatusBadge`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `CARD_STATUSES` (four, in order), `STATUS_STYLE` with `label`, `variant` (`gray`, `blue`, `red`, `green`), and a complete static `className` string per status (no template-built classes), `STATUS_LABEL` as a function; `StatusBadge` renders `BaseBadge` with the variant; keep the old `STATUS_VARIANT` export only until every call site is migrated
    - Property test: **Property 62: Status style map** (four distinct labels, class strings, and variants; `URGENT` uses danger tokens and `DONE` success tokens; `className` and the `BaseBadge` variant agree; board face, modal, and My Tasks row use the same entry)
    - Supersedes the three-status `lib/status.ts`, tests, and `StatusBadge` of tasks 29.1, 29.3, and 29.9, and the three-status part of Property 56; those stay as history
    - **Validates: Requirements 21.22, 23.17, 25.2, 39.5, 39.6**
    - _Requirements: 21.22, 23.17, 25.2, 39.5, 39.6, 32.25_
    - _Design: B17, Correctness Property 62_
    - Depends on: 49.1, 49.5, 48

  - [x] 49.3 Create `lib/labelColor.ts`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `LABEL_KEYS` (eight), `normalizeLabel` (trim, NFC, lower case), `labelColor(text)` (FNV-1a 32 bit, no `Math.random`, no date), `LABEL_CLASS` with a complete static two-token class string per key
    - Property test: **Property 63: Label color** (always one of the eight keys, deterministic, invariant under case and surrounding whitespace, every key has a complete class string with no template placeholder, non-ASCII input handled)
    - **Validates: Requirements 39.7, 39.8, 39.9, 39.11**
    - _Requirements: 39.7, 39.8, 39.9, 39.11, 39.12, 32.24_
    - _Design: B17, Correctness Property 63_
    - Depends on: 49.5, 48

  - [x] 49.4 Rewrite `lib/roles.ts` with `can`, `assignableRoles`, and `canActOnMember`
    - Read `guidelines/frontend.md` first. `ROLE_RANK`, `Action` (ten actions of Requirement 43.13), `can(role, action)`, `assignableRoles(role)` (admin: guest, member, manager; manager: guest, member; others none), `canActOnMember(role, targetRole)`, `ROLE_VARIANT` with four pairwise distinct variants; keep `canEdit`, `isAdmin`, and `isGuest` only until task 50.1 migrates every call site, then delete them
    - Property test: **Property 74: Frontend `can` and role controls**, pure part: a table test over every role and action against the Requirement 43 rule written independently in the test (not copied from the source table)
    - Supersedes the V6 `lib/roles.ts` and its tests of tasks 29.1 and 29.3; those stay as history
    - **Validates: Requirements 43.13, 43.14, 43.15**
    - _Requirements: 43.3, 43.13, 43.14, 43.15, 32.26_
    - _Design: B16, D19, Correctness Property 74_
    - Depends on: 49.1

  - [x] 49.5 Add `@source "../lib"` and any missing tokens to `globals.css`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - Add `@source "../lib";` next to the existing `@source` lines of `web/app/globals.css` (a superset of the folders listed in Requirement 15.2, design D23 and Open issue 45); add `@theme` tokens only for the pairs that `guidelines/design-system.md` defines and `globals.css` lacks (task 48)
    - New test `web/__tests__/tailwind-sources.test.ts`: `globals.css` scans `components`, `hooks`, and `lib`; every class string exported from `lib/status.ts` and `lib/labelColor.ts` is a complete literal with no `${`; search `web/__tests__/` for existing assertions on the `@source` list and update them
    - _Requirements: 39.5, 39.9, 39.10, 15.2_
    - _Design: D23, B17, Open issues 45, 46_
    - Depends on: 47, 48

  - [x] 49.6 Create `lib/overdue.ts` and `lib/progress.ts` with tests
    - Read `guidelines/frontend.md` first. `todayUtc(now = new Date())` (ISO date, UTC), `isOverdue(due, status, today)` (`due` not null, `due < today`, status not `DONE`), `formatOverdue(n)` ("1 day overdue" for 1), `progressPercent(done, total)` (0 for total 0)
    - Property tests: **Property 65: Overdue chip and text** (pure part), **Property 66: Checklist rules** (progress part: `round(done / total * 100)` and text `done/total`, no indicator at 0)
    - **Validates: Requirements 40.11, 40.14, 41.16**
    - _Requirements: 40.11, 40.14, 41.16, 32.27, 32.29_
    - _Design: B18, B19, Open issue 51, Correctness Properties 65, 66_
    - Depends on: 49.1

  - [x] 49.7 Create `lib/linkProvider.ts` and the checklist and link validators
    - Read `guidelines/frontend.md` first. `providerKey(hostname)` returns `gdrive`, `onedrive`, `dropbox`, `notion`, or `generic` by exact host or subdomain suffix in any letter case; `lib/validation.ts` gains `validateLinkUrl` (mirror of `validate_link_url`) and `validateChecklistText` (1 to 200, non-blank)
    - Property tests: **Property 68** (client mirror: same accept and reject decisions as the server rule over a shared table of cases and generated strings), **Property 69: Provider icon key**, **Property 29** (re-run with the new validators)
    - Supersedes the V6 validator list of task 29.4 (additive); 29.4 stays as history
    - **Validates: Requirements 42.5, 42.13, 42.14, 41.6**
    - _Requirements: 42.5, 42.13, 42.14, 41.6, 32.28_
    - _Design: B18, Correctness Properties 29, 68, 69_
    - Depends on: 49.1

- [x] 50. Phase 28 (V11): Frontend components
  - [x] 50.1 Migrate the board gating to `can` and hide the Column controls for `member`
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `BoardRoleContext` provides `{ role, can }`; Column add, rename, delete, and reorder controls need `manage_columns` (admin and manager); add card, drag (`useDragAndDrop({ enabled: can(role, "edit_cards") })`), status, assignee, checklist, links, and comment form need `edit_cards`; the analytics link needs `view_analytics` (admin only); the guest badge and read-only behaviour stay; remove `canEdit`, `isAdmin`, `isGuest` from `lib/roles.ts` once no call site remains; keep every file at or below 300 lines (extract `BoardColumns.tsx` from `BoardView.tsx` if needed)
    - RTL tests: member sees no Column controls but can add and drag cards, manager and admin see the Column controls, guest sees nothing editable
    - Supersedes the V6 role gating and the member Column controls of tasks 18.5, 30.1, and 36.1; those stay as history
    - Property test: **Property 74: Frontend `can` and role controls** (render part)
    - **Validates: Requirements 10.11, 21.13, 21.20**
    - _Requirements: 10.11, 21.2, 21.4, 21.5, 21.12, 21.13, 21.20, 22.18, 43.13, 32.30_
    - _Design: B16 (gating table), B6-V6 (V11 note), Open issue 53_
    - Depends on: 49.1, 49.4

  - [x] 50.2 Rebuild the member panel with the role dropdown and manager access
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `MemberPanel` and `InviteLinksPanel` render for `manage_members` and `view_invite_links` (admin and manager); `MemberList` shows a role `BaseBadge` (`ROLE_VARIANT`) per row and, only when `canActOnMember(myRole, row.role)`, a new `RoleSelect.tsx` listing `assignableRoles(myRole)` and the remove control; a role change sends PATCH `/api/boards/<id>/members/<user_id>`, updates the row only after 200, and on an error keeps the old role and calls `handleError`; a change to `guest` clears that user's assignments in local board state; `BoardToolbar` shows the Members button for admin and manager and the Analytics link for the admin only
    - RTL tests: dropdown options for the admin and for a manager, no dropdown or remove control for an equal or higher rank, role change success and failure, manager sees both invite links, `member` sees neither
    - Supersedes the admin-only member panel and toolbar buttons of tasks 18.7, 30.4, and 36.1; those stay as history
    - **Validates: Requirements 21.12, 21.21, 37.15, 37.17, 43.13, 43.14, 43.15**
    - _Requirements: 21.12, 21.21, 37.15, 37.16, 37.17, 43.5, 43.13, 43.14, 43.15, 32.26_
    - _Design: B16, B6-V6 (member panel), Correctness Property 74_
    - Depends on: 50.1, 49.4, 49.1

  - [x] 50.3 Add the Card face indicators (`CardMetaRow.tsx`)
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - New `CardMetaRow.tsx` (one component, `flex flex-wrap gap-1`): label chips coloured by `labelColor`, `StatusBadge`, the "Overdue" chip with `bg-danger-soft text-danger-ink` iff `isOverdue(due_date, status, today)` (no request), the link chip with icon and `link_count` iff `link_count > 0`, and below the row the checklist text `done/total` with a thin bar (static colour classes, computed width through `style`) iff `checklist_total > 0`; `today` is passed in for testability; counts missing on search results hide the chips; `CardItem.tsx` stays at or below 300 lines and composes the row
    - RTL tests: chip rules, `3/5` and 60 percent, no indicator at 0, link chip hidden at 0, label colours stable across cards, guest sees the same face
    - Supersedes the V5 and V6 `CardItem` markup of tasks 18.4 and 30.1; those stay as history
    - **Validates: Requirements 39.6, 39.11, 40.14, 41.16, 42.15**
    - _Requirements: 39.6, 39.11, 40.14, 41.16, 41.17, 42.15, 32.27, 32.29_
    - _Design: B18 (card face), B21 (`CardMetaRow.tsx`)_
    - Depends on: 49.2, 49.3, 49.6, 50.1

  - [x] 50.4 Rebuild `CardDetailModal` for four statuses, card detail loading, and count updates
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `StatusSelect` offers the four options in `CARD_STATUSES` order with the current status preselected; on open the modal shows the card fields from board state at once (Requirement 23.1, within 300 ms) and sends `GET /api/cards/<id>` for the checklist and links, with a loading state per section and `handleError` on failure; `onCardUpdated` and a new `onCountsChanged(cardId, counts)` update the board state (Card face) without a reload; assignee options are the members whose role is not `guest` (so managers are offered); guests see a read-only view; keep every file at or below 300 lines
    - RTL tests: four options with the current one preselected, status-only PATCH body (`URGENT` included), badge update on the board and in My Tasks, failing PATCH keeps the modal and the previous status, guest view
    - Supersedes the three-option status control of task 30.2; 30.2 stays as history
    - **Validates: Requirements 23.1, 23.17 to 23.22, 41.12, 41.17, 42.11**
    - _Requirements: 23.1, 23.2, 23.17, 23.18, 23.19, 23.20, 23.21, 41.17, 32.16, 32.25_
    - _Design: B18 (CardDetailModal composition), B17, Correctness Properties 62, 74_
    - Depends on: 50.1, 50.3, 49.2, 49.7

  - [x] 50.5 Build the checklist section
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `ChecklistSection.tsx`, `ChecklistItemRow.tsx`, `AddChecklistForm.tsx` and `hooks/useChecklist.ts`: checkbox, text with inline edit, delete control, add form with field errors (empty, blank, over 200 characters, no request), add control disabled at 50 items with the message "Limit of 50 items reached", optimistic toggle applied within 100 ms and restored with one `handleError` toast on failure, add, edit, and delete failures keep the list and the entered text, read-only for a guest; call `onCountsChanged` after every successful change; wire into `CardDetailModal`
    - RTL tests: progress after changes, optimistic toggle and revert, guest read-only, disabled add at 50
    - Property test: **Property 67: Optimistic checklist toggle**
    - **Validates: Requirements 41.12 to 41.17**
    - _Requirements: 41.12, 41.13, 41.14, 41.15, 41.16, 41.17, 32.27_
    - _Design: B18 (checklist), Correctness Property 67_
    - Depends on: 50.4, 49.6, 49.7

  - [x] 50.6 Build the workspace links section
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `LinksSection.tsx`, `LinkRow.tsx`, `LinkForm.tsx`: label, hostname beside every label (Open issue 55), a generic icon per `providerKey` from the design-system icon library, an anchor with `href` set to the stored URL, `target="_blank"`, and `rel="noopener noreferrer"`, the label rendered as text (no `dangerouslySetInnerHTML`), add form (URL and optional label) and edit and delete controls with field errors from `validateLinkUrl` and no request on invalid input, failures keep the list and the entered values and call `handleError`, read-only for a guest; call `onCountsChanged`; wire into `CardDetailModal`
    - RTL tests: invalid values blocked, anchor attributes, chip count updates, guest list only
    - **Validates: Requirements 42.11, 42.12, 42.13, 42.14, 42.16**
    - _Requirements: 42.11, 42.12, 42.13, 42.14, 42.15, 42.16, 28.9, 32.28_
    - _Design: B18 (links), Correctness Property 69_
    - Depends on: 50.5, 49.7

  - [x] 50.7 Build the overdue UI
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `hooks/useOverdue.ts` (`{ items, total, refresh }`): one request on the first mount of the Header while the AuthContext status is `authenticated` and one each time the notification list opens, never on a timer, a failed request keeps the previous items and shows no toast; `NotificationList` shows an "Overdue" group above the stored items (`OverdueItemRow.tsx`: red `BaseBadge` "Overdue", `formatOverdue(days_overdue)`, title, board name, selecting navigates to `/boards/<board_id>` and closes the list); the bell count stays the stored unread count; the empty state shows only when both lists are empty
    - RTL tests with fake timers: request on mount and on open, none after 10 minutes, bell count unchanged, empty-state rule, silent failure
    - Property test: **Property 65: Overdue chip and text** (component part)
    - Supersedes the empty-state behaviour of tasks 17.12 and 24.5 in the notification list; those stay as history
    - **Validates: Requirements 40.10 to 40.15**
    - _Requirements: 40.10, 40.11, 40.12, 40.13, 40.15, 24.5, 32.29_
    - _Design: B19, Open issues 50, 51_
    - Depends on: 49.6, 49.1

  - [x] 50.8 Show four roles and four statuses on the Dashboard and My Tasks
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `BoardList` role badge uses the four `ROLE_VARIANT` entries and shows `manager`; `MyTasksList` renders `StatusBadge` for all four statuses (an `URGENT` Card stays in the list, `DONE` stays with the "Done" badge, no status filter); remove the old `STATUS_VARIANT` export and update remaining call sites
    - Supersedes the three-status badges and three-role badges of task 30.8; 30.8 stays as history
    - _Requirements: 20.1, 25.2, 25.7, 43.15_
    - _Design: B16, B17_
    - Depends on: 49.2, 49.4

  - [x] 50.9 Update the Welcome_Page copy for the Urgent status
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - `lib/welcomeContent.ts`: the second feature card description becomes "Add labels, due dates, and a status (Not started, In progress, Urgent, or Done) to every card."; the preview sample statuses may include one "Urgent" chip; confirm `lib/forbiddenClaims.ts` has no "checklist" entry (the V8 list already lacks it; "subtask" stays forbidden) and the copy mentions no forbidden string; update the V8 Welcome_Page unit test expectation for the exact feature text
    - Supersedes the three-status feature copy of tasks 35.1 and 37.2; those stay as history
    - Property test: **Property 60: Forbidden-claims scan** (re-run over the updated copy)
    - **Validates: Requirements 38.17, 38.18, 38.19**
    - _Requirements: 38.17, 38.18, 38.19, 32.30_
    - _Design: B20 (welcome copy), Open issue 60, Correctness Property 60_
    - Depends on: 47

  - [x] 50.10 Responsive pass for the V11 components
    - Read `guidelines/frontend.md` and `guidelines/design-system.md` first (read only); note `web/AGENTS.md`
    - Review the Card face chips, checklist, links, role dropdown, and overdue rows at 375 px against design B9: no horizontal overflow outside the Kanban container, `flex-wrap` and `min-w-0`, long URLs and hostnames use `break-all`, 44 px tap targets for the checkbox, delete, role dropdown, and add controls; add class-based RTL assertions where practical
    - _Requirements: 27.1, 27.2, 27.6, 41.12, 42.11, 43.14_
    - _Design: B9, B18_
    - Depends on: 50.2, 50.3, 50.5, 50.6, 50.7, 50.8, 50.9

  - [x] 50.11 Update the frontend repository-rule tests for the V11 files
    - Read `guidelines/frontend.md` first; note `web/AGENTS.md`
    - Extend `web/__tests__/repo-rules.test.ts`: one component per file for `CardMetaRow`, `ChecklistSection`, `ChecklistItemRow`, `AddChecklistForm`, `LinksSection`, `LinkRow`, `LinkForm`, `RoleSelect`, `OverdueItemRow`; no native `<button` outside `BaseButton`; no `dangerouslySetInnerHTML`; `scripts/check_file_size.py` over `web/` (300 lines); split any failing file (`CardItem`, `BoardView`, `CardDetailModal`, `MemberPanel` are the likeliest)
    - Supersedes the file lists of tasks 30.11, 37.9, and 40.6; those stay as history
    - _Requirements: 28.9, 18.6, 30.6, 30.7, 44.6_
    - _Design: B21, Open issue 56_
    - Depends on: 50.10

- [ ] 51. Phase 29 (V11): Frontend tests
  - [ ] 51.1 Write the role and gating tests (`can`, dropdown, board views)
    - Read `guidelines/frontend.md` first. Table test of `can(role, action)` over every combination; `assignableRoles`; the role dropdown and remove control only through `canActOnMember`; a board rendered as `member` shows no Column controls, member panel, invite links, or analytics link while keeping card editing; as `manager` shows Column controls, member panel, and both invite links but no analytics link; as `admin` everything
    - Property test: **Property 74: Frontend `can` and role controls**
    - **Validates: Requirements 43.13, 43.14, 43.15, 21.12, 21.13**
    - _Requirements: 21.12, 21.13, 43.13, 43.14, 43.15, 32.26, 32.30_
    - _Design: Testing Strategy V11 additions (frontend), Correctness Property 74_
    - Depends on: 50.1, 50.2

  - [ ] 51.2 Write the checklist tests
    - Read `guidelines/frontend.md` first. `3/5` and a 60 percent bar for 3 done of 5, no indicator at 0, optimistic toggle within 100 ms and restore with one toast on failure, read-only checkboxes for a guest, add control disabled at 50, field errors without a request
    - Property tests: **Property 66** (progress and rules), **Property 67: Optimistic checklist toggle**
    - **Validates: Requirements 41.12 to 41.17**
    - _Requirements: 41.12, 41.13, 41.14, 41.16, 32.27_
    - _Design: Correctness Properties 66, 67_
    - Depends on: 50.5

  - [ ] 51.3 Write the workspace link tests
    - Read `guidelines/frontend.md` first. The add form rejects empty, `javascript:alert(1)`, `data:`, `file:`, and over-2048-character values without a request; every anchor has `target="_blank"` and `rel` containing `noopener` and `noreferrer`; the count chip is hidden at 0 and shown above 0; `providerKey` returns `generic` for an unknown host; a guest sees the list without add, edit, or delete controls
    - Property tests: **Property 68** (client side), **Property 69: Provider icon key**
    - **Validates: Requirements 42.11 to 42.16**
    - _Requirements: 42.11, 42.12, 42.13, 42.14, 42.15, 32.28_
    - _Design: Correctness Properties 68, 69_
    - Depends on: 50.6

  - [ ] 51.4 Write the overdue and status-map UI tests
    - Read `guidelines/frontend.md` first. The Card chip appears iff the due date is before the UTC date and the status is not `DONE`; "1 day overdue" and "N days overdue"; the overdue request is sent on load and when the list opens and never on a timer; overdue items are not counted by the bell; the empty state needs both lists empty; four status labels and classes, and the board Card and My Tasks row show the same badge
    - Property tests: **Property 65**, **Property 62** (component use)
    - **Validates: Requirements 40.10 to 40.15, 39.5, 39.6**
    - _Requirements: 40.10, 40.11, 40.12, 40.13, 40.14, 40.15, 39.6, 32.25, 32.29_
    - _Design: Correctness Properties 62, 65_
    - Depends on: 50.3, 50.7

  - [ ] 51.5 Sweep and update the remaining tests invalidated by V11
    - Read `guidelines/frontend.md` first; run the full `npm test` and fix every failure caused by V11 without weakening an assertion
    - Supersedes the V5 to V8 assertions that assume three statuses or three roles or a `member` with Column controls: the RTL tests of tasks 18.5, 18.7, 29.3, 29.9, 30.1, 30.2, 30.4, 30.8, 36.1, 37.2, and 37.3, plus every `Card` and `Role` test fixture; those tasks stay as history
    - _Requirements: 10.11, 21.13, 21.22, 23.17, 25.2, 43.15, 32.9, 32.10_
    - _Design: Correctness Property Amendments (V11 change notes)_
    - Depends on: 51.1, 51.2, 51.3, 51.4, 50.11

- [ ] 52. Phase 30 (V11): Playwright updates
  - [ ] 52.1 Update the invite-join and role scenario
    - Read `guidelines/frontend.md` first. The pre-existing user (`requireCredentials()`, the Board creator and therefore `admin`) creates a Board and reads both links; a second generated account joins through the member link, sees card controls and no Column controls (no add-column control); the creator promotes it to manager through the role dropdown; after a reload the second account sees the Column controls and the member panel but no analytics link; a third account joins through the guest link and sees the "Guest" badge and no edit controls
    - Supersedes the member-sees-add-column expectation of task 31.7; 31.7 stays as history
    - No literal credentials, no `waitForTimeout`
    - _Requirements: 10.11, 21.13, 21.20, 43.14, 33.6, 33.10_
    - _Design: Testing Strategy V11 additions (Playwright)_
    - Depends on: 50.2, 31.1, 46.16

  - [ ] 52.2 Write the checklist, link, and Urgent status scenario
    - Read `guidelines/frontend.md` first. The Board creator adds a checklist item and a link in a card, sees `1/1` progress and the link chip on the Card face, and sets the status to "Urgent" and sees the red badge there and in `/my-tasks`
    - No literal credentials, no `waitForTimeout`
    - _Requirements: 39.6, 41.16, 42.15, 33.6, 33.10_
    - _Design: Testing Strategy V11 additions (Playwright)_
    - Depends on: 50.6, 50.4, 31.1

  - [ ] 52.3 Write the overdue scenario
    - Read `guidelines/frontend.md` first. Set a past due date on an assigned card through the modal, see the "Overdue" chip on the Card face, open the notification bell and see the overdue row with "N days overdue" and no change of the bell count, select it and land on the board
    - No literal credentials, no `waitForTimeout`
    - _Requirements: 40.10, 40.11, 40.12, 40.14, 33.6, 33.10_
    - _Design: Testing Strategy V11 additions (Playwright)_
    - Depends on: 50.7, 50.3, 31.1

  - [ ] 52.4 Extend the no-literal-credentials check over the V11 specs
    - Confirm the scan of `web/e2e/` (task 31.9, Property 58) covers the new and updated specs of 52.1 to 52.3 and fails on a literal e-mail address or a literal password passed to a fill; add a case that lists the V11 spec files and asserts each imports `requireCredentials` or uses no credentials
    - Supersedes the file lists of tasks 31.9 and 37.7; those stay as history
    - **Validates: Requirements 33.10, 33.12**
    - _Requirements: 33.6, 33.10, 33.12, 32.19_
    - _Design: Correctness Property 58_
    - Depends on: 52.1, 52.2, 52.3

- [ ] 53. Phase 31 (V11): README and documentation
  - [ ] 53.1 Update `README.md` for V11
    - Features list adds the Urgent status and label colors, overdue notifications, card checklists, workspace links (URLs only, no file upload), and the Manager role with its permissions; Local Run Steps state that the V11 schema changes need `flask db migrate` and `flask db upgrade` as a manual Migration_Step in which the user hand-edits the `cards.status` and `board_memberships.role` check constraints (the migration generator does not detect them); a sentence states that the role `member` no longer manages Columns; describe the look in words only and name no example HTML file (Requirement 36.14); run `scripts/check_readme_links.py`
    - Do not remove the owner's TODO placeholders of task 23.3
    - _Requirements: 36.15, 36.14, 36.12_
    - _Design: Part D (V11 notes), D3_
    - Depends on: 45.1, 50.9

  - [ ] 53.2 Review the documentation and the guidelines for V11 drift
    - Update `docs/deployment.md` so the verification list also names GET `/api/notifications/overdue`, POST and PATCH of a checklist item and a link, GET `/api/cards/<id>`, and PATCH `/api/boards/<id>/members/<user_id>` with a second account; check `docs/violation-report.md` and `docs/guideline-comparison.md` for outdated "7 tables" or three-role statements; search `guidelines/*.md` for "admin only", "7 tables", and three-role statements and report each hit to the user in the task result instead of editing (agents never modify `guidelines/`); re-run `scripts/check_repo_hygiene.py` and `scripts/check_readme_links.py`
    - _Requirements: 34.5, 35.1, 36.12, 30.1_
    - _Design: Part D (V11 notes), Open issue 65_
    - Depends on: 47

- [ ] 54. V11 final checkpoint
  - Run `pytest -v` from `app/`, `npm test` and `npm run build` from `web/`, `scripts/check_file_size.py` over `app/` and `web/`, `scripts/check_repo_hygiene.py`, and `scripts/check_readme_links.py`; confirm that no backend or frontend file is over 300 lines
  - Ensure all tests pass, ask the user if questions arise
  - Depends on: 47, 49.2, 49.3, 49.4, 49.5, 49.6, 49.7, 50.11, 51.5, 52.4, 53.1, 53.2
  - _Requirements: 31.8, 32.9, 32.10, 32.11, 30.6, 35.1, 36.12_

- [ ] 55. [MANUAL] Verify the V11 features in the browser before deployment
  - NOT executed by the agent. Run the API with `flask run` and the web app with `npm run dev` against the development database; check at a desktop width and at 375 px (browser device mode)
  - Check in words: a card shows a red "Urgent" badge and coloured labels that keep the same colour on every board; a checklist added in the card shows `done/total` and a thin bar on the Card face and a toggle survives a reload; a link opens in a new tab and shows its hostname; a past due card shows the red "Overdue" chip and the bell list shows the overdue row without changing the unread count; a `member` sees no Column controls, member panel, or invite links, a manager sees the Column controls, the member panel, and both invite links but no analytics link, and the admin sees everything; the admin promotes a member to manager and demotes a manager to guest (assignments cleared); a manager cannot change or remove another manager or the admin
  - Depends on: 54
  - _Requirements: 10.11, 39.6, 40.11, 40.14, 41.16, 42.12, 43.14, 34.8_
  - _Design: B16 to B19_

- [ ] 56. [MANUAL] Apply the V11 schema to production and extend the deployed verification
  - NOT executed by the agent. If the production schema was created (task 22.4) before the V11 migration of task 45.1 existed, run `flask db upgrade` again with `DATABASE_URL` pointed at the production database (the committed history already contains the hand-edited constraints); if production is still empty, the first `flask db upgrade` already includes V11. Then add to the Postman and browser verification of tasks 22.6 and 22.7: GET `/api/notifications/overdue`, POST and PATCH of a checklist item and a link, GET `/api/cards/<id>`, PATCH `/api/boards/<id>/members/<user_id>` with a second account, a Card status `URGENT`, and the Column controls hidden for a `member`
  - Depends on: 45.1, 54, 22.5
  - _Requirements: 34.3, 34.5, 34.6, 44.1_
  - _Design: Part D (V11 notes), Open issue 66_

## Notes

- Tasks marked `[MANUAL]` are performed by the user and never by the agent: 4.1, 4.2, 4.3, 15.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 23.4, 23.8, and the V6 manual tasks 26.1 (V6 migration on the development and test databases), 26.2 (optional backfill), 33.3 (browser verification of invite links and the welcome flow), 33.4 (`web/.env.test` and the local E2E account), and 33.5 (E2E account on the production database).
- All test sub-tasks are required, not optional, because the user wants pytest in the backend phase and the suites in the frontend phase.
- Assumptions: guidelines are written first (task 1); `permissions.py`, notifications, and users are built before the tasks that depend on them (see Overview); the dependency graph runs most waves one after another to respect the user's backend-then-frontend rule, with parallel waves only for files that do not overlap.
- Test tasks that use the database depend on 5.1, which depends on the manual task 4.3. Pure tests (2.7, 2.8, 3.5) have no such dependency.
- Ordering tests, property tests, and every requirement keep to the 300-line file rule; split large test files by feature.
- Properties 1 to 43 are covered: 1, 2 in 2.8 and 14.3; 3, 4 in 2.8; 5 in 2.7; 6 to 8 in 14.2; 9 in 7.2, 8.4, 14.2; 10, 11 in 7.2; 12 in 7.2, 9.2, 11.3, 12.2; 13 in 14.1; 14 in 8.3; 15 in 8.3, 9.2, 11.3; 16 in 9.2, 11.3; 17 in 6.2, 11.3; 18 in 8.4, 11.3; 19 in 11.4; 20 in 12.2; 21 in 10.2, 11.5; 22, 23 in 10.2; 24 in 13.2; 25 in 14.5; 26, 39, 40 in 17.6; 27 in 17.9; 28 in 17.5; 29 in 17.3; 30, 31, 41, 42 in 17.4 and 17.14; 32 in 17.12; 33 in 17.13; 34 in 18.9 and 18.10; 35 in 18.9 (and 17.2); 36, 37, 38 in 7.3; 43 in 6.2 and 7.3.
- Requirement coverage (task numbers): R1: 1.2, 2.1, 2.2, 2.5, 3.1 to 3.5 · R2: 2.3, 3.1, 3.2, 3.5, 14.2 · R3: 4.1 to 4.3, 3.4, 14.4 · R4: 2.4, 2.8, 14.3 · R5: 2.5, 2.8 · R6: 7.1 to 7.3 · R7: 6.1, 6.2 · R8: 8.1, 8.3 · R9: 8.2, 8.4 · R10: 9.1, 9.2 · R11: 11.1 to 11.5, 8.1 · R12: 12.1, 12.2 · R13: 10.1, 10.2, 11.5, 12.3 · R14: 13.1, 13.2 · R15: 17.1, 17.6 · R16: 17.2, 17.6, 17.9 · R17: 17.5, 17.7, 17.8 · R18: 17.10, 17.11 · R19: 18.1, 18.2 · R20: 18.3 · R21: 18.4 to 18.8 · R22: 17.4, 17.14, 18.5 · R23: 18.9 · R24: 17.12 · R25: 18.10 · R26: 18.11, 17.8 · R27: 18.12, 21.4, 22.8 · R28: 2.2, 2.6, 14.1, 14.4, 17.5, 19.1, 23.3 · R29: 14.5, 3.5 · R30: 1.2 to 1.5, 15.1, 19.1, 23.1, 23.2 · R31: 5.1, 2.7 to 14.5 · R32: 17.x and 18.x tests · R33: 21.1 to 21.5, 22.9 · R34: 22.1 to 22.9 · R35: 1.1, 22.1, 23.6 to 23.8 · R36: 23.3 to 23.5.
- Route and page coverage: all 29 endpoints plus 3a are implemented in tasks 2.5 (health), 6.1, 7.1, 8.1, 8.2, 9.1, 10.1, 11.1, 11.2, 12.1, 13.1; all 7 pages (`/register`, `/login`, `/`, `/boards/[id]`, `/my-tasks`, `/profile`, and the Card Detail Modal) are in tasks 18.1 to 18.11.

- V6 history rule: tasks 1 to 22.2 are completed history and are not edited. A V6 task that changes their behaviour names the task it supersedes. The checked boxes of 1 to 22.2 describe the V5 state; they do not claim V6 behaviour.
- V6 properties 44 to 58 are tested in: 44 in 25.7 (pure) and 27.4 (database); 45 in 27.4; 46 in 27.6; 47 in 25.9 (`role_allows`) and 27.11 (endpoint matrix); 48 in 27.4; 49 in 27.9; 50 in 25.8 (Python) and 29.3 (TypeScript); 51 in 27.9; 52 in 29.2; 53 in 29.6; 54 in 27.2; 55 in 29.11, 30.1, and 30.2; 56 in 29.3, 29.10, 30.2, and 30.8; 57 in 25.10 (pure) and 27.9 (logs); 58 in 31.9. Older properties updated by V6: 1, 2, 3 in 27.13; 6, 7 in 27.14; 8, 9, 14, 18 in 27.10; 12 in 27.4; 13 in 27.11; 17 in 27.2 and 27.4; 25 in 27.15; 29 in 29.4 and 30.9; 31 and 35 in 29.10 and 30.2; 34 in 30.8; 43 in 27.2. Property 24 and Property 28 are superseded by Properties 46 and 53 (their old tests stay as history in tasks 13.2 and 17.5).
- V6 requirement coverage (task numbers): R37: 25.2, 25.3, 25.5, 27.7 to 27.9, 27.11, 30.4, 30.5, 31.7 · R38: 29.5 to 29.7, 30.6, 31.5 · amended R2: 25.1, 25.2, 27.12 · R3: 26.1, 26.2 · R4: 27.13 · R7 and R26: 27.1, 27.2, 30.9, 31.8 · R8 to R10, R12: 25.3, 25.4, 27.10, 27.11 · R11: 25.1, 27.3, 27.4 · R13: 27.4 · R14: 27.5, 27.6 · R17 and R19: 29.2, 29.5 to 29.7, 30.7 · R20: 30.8 · R21 to R23: 30.1 to 30.3 · R22: 29.11 · R25: 30.8 · R27: 30.10, 31.4 · R28: 25.5, 25.10, 27.9, 27.14 · R29: 27.15 · R31: 27.2 to 27.15 · R32: 29.x and 30.x tests · R33: 31.1 to 31.9, 33.4, 33.5 · R35: 33.1, 33.2 · R36: 23.3 (V6 note).
- V6 tests of earlier work: every existing test or code that V6 invalidates is covered by a task that names the task it supersedes: 3.1 and 3.2 by 25.1 and 25.2; 3.3 by 25.3; 3.5 by 25.6; 6.1 and 6.2 by 27.1 and 27.2; 8.3 and 8.4 by 27.10; 11.1 to 11.5 by 27.3 and 27.4; 13.1 and 13.2 by 27.5 and 27.6; 14.1 by 27.11; 14.2 and 14.4 by 27.14; 14.3 by 27.13; 14.5 by 27.15; 17.2, 17.3, 17.4, 17.5, 17.8, 17.14 by 29.1, 29.4, 29.10, 29.5, 29.7, 29.11; 18.1 to 18.12 by 30.1 to 30.10; 19.1 by 30.11; 21.1 to 21.5 by 31.1 to 31.4 and 31.9; 1.1, 2.1, and 17.1 (ignore and `.env.example` files) by 33.1 and 33.2.

- V8 notes: V8 is frontend only, so there is no backend task, migration, or API change. V8 task 39 is a new `[MANUAL]` task (browser verification at 375 px and 1920 px). The deployment tasks 22.3 onward and the documentation tasks 23.x and 24 must run only after the V8 checkpoint (task 38) and the manual task 39; their text is unchanged, and the order is enforced by the waves of the dependency graph (V8 waves 59 to 66, deployment waves moved to 67 to 79). Task 37.8 enforces Requirement 36.14: the README and the spec documents must not name, link, or embed the example HTML files in `improvements/`, so tasks 23.3 and 23.5 must describe the look in words only.
- V8 properties: 59 in 34.1 (pure) and 37.1 (component); 60 in 35.1 (pure) and 37.2 (DOM and source). V8 requirement coverage (task numbers): R17.14 and R18.14, R18.15: 34.1 to 34.3, 37.1 · R21.24 to R21.28: 36.1, 36.2, 37.3 · R27.10: 34.3, 35.4, 37.6 · R32.20: 37.1 · R32.21: 37.2 · R32.22: 37.3 · R33.13: 37.4 · R33.15: 37.5 · R33.16: 37.6 · R36.14: 37.8 · R38.1 to R38.21: 35.1 to 35.4, 37.2.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4"] },
    { "id": 4, "tasks": ["2.5"] },
    { "id": 5, "tasks": ["2.6", "3.1", "3.2"] },
    { "id": 6, "tasks": ["2.7", "2.8", "3.3", "3.4"] },
    { "id": 7, "tasks": ["3.5"] },
    { "id": 8, "tasks": ["4.1"] },
    { "id": 9, "tasks": ["4.2"] },
    { "id": 10, "tasks": ["4.3"] },
    { "id": 11, "tasks": ["5.1"] },
    { "id": 12, "tasks": ["6.1"] },
    { "id": 13, "tasks": ["6.2", "7.1"] },
    { "id": 14, "tasks": ["7.2", "7.3", "8.1", "10.1"] },
    { "id": 15, "tasks": ["8.2", "8.3", "9.1", "10.2"] },
    { "id": 16, "tasks": ["8.4", "9.2", "11.1"] },
    { "id": 17, "tasks": ["11.2", "11.3", "12.1"] },
    { "id": 18, "tasks": ["11.4", "11.5", "12.2", "12.3", "13.1"] },
    { "id": 19, "tasks": ["13.2", "14.1", "14.2", "14.3", "14.4"] },
    { "id": 20, "tasks": ["14.5", "15.1", "15.2"] },
    { "id": 21, "tasks": ["17.1"] },
    { "id": 22, "tasks": ["17.2", "17.3", "17.4", "17.5"] },
    { "id": 23, "tasks": ["17.6", "17.10", "17.13"] },
    { "id": 24, "tasks": ["17.7", "17.8"] },
    { "id": 25, "tasks": ["17.9", "17.11"] },
    { "id": 26, "tasks": ["17.12", "17.14"] },
    { "id": 27, "tasks": ["18.1", "18.2", "18.3", "18.10", "18.11"] },
    { "id": 28, "tasks": ["18.4"] },
    { "id": 29, "tasks": ["18.5"] },
    { "id": 30, "tasks": ["18.6", "18.7", "18.8", "18.9"] },
    { "id": 31, "tasks": ["18.12"] },
    { "id": 32, "tasks": ["19.1"] },
    { "id": 33, "tasks": ["21.1"] },
    { "id": 34, "tasks": ["21.2", "21.3", "21.4"] },
    { "id": 35, "tasks": ["21.5", "22.1"] },
    { "id": 36, "tasks": ["22.2"] },
    { "id": 37, "tasks": ["25.1", "25.2"] },
    { "id": 38, "tasks": ["25.3", "25.5", "25.6", "25.7"] },
    { "id": 39, "tasks": ["25.4", "25.8", "25.9", "25.10"] },
    { "id": 40, "tasks": ["26.1"] },
    { "id": 41, "tasks": ["26.2", "27.1", "27.3", "27.5", "27.7", "27.12"] },
    { "id": 42, "tasks": ["27.2", "27.4", "27.6", "27.8", "27.10"] },
    { "id": 43, "tasks": ["27.9", "27.11", "27.13", "27.14", "27.15"] },
    { "id": 44, "tasks": ["28"] },
    { "id": 45, "tasks": ["29.1", "29.4", "29.5", "29.8"] },
    { "id": 46, "tasks": ["29.2", "29.3", "29.6", "29.7", "29.9", "29.10"] },
    { "id": 47, "tasks": ["29.11"] },
    { "id": 48, "tasks": ["30.1", "30.5", "30.6", "30.7", "30.8", "30.9"] },
    { "id": 49, "tasks": ["30.2", "30.4"] },
    { "id": 50, "tasks": ["30.3"] },
    { "id": 51, "tasks": ["30.10"] },
    { "id": 52, "tasks": ["30.11"] },
    { "id": 53, "tasks": ["31.1"] },
    { "id": 54, "tasks": ["31.2", "31.3", "31.4", "31.5", "31.6", "31.7", "31.8"] },
    { "id": 55, "tasks": ["31.9"] },
    { "id": 56, "tasks": ["32"] },
    { "id": 57, "tasks": ["33.1", "33.3"] },
    { "id": 58, "tasks": ["33.2", "33.4"] },
    { "id": 59, "tasks": ["34.1", "35.1", "36.1", "37.8"] },
    { "id": 60, "tasks": ["34.2", "35.2", "36.2"] },
    { "id": 61, "tasks": ["34.3", "35.3"] },
    { "id": 62, "tasks": ["35.4"] },
    { "id": 63, "tasks": ["37.1", "37.2", "37.3", "37.4", "37.5", "37.6"] },
    { "id": 64, "tasks": ["37.7", "37.9"] },
    { "id": 65, "tasks": ["38"] },
    { "id": 66, "tasks": ["39"] },
    { "id": 67, "tasks": ["22.3"] },
    { "id": 68, "tasks": ["22.4"] },
    { "id": 69, "tasks": ["22.5"] },
    { "id": 70, "tasks": ["22.6", "33.5"] },
    { "id": 71, "tasks": ["22.7"] },
    { "id": 72, "tasks": ["22.8"] },
    { "id": 73, "tasks": ["22.9"] },
    { "id": 74, "tasks": ["23.1", "23.4", "23.6", "23.7"] },
    { "id": 75, "tasks": ["23.2"] },
    { "id": 76, "tasks": ["23.3"] },
    { "id": 77, "tasks": ["23.5"] },
    { "id": 78, "tasks": ["23.8"] },
    { "id": 79, "tasks": ["24"] },
    { "id": 80, "tasks": ["40.1", "40.2", "40.3"] },
    { "id": 81, "tasks": ["40.4"] },
    { "id": 82, "tasks": ["40.5", "40.6"] },
    { "id": 83, "tasks": ["41"] },
    { "id": 84, "tasks": ["42"] },
    { "id": 85, "tasks": ["43"] },
    { "id": 86, "tasks": ["44.1", "44.5", "44.6"] },
    { "id": 87, "tasks": ["44.2", "44.13", "44.15"] },
    { "id": 88, "tasks": ["44.3", "44.12"] },
    { "id": 89, "tasks": ["44.4", "44.7"] },
    { "id": 90, "tasks": ["44.8", "44.14"] },
    { "id": 91, "tasks": ["44.9", "44.10", "44.11"] },
    { "id": 92, "tasks": ["45.1"] },
    { "id": 93, "tasks": ["46.1"] },
    { "id": 94, "tasks": ["46.2", "46.9", "46.11", "46.13"] },
    { "id": 95, "tasks": ["46.3", "46.4", "46.10", "46.12"] },
    { "id": 96, "tasks": ["46.5", "46.6", "46.14", "46.15"] },
    { "id": 97, "tasks": ["46.7", "46.8", "46.17"] },
    { "id": 98, "tasks": ["46.16", "46.18"] },
    { "id": 99, "tasks": ["47"] },
    { "id": 100, "tasks": ["48"] },
    { "id": 101, "tasks": ["49.1", "49.5"] },
    { "id": 102, "tasks": ["49.2", "49.3", "49.4", "49.6", "49.7"] },
    { "id": 103, "tasks": ["50.1", "50.8", "50.9"] },
    { "id": 104, "tasks": ["50.2", "50.3", "50.7"] },
    { "id": 105, "tasks": ["50.4"] },
    { "id": 106, "tasks": ["50.5"] },
    { "id": 107, "tasks": ["50.6"] },
    { "id": 108, "tasks": ["50.10", "51.1", "51.2", "51.3", "51.4"] },
    { "id": 109, "tasks": ["50.11", "51.5"] },
    { "id": 110, "tasks": ["52.1", "52.2", "52.3"] },
    { "id": 111, "tasks": ["52.4"] },
    { "id": 112, "tasks": ["53.1", "53.2"] },
    { "id": 113, "tasks": ["54"] },
    { "id": 114, "tasks": ["55"] },
    { "id": 115, "tasks": ["56"] }

  ]
}
```

## V9 Notes

- V9 is frontend only: no backend task, migration, or API change. Tasks 1 to 39 and the waves 0 to 79 are unchanged history. Task 43 is a new `[MANUAL]` task.
- V9 wave ids 80 to 85 are appended after the deployment waves only because wave ids are append-only. V9 tasks depend only on the V8 checkpoint (task 38) and on tasks 37.5 and 31.1 through their `Depends on:` lines, not on the deployment tasks (22.3 onward), so V9 tasks may run before or independently of the deployment waves 67 to 79. Because the Footer is shared by every page, run the V9 checkpoint (42) before the deployment tasks 22.3 onward if the footer should be part of the first deployment.
- V9 requirement coverage (task numbers): R18.16 to R18.21 -> 40.1 to 40.5 · R27.11, R27.12 -> 40.4, 41 · R32.23 -> 40.5 · R33.17 -> 41. Also: R18.13 and R18.14 -> 40.2, 40.5 · R38.19 (footer text scan) -> 40.5 · R33.15 (banner-scoped logo locators) -> 41 · R30.6 and R30.7 -> 40.6, 42.
- The README and the spec documents describe the footer look in words only and name no example HTML file or image (Requirement 36.14, task 37.8).

## V11 Notes

- V11 history rule: tasks 1 to 43 and the waves 0 to 85 are unchanged history. A V11 task that changes earlier work names the task it supersedes. The checked boxes of the earlier tasks describe the V5 to V9 state and do not claim V11 behaviour.
- Manual V11 tasks (never run by the agent): 45.1 (V11 migration on the development and test databases, hand-edited `ck_cards_status` and `ck_board_memberships_role`, no agent-generated migration script), 48 (design-system tokens), 55 (browser verification), 56 (production schema and verification).
- Order: backend first (44 to 47), then the frontend (48 to 54), as in V6. Every V11 task that needs `URGENT`, `manager`, `ix_cards_due_date`, `checklist_items`, or `card_links` in the database depends on 45.1, so pure tests (44.11 to 44.15) are not blocked.
- Deployment ordering: the new wave ids 86 to 115 are append-only, so they run after the pending deployment waves 67 to 79 even though the existing text of tasks 22.3 to 22.9 and 23.x could not be edited. Recommendation: do not start 22.3 before task 54 is complete, so the first production `flask db upgrade` (22.4) already contains the V11 history. If production was already created, task 56 covers the second `flask db upgrade` and the extended verification.
- Property coverage (61 to 75): 61 in 44.12 (pure) and 46.15 (database); 62 in 49.2 and 51.4; 63 in 49.3; 64 in 46.10; 65 in 49.6 (pure), 50.7, and 51.4; 66 in 46.5 (server), 49.6 (progress), 51.2; 67 in 50.5 and 51.2; 68 in 44.14 (pure), 46.7, 49.7 (client mirror), 51.3; 69 in 49.7 and 51.3; 70 in 46.8; 71 in 46.3; 72 in 44.13 (pure) and 46.12 (database); 73 in 44.15 (pure) and 46.16 (database); 74 in 49.4 (pure), 50.1, and 51.1; 75 in 44.15 (pure) and 46.14 (database). Older properties updated by V11: 1, 2, 3 in 46.18; 13 and 47 in 46.16; 46 and 48 in 46.15; 25 is superseded by 71 (46.3); 29 in 49.7; 56 (four statuses) in 49.2; 58 in 52.4; 60 in 50.9.
- Requirement coverage (task numbers): R39: 44.2, 46.15, 49.2, 49.3, 49.5, 50.3, 50.4 · R40: 44.2, 46.9, 46.10, 49.6, 50.3, 50.7, 51.4, 52.3 · R41: 44.3, 44.4, 44.7, 46.4, 46.5, 49.6, 50.5, 51.2 · R42: 44.3, 44.4, 44.14, 46.6, 46.7, 49.7, 50.6, 51.3 · R43: 44.5, 44.6, 44.7, 44.8, 46.11, 46.12, 46.16, 49.4, 50.1, 50.2, 51.1, 52.1 · R44: 44.2, 44.3, 44.10, 44.11, 45.1, 46.2, 46.3, 46.17. Amended rows: R1.4, R1.9, R2.2, R2.9 to R2.11, R2.15, R2.16, R3.5, R3.9, R3.11 in 44.3, 44.9, 44.11, 45.1, 46.17 · R4.3 in 46.18 · R9, R10, R14.10 in 44.8, 46.11, 46.13, 46.15 · R11 in 44.2, 46.15 · R20, R21, R23, R25 in 50.1, 50.4, 50.8 · R28.12, R37 in 44.8, 46.14 · R31.18 to R31.25 in 44.13, 44.14, 46.3, 46.5, 46.7, 46.8, 46.10, 46.12, 46.13, 46.16 · R32.24 to R32.30 in 49.2 to 49.7, 50.x, 51.x · R36.15 in 53.1 · R38.17 to R38.19 in 50.9.
- Tests of earlier work invalidated by V11 (all named in the V11 tasks): 3.5 and 25.6 by 44.11; 5.1 by 46.1; 8.1 (four queries) by 46.2; 8.2 and 8.4 by 46.11 and 46.12; 9.2 by 46.13; 14.1 and 27.11 by 46.16; 14.2 and 27.14 by 46.8; 14.3 and 27.13 by 46.18; 14.5 and 27.15 by 46.3; 25.7 by 44.12; 25.8 and 25.9 by 44.15; 27.4 and 27.6 by 46.15; 27.9 by 46.14; 27.12 by 46.17; 29.1, 29.3, 29.9 by 49.1 to 49.4; 30.1, 36.1 by 50.1 and 50.2; 30.2 by 50.4; 30.4 by 50.2; 30.8 by 50.8; 31.7 by 52.1; 35.1 and 37.2 by 50.9; remaining RTL fixtures by 51.5.
- Known inconsistencies and gaps found while planning (the specification documents were not edited): (1) design Open issue 45: Requirement 15.2 lists only `app/`, `components/`, and `hooks/` as Tailwind sources while R39.5 and R39.9 put class strings in `lib/`; task 49.5 adds `@source "../lib"` and the requirement text still needs "and `lib/`". (2) Requirement 39.10 asks that missing token pairs be defined in `guidelines/design-system.md` first, but agents never modify `guidelines/`; this is handled by the manual task 48. (3) Requirement 43.8 (400 for a request that names the Board_Admin) overlaps R43.6 (403 by rank) and R9.7; tasks 44.6, 46.11, and 46.12 apply the owner check first (admin gets 400, manager gets 403, Open issue 47). (4) Requirement 11.15 says a non-Board_Member gets 403 on every single-Card endpoint, which would include a guest, but R41.9 gives a guest 200 on GET `/api/cards/<id>`; tasks follow R41.9 (Open issue 49). (5) Requirement 42.2 does not cap the default label, so tasks cut it to 100 characters (Open issue 48). (6) Requirement 43 does not say that a role change to the current role returns 200 or that body validation (400) runs before the permission check (403); tasks 46.11 and 46.12 apply both (Open issue 59). (7) Requirement 33 has no V11 criteria, so the Playwright tasks 52.1 to 52.3 cite only the design Testing Strategy. (8) The CHANGELOG says the string "checklist" was removed from the forbidden list, but the current Requirement 38.19 list does not contain it; task 50.9 only verifies `lib/forbiddenClaims.ts`. (9) Requirement 23.1 (card data within 300 ms) and R41.9 (checklist and links from GET `/api/cards/<id>`) are reconciled in task 50.4 by showing the board-state fields at once and loading the sections asynchronously. (10) Search and My Tasks cards carry no counts (R44.5, Open issue 58), so task 50.3 hides the checklist and link indicators when the counts are absent. (11) Open issues 50, 51, 52, 61, 62, 63, and 64 are accepted as stated and need no task beyond the notes in 46.9, 49.6, 50.7, and 50.2.
