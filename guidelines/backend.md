# Backend Guidelines (Flask API)

Purpose: rules for the Kano Flask API so that generated code is consistent and reviewable.
Read this file before writing any code in `app/`. Scope: everything under `app/` except data-model rules.
Also consult `guidelines/database.md` (models, soft delete, ordering, migrations) and `guidelines/frontend.md` (only for the API contract the UI consumes).
Every new entry must keep the Rule / Rationale / Kano Example structure.

### G-BE-01: One Blueprint_Package per feature
- **Rule:** Put each feature in `app/blueprints/<feature>/` with exactly `routes.py`, `service.py`, and `schema.py`, define its SQLAlchemy model(s) in that `schema.py`, and never create `app/routes/`, `app/services/`, or `app/models/`.
- **Rationale:** A fixed layout lets every agent find code without searching, and one model definition per package avoids duplicate or circular definitions.
- **Kano Example:** `app/blueprints/cards/schema.py` holds `Card` and `CardCreateSchema`; the eight packages are auth, users, boards, columns, cards, comments, notifications, analytics.

### G-BE-02: Cross-blueprint import rules
- **Rule:** Import another feature's models only from its `schema.py`, call its `service.py` only where the design allows, never import its `routes.py`, and reference its models by string name in relationships and foreign keys.
- **Rationale:** These rules keep the import graph acyclic. Allowed service-to-service calls are auth to users, cards to notifications, and comments to notifications.
- **Kano Example:** `db.relationship("Column", lazy="raise")` in `app/blueprints/cards/schema.py`; `app/blueprints/cards/service.py` calls `notifications/service.py`.

### G-BE-03: Thin routes, logic in services
- **Rule:** Make `routes.py` parse input, call one `service.py` function, and return `ok(...)`, and keep all business logic, queries, and commits in `service.py`.
- **Rationale:** Routes without logic make the envelope and status handling uniform and keep services testable without HTTP.
- **Kano Example:** `app/blueprints/boards/routes.py` calls `service.create_board(current_user, data)`; the route never touches `db.session`.

### G-BE-04: Shared modules in app/
- **Rule:** Keep cross-cutting code only in `app/config.py`, `extensions.py`, `errors.py`, `permissions.py`, `wsgi.py`, and the design's helper modules `soft_delete.py`, `ordering.py`, `health.py`, and create `db`, `migrate`, and `jwt` once in `extensions.py`.
- **Rationale:** One home per concern prevents helpers from being copied between features.
- **Kano Example:** `from app.extensions import db`; all internal imports are absolute because `app/` is the package `app`.

### G-BE-05: Response_Envelope shape
- **Rule:** Return every response body as exactly `{ "data": ... }` on success or `{ "error": "<message up to 500 chars>" }` on failure, using `ok()` and `fail()` from `app/errors.py`, and never put the status code in the body.
- **Rationale:** The frontend `apiClient` depends on this single shape.
- **Kano Example:** `return ok(board_schema.dump(board), 201)`; `fail("Board not found", 404)`.

### G-BE-06: Success status codes
- **Rule:** Return 201 only for the six creating POSTs (register, boards, members, columns, cards, comments) and 200 for every other success, with DELETE returning 200 and a `data` object, never 204.
- **Rationale:** Fixed codes make client logic and tests predictable.
- **Kano Example:** `DELETE /api/cards/<id>` returns `ok({"card_id": "<uuid>"})`; `POST /api/auth/login` and `PATCH /api/cards/<id>/position` return 200.

### G-BE-07: Error status mapping
- **Rule:** Map failures only through `ApiError` subclasses and handlers in `app/errors.py` as validation 400, bad or wrong-type JWT 401, permission 403, missing or soft-deleted resource or malformed UUID 404, bad method 405, unique conflict 409, unexpected 500.
- **Rationale:** Central mapping stops each route from inventing its own codes.
- **Kano Example:** `raise Conflict("Email already registered")` in `app/blueprints/auth/service.py`; a foreign-key `IntegrityError` becomes 400.

### G-BE-08: Validate every input with Marshmallow
- **Rule:** Validate every request body and query string with a Marshmallow schema from the package's `schema.py` using `unknown = RAISE`, through `load_json(schema)` in `app/errors.py`.
- **Rationale:** Validation at the boundary keeps bad data out of services, and `RAISE` rejects unexpected fields such as `password` on a profile update.
- **Kano Example:** `CardQuerySchema` for `GET /api/cards?q=...&board_id=...`; `UserUpdateSchema` rejects `password` with 400.

