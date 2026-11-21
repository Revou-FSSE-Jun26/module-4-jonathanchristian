# Implementation Plan: Kano

**Version:** V6 (V1 to V5 tasks 1 to 22.2 preserved as history; V6 tasks added as 25 onward)

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
    - Save the Postman run screenshot for task 23.4
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
  - [ ] 23.1 Complete `docs/violation-report.md`
    - Review the generated code in `app/` and `web/` against the Guidelines; list at least 3 violations found, each with the violated guideline id, the file, and the fix applied; apply the fixes in code and re-run the affected tests
    - Record only violations that were actually found
    - _Requirements: 30.5_
    - V6 note: the review also covers the V6 code (tasks 25 to 31), for example the role helpers, the invitation module, and the new frontend components.
    - Depends on: 22.9, 1.5, 32

  - [ ] 23.2 Complete `docs/guideline-comparison.md`
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

  - [ ] 23.4 [MANUAL] Capture the screenshots
    - NOT executed by the agent. Save into `docs/screenshots/`: Postman run covering all eight groups against the public URL, Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, Login, a Card being dragged between Columns, the notification bell with an unread count above zero, and the Playwright HTML report with all tests passed
    - Depends on: 22.9
    - _Requirements: 36.10_
    - V6 note: the screenshots may also include the welcome page, the invite links panel in the member panel, and the status control in the Card Detail Modal.
    - Depends on: 33.3

  - [ ] 23.5 Embed the screenshots in the README and check links
    - Add the Screenshots section with each image and a caption naming its subject; add a script or test that verifies every relative link and image path in `README.md` resolves to an existing file
    - _Requirements: 36.10, 36.12, 36.5_
    - Depends on: 23.3, 23.4

  - [ ] 23.6 Verify and complete the CHANGELOG refinement history
    - `CHANGELOG.md` must hold at least 5 refinement entries, each with the before text, the after text, the version number, and the date (V2 to V5 already contain entries; count them and add the missing before and after text if fewer than 5 qualify)
    - Never remove historical entries
    - _Requirements: 35.6_
    - Depends on: 22.9

  - [ ] 23.7 Add a repository hygiene check script
    - `scripts/check_repo_hygiene.py`: `.gitignore` rules present, both `.env.example` files list every variable the code reads, no tracked `.env*` file other than `.env.example`, a secrets scan of tracked files (JWT secret, database password, API key patterns), spec documents exist in `.kiro/specs/kano/`, `guidelines/` has the three files and `.kiro/steering/` has no copies
    - Run it and fix findings
    - V6 note: the script also checks that `.env.test` is git-ignored and `.env.test.example` is tracked (`git check-ignore` semantics), that `web/.env.test.example` lists `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`, that no tracked `.env.test` exists, and that no file in `web/e2e/` contains a literal credential (reuse the scanner of task 31.9).
    - Depends on: 33.1, 33.2, 31.9
    - _Requirements: 35.1, 35.2, 35.3, 35.5, 35.7, 30.1_
    - Depends on: 22.9

  - [ ] 23.8 [MANUAL] Check the Git history and rotate secrets if needed
    - NOT executed by the agent. Confirm each of the six phases (specification writing, guideline authoring, backend implementation, frontend implementation, testing, deployment) has at least one commit whose message names the phase, and that no real secret exists in any commit; if one does, remove it from history and rotate it
    - Depends on: 23.7, 23.5
    - _Requirements: 35.3, 35.4, 35.7_
    - V6 note: also confirm that no commit contains `web/.env.test` or real E2E credentials, and that the V6 work (tasks 25 to 33) appears in commits whose messages name the phase.

- [ ] 24. Final checkpoint
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

