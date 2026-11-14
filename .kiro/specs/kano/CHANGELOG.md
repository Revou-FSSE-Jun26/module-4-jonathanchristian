# Changelog

## V1 - Initial Release
- Initial requirements generated from `kano.md` and `preferences.md`, including the user's answers to the clarifying questions.
- Initial implementation scope established: Flask backend in `app/`, Next.js frontend in `web/`, testing, deployment, and documentation deliverables.
- Acceptance criteria for Requirements 1 to 36 were detailed (boundary values, error paths, and measurable thresholds) within V1.
- `design.md` and `tasks.md` are not yet generated.

## V2 - 2026-11-14
### Changes
- Specification change (user-made): the backend layout moved from separate `app/routes/`, `app/services/`, and `app/models/` folders to per-feature `app/blueprints/<feature>/{routes.py, service.py, schema.py}`, with SQLAlchemy models in each feature's `schema.py`. This rewrote Requirement 1 criteria 3 and 4 and the Folder Structure.
- Refinement 1 (Requirement 1, shared code): added criteria 5 and 6 for the shared modules `__init__.py` (`create_app`), `config.py`, `extensions.py`, `errors.py`, `permissions.py`, and `wsgi.py`, and the use of `permissions.py` by every feature's `service.py`. Former criteria 5 to 10 are now 10 to 15. Criterion 1 is unchanged because the directories stay `blueprints/`, `tests/`, and `migrations/`.
- Refinement 2 (Requirement 1, cross-feature imports): added criteria 7 to 9 for import rules between Blueprint_Packages, string-name references for cross-package relationships and foreign keys, and importing every model-defining `schema.py` in the application factory before Flask-Migrate runs.
- Refinement 3 (Requirement 30 criterion 6): replaced the one-resource-per-file rule, which conflicted with the 8-blueprint layout (boards also owns Board_Membership and the members endpoints), with a one-feature-per-Python-file, one-component-per-React-file, and 300-line limit rule. The split rule is now criterion 7.
- Folder Structure and Glossary (Blueprint_Package) updated to the new layout.
- Requirement 3 criterion 1 was reviewed and left unchanged; it is consistent with Requirement 1 criterion 9.

#### Before / After
- R1.3 before: "THE Kano_API SHALL implement `routes.py` and `service.py` in each Blueprint_Package as entry points that contain no business logic and only delegate to the matching per-resource files in `app/routes/` and `app/services/`, and `schema.py` SHALL contain the Marshmallow schemas for that feature."
- R1.3 after: "THE Kano_API SHALL implement in each Blueprint_Package the Flask route handlers of that feature in `routes.py`, the business and data-access logic of that feature in `service.py`, and the Marshmallow schemas and SQLAlchemy model(s) of that feature in `schema.py`."
- R1.4 before: "THE Kano_API SHALL define exactly one model class per file under `app/models/`, with one file for each of User, Board, Board_Membership, Column, Card, Comment, and Notification."
- R1.4 after: "THE Kano_API SHALL define each of the models User, Board, Board_Membership, Column, Card, Comment, and Notification exactly once, in the `schema.py` of its owning Blueprint_Package (users: User; boards: Board and Board_Membership; columns: Column; cards: Card; comments: Comment; notifications: Notification), with no `app/models/` directory, and the auth and analytics Blueprint_Packages SHALL define no model."
- R1 (new criteria 5 to 9) before: no criteria for shared modules, import rules, or model registration.
- R1 (new criteria 5 to 9) after: shared modules in `app/` (5), `permissions.py` used by every `service.py` (6), import rule: models only from another package's `schema.py`, `service.py` calls allowed, no `routes.py` imports (7), string-name references for cross-package relationships and foreign keys (8), application factory imports every model-defining `schema.py` before Flask-Migrate runs so `flask db migrate` detects all 7 tables (9).
- R30.6 before: "IF a source file in `app/` or `web/` defines code for more than one resource (for example, routes or services for both Cards and Comments) or more than one React component, THEN THE file SHALL be split so that each file contains code for exactly one resource or one component."
- R30.6 after: "THE repository SHALL contain in `app/` only Python source files that each contain code for exactly one feature (Blueprint_Package) or one shared concern, in `web/` only React component files that each define exactly one component, and no source file in `app/` or `web/` that exceeds 300 lines." R30.7 (new): "IF a source file in `app/` or `web/` exceeds 300 lines, or a Python source file in `app/` mixes code of more than one feature, THEN THE file SHALL be split, and a split Python module SHALL become a package of the same name containing one module per resource (for example `app/blueprints/boards/service/`) whose `__init__.py` keeps `routes`, `service`, and `schema` importable under those names."
- Folder tree before: `app/` listed `blueprints/<feature>/ (routes.py, service.py, schema.py)`, `routes/`, `services/`, `models/`, `tests/`, `migrations/`, `venv/`.
- Folder tree after: `app/` lists `__init__.py`, `config.py`, `extensions.py`, `errors.py`, `permissions.py`, `wsgi.py`, `blueprints/<feature>/ (routes.py, service.py, schema.py incl. SQLAlchemy models)`, `tests/`, `migrations/`, `venv/`.
- Glossary Blueprint_Package before: "A directory `app/blueprints/<feature>/` containing `routes.py`, `service.py`, and `schema.py`."
- Glossary Blueprint_Package after: same text followed by "(Marshmallow schemas and SQLAlchemy models)".