### G-BE-09: Membership and role checks via permissions.py
- **Rule:** Enforce Board_Membership and role on the server only through the helpers in `app/permissions.py`, checking 404 first, then 403 for non-members, then 403 for non-admins, with no resource data in the 403 body.
- **Rationale:** One place for access control keeps the ordering consistent and avoids data leaks.
- **Kano Example:** `require_board_admin(board_id, user.user_id)` in `app/blueprints/boards/service.py`; `permissions.py` imports `schema.py` files and never a `service.py`.

### G-BE-10: JWT access and refresh tokens
- **Rule:** Issue an access token (`type=access`, lifetime `JWT_ACCESS_TOKEN_EXPIRES`) and a stateless refresh token (`type=refresh`, lifetime `JWT_REFRESH_TOKEN_EXPIRES`), both with `sub = str(user_id)`, accept the refresh token only on `POST /api/auth/refresh`, and answer a wrong-type or deleted-user token with 401.
- **Rationale:** Token type separation limits what a stolen token can do, and 401 (not the library default 422) is what the client expects.
- **Kano Example:** `@jwt_required(refresh=True)` on `POST /api/auth/refresh` in `app/blueprints/auth/routes.py`.

### G-BE-11: Configuration, secrets, and CORS from environment
- **Rule:** Read `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES`, and `CORS_ORIGINS` only through `Config.from_env()`, fail startup naming each missing variable without printing values, list every variable in `app/.env.example` with placeholders, and enable CORS only for the configured origins.
- **Rationale:** Fail-fast config surfaces deployment mistakes early, and nothing sensitive reaches the repository.
- **Kano Example:** `ConfigError("Missing required environment variable: JWT_SECRET_KEY")` in `app/config.py`.

### G-BE-12: Logging and error messages
- **Rule:** Never log passwords, hashes, tokens, or `Authorization` headers, and return the generic message `"Internal server error"` for every 500 after rolling back and logging the exception.
- **Rationale:** Logs and error bodies are the most common place for accidental leaks of secrets and SQL details.
- **Kano Example:** the generic `Exception` handler in `app/errors.py` calls `db.session.rollback()` and `logger.exception(...)`.

### G-BE-13: Python naming and dependency install
- **Rule:** Follow PEP 8 (PascalCase classes, snake_case everything else) and install packages only with `py -m pip install <name>` into the existing `app/venv`, pinning exact versions in `app/requirements.txt`.
- **Rationale:** Consistent names and pinned versions make the project reproducible.
- **Kano Example:** `class CardCreateSchema`, `def next_last_order(...)`, `Flask-Migrate==<version>` in `app/requirements.txt`.

### G-BE-14: pytest conventions
- **Rule:** Name tests `test_<behavior>` in `app/tests/`, run them only against the database in `TEST_DATABASE_URL` (a name ending in `_test`, never `DATABASE_URL`), and have each test create its own data and assert the envelope shape and status code.
- **Rationale:** Isolated, order-independent tests can run repeatedly, and the separate database protects development data.
- **Kano Example:** `app/tests/conftest.py` factories `make_user`, `make_board`, `auth_header(user)` and a per-test `TRUNCATE`.

### G-BE-15: 300-line file limit and split rule
- **Rule:** Keep every `.py`, `.ts`, and `.tsx` file in `app/` and `web/` at or below 300 lines, and split an oversized Python module into a package whose `__init__.py` still exports `routes`, `service`, and `schema`.
- **Rationale:** Small single-purpose files are easier for agents to read and edit correctly.
- **Kano Example:** `app/blueprints/boards/service.py` becomes `service/` with `board_service.py`, `member_service.py`, and `cascade.py`.

## Quick checklist
- [ ] Files sit in the right `app/blueprints/<feature>/` package; no cross-package `routes.py` import.
- [ ] Routes are thin; logic is in `service.py`.
- [ ] Every body and query string has a Marshmallow schema.
- [ ] Role and membership checks go through `permissions.py`.
- [ ] Responses use `ok()`/`fail()` with the correct status code.
- [ ] No secrets, tokens, or SQL text in logs or responses; new env vars are in `.env.example`.
- [ ] Tests use the test database and their own data.
- [ ] No file over 300 lines.