- [ ] 27. Phase 14 (V6): Backend features and pytest tests
  - [ ] 27.1 Rewrite PATCH `/api/users/me` (name and password with `current_password`, email fixed)
    - `users/schema.py`: `UserUpdateSchema` with `name` (1 to 100), `password` (8 to 128), `current_password` (load only, non-empty), and an explicit `email` field whose validator always raises `email cannot be changed`; `@validates_schema` rejects a body with neither `name` nor `password`, a `current_password` without `password`, and a `password` without `current_password`
    - `users/service.update_me`: verify `current_password` with `check_password_hash` first (400 naming `current_password`, nothing saved, never 403), then set `name`, then `password_hash` through `users/service.hash_password`, one commit; no token invalidation; the log filter keeps dropping `password` and `current_password`
    - Supersedes the V5 behaviour of task 6.1 (email update accepted, password rejected); 6.1 stays as history
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.8, 2.12_
    - _Design: A3 (V6 change), A11 row 5_
    - Depends on: 26.1, 25.4

  - [ ] 27.2 Update the users tests for the V6 PATCH contract
    - Supersedes the V5 behaviour tested in task 6.2 (email update, 409 duplicate email on PATCH, password field rejected); 6.2 stays as history
    - Cover: name boundaries 0, 1, 100, 101; password boundaries 7, 8, 128, 129 with a correct `current_password`, then a login with the new password and a failing login with the old one; 400 naming `current_password` for a wrong or missing value with the name unchanged even when the body also has a valid name; 400 naming `email` for any `email` value including the current email; empty body 400; GET still 401 for deleted-user and wrong-type tokens; no password, `current_password`, or hash in responses or captured logs
    - Property tests: **Property 54: Profile update never changes the email and needs the current password**; **Property 17: Partial update** (user part: only `name` and `password` are updatable); **Property 9** user part reduced to registration and add-member matching; **Property 43** re-run for both user endpoints
    - **Validates: Requirements 7.2 to 7.8**
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 31.12, 31.17_
    - _Design: A3, Correctness Properties 9, 17, 43, 54_
    - Depends on: 27.1

  - [ ] 27.3 Add card status to the cards service and schemas
    - `CardCreateSchema` does not declare `status` (so `unknown = RAISE` returns 400 naming `status`); the service always stores `NOT_STARTED` and null `completed_at` on create
    - `CardUpdateSchema.status` is `fields.String(validate=OneOf(CARD_STATUSES), allow_none=False)`; the update calls `apply_status_change` once inside the same UPDATE and transaction as the other fields; `completed_at` is never accepted from the client
    - `position_service` never reads or writes `status` or `completed_at`, including a move into a Column named `Done`; `CardSchema`, `CardSearchSchema`, and the board detail include `status` and `completed_at`; assignee checks use `assert_assignee_is_writer`
    - Supersedes the V5 behaviour of tasks 11.1 and 11.2 for Card fields and assignee; 11.1 and 11.2 stay as history
    - _Requirements: 11.2, 11.4, 11.5, 11.17, 11.18, 11.19, 11.20, 11.21, 11.22, 11.23, 11.24_
    - _Design: A13, A10, A11 rows 18, 19, 22_
    - Depends on: 25.4, 26.1

  - [ ] 27.4 Update and extend the cards tests for status, assignee, and guests
    - Supersedes the V5 tests of tasks 11.3 and 11.5 where they assume that any member can be assignee, that the card fields have no status, or that a partial update changes only the supplied fields; 11.3, 11.4, and 11.5 stay as history
    - Cover: default `NOT_STARTED` and null `completed_at`; 400 for `status` in the create body; 400 for `done`, an empty string, null, and an unknown value on PATCH; `completed_at` rules including `DONE` to `DONE`; `status` and `completed_at` in board detail, search, and My Tasks; a position change (including into a Column named `Done`, any letter case) leaves both unchanged; guest as assignee 400; removed member and non-participant as assignee 400; no Notification row for a user whose only role is `guest`; accepting an invitation creates no Notification
    - Property tests: **Property 44** (stateful PATCH sequences against the database), **Property 45: Status validation and position independence**, **Property 48: Assignee must be admin or member, guests are never notified**, **Property 17** (card part: a status change also moves `completed_at`), **Property 12** (status values)
    - **Validates: Requirements 11.4, 11.17 to 11.24, 13.12**
    - _Requirements: 11.4, 11.5, 11.17, 11.18, 11.19, 11.20, 11.21, 11.22, 11.24, 13.12, 31.13, 31.17_
    - _Design: A13, A7 (V6 change), Correctness Properties 12, 17, 44, 45, 48_
    - Depends on: 27.3

  - [ ] 27.5 Rewrite the analytics service for the status rule and guests
    - `analytics/service.py`: completed this week counts non-deleted Cards with `status = 'DONE'` and `completed_at` from `start_of_week_utc(now)` (inclusive) to `now` (inclusive), whatever their Column, with no join to `columns`; cards per Column still count every non-deleted Card; member activity lists only memberships with role `admin` or `member`
    - Supersedes the V5 behaviour of task 13.1 (Column named `Done` and `updated_at`); 13.1 stays as history
    - _Requirements: 14.2, 14.3, 14.4, 14.6, 14.10_
    - _Design: A8 (V6 change), D14_
    - Depends on: 25.1, 26.1

  - [ ] 27.6 Update the analytics tests for the V6 definition
    - Supersedes the V5 tests of task 13.2 (completed through the Column named `Done`); 13.2 stays as history
    - Cover: `DONE` at Monday 00:00:00 UTC counted and one second earlier not; `DONE` in a Column not named `Done` counted; a Column named `Done` with another status not counted; soft-deleted `DONE` not counted; no `DONE` card gives 0; guests excluded from member activity; 403 for member, guest, and non-participant; 404; 401
    - Property test: **Property 46: Analytics equals a naive model (V6 definition)**
    - **Validates: Requirements 14.1 to 14.10**
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6, 14.7, 14.10, 31.14_
    - _Design: A8, Correctness Property 46_
    - Depends on: 27.5

  - [ ] 27.7 Create both invite tokens with the Board and expose the guest role in Board responses
    - `boards/service.create_board` generates both tokens (retrying on a unique collision up to 3 times) and inserts the admin membership in one transaction; any failure rolls back all of them
    - Board detail returns `my_role` `guest` for guests; the members list returns the role `guest`; removing a guest membership follows the member removal rules; Board detail still runs exactly 4 queries
    - Supersedes the V5 behaviour of tasks 8.1 and 8.2 for creation and roles; 8.1 and 8.2 stay as history
    - _Requirements: 8.10, 8.11, 9.13, 9.15, 37.3_
    - _Design: A14 (generation), A9, A11 rows 6, 8, 12_
    - Depends on: 25.4, 26.1

  - [ ] 27.8 Implement the invitation links and accept endpoints
    - `invite_schemas.py`: `InviteLinksSchema`, `InviteRoleSchema` (`member` or `guest`), `InviteTokenSchema`, `InviteInfoSchema`, `AcceptResultSchema`
    - `invite_service.py`: lazy creation with `COALESCE` for NULL tokens, regenerate (new token for one role only, old token invalid at once), `find_board_by_token` (format check first, 404 for malformed, unknown, replaced, or soft-deleted Board), `accept.py` accept transaction (`SELECT ... FOR UPDATE`, `resolve_accept`, create, conditional upgrade, `IntegrityError` caught locally and re-read so concurrent accepts end with one active membership)
    - `invite_routes.py` on the boards blueprint: GET `/api/boards/<uuid:id>/invite-links` (admin), POST `/api/boards/<uuid:id>/invite-links/<role>/regenerate` (admin, 200), GET `/api/invites/<token>` (200), POST `/api/invites/<token>/accept` (200 in every case); services never put a token into an exception message
    - _Requirements: 37.3 to 37.13, 37.21, 37.23, 4.3, 28.12_
    - _Design: A14, A11 rows 30 to 33, A12-V6_
    - Depends on: 27.7, 25.5

  - [ ] 27.9 Write pytest tests for invitations and accept
    - Tokens created with the Board and lazily for a Board with NULL tokens; token format and uniqueness; invite-links and regenerate for the admin and 403 for member, guest, and non-participant; 400 for a bad role; regenerate invalidates the old token (404) and leaves the other role's token and all memberships; accept creates `member` and `guest` memberships; guest upgraded by the member token; no downgrade of member or admin; repeated accept idempotent; accept after a soft-deleted membership creates a new active row and leaves the old row unchanged; 404 for unknown, malformed, and soft-deleted-Board tokens; 401 without a token and with a refresh token; no Notification created; a two-thread concurrent accept ends with one active row; log capture contains no token for 400, 401, 403, 404, and 500 invite requests
    - Property tests: **Property 49: Invite tokens are well formed, unique, and regeneration invalidates**, **Property 51: Accept is idempotent and keeps one active membership**, **Property 57** (integration: captured logs)
    - **Validates: Requirements 37.2 to 37.13, 37.21, 37.23, 28.13**
    - _Requirements: 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.9, 37.10, 37.11, 37.12, 37.13, 37.21, 37.23, 28.13, 31.16, 31.17_
    - _Design: A14, Correctness Properties 49, 51, 57_
    - Depends on: 27.8

  - [ ] 27.10 Update the board and member tests for roles, tokens, and guests
    - Supersedes the V5 tests of tasks 8.3 and 8.4; 8.3 and 8.4 stay as history
    - Cover: creation also creates both tokens and the atomic-creation fault injection leaves no Board, membership, or token; detail returns `my_role` `guest` and the same Columns and Cards; members list includes `guest` rows; the admin removes a guest (200) and a guest cannot add or remove (403); a removed guest gets 403 afterwards; assignee cleared on removal; membership uniqueness ignores soft-deleted rows for all three roles
    - Property tests: **Property 14**, **Property 8** (Board creation part including tokens), **Property 9** (membership uniqueness), **Property 18** (removal part)
    - **Validates: Requirements 8.1, 8.10, 8.11, 9.1 to 9.15**
    - _Requirements: 8.1, 8.10, 8.11, 8.12, 9.5, 9.13, 9.14, 9.15, 31.15_
    - _Design: A4-V6, A14, Correctness Properties 8, 9, 14, 18_
    - Depends on: 27.7

  - [ ] 27.11 Update the role and membership enforcement matrix for the guest role
    - Supersedes the V5 matrix of task 14.1 (non-member, member, admin only); 14.1 stays as history
    - Parametrize admin, member, guest, and non-participant over every endpoint of the matrix in design A4-V6 (Board, members, Columns, Cards, Comments, analytics, invite-links, regenerate, search): a guest gets 403 on every write endpoint with the data unchanged and the body free of resource data, 200 on the read endpoints; a guest who authored an old Comment still gets 403 on PATCH and DELETE
    - Property tests: **Property 47: Guest never writes (role by endpoint matrix)** (database-backed part), **Property 13: Role and membership enforcement** (updated: member means admin or member)
    - **Validates: Requirements 8.11, 8.12, 9.13, 9.14, 10.10, 11.23, 12.10, 12.11, 14.10, 28.14, 37.14**
    - _Requirements: 8.12, 9.14, 10.10, 11.23, 12.10, 12.11, 14.10, 28.14, 37.5, 37.14, 31.15_
    - _Design: A4-V6 (matrix), Correctness Properties 13, 47_
    - Depends on: 27.8, 27.3, 27.5

  - [ ] 27.12 Write database-level V6 schema tests
    - Against the test database after task 26.1: `ck_cards_status` rejects an unknown status, the three-role `ck_board_memberships_role` accepts `guest` and rejects another value, the two token unique constraints allow many NULLs and reject a duplicate token, a `cards` insert without status gets `NOT_STARTED`, and `information_schema` lists exactly the 7 tables
    - A failure message tells the user to review the hand-added check constraints of task 26.1
    - _Requirements: 2.15, 2.16, 2.17, 3.9, 31.16_
    - _Design: Data Models (V6 schema changes and migration), Open issue 24_
    - Depends on: 26.1

  - [ ] 27.13 Update the envelope, status code, and serialization tests for the V6 endpoints
    - Supersedes the V5 endpoint list of task 14.3 (29 endpoints plus 3a); 14.3 stays as history
    - Parametrize over the 33 endpoint rows of design A11 plus 3a: exactly one top-level key, 201 only for the six creating POSTs (regenerate and accept return 200), 200 elsewhere, each failure type maps to the right status (including 400 for `email` in PATCH `/api/users/me` and for `status` on card create), UUID and timestamp formats, `completed_at` format
    - Property tests: **Property 1: Envelope shape**, **Property 2: Status code by outcome**, **Property 3: Serialization format** (updated)
    - **Validates: Requirements 4.1 to 4.18**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.15, 31.3_
    - _Design: A11, Correctness Properties 1, 2, 3_
    - Depends on: 27.8, 27.1, 27.3

  - [ ] 27.14 Update the soft-delete, hygiene, and log tests for V6
    - Supersedes the V5 coverage of tasks 14.2 and 14.4 where V6 adds behaviour; 14.2 and 14.4 stay as history
    - Cover: soft-deleting a Board makes its invite tokens answer 404 and cascades guest memberships; soft-deleted `DONE` cards are excluded from analytics; log capture contains no `current_password`, password, token, or hash for failing PATCH `/api/users/me` requests; the static scan for SQL built by string formatting also covers the new invite and analytics code
    - Property tests: **Property 6** and **Property 7** re-run with Cards that have a status and Boards that have tokens
    - _Requirements: 2.7 to 2.11, 7.8, 28.2, 28.3, 28.13, 37.10, 31.6_
    - _Design: A5, A12-V6, Correctness Properties 6, 7_
    - Depends on: 27.8

  - [ ] 27.15 Update the performance and query-count tests for V6
    - Supersedes the V5 tests of task 14.5; 14.5 stays as history
    - Board detail with 20 Columns and 500 Cards still runs at most 5 queries with the V6 role helper and the extra card fields, and the count is identical for 10 and 500 Cards; p95 under 500 ms for 100 requests; GET invite-links with lazy token creation stays within a fixed query count; search and `assignee=me` stay under 500 ms for 2000 Cards with status
    - Property test: **Property 25: Constant query count for board detail** (re-run)
    - _Requirements: 29.1, 29.2, 29.4, 29.5_
    - _Design: A9, Correctness Property 25_
    - Depends on: 27.7, 27.3, 25.4