### Reason
- The user restructured the backend into per-feature packages. Three follow-up issues were then approved: the one-resource-per-file rule conflicted with the 8-blueprint layout, shared code had no home, and cross-feature imports and model registration for migrations were unspecified.

### Impact
- Requirements: 1 (criteria 5 to 9 added, 10 to 15 renumbered), 30 (criterion 6 reworded, criterion 7 added). Requirement 3 reviewed, not changed.
- Other sections: Folder Structure, Glossary (Blueprint_Package), version marker set to V2.
- Design and tasks: `design.md` and `tasks.md` do not exist yet.

## V3 - 2026-11-14
### Changes
- Specification change (Requirement 4 only, option A approved by the user): the Response_Envelope stays exactly as in `kano.md` (success `{ "data": ... }`, error `{ "error": "<message>" }`, no `status` or `message` field in the body). The status code is carried only by the HTTP status line, and every response carries the exact code. The frontend reads it from `response.status` (Requirements 16.6 and 16.7, unchanged).
- Requirement 4 now has 18 criteria (was 12). New criteria 2, 3, 4, 6, 7, 8. Criteria 1 and 5 amended. Former criteria 3 to 12 are now 9 to 18 with unchanged wording.
- Version marker in `requirements.md` set to V3.

#### Before / After
- R4.1 before: "WHEN a request succeeds, THE Kano_API SHALL return a 2xx status with a JSON body whose only top-level key is `data`, in the form `{ "data": ... }`."
- R4.1 after: "WHEN a request succeeds, THE Kano_API SHALL return the exact success status code defined in criterion 3 with a JSON body whose only top-level key is `data`, in the form `{ "data": ... }`."
- R4.2 before: "IF a request fails, THEN THE Kano_API SHALL return the HTTP status code that matches the failure type, with a JSON body whose only top-level key is `error`, in the form `{ "error": "<message>" }`, where `<message>` is a non-empty string of at most 500 characters."
- R4.5 after (former R4.2): "IF a request fails, THEN THE Kano_API SHALL return the exact HTTP status code defined in criterion 6 for the failure type, with a JSON body whose only top-level key is `error`, in the form `{ "error": "<message>" }`, where `<message>` is a non-empty string of at most 500 characters."
- R4.2 (new): the status code is set on the HTTP status line of every response, is not repeated as a body field, and the body has no top-level key other than `data` or `error`.
- R4.3 (new): POST requests that create a resource (`/api/auth/register`, `/api/boards`, `/api/boards/<id>/members`, `/api/boards/<id>/columns`, `/api/columns/<id>/cards`, `/api/cards/<id>/comments`) return 201. All other successful requests (POST `/api/auth/login`, every GET including `/api/health`, every PATCH including `/api/cards/<id>/position`, `/api/boards/<id>/columns/reorder`, `/api/notifications/<id>/read`, every DELETE) return 200.
- R4.4 (new): DELETE returns 200 with `{ "data": ... }` containing a JSON object, never 204 or an empty body.
- R4.6 (new): failure mapping: validation 400; JWT 401; permission or membership 403; missing, soft-deleted, or invalid-UUID path id 404; unsupported method 405; unique conflict 409; unhandled exception or database failure 500.
- R4.7 (new): where another requirement says "return an error" without a code, the R4.6 mapping applies (unique violation 409, foreign-key or NOT NULL violation 400, anything unexpected 500).
- R4.8 (new): error messages are human-readable strings and generic for status 500.

### Reason
- The user asked whether every response carries the status code. Option A keeps the `kano.md` envelope unchanged and puts the status in the HTTP status line.

### Impact
- Requirements: 4 only. Requirements 5, 16, and 31.3 were checked and are consistent; no other requirement was edited.
- Design and tasks: `design.md` and `tasks.md` do not exist yet.