- [ ] 28. V6 backend checkpoint
  - Run `pytest -v` from `app/` against the test database after task 26.1: 0 failures and 0 errors, including the file-size test of task 15.1 (split any backend file over 300 lines)
  - Ensure all tests pass, ask the user if questions arise
  - Frontend V6 tasks (29 onward) depend on this checkpoint
  - Depends on: 25.7, 25.8, 25.9, 25.10, 27.2, 27.4, 27.6, 27.9, 27.10, 27.11, 27.12, 27.13, 27.14, 27.15
  - _Requirements: 31.8, 30.6, 30.7_

- [ ] 29. Phase 15 (V6): Frontend libraries and shared pieces
  - [ ] 29.1 Add the V6 types and the pure libraries `status.ts`, `roles.ts`, `inviteRoles.ts`, and `nextParam.ts`
    - `lib/types.ts`: `Role` includes `guest`, `CardStatus`, `Card` gains `status` and `completed_at`, plus `InviteLink`, `InviteLinks`, `InviteInfo`, `AcceptResult`, `ProfileUpdate` (never `email`)
    - `lib/status.ts` (`CARD_STATUSES`, `STATUS_LABEL`, `STATUS_VARIANT`, `isCardStatus`), `lib/roles.ts` (`canEdit`, `isAdmin`, `isGuest`, `ROLE_VARIANT`), `lib/inviteRoles.ts` (`acceptOutcome`, the twin of `resolve_accept`), `lib/nextParam.ts` (`safeNext`, `withNext`)
    - Supersedes the V5 types of task 17.2; 17.2 stays as history
    - _Requirements: 19.11, 21.22, 23.17, 37.15, 37.18_
    - _Design: B10 (V6 additions), B7-V6 (`lib/status.ts`), B6-V6 (`lib/roles.ts`), B4-V6 (`safeNext`)_
    - Depends on: 28

  - [ ] 29.2 Write property test for `safeNext`
    - **Property 52: Safe `next` parameter**
    - fast-check: valid `/invite/<1 to 128 URL-safe characters>` accepted; absolute and protocol-relative URLs, backslashes, extra slashes, query strings, fragments, percent sequences, whitespace, and other paths return null; the post-login target is `safeNext(next) ?? "/"`
    - **Validates: Requirements 19.8, 19.11, 28.15**
    - _Requirements: 19.8, 19.11, 28.15, 32.19_
    - Depends on: 29.1

  - [ ] 29.3 Write tests for `status.ts`, `roles.ts`, and `inviteRoles.ts`
    - **Property 50** (TypeScript twin): `acceptOutcome` equals the Python `resolve_accept` table over all role pairs; **Property 56: Status labels, badges, and moves** (label and variant part): the three labels "Not started", "In progress", "Done" and the three variants are pairwise distinct; `canEdit`, `isAdmin`, `isGuest` over all roles
    - **Validates: Requirements 21.22, 23.17, 37.12, 37.19**
    - _Requirements: 21.22, 23.17, 25.2, 37.12, 37.19, 32.19_
    - Depends on: 29.1

  - [ ] 29.4 Update `lib/validation.ts` for the profile and re-run the validator property test
    - Add `validateNewPassword` (8 to 128), `validateCurrentPassword` (non-empty), and `validatePasswordSection(cur, next)` (both empty ok; exactly one filled errors on the empty one; both filled validate each); the email validator stays for register and login and is no longer used by the profile page
    - Supersedes the V5 behaviour of task 17.3 (profile email validator); 17.3 stays as history
    - Property test: **Property 29: Client validators mirror server rules** (updated with the new validators)
    - **Validates: Requirements 26.3**
    - _Requirements: 26.3, 26.6, 32.15_
    - _Design: B11, Correctness Property 29_
    - Depends on: 28

  - [ ] 29.5 Replace `guardDecision` with `decideRoute` and add the welcome cookie helpers
    - `lib/decideRoute.ts`: `classifyPath`, `INVITE_PATH_RE`, and the pure `decideRoute({ pathname, auth, welcomeSeen })` with the table of design B4-V6; `lib/authCookie.ts`: add `WELCOME_COOKIE`, `getWelcomeSeen`, `setWelcomeCookie` (`kano_welcome_seen=1`, Max-Age 31536000, path `/`, `SameSite=Lax`, not httpOnly); `clearAuthCookies` never touches the welcome cookie
    - Delete `guardDecision` from `lib/authCookie.ts` and move its test cases to `decideRoute`, so only one decision function exists
    - Supersedes the V5 behaviour of task 17.5 (`guardDecision`, Property 28); 17.5 stays as history
    - _Requirements: 17.8, 17.9, 17.12, 17.13, 38.4 to 38.13_
    - _Design: B4-V6, D15, Open issue 28_
    - Depends on: 28

  - [ ] 29.6 Write property test for `decideRoute`
    - **Property 53: Route decision with welcome cookie and invite paths**
    - fast-check over every combination of path class (`/`, `/welcome`, `/login`, `/register`, `/invite/<token>` with generated tokens, malformed invite path, other protected path), auth state, and cookie flag; plus tests that logout keeps the welcome cookie
    - **Validates: Requirements 17.7, 17.8, 17.9, 17.12, 17.13, 37.20, 38.5 to 38.12**
    - _Requirements: 17.12, 17.13, 37.20, 38.5, 38.6, 38.7, 38.8, 38.9, 38.10, 38.11, 38.12, 38.13, 32.19_
    - Depends on: 29.5

  - [ ] 29.7 Update the proxy (`web/proxy.ts`) to use `decideRoute`
    - Compute `auth` from the cookies, call `decideRoute`, perform `refresh-then-continue` (forward the new access cookie on the request and the response), re-evaluate with `auth: "unauthenticated"` after a 401 refresh (delete both auth cookies, invite paths keep `next`, `/` goes to `/welcome` or `/login` by the cookie), network error or 5xx still goes to `/login?expired=1`, and set `kano_welcome_seen` when `setWelcomeCookie` is true; `/login?expired=1` keeps the loop guard
    - Update the proxy tests with a mocked fetch for every decision branch including the invite path with an expired access cookie and a valid refresh cookie
    - Supersedes the V5 behaviour of task 17.8; 17.8 stays as history
    - _Requirements: 17.7, 17.8, 17.9, 17.13, 37.20, 38.5 to 38.12_
    - _Design: B4-V6, Open issue 32_
    - Depends on: 29.5

  - [ ] 29.8 Add the invite page headers in `next.config.ts` with a test
    - `headers()` sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/invite/:path*`; a unit test reads the exported config and asserts both headers for that source
    - _Requirements: 28.13, 37.18_
    - _Design: B1 (`next.config.ts`), Open issue 22_
    - Depends on: 28

  - [ ] 29.9 Create the shared `StatusBadge` component with a test
    - `components/shared/StatusBadge.tsx` renders `BaseBadge` with `STATUS_LABEL` and `STATUS_VARIANT`; it is the only place a status becomes text
    - RTL test: each of the three statuses renders its label and a distinct variant class
    - _Requirements: 21.22, 25.2, 18.4_
    - _Design: B3 (`StatusBadge`), B7-V6_
    - Depends on: 29.1

  - [ ] 29.10 Update `diffCardFields` and the order reducers for status
    - `lib/format.ts`: `diffCardFields` also compares `status`, so a status-only change produces exactly `{ status }`; `lib/order.ts`: `moveCardInState` and `restoreCardInState` copy every field except `column_id` and `order` unchanged
    - Supersedes the V5 behaviour of tasks 17.2 (`diffCardFields`) and 17.4 (reducers); 17.2 and 17.4 stay as history
    - Property tests: **Property 35: Changed-fields diff** (updated), **Property 56: Status labels, badges, and moves** (move part), **Property 31** re-run
    - **Validates: Requirements 23.2, 23.18, 21.23, 22.19**
    - _Requirements: 23.2, 23.18, 21.23, 22.19_
    - _Design: B6-V6, B7-V6, Correctness Properties 31, 35, 56_
    - Depends on: 29.1

  - [ ] 29.11 Add `enabled` to `useDragAndDrop` and test the guest case
    - `useDragAndDrop({ enabled })`: when false return the same shape with every handler undefined and `touchDrag = null`, and `commitDrop` returns early, so no drag starts, no state changes, and no request is sent for any mouse or touch sequence; when true behave as before and send only `column_id` and `order`
    - Supersedes the V5 behaviour of task 17.14; 17.14 stays as history
    - Property test: **Property 55: Guest UI has no edit controls and starts no drag** (hook part)
    - **Validates: Requirements 22.18, 22.19**
    - _Requirements: 22.18, 22.19, 21.23_
    - _Design: B6-V6, Correctness Property 55_
    - Depends on: 29.10

- [ ] 30. Phase 16 (V6): Frontend pages and components
  - [ ] 30.1 Add `BoardRoleContext` and role gating to the board components
    - `components/boards/BoardRoleContext.tsx` provides `{ role, canEdit, isAdmin }` from `my_role`; `BoardView`, `KanbanColumn`, `ColumnHeader`, `AddColumnForm`, `AddCardForm`, `CardSearchInput`, and `CardItem` read it; a guest sees the "Guest" `BaseBadge`, no add-column, add-card, rename, delete, or drag controls (no `draggable`, no touch handler), keeps the search input, and `CardItem` shows `StatusBadge`
    - Pass `enabled = canEdit` to `useDragAndDrop`
    - RTL tests: admin and member see the controls, guest does not, drag of a card changes no badge
    - Supersedes the V5 behaviour of tasks 18.4 and 18.5; 18.4 and 18.5 stay as history
    - Property test: **Property 55: Guest UI has no edit controls and starts no drag** (render part)
    - **Validates: Requirements 21.20, 21.22, 21.23, 22.18**
    - _Requirements: 21.12, 21.13, 21.20, 21.22, 21.23, 22.18, 37.17_
    - _Design: B6-V6, B2, Correctness Property 55_
    - Depends on: 29.9, 29.11, 29.1

  - [ ] 30.2 Rebuild `CardDetailModal` with the status control and the guest read-only view
    - Split into `CardDetailModal.tsx` (shell and save logic), `CardDetailForm.tsx`, and `StatusSelect.tsx` (native select with exactly "Not started", "In progress", "Done", preselected); the PATCH sends only changed fields including `status`; on 200 call `onCardUpdated(card)` so the board badge updates; on error keep the modal open, the entered values, and the previous status
    - Assignee options are `members.filter(m => m.role !== "guest")`; when `canEdit` is false every field and the status select are disabled and the save, delete, comment form, and comment edit and delete controls are hidden (`CommentList readOnly`) while comments still load; support `isNew` with a single Save button and an empty diff closing without a request
    - RTL tests: three options with the current status preselected, status-only PATCH body, badge update, failing PATCH keeps the previous status, guest view
    - Supersedes the V5 behaviour of task 18.9; 18.9 stays as history
    - Property tests: **Property 35**, **Property 55** (modal part), **Property 56** (badge part)
    - **Validates: Requirements 23.17 to 23.22**
    - _Requirements: 23.1, 23.2, 23.17, 23.18, 23.19, 23.20, 23.21, 23.22, 32.16_
    - _Design: B7-V6, Correctness Properties 35, 55, 56_
    - Depends on: 30.1, 29.9, 29.10

  - [ ] 30.3 Implement the new-card flow
    - `AddCardForm` still asks only for the title and returns the created Card to `BoardView`, which appends it to its column and opens `CardDetailModal` with `isNew`; a failed creation opens no modal and shows no card; closing the modal without saving keeps the title-only card with status `NOT_STARTED`
    - RTL tests for the three states of the diagram in design B6-V6
    - Supersedes the V5 add-card behaviour of task 18.5 (no modal after creation); 18.5 stays as history
    - _Requirements: 21.6, 21.7, 21.17, 21.18, 21.19, 23.22, 32.17_
    - _Design: B6-V6 (new-card flow state diagram)_
    - Depends on: 30.2

  - [ ] 30.4 Rebuild the member panel with the invitation links
    - Split `MemberPanel.tsx` into `MemberPanel.tsx` (shell), `MemberList.tsx` (role `BaseBadge` per row and remove control for every non-admin row including guests), `AddMemberForm.tsx`, `InviteLinksPanel.tsx`, and `InviteLinkRow.tsx`; the panel renders only for the admin
    - `InviteLinksPanel` calls GET `/api/boards/<id>/invite-links` on mount and shows "Member link: can edit" and "Guest link: view only" with the full URL in a read-only selectable field, a copy `BaseButton` (`navigator.clipboard.writeText` in `try/catch`: success toast, failure error toast with the URL still visible), and a regenerate `BaseButton` that opens `ConfirmDialog` and replaces the token only after a 200 (error: old link stays, `handleError`)
    - RTL tests: panel and links only for the admin, copy success and failure, regenerate confirm and error, guest rows removable
    - Supersedes the V5 behaviour of task 18.7; 18.7 stays as history
    - _Requirements: 21.12, 21.13, 21.21, 37.15, 37.16, 37.17, 32.18_
    - _Design: B6-V6 (member panel and invitation links), B1_
    - Depends on: 30.1, 29.1

  - [ ] 30.5 Build the `/invite/[token]` page
    - `app/invite/[token]/page.tsx` (Server: reject a token that fails the token format with the not-found message, else fetch GET `/api/invites/<token>` with the server token; 401 calls `redirect("/login?expired=1")`) and `components/boards/InviteJoinCard.tsx` (Client): board name, "Member: can edit" or "Guest: view only", a Join `BaseButton` disabled while POST accept runs, redirect to `/boards/<board_id>` with a success toast on 200; when `acceptOutcome` is `none` and `current_role` is set show the current role and an open-board link instead; a 404 shows the not-found message with a link to `/` and no Join button
    - RTL tests for each branch
    - _Requirements: 37.18, 37.19, 27.9, 32.18_
    - _Design: B2 (`/invite/[token]`), B6-V6 (invite page)_
    - Depends on: 29.1, 29.5

  - [ ] 30.6 Build the `/welcome` page
    - `app/welcome/page.tsx` (public Server Component, no API call), `components/welcome/WelcomeContent.tsx` (1 to 5 sentences and the eight listed capabilities), `components/welcome/WelcomeActions.tsx` (Client: "Log in" and "Create account" `BaseButton`s that call `setWelcomeCookie` and navigate); one Header and one Footer from the layout; single-column responsive layout `mx-auto w-full max-w-xl px-4`
    - RTL tests: both buttons present, the cookie is set on click, navigation targets `/login` and `/register`
    - _Requirements: 38.1, 38.2, 38.3, 38.10, 27.9_
    - _Design: B2 (`/welcome`), B4-V6, B9 (V6 responsive note)_
    - Depends on: 29.5

  - [ ] 30.7 Make the login and register forms honor `next`
    - `LoginForm` redirects with `router.push(safeNext(next) ?? "/")`; `RegisterForm` redirects to `withNext("/login", safeNext(next))` after the 201; the two pages link to each other with `withNext`; invalid `next` values are ignored
    - RTL tests: valid invite `next` followed after login and kept through register, absolute URL and other-path `next` ignored
    - Supersedes the V5 redirect behaviour of tasks 18.1 and 18.2; 18.1 and 18.2 stay as history
    - _Requirements: 19.3, 19.8, 19.11, 19.12, 28.15_
    - _Design: B4-V6 (`safeNext`, `withNext`)_
    - Depends on: 29.1, 29.2

  - [ ] 30.8 Show guest role badges on the Dashboard and status badges in My Tasks
    - `BoardList` role badge uses `ROLE_VARIANT` for `admin`, `member`, and `guest`; `MyTasksList` renders `StatusBadge` after the Column name, keeps `DONE` cards with the "Done" badge, and adds no status filter
    - Update the Dashboard and My Tasks RTL tests accordingly
    - Supersedes the V5 behaviour of tasks 18.3 and 18.10; 18.3 and 18.10 stay as history
    - Property tests: **Property 34** (grouping, re-run with status), **Property 56** (badge part)
    - **Validates: Requirements 20.1, 25.2, 25.7**
    - _Requirements: 20.1, 25.2, 25.7_
    - _Design: B2 (V6 other pages), B7-V6 (badges)_
    - Depends on: 29.9, 29.1

  - [ ] 30.9 Rebuild the Profile page (fixed email, change password)
    - `components/users/ProfileForm.tsx` (name input pre-filled), `ReadOnlyEmail.tsx` (email as text, no input), `ChangePasswordForm.tsx` (masked current and new password inputs, `autoComplete` values, never pre-populated); the body never contains `email` and contains `password` and `current_password` only when both are filled and valid; on 200 call `updateUser`, show a success toast, and clear both password inputs; a 400 that names `current_password` (`errorNamesField`) shows the field error and keeps the name; other errors use `useErrorHandler`
    - RTL tests: no email input exists, name 0 and 101 error, one-filled password section error, 7 characters error and 8 characters submitted with `current_password`, the `current_password` error branch, the request body check
    - Supersedes the V5 behaviour of task 18.11 (editable email, no password); 18.11 stays as history
    - Property test: **Property 29** (profile validators, component use)
    - **Validates: Requirements 26.1 to 26.8**
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.8, 32.15_
    - _Design: B11, B2 (`/profile` V6 change)_
    - Depends on: 29.4

  - [ ] 30.10 Responsive pass for the V6 pages and guest view
    - Review `/welcome`, `/invite/[token]`, `InviteLinksPanel` (URL field, copy, and regenerate stacked below `md`, `break-all`), the guest badge (`flex-wrap`), and `ConfirmDialog` at 375 px against design B9; 44 px tap targets for Join, Log in, and Create account; add class-based RTL assertions where practical
    - Supersedes the V5 coverage of task 18.12 for the new pages; 18.12 stays as history
    - _Requirements: 27.1, 27.2, 27.6, 27.9, 22.17_
    - _Design: B9 (V6 responsive note)_
    - Depends on: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6

  - [ ] 30.11 Update the frontend repository-rule tests for the V6 files
    - Supersedes the V5 coverage of task 19.1 for the new and split files; 19.1 stays as history
    - `web/__tests__/repo-rules.test.ts`: no `dangerouslySetInnerHTML`, no native `<button` outside `BaseButton`, one component per file in `components/` (including `MemberList`, `InviteLinkRow`, `StatusSelect`, `WelcomeActions`), and `scripts/check_file_size.py` over `web/` (300 lines); split any failing file
    - _Requirements: 28.9, 18.6, 30.6, 30.7_
    - _Design: B1, File size and split rule_
    - Depends on: 30.10

- [ ] 31. Phase 17 (V6): Playwright and `.env.test` work
  - [ ] 31.1 Update `playwright.config.ts` and add the credential and welcome helpers
    - Load `web/.env.test` with dotenv (`override: false`, so process variables win) before reading any variable; validate `E2E_BASE_URL` (absolute http or https URL, error names the variable) before any test starts; create `web/.env.test.example` with placeholders for `E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`
    - `web/e2e/support/credentials.ts`: `requireCredentials()` throws `Missing required environment variable: <NAME>` (never a value), builds the wrong password at run time (`password + "-wrong-" + Date.now()`), and builds the unique registration email by plus-addressing the local part of `E2E_USER_EMAIL`; `web/e2e/support/welcome.ts`: `setWelcomeSeen(context, baseURL)` adds the `kano_welcome_seen` cookie
    - Unit tests: missing variable named in the error, no value printed, dotenv does not override an existing variable
    - Supersedes the V5 behaviour of task 21.1 (live URL from the shell only); 21.1 stays as history
    - _Requirements: 33.2, 33.10, 33.11, 35.2_
    - _Design: Testing Strategy V6 additions (Playwright), D1 (V6 credentials note)_
    - Depends on: 30.11

  - [ ] 31.2 Update the auth E2E scenarios (no literal credentials, welcome cookie)
    - Supersedes the V5 specs of task 21.2; 21.2 stays as history
    - Four scenarios: login with `requireCredentials()` redirects to `/`; the wrong password built at run time shows the invalid-credentials error and stays on `/login`; an unauthenticated visit to `/` (after `setWelcomeSeen`) redirects to `/login`; logout redirects to `/login` and a following visit to `/` redirects again
    - _Requirements: 33.3, 33.6, 33.10, 33.11, 33.14_
    - _Design: Testing Strategy V6 additions (Playwright)_
    - Depends on: 31.1

  - [ ] 31.3 Update the Kanban journey E2E (generated email, password from the environment)
    - Supersedes the V5 spec of task 21.3; 21.3 stays as history
    - Step 1 registers a unique generated email with the password from `E2E_USER_PASSWORD` through the helper; the 8 steps, serial mode, and mouse `dragTo` stay
    - _Requirements: 33.4, 33.5, 33.6, 33.10_
    - Depends on: 31.1

  - [ ] 31.4 Update the mobile viewport E2E checks (375 px) for the new pages
    - Supersedes the V5 specs of task 21.4; 21.4 stays as history
    - Remove hardcoded credentials (use the helper), set the welcome cookie before visiting `/`, and add `/welcome` and an invite page to the overflow, overlap, and 44 px checks
    - _Requirements: 27.1, 27.2, 27.6, 27.9, 33.10_
    - _Design: B9, Testing Strategy V6 additions_
    - Depends on: 31.1

  - [ ] 31.5 Write the welcome E2E scenario
    - Fresh browser context: a visit to `/` lands on `/welcome`; the page shows "Log in" and "Create account"; "Log in" leads to `/login` and `context.cookies()` contains `kano_welcome_seen`; "Create account" leads to `/register`; a second visit to `/` lands on `/login`
    - _Requirements: 33.13, 38.5, 38.6, 38.10, 38.14_
    - Depends on: 31.1

  - [ ] 31.6 Write the status and new-card E2E scenarios
    - Status: open a card, choose "In progress", save, see the badge on the board; set "Done" and see "Done" in `/my-tasks`. New card: add a card by title, the Card Detail Modal opens with the title, fill the description, save
    - _Requirements: 21.17, 21.22, 23.17, 23.18, 25.2, 33.3_
    - Depends on: 31.1

  - [ ] 31.7 Write the invite-join E2E scenario
    - The pre-existing user creates a Board and reads the member and guest links in the member panel; a second browser context registers a generated user and joins through the member link and sees edit controls; a third context joins through the guest link and sees the "Guest" badge and no add-column control
    - _Requirements: 37.15, 37.18, 37.20, 21.20, 33.14_
    - Depends on: 31.1

  - [ ] 31.8 Write the profile E2E scenario
    - `/profile` shows the email as text equal to `E2E_USER_EMAIL` (read through the helper) and has no email input
    - _Requirements: 26.1, 33.10_
    - Depends on: 31.1

  - [ ] 31.9 Extend the E2E checks with the no-literal-credentials scan
    - `web/scripts/scanCredentials.ts` exports the pure `findCredentialLiterals(source)` (reports an e-mail address string literal or a string literal passed to a password or email input fill); extend `web/__tests__/no-wait-for-timeout.test.ts` (task 21.5) so it also fails on any finding in `web/e2e/`
    - Supersedes the V5 check of task 21.5 (only `waitForTimeout`); 21.5 stays as history
    - Property test: **Property 58: E2E sources contain no literal credentials** (generated sources, plus the real files under `web/e2e/`)
    - **Validates: Requirements 33.10, 33.12**
    - _Requirements: 33.6, 33.10, 33.12, 32.19_
    - _Design: Correctness Property 58, Testing Strategy V6 additions_
    - Depends on: 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8

- [ ] 32. V6 frontend checkpoint
  - Run `npm test` from `web/` (single run, exit code 0, no network and no running API), `npm run build` (exit code 0, zero TypeScript errors), `pytest -v` from `app/`, and `scripts/check_file_size.py` over `app/` and `web/`
  - Ensure all tests pass, ask the user if questions arise
  - Final repository and verification tasks (33) and the deployment tasks (22.3 onward) depend on this checkpoint
  - Depends on: 28, 29.2, 29.3, 29.4, 29.6, 29.7, 29.8, 30.11, 31.9
  - _Requirements: 32.9, 32.10, 32.11, 31.8_

- [ ] 33. Phase 18 (V6): Final repository rules and pre-deployment verification
  - [ ] 33.1 Update `.gitignore` for `.env.test` and `.env.test.example`
    - Keep ignoring `.env`, `.env.local`, and every other `.env*`; add `.env.test` to the ignored files and keep `.env.example` and `.env.test.example` tracked with the exceptions placed after the `.env*` rule (`!.env.example`, `!.env.test.example`)
    - Add a test or script that runs `git check-ignore web/.env.test` (must be ignored) and `git check-ignore web/.env.test.example` and `git check-ignore app/.env.example` (must not be)
    - Supersedes the V5 rules of task 1.1; 1.1 stays as history
    - _Requirements: 35.1, 35.2, 35.7_
    - _Design: D1 (V6 credentials note), Testing Strategy V6 additions (Files)_
    - Depends on: 32

  - [ ] 33.2 Check the ignore files and the `.env.example` files for V6
    - Confirm `.vercelignore` still excludes `web/`, `app/venv/`, and `.kiro/` and that `web/.env.test` is never part of an upload; add a test that each `.env.example` lists every variable read by its project (V6 adds no environment variable) and that `web/.env.test.example` lists exactly `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` with placeholder values
    - Supersedes the V5 coverage of `.vercelignore` and the `.env.example` files in tasks 1.1, 2.1, and 17.1; those stay as history
    - _Requirements: 35.2, 1.14, 15.5_
    - _Design: D1 (V6 deployment notes)_
    - Depends on: 33.1

  - [ ] 33.3 [MANUAL] Verify the invite links and the welcome flow in the browser before deployment
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
    { "id": 59, "tasks": ["22.3"] },
    { "id": 60, "tasks": ["22.4"] },
    { "id": 61, "tasks": ["22.5"] },
    { "id": 62, "tasks": ["22.6", "33.5"] },
    { "id": 63, "tasks": ["22.7"] },
    { "id": 64, "tasks": ["22.8"] },
    { "id": 65, "tasks": ["22.9"] },
    { "id": 66, "tasks": ["23.1", "23.4", "23.6", "23.7"] },
    { "id": 67, "tasks": ["23.2"] },
    { "id": 68, "tasks": ["23.3"] },
    { "id": 69, "tasks": ["23.5"] },
    { "id": 70, "tasks": ["23.8"] },
    { "id": 71, "tasks": ["24"] }

  ]
}
```
