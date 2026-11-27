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
- Design and tasks: `design.md` was created as part of the V3 initial design generation (version marker V3). `tasks.md` does not exist yet.

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

## V4 - 2026-11-14
### Changes
- Specification change (user decision 1): login now issues an access token (expiry 3600 s) and a refresh token (expiry 604800 s). Both are Flask-JWT-Extended JWTs with `sub = user_id` and a `type` claim (`access` or `refresh`).
- Specification change (assumption, to complete the refresh flow): new endpoint POST `/api/auth/refresh`. The client sends the refresh token as `Authorization: Bearer <refresh_token>`. Success returns 200 `{ "data": { "access_token", "token_type": "Bearer", "expires_in": 3600 } }`. There is no rotation and no server-side revocation, so logout only clears client cookies. A refresh token on a protected endpoint, an access token on `/api/auth/refresh`, an expired or invalid refresh token, and a refresh token of a soft-deleted or nonexistent user all return 401.
- Specification change (assumption): login response data is `{ "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "user" }`. Register is unchanged (no tokens).
- Specification change (assumption): the single `JWT_EXPIRES_SECONDS` variable is replaced by `JWT_ACCESS_TOKEN_EXPIRES` (placeholder 3600) and `JWT_REFRESH_TOKEN_EXPIRES` (placeholder 604800). Both are required at startup and fail fast by name.
- Specification change (assumption): frontend keeps two non-httpOnly cookies (`SameSite=Lax`, path `/`): the access cookie (3600 s, from `expires_in`) and the refresh cookie (604800 s, constant). The apiClient refreshes once on a 401 and retries once, with concurrent 401s sharing one in-flight refresh. A failed refresh clears both cookies and AuthContext and redirects to `/login`. `middleware.ts` refreshes an expired or missing access cookie from the refresh cookie before rendering and sets the new access cookie on the response. Logout and the 401 handler clear both cookies. Session restore calls GET `/api/users/me` with the access token, refreshing first when needed.
- Implementation change: the empty `app/app.py` created while setting up the venv was deleted by the user (user decision 2). The related open issue and scaffolding note were removed from `design.md`.
- Requirements edited (`requirements.md`, now V4): Introduction (core features), Glossary (JWT reworded; Access_Token and Refresh_Token added; Auth_Cookie and AuthContext reworded), Requirement 1 (criteria 12 and 13), Requirement 4 (criteria 3, 6, 13), Requirement 6 (criteria 4, 5, 6, 7, 9 reworded; criteria 10 to 15 added), Requirement 16 (criteria 5 and 13 reworded; criteria 14 to 17 added), Requirement 17 (rewritten and renumbered, now 11 criteria), Requirement 28 (criteria 6, 7, 8), Requirement 31 (criterion 11 added), Requirement 32 (criterion 7 reworded, criterion 12 added), Requirement 34 (criterion 4), Requirement 36 (criteria 3 and 11). Requirements 7, 33, and the other criteria of Requirement 4 were reviewed and left unchanged.
- Design edited (`design.md`, now V4): decision D9, system context diagram, A1 (env table, `create_app` step 2, `.env.example`), A2 (JWT callbacks row), A3 (token types, type enforcement, refresh, login and refresh response, logout), A11 (new row 3a, row 3, legend), A12, B1 (file tree), B2 (login row, dashboard row, 401 note), B4 (cookies, AuthProvider, middleware, login sequence diagram, new middleware refresh diagram), B5 (apiClient refresh and retry, `lib/refreshSession.ts`, new refresh-on-401 sequence diagram, useErrorHandler), B10 (auth types), Correctness Properties (5, 11, 26 reworded; 28 rewritten; 36 to 39 added), Error Handling, Testing Strategy (backend, frontend), D1 (production env variables, verification order), D3, Traceability Matrix (rows 4, 6, 16, 17, 28, 31, 32, 34, 36), Open issues.

#### Before / After
- R6.4 before: "WHEN a client sends POST `/api/auth/login` with a valid email and password of a non-deleted User, THE Kano_API SHALL return status 200 with a JWT and the User profile excluding the password and password hash."
- R6.4 after: "... THE Kano_API SHALL return status 200 with `{ "data": { "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "user": <profile> } }`, where the profile excludes the password and password hash."
- R6.5 before: "THE Kano_API SHALL set the JWT expiry from the configured expiry environment variable and SHALL include the `user_id` as the token subject."
- R6.5 after: "THE Kano_API SHALL issue the Access_Token with `type` = `access` and an expiry of `JWT_ACCESS_TOKEN_EXPIRES` seconds (3600 in the default configuration), SHALL issue the Refresh_Token with `type` = `refresh` and an expiry of `JWT_REFRESH_TOKEN_EXPIRES` seconds (604800 in the default configuration), and SHALL include the `user_id` as the `sub` claim of both tokens."
- R17.2 before: "WHEN a login succeeds, THE AuthContext SHALL store the JWT in memory and in the Auth_Cookie with a lifetime in seconds equal to the JWT expiry configured for Kano_API, path `/`, and `SameSite=Lax`."
- R17.2 after: "WHEN a login succeeds, THE AuthContext SHALL store the Access_Token and the Refresh_Token in memory, SHALL store the Access_Token in the access cookie with a lifetime in seconds equal to the `expires_in` value of the login response (3600), and SHALL store the Refresh_Token in the refresh cookie with a lifetime of 604800 seconds, each cookie with path `/` and `SameSite=Lax`."
- R17 criteria numbering: before 10 criteria (7 was the unauthenticated redirect, 9 was the Server Component token, 10 was `updateUser`). After 11 criteria (new 7 is the middleware refresh, 8 the unauthenticated redirect, 10 the Server Component token, 11 `updateUser`).
- R1.12 before: "... read the database URL, JWT secret, JWT expiry (in seconds), and allowed CORS origins ..."
- R1.12 after: "... read the database URL, JWT secret, Access_Token expiry `JWT_ACCESS_TOKEN_EXPIRES` (in seconds), Refresh_Token expiry `JWT_REFRESH_TOKEN_EXPIRES` (in seconds), and allowed CORS origins ..."
- R16.13 before: "... SHALL clear the Auth_Cookie and the AuthContext User and JWT state, and redirect the User to `/login`."
- R16.13 after: "... SHALL clear both the access cookie and the refresh cookie and the AuthContext User, Access_Token, and Refresh_Token state, and redirect the User to `/login`." Criteria 14 to 17 add the refresh-and-retry, single-flight, failure, and no-refresh-for-auth-endpoints rules.
- Design open issue before: "Cookie lifetime source (Requirement 17.2). ... Design reads the `exp` claim from the JWT payload." After: resolved by `expires_in` and the 604800 constant. The `app/app.py` open issue was removed.

### Reason
- The user requested access and refresh tokens with 1 hour and 7 day expiry (decision 1) and deleted `app/app.py` (decision 2).
- The refresh endpoint, response shapes, env variable names, cookie handling, single-flight refresh, middleware refresh, and the stateless (no rotation, no revocation) design are assumptions made by the assistant to complete the flow. The user can override each one.

### Impact
- Requirements: 1, 4, 6, 16, 17, 28, 31, 32, 34, 36, Introduction, and Glossary. Requirement 17 criteria were renumbered.
- Design: see the list under Changes. New correctness properties 36 to 39. Open issues renumbered (12 retained, 5 new: 13 to 17).
- Tasks: `tasks.md` does not exist yet, so no task was changed. When it is generated it must include the refresh endpoint, `lib/refreshSession.ts`, the middleware refresh, and the new tests.
- New open questions: refresh tokens cannot be revoked on logout and are not rotated; the refresh cookie lifetime is a constant coupled to `JWT_REFRESH_TOKEN_EXPIRES`; a middleware refresh failure from a network error or 5xx logs the user out; the 7-day non-httpOnly refresh cookie raises the XSS impact; Flask-JWT-Extended answers 422 for a wrong token type by default and the design maps it to 401.

## V5 - 2026-11-14
### Changes
- Specification change (fix 1, deleted-user conflict): Requirement 6.9 wins. A token whose subject is a soft-deleted or nonexistent User gets 401 on every protected endpoint. Former Requirement 7.7 (404 for a deleted user on `/api/users/me`) was removed, Requirement 7.6 was widened to cover wrong-type tokens and deleted or unknown subjects, and a new Requirement 7.7 was added (see the last change below).
- Specification change (fix 2): the Glossary definition of Notification now matches Requirement 13.
- Specification change (fix 3, email uniqueness): User emails are stored lowercased (register, PATCH `/api/users/me`, add-member lookup, login lookup) and uniqueness is enforced on the lowercased email among non-deleted Users. Requirements 2.12, 6.1, 6.4, 7.2, and 9.1 carry the minimal normalization wording. Requirements 6.2 and 7.4 keep their case-insensitive wording, which is now implemented by the lowercase storage.
- Specification change (fix 6, refresh cookie lifetime): the login response data gains `refresh_expires_in` (equal to `JWT_REFRESH_TOKEN_EXPIRES`, 604800 by default). The access cookie lifetime comes from `expires_in` and the refresh cookie lifetime from `refresh_expires_in`; the middleware uses the `expires_in` of the refresh response. No frontend lifetime constant remains. Requirements 6.4, 17.2, 17.7, 31.11, and 32 (new criterion 14) were updated.
- Specification change (fix 8, server-side apiClient): Requirement 16 criteria 14 to 16 are scoped to the browser (Client Component) runtime, and new criterion 16.18 states that in a Server Component the apiClient never calls POST `/api/auth/refresh`, never writes cookies, and throws `ApiError` 401 on a 401. Only the middleware renews tokens for server rendering.
- Specification change (fix 21, touch drag and drop): Requirement 22.1 now says native HTML5 DnD for mouse input, and new criteria 22.12 to 22.17 add touch support in the same `useDragAndDrop` hook (300 ms long-press, `document.elementFromPoint`, same order rules, same optimistic update and revert, cancel rules, scrolling preserved when no drag is active). Requirement 27 gains criterion 27.8, and Requirement 32 gains criterion 13 (touch tests). Requirement 34.8 and 33.4 were reviewed and left unchanged.
- Specification change (clarification, Antigravity): Antigravity is part of the AI workflow. Project Brief AI tools line, Requirement 36.4 (new subsection on how Antigravity was used) and 36.6 (Technologies list) were updated. The Overview text was not changed.
- Specification change (clarification, no account deletion): new Requirement 7.7 states that the Kano_API provides no endpoint to delete or deactivate a User and that soft-deleted Users exist only as seed data created directly in the test database. Requirement 31.11 now says its soft-deleted User is such seed data.
- Design edits (`design.md`, now V5): A3 (deleted-user handling, no delete endpoint, email normalization, login response), A11 endpoint rows 3, 4, 5, B2 login row, B4 (cookie table, `authCookie.ts` helpers, AuthProvider login, login and middleware diagrams, server-side behavior), B5 (server-side apiClient rule, refresh diagram note), B6 (mouse and touch paths, `computeDropIndex`, `touchGestureStep`, touch branch in the sequence diagram, CSS and `touch-action` note), B9 (touch row), B10 (`LoginResult`), Data Models (users row: lowercase check constraint and partial unique index), Correctness Properties 9, 11, 36, 39 amended and 40 to 43 added, Error Handling (4 rows), Testing Strategy (auth token tests, soft-deleted user fixture, touch tests, server apiClient and cookie tests, Playwright note), D1 verification order, D3 (seven AI Workflow subsections, Antigravity), Traceability Matrix rows 2, 6, 7, 16, 17, 22, 27, 32, 36, Open issues (5 and 14 resolved, 18 to 20 added).

#### Before / After
- R7.7 before: "IF the User identified by the JWT subject does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404 for GET or PATCH `/api/users/me`."
- R7.6 and R7.7 after: 7.6 "IF a request to GET or PATCH `/api/users/me` has a missing, malformed, invalid-signature, expired, or wrong-type JWT (a Refresh_Token), or a JWT whose subject belongs to a soft-deleted or nonexistent User, THEN THE Kano_API SHALL return status 401 and leave the User unchanged." 7.7 "THE Kano_API SHALL NOT provide any endpoint to delete or deactivate a User, and soft-deleted Users SHALL exist only as seed data created directly in the database by tests (Requirements 6.6, 6.9, 6.13, and 31.11 are tested with such seed data)."
- Glossary Notification before: "A record for a User created when a Card is assigned to the User or when a Comment is added to a Card the User is assigned to or has commented on."
- Glossary Notification after: "A record for a User created when a Card is assigned to the User, or when a Comment is added to a Card the User is assigned to or when the User is the Board_Admin of the Card's Board (never for the Comment author)."
- R2.12 before: "THE Kano_API SHALL enforce a unique email per non-deleted User and a unique (board, user) pair per non-deleted Board_Membership, so that ..."
- R2.12 after: "THE Kano_API SHALL store every User email lowercased (normalized on registration, on PATCH `/api/users/me`, and when matching the email of an add-member request) and SHALL enforce a unique lowercased email per non-deleted User and a unique (board, user) pair per non-deleted Board_Membership, so that ..."
- R6.4 before: login data `{ "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "user": <profile> }`.
- R6.4 after: login data `{ "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "refresh_expires_in": 604800, "user": <profile> }`, where `expires_in` equals `JWT_ACCESS_TOKEN_EXPIRES` and `refresh_expires_in` equals `JWT_REFRESH_TOKEN_EXPIRES`.
- R17.2 before: "... SHALL store the Access_Token in the access cookie with a lifetime in seconds equal to the `expires_in` value of the login response (3600), and SHALL store the Refresh_Token in the refresh cookie with a lifetime of 604800 seconds, ..."
- R17.2 after: "... SHALL store the Access_Token in the access cookie with a lifetime in seconds equal to the `expires_in` value of the login response, and SHALL store the Refresh_Token in the refresh cookie with a lifetime in seconds equal to the `refresh_expires_in` value of the login response, ..."
- R17.7 before: new access cookie "lifetime 3600 seconds". After: "lifetime in seconds equal to the `expires_in` value of the refresh response".
- R16.14 before: "WHEN a protected request sent by the apiClient with an Access_Token returns status 401 and a Refresh_Token is available, THE apiClient SHALL send POST `/api/auth/refresh` once ..."
- R16.14 after: "WHILE running in a Client Component (browser runtime), WHEN a protected request sent by the apiClient with an Access_Token returns status 401 and a Refresh_Token is available, THE apiClient SHALL send POST `/api/auth/refresh` once ..." Criteria 16.15 and 16.16 received the same browser-runtime scope. New 16.18: "WHILE running in a Server Component, THE apiClient SHALL NOT send POST `/api/auth/refresh`, SHALL NOT write or delete any cookie, and SHALL, on a 401 response, throw an ApiError with `statusCode` 401, so that the page redirects to `/login`; ..."
- R22.1 before: "... manage card dragging between Columns using the native HTML5 Drag and Drop API."
- R22.1 after: "... manage card dragging between Columns for mouse input using the native HTML5 Drag and Drop API." New 22.12 to 22.17: touch support (300 ms long-press with at most 10 px movement, scroll blocked only while a touch drag is active, cancel rules, `document.elementFromPoint` target detection, same order rules and optimistic update with revert, no `touch-action` that blocks panning). No existing Requirement 22 criterion was renumbered.
- R27 before: 7 criteria. After: criterion 8 added, "WHILE the viewport width is below 768 px, THE Kano_Web SHALL let a Board_Member drag a Card between Columns by touch, as specified in Requirement 22 criteria 12 to 17."
- Design open issue 5 before: "Native drag events do not fire on touch screens, so dragging on a real phone will not work. ..." After: resolved. Mouse drag is covered by Playwright, touch drag by manual DevTools device mode and React Testing Library tests, because Playwright cannot simulate a long-press touch drag reliably.
- Design open issue 14 before: the refresh cookie lifetime is the constant `REFRESH_COOKIE_MAX_AGE = 604800`. After: resolved, the lifetime comes from `refresh_expires_in`.

### Reason
- The user approved the fixes from the requirements review (fixes 1, 2, 3, 6, 8, and 21) and two clarifications (Antigravity in the AI workflow, no account deletion).

### Impact
- Requirements: Project Brief, Glossary (Notification), 2.12, 6.1, 6.4, 7.2, 7.6, 7.7 (replaced), 9.1, 16.14 to 16.16 (scoped), 16.18 (new), 17.2, 17.7, 22.1, 22.12 to 22.17 (new), 27.8 (new), 31.11, 32.13 and 32.14 (new), 36.4, 36.6. No criterion was renumbered except that the old 7.7 was replaced by a new 7.7 with different content.
- Design: see the Design edits list under Changes. New correctness properties 40 to 43. New open issues 18 to 20.
- Tasks: `tasks.md` does not exist yet, so no task was changed. When it is generated it must include the `refresh_expires_in` field, the lowercase email normalization and check constraint, the server-side apiClient rule, the touch path of `useDragAndDrop`, the `make_deleted_user` test fixture, and the new tests. Update: `tasks.md` was created from requirements V5 and design V5 (no new version).
- Breaking changes: the login response shape gains a field (additive). Requests to `/api/users/me` with a deleted user's token now get 401 instead of 404.

## V6 - 2026-11-21
Source: `improvements.md` plus six user-approved decisions. Only `requirements.md` is changed in this step (now V6). `design.md` and `tasks.md` stay at V5 and will be updated to V6 in the following steps. Tasks 1 to 22.2 stay valid as history.

### Changes
Classification: all items below are **specification changes** unless marked otherwise. No design change, implementation change, or bug fix is made in this step.

1. **Profile update (Requirements 2.12, 7.2 to 7.5, 7.8 new, 26.1 to 26.6, 26.8 new).** The email can no longer be changed. PATCH `/api/users/me` accepts `name` (1 to 100) and/or `password` (8 to 128) with a required `current_password`. A wrong or missing `current_password` gives 400 naming `current_password` (never 403). A body with `email` gives 400. The Profile page shows the email read-only, with an optional change-password section. **Breaking change** for API clients: an `email` field in PATCH `/api/users/me` was accepted before and now returns 400, and a `password` field returned 400 before and is now accepted with `current_password`. The 409 email-conflict path of PATCH no longer exists (registration still returns 409).
2. **Card status (Requirements 2.16 new, 11.2, 11.4, 11.17 to 11.24 new, 14.2, 14.3, 21.22 new, 22.19 new, 23.17 to 23.22 new, 25.2, 25.7 new).** Cards get `status` (`NOT_STARTED`, `IN_PROGRESS`, `DONE`, check constraint) and `completed_at`. Status is set through PATCH `/api/cards/<id>`. Dragging a card does not change status. Analytics "completed this week" now uses `status = DONE` and `completed_at` and no longer the Column named `Done`. **Breaking change** for the analytics numbers: cards that were counted through the Done column are not counted after V6 unless the optional manual backfill (Requirement 3.10) is run.
3. **New card flow (Requirements 21.17 to 21.19 new, 23.22 new).** The quick-add form still asks only for the title. After a 201 response the CardDetailModal opens for the new card. Closing it keeps the title-only card. A failed creation opens no modal.
4. **Invitation links and guest role (new Requirement 37; amended Glossary, Project Brief, 2.15, 2.17, 4.3, 8.10 to 8.12, 9.13 to 9.15, 10.10, 11.11, 11.13, 11.22, 11.23, 12.8, 12.10, 12.11, 13.12, 14.10, 17.8, 17.12, 17.13, 19.3, 19.8, 19.11, 19.12, 20.1, 21.20, 21.21, 21.22, 22.18, 23.20, 23.21, 28.12 to 28.15).** New role `guest` (read-only). Two permanent Invite_Tokens per Board stored as columns on `boards`. New endpoints GET `/api/boards/<id>/invite-links`, POST `/api/boards/<id>/invite-links/<role>/regenerate`, GET `/api/invites/<token>`, and POST `/api/invites/<token>/accept`. Accept rules: no downgrade, guest upgraded to member by the member token, soft-deleted membership replaced by a new row. GET `/api/invites/<token>` was included, as recommended, so the join page can show the board name and role. The glossary term Board_Member keeps its meaning (admin and member roles) and excludes the guest, and the new term Board_Participant means any role. **Breaking change:** a role value `guest` now exists, so any code that assumes only `admin` and `member` must be reviewed.
5. **E2E credentials (Requirements 33.3, 33.4, 33.10 to 33.14 new, 35.1, 35.2).** E2E tests read `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` from the git-ignored `web/.env.test` (committed `web/.env.test.example`). No credentials in `web/e2e/`, with a check like the `waitForTimeout` check. The process environment wins over the file. A pre-existing account is a manual task for the user. `.gitignore` must ignore `.env.test` and keep `.env.test.example` (this needs a later **implementation change** to `.gitignore`).
6. **Welcome page (new Requirement 38; amended 17.8, 17.9, 17.12 new, 17.13 new, 27.9 new, 33.3, 33.13 new).** Public `/welcome` Server Component, `kano_welcome_seen` cookie, first-visit redirect from `/`, route-guard function `decideRoute`. Decision made here: the middleware guards `/invite/<token>` (it is a protected route that redirects anonymous visitors to `/login?next=...`, and it receives the refresh step of 17.7), so the invite page itself never renders for an anonymous visitor. The user text called the page "public"; this is the precise definition asked for. `/welcome`, `/login`, `/register` are public.
7. **Tests and docs (Requirements 31.12 to 31.17, 32.15 to 32.19, 36.13 new).** Backend tests for profile, status, guest, and invitations. Frontend tests for the profile form, CardDetailModal, new-card flow, invitation UI, `decideRoute`, and `next` validation.
8. **Migration (Requirements 3.8 to 3.10 new).** New manual Migration_Step for V6. See Impact.
9. **Folder Structure and Glossary.** `web/` line lists `e2e/` and `.env.test.example`. New Glossary terms: Board_Guest, Board_Participant, Card_Status, Invite_Token, Invite_Link, Welcome_Page, Welcome_Cookie. Amended: Board_Member, Board_Membership, Card.

#### Before / After
- R2.12 before: "... normalized on registration, on PATCH `/api/users/me`, and when matching the email of an add-member request ..."
- R2.12 after: "... normalized on registration and when matching the email of an add-member request; the email cannot change after registration, see Requirement 7 ..."
- R7.2 before: "... PATCH `/api/users/me` with a name of 1 to 100 characters and/or a valid email of up to 254 characters, ... update only the supplied fields (storing a supplied email lowercased) ..."
- R7.2 after: "... PATCH `/api/users/me` with a `name` of 1 to 100 characters and/or a `password` of 8 to 128 characters together with a `current_password` that matches the stored password, ... store a supplied password as a salted hash, return status 200 with the updated profile ... excluding the password and password hash ..."
- R7.3 before: "IF a PATCH `/api/users/me` request contains a password field, THEN ... status 400 and leave the User unchanged."
- R7.3 after: "IF a PATCH `/api/users/me` request contains an `email` field with any value, THEN ... status 400 with an error message naming the field `email` and leave the User unchanged ..."
- R7.4 before: "IF the new email in a PATCH `/api/users/me` request belongs to another non-deleted User ..., THEN ... status 409 ..."
- R7.4 after: "IF a PATCH `/api/users/me` request contains a `password` and the `current_password` is missing or does not match the stored password, THEN ... status 400 (and not status 403) with an error message naming the field `current_password`, and leave the User unchanged, including the name ..."
- R7.5 before: invalid cases were empty name, name over 100, malformed or over-long email, or a body with neither name nor email.
- R7.5 after: invalid cases are empty name, name over 100, password under 8 or over 128, `current_password` without `password`, or a body with neither `name` nor `password`.
- R26.1 before: "... controlled inputs for name and email are pre-populated ..."
- R26.1 after: "... controlled name input is pre-populated ..., and that shows the email ... as read-only text without an editable email input."
- R26.2 to 26.6 before: submit name and email; field errors for email; 409 shows email-in-use; no password field in the form.
- R26.2 to 26.6 after: submit name (and `password` and `current_password` when the optional section is filled); field errors for name, new password length, and half-filled password section; status 400 naming `current_password` shows an error on the current password input; other failures use useErrorHandler; the form has an optional change-password section.
- R11.2 before: "... assignee (optional, a Board_Member), Order_Value, and Column."
- R11.2 after: "... assignee (optional, a Board_Member with the role `admin` or `member`), status (Card_Status, default `NOT_STARTED`), completed_at (optional UTC timestamp), Order_Value, and Column."
- R11.4 before: invalid inputs ended with "... or a labels list that exceeds 10 items or contains an item outside 1 to 30 characters".
- R11.4 after: "... a labels list that exceeds 10 items or contains an item outside 1 to 30 characters, or a `status` that is not exactly `NOT_STARTED`, `IN_PROGRESS`, or `DONE` (case-sensitive ...)".
- R11.11 before: "... across Boards where the current User is a Board_Member, whose title or description contains the text ..."
- R11.11 after: "... across Boards where the current User is a Board_Participant (admin, member, or guest), whose title or description ..."
- R11.13 before: "... the current User is not a Board_Member of that Board ... 403." After: "... is not a Board_Participant of that Board ... 403."
- R12.8 before: "IF the current User is not a Board_Member of the Card's Board, THEN ... 403 for comment creation and listing ..." After: "IF the current User is not a Board_Participant ..." (a Board_Guest may list, and gets 403 on creation through 12.11).
- R14.2 before: "THE Kano_API SHALL treat a Card as completed when it is in the Column of the Board whose name is `Done` (case-insensitive), and count it in the current week when its `updated_at` falls from Monday 00:00:00 UTC of the current week up to and including the request time."
- R14.2 after: "... treat a non-deleted Card of the Board as completed when its `status` is `DONE`, regardless of the Column it is in, and count it in the current week when its `completed_at` falls from Monday 00:00:00 UTC of the current week up to and including the request time."
- R14.3 before: "IF the Board has no Column named `Done` (case-insensitive), THEN ... return 0 ..."
- R14.3 after: "IF no non-deleted Card of the Board has `status` `DONE` with a `completed_at` in the current week, THEN ... return 0 ..."
- R17.8 before: "WHEN an unauthenticated visitor requests a protected route, THE Kano_Web SHALL redirect the visitor to `/login` before rendering any protected page content. An unauthenticated visitor is ..."
- R17.8 after: same rule, plus two exceptions (`/` without the Welcome_Cookie goes to `/welcome`; `/invite/<token>` goes to `/login?next=...`) and a definition of protected route (every route except `/welcome`, `/login`, `/register`).
- R17.9 before: "WHEN an authenticated User requests `/login` or `/register`, ... redirect the User to `/`." After: "... `/login`, `/register`, or `/welcome` ..."
- R19.3 before: "... on a 201 response, redirect to `/login` and show a success toast." After: "... redirect to `/login` (keeping a valid `next` query parameter, see criterion 11) and show a success toast."
- R19.8 before: "... store the JWT through the AuthContext on a 200 response, and redirect to `/`." After: "... redirect to the `next` path when it is valid (criterion 11) or to `/` when `next` is missing or invalid."
- R20.1 before: "a role badge showing `admin` or `member`". After: "`admin`, `member`, or `guest`".
- R25.2 before: shows title, due date, Column name, and board link. After: also shows the Card_Status as a BaseBadge.
- R4.3 before: the 200 list named POST `/api/auth/login` and POST `/api/auth/refresh` among the non-creating POSTs. After: also POST `/api/invites/<token>/accept` and POST `/api/boards/<id>/invite-links/<role>/regenerate` (both 200, not 201).
- R8.10 before: "... fails after the Board row is created but before the admin Board_Membership is stored, THEN ... roll back both records ..." After: "... before the admin Board_Membership and the two Invite_Tokens ... are stored, THEN ... roll back all of these records ..."
- R33.3 before: valid-credentials login, invalid-credentials login, unauthenticated visit to a protected route, and logout, with no source named for the credentials. After: credentials come from `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, the wrong password is built at run time, and scenarios that visit `/` unauthenticated set `kano_welcome_seen` first.
- R33.4 step 1 before: "(1) register a new User with a unique email per run". After: "... with a unique generated email per run and the password from `E2E_USER_PASSWORD`".
- R35.1 before: ".gitignore excludes `.env`, `.env.local`, and every other `.env*` file except `.env.example`". After: "... `.env`, `.env.local`, `.env.test`, and every other `.env*` file except `.env.example` and `.env.test.example`".
- R35.2 before: "commit `app/.env.example` and `web/.env.example`". After: "commit `app/.env.example`, `web/.env.example`, and `web/.env.test.example` (listing `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`)".
- Project Brief user roles before: Board_Admin and Board_Member only. After: adds Board_Guest and the invitation links.
- Project Brief core features before: "... board members with roles; ... user profile; board analytics." After: adds card status, three roles, invitation links, "user profile (name and password; the email is fixed)", and the welcome page.
- Glossary Board_Membership before: "role (`admin` or `member`)". After: "role (`admin`, `member`, or `guest`)".
- Glossary Board_Member before: "A User added to a Board by email; holds the member role on that Board." After: also joins through a member Invite_Link, and the term covers admin and member roles and excludes guest.
- Glossary Card before: "... title, description, due date, labels, assignee, and a FLOAT order value." After: adds Card_Status and `completed_at`.
- Requirements added without a Before text (new criteria appended at the end of their requirement, nothing renumbered): 2.15 to 2.17, 3.8 to 3.10, 7.8, 8.11, 8.12, 9.13 to 9.15, 10.10, 11.17 to 11.24, 12.10, 12.11, 13.12, 14.10, 17.12, 17.13, 19.11, 19.12, 21.17 to 21.23, 22.18, 22.19, 23.17 to 23.22, 25.7, 26.8, 27.9, 28.12 to 28.15, 31.12 to 31.17, 32.15 to 32.19, 33.10 to 33.14, 35.2 (extended), 36.13, Requirement 37, and Requirement 38.

#### Design edits (step 2: `design.md` V5 to V6, classification: design changes; no implementation change)
No V5 decision was deleted. Where V6 supersedes a V5 text, the V5 text stays and a "V6 change" note names the replacement.
- Version marker set to "V6 (revised against requirements V6; initial design was V3)" with a V6 change summary and section index.
- Overview: new decisions D12 (three roles, reader/writer/admin helpers), D13 (invitations inside the `boards` package), D14 (card status and `completed_at`), D15 (`decideRoute` and `safeNext`). New V6 manual-migration note.
- Architecture: model ownership row for boards, folder layout comment, module rules 6 and 7, planned splits for `boards/service/`, `boards/routes/`, `boards/schema/`, `cards/service/`, `MemberPanel`, `CardDetailModal`.
- Part A: A1 (log filter redacts invite tokens), A3 (PATCH `/api/users/me` rewritten: name and password with `current_password`, email always 400, no token invalidation), A4 (V5 helper list marked superseded) and new A4-V6 (role levels, `role_allows`, new helper names, endpoint by role matrix), A7 (guests never notified), A8 (analytics query by `status = DONE` and `completed_at`, guests excluded), A10 (guest search, status in results), A11 (legend, rows 5, 8, 12, 22, 24 amended, rows 30 to 33 added, card and invite JSON shapes), new A12-V6 (token entropy, log redaction, timing, open redirect), new A13 (card status and `apply_status_change`), new A14 (invitations: storage, lazy creation, regenerate, `resolve_accept`, accept transaction, race handling, error mapping).
- Part B: B1 (file tree: `proxy.ts`, `next.config.ts`, welcome and invite pages, invite, status, profile components, `lib/status.ts`, `roles.ts`, `nextParam.ts`, `decideRoute.ts`, `inviteRoles.ts`, `.env.test.example`, `e2e/support`, `scripts/`), B2 (profile row changed, `/welcome` and `/invite/[token]` rows), B3 (`StatusBadge`), new B4-V6 (`decideRoute` table, two sequence diagrams, `safeNext`), new B6-V6 (role gating, `useDragAndDrop({ enabled })`, new-card state diagram, member panel and invitation links, invite page), new B7-V6 (status control, guest read-only view, badges), B9 V6 responsive note, B10 (`Role`, `CardStatus`, `Card` fields), new V6 types and new B11 (profile page and validators).
- Data Models: Card model (`status`, `completed_at`, `ck_cards_status`), Board token columns and unique constraints, three-role membership check, ER diagram, new "V6 schema changes and migration" table (hand-added check constraints because Alembic does not detect them, optional backfill SQL as design only), Marshmallow schema list.
- Correctness Properties: V6 change notes on Properties 9, 13, 17, 24, 28, 29, and 35. New Properties 44 to 58 (status transitions, status validation, analytics V6, guest matrix, assignee and notifications, invite tokens, accept decision, accept idempotence, safe `next`, `decideRoute`, profile PATCH, guest UI, status labels, log redaction, E2E credential scan).
- Error Handling: 14 V6 rows. Testing Strategy: new "V6 additions" (backend, frontend, Playwright with `web/.env.test`, dotenv order, `credentials.ts`, `.gitignore` rule, new scenarios).
- Part D: D1 (credentials file, no new environment variable, no production V6 migration, invite page headers) and D3 (README V6 items). Traceability Matrix rows 37 and 38 and a V6 amendments table for Requirements 2, 3, 7 to 14, 17, 19 to 23, 25 to 28, 31 to 33, 35.
- Open issues: items 3 and 9 marked resolved, new items 21 to 32.

#### Before / After (design)
- Roles: before "`require_board_member` and `*_for_member` helpers"; after "`require_board_reader`, `require_board_writer`, `require_board_admin` and `*_for_reader` / `*_for_writer` helpers, `assert_assignee_is_writer`".
- Analytics completed: before "Card in Column named `Done` with `updated_at` in the week"; after "`status = DONE` and `completed_at` in the week, no join with columns".
- Route guard: before `guardDecision(pathname, accessExp, refreshExp, now)` with five rows; after `decideRoute({ pathname, auth, welcomeSeen })` with the table in B4-V6.
- PATCH `/api/users/me`: before name and email, password rejected; after name and password with `current_password`, email rejected with 400.
- Files: before `web/middleware.ts` in the tree; after `web/proxy.ts`, the name used in the repository.

### Reason
- Product improvements listed in `improvements.md`: fixed email with password change, card status with direct update, new-card detail prompt, member and guest invitation links, E2E tests without hardcoded credentials, and a welcome page.
- Assumptions made while writing the criteria, which the user can override: GET `/api/invites/<token>` returns `current_role` as well; the status is not accepted on card creation (400); guests are excluded from member activity in analytics; regenerate returns the new token; the Welcome_Cookie is also set by the middleware when `/login` or `/register` is requested; `/invite/<token>` is guarded by the middleware; a guest can use card search on boards where they hold a membership; the `next` parameter accepts only `/invite/<1 to 128 URL-safe characters>`.

### Impact
- **Requirements amended (existing numbering kept):** Project Brief, Folder Structure, Glossary; 2 (12), 3, 4 (3), 7 (2 to 5), 8 (10), 11 (2, 4, 11, 13), 12 (8), 14 (2, 3), 17 (8, 9), 19 (3, 8), 20 (1), 25 (2), 26 (1 to 6), 33 (3, 4), 35 (1, 2).
- **Requirements with criteria appended:** 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 17, 19, 21, 22, 23, 25, 26, 27, 28, 31, 32, 33, 36.
- **Requirements added:** 37 (Board Invitation Links and Guest Role) and 38 (Welcome Page), in the new "Part F: V6 Improvements".
- **Design (updated in step 2):** `design.md` is now V6, see "Design edits" above. **Tasks:** `tasks.md` (V5) is not changed yet and will be updated in the next step. Areas that needed design work, now covered by the design: permissions helpers with the guest role, the Card model and card service (status and `completed_at`), the analytics query, the users PATCH schema, an invitations module (it should live in the boards Blueprint_Package, because no ninth package is allowed by Requirement 1.2), the middleware and `decideRoute`, the `/welcome` and `/invite/[token]` routes, the member panel, the CardDetailModal, `useDragAndDrop` for guests, the Profile page, and the E2E configuration.
- **Manual Migration_Step (Requirement 3):** no new table is added, so the 7-table rule in Requirement 1.9 and Requirement 3.5 holds. New columns on `boards` (`member_invite_token`, `guest_invite_token`) and on `cards` (`status`, `completed_at`), plus a check constraint for the role value `guest` on `board_memberships`, change the models after the earlier migration was applied. The user runs `flask db migrate` and `flask db upgrade` from `app/` for the development database and the test database. Production is not deployed yet, so no production migration is needed. The optional SQL backfill of Requirement 3.10 is a manual step and not an automated task.
- **Implementation tasks affected later (not changed now):** backend models, schemas, services, and routes for users, cards, analytics, boards, and permissions; frontend profile, card detail, board page, member panel, invite page, welcome page, middleware, and apiClient helpers; pytest and React Testing Library tests; Playwright config and tests; `.gitignore` and `web/.env.test.example`; README. Completed tasks 1 to 22.2 are not reverted, and the code they produced will be revised by V6 tasks.
- **Breaking changes:** PATCH `/api/users/me` contract (email rejected, password accepted with `current_password`); analytics "completed this week" definition; a new role value `guest`; `/` for a first-time unauthenticated visitor now redirects to `/welcome` and not to `/login`.
- **Design impact (V6, step 2):** design sections changed or added are listed under "Design edits". The tasks step must cover: the V6 migration task with hand-added check constraints, `permissions.py` role helpers, `apply_status_change`, the users PATCH rewrite, the invitation endpoints and `resolve_accept`, the analytics rewrite, the log redaction filter, `decideRoute` (replacing `guardDecision`) in `proxy.ts`, `safeNext`, the welcome and invite pages, the board role gating and `useDragAndDrop({ enabled })`, the new-card flow, the status control and badges, the profile form, `next.config.ts` headers, the Playwright credential loading and scenarios, `.gitignore` and `web/.env.test.example`, and the new tests for Properties 44 to 58. New open issues 21 to 32 in `design.md` need the user's attention before implementation (notably 22, 24, and 25).

#### Task edits (step 3: `tasks.md` V5 to V6, classification: specification and task planning changes; no implementation change)
Tasks 1 to 22.2 are completed history and were not edited (same numbering, text, and checked boxes). Task 22 stays unchecked. No new task is marked done.
- **Header and Overview.** Version line is now "V6 (V1 to V5 tasks 1 to 22.2 preserved as history; V6 tasks added as 25 onward)". A V6 paragraph explains the order (backend first, then frontend) and that completed tasks are history.
- **New phases added (titles only).**
  - 25 Backend models, schema, and permissions: 25.1 Card columns and status rule, 25.2 Board tokens and three-role check, 25.3 role helpers, 25.4 call-site migration, 25.5 invitation helpers and log redaction, 25.6 model metadata tests, 25.7 to 25.10 property tests (44, 50, 47 pure part, 57).
  - 26 Manual migration: 26.1 [MANUAL] V6 `flask db migrate` and `flask db upgrade` on the development and test databases (hand-added check constraints), 26.2 [MANUAL] optional backfill.
  - 27 Backend features and tests: 27.1 to 27.15 (users PATCH, card status, analytics, board tokens, invitation endpoints, guest matrix, schema tests, envelope tests, soft-delete and log tests, performance tests, with properties 1 to 3, 6 to 9, 12 to 14, 17, 18, 25, 43 to 51, 54, 57).
  - 28 Backend V6 checkpoint.
  - 29 Frontend libraries and shared pieces: 29.1 to 29.11 (types, status, roles, `safeNext`, `decideRoute`, proxy, headers, `StatusBadge`, `useDragAndDrop({ enabled })`, with properties 29, 31, 35, 50, 52, 53, 55, 56).
  - 30 Frontend pages and components: 30.1 to 30.11 (role gating, CardDetailModal, new-card flow, member panel with invite links, invite page, welcome page, `next` handling, badges, profile, responsive pass, repository-rule tests).
  - 31 Playwright and `.env.test`: 31.1 to 31.9 (config and helpers, updated specs, welcome, status, invite, profile, credentials scan, property 58).
  - 32 V6 frontend checkpoint.
  - 33 Final repository rules and verification: 33.1 `.gitignore`, 33.2 ignore and `.env.example` checks, 33.3 [MANUAL] browser verification, 33.4 [MANUAL] `web/.env.test` and local E2E account, 33.5 [MANUAL] production E2E account.
- **Pending tasks that got new `Depends on` lines or V6 notes.** 22.3 depends on 32, 33.1, 33.2, 33.3 (nothing is deployed before V6 is complete). 22.4 depends on 26.1 (production schema includes V6). 22.6 and 22.7 got V6 notes only. 22.9 depends on 31.9, 33.4, 33.5 (needs `web/.env.test`). 23.1 depends on 32. 23.3 depends on 26.1 and 31.9 (README features, `.env.test`, V6 migration step). 23.4 depends on 33.3 (welcome page, invite links panel, status control screenshots). 23.7 depends on 33.1, 33.2, 31.9 (`.env.test` ignore rule, no literal credentials in `web/e2e/`). 23.8 and 24 got V6 notes, and 24 depends on 32.
- **New manual tasks.** 26.1, 26.2, 33.3, 33.4, 33.5.
- **Superseded behaviour.** Each V6 task that changes work from a completed task names it ("Supersedes the V5 behaviour of task X.Y; X.Y stays as history"): 3.1, 3.2, 3.3, 3.5, 6.1, 6.2, 8.1 to 8.4, 11.1 to 11.5, 12.1, 13.1, 13.2, 14.1 to 14.5, 17.2 to 17.5, 17.8, 17.14, 18.1 to 18.12, 19.1, 21.1 to 21.5, and the ignore and `.env.example` parts of 1.1, 2.1, 17.1.
- **Dependency graph.** Waves 0 to 36 are unchanged. Waves 37 to 58 hold the V6 tasks, and the pending V5 tasks moved to waves 59 to 71 (task 24 added as the last wave). Valid JSON, 72 waves, every incomplete task without sub-tasks appears once.
- **Notes.** Manual task list extended, V6 history rule, property 44 to 58 coverage map, V6 requirement coverage (R37, R38, amended requirements), and a map of superseded tests.

### Impact (tasks, added in step 3)
- **Tasks:** `tasks.md` is now V6. New tasks 25 to 33 cover every V6 requirement amendment and requirements 37 and 38, and the Correctness Properties 44 to 58 each have a test task. Pending V5 tasks 22.3 to 22.9, 23.1 to 23.8, and 24 keep their text and are re-ordered behind the V6 checkpoint through `Depends on` lines and later waves.
- **Order:** the V6 migration (26.1) blocks every V6 task that uses the new columns. The production schema (22.4) includes V6, so no production-only V6 migration exists.
- **Open points for the user:** hand-adding the two check constraints in the migration (26.1), deciding on the optional backfill (26.2), creating the E2E accounts and `web/.env.test` (33.4, 33.5), and the design open issues 22, 24, and 25.

#### Implementation change (after tasks 25 to 28): Postman collection "Kano" synced with pp/openapi.yaml 2.0.0
- Classification: implementation change (test tooling). No specification or design change, so the version stays V6.
- Postman collection "Kano" (My Workspace) updated: description now v2.0.0 with roles; new folder Invitations (7 requests: get invite links, regenerate member and guest token, invite info and accept for each token); new requests Change password, Update current user (email rejected), Create card (status rejected), Update card status (IN_PROGRESS, DONE, invalid).
- Existing requests: descriptions updated for the guest role, status and completed_at, and the new analytics definition; Create card test now checks NOT_STARTED and completed_at null.
- New collection variables: 
ew_password, member_invite_token, guest_invite_token.
- Not run against a live server yet.

## V7 - 2026-11-21
### Changes
- **Task change (33.1).** The sub-step "add a test or script that runs `git check-ignore`" is removed at the user's request. The `git check-ignore` results were checked once by hand: `web/.env.test` is ignored, and `web/.env.test.example`, `web/.env.example`, and `app/.env.example` are not. The automated check stays in pending task 23.7 (repository hygiene script).
- **Design change (Testing Strategy V6 additions, Files).** A V7 note says the check is not automated in 33.1 and that task 23.7 covers it later. No V6 text was removed.
- **Implementation change (33.1).** Root `.gitignore` adds `.env.test` and `!.env.test.example` after the `.env*` rule. `web/.gitignore` adds `!.env.test.example`, because its own `.env*` rule was ignoring `web/.env.test.example`.
- **Implementation change (33.2).** New `web/__tests__/env-files.test.ts`. It checks that `.vercelignore` still excludes `web/`, `app/venv/`, and `.kiro/`. It also checks that `app/.env.example` and `web/.env.example` list every variable their code reads, and that `web/.env.test.example` lists exactly `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` with placeholder values. `VERCEL` is set by the platform and is excluded from the check.
- Requirements: no change. The version marker is V7 only to keep the documents consistent.
### Reason
- The user asked to run tasks 33.1 and 33.2 without the `git check-ignore` test or script.
### Impact
- Requirements 35.1, 35.2, 35.7, 1.14, 15.5: behaviour unchanged.
- Design: Testing Strategy V6 additions (Files), with a V7 note.
- Tasks: 33.1 and 33.2 done. Task 23.7 still includes the `git check-ignore` check. Tasks 33.3 to 33.5 are not affected.

## V8 - 2026-11-23
Source: `improvements/improvements2.md` (frontend only, no backend change). Only `requirements.md` is changed in this step (now V8). `design.md` and `tasks.md` stay at V7 and will be updated to V8 in the following steps. The HTML example files in `improvements/` were used only as visual and content direction and are not referenced by any specification or documentation file.

### Changes
Classification: all items below are **specification changes, frontend only**. No design change, implementation change, bug fix, or breaking change is made in this step. No API, model, migration, or backend test changes.

1. **Header logo link (new Requirement 18 criteria 14 and 15, new Requirement 17 criterion 14).** The Kano logo and wordmark in the Header is one link. An unauthenticated visitor goes to `/welcome` regardless of the Welcome_Cookie, an authenticated User goes to `/` (Dashboard), and the link never targets `/login`. "Authenticated" for the Header means the AuthContext holds a User or an access or refresh cookie is present, and the target is recomputed when that state changes. `decideRoute` and the middleware are unchanged.
2. **Welcome page content and layout (Requirement 38 criteria 1, 2, 10 amended; criteria 15 to 21 appended; Requirement 27 criterion 10 appended).** The page now has a Header with Log in and Register, a hero (eyebrow, headline, subheadline, "Get started"), a decorative board preview, a features section with four cards, a bottom call to action ("Create account" and "Log in"), and the Footer. Exact texts and targets are fixed in criterion 16. The visual rules follow `guidelines/design-system.md` (Inter 400/500/600, tokens only, flat, 1 px line borders, one primary button per region).
3. **Claims removed.** The visual examples contained statements that are not true for Kano. Criterion 19 forbids them with a string list: usage numbers, uptime, latency, ratings, testimonial and customer name, "free", "credit card", "60 seconds", "real-time", websockets, "fuzzy" search, "threaded" discussions, checklists and subtasks, and ticket ids such as "KAN-". Replacements are true statements (drag and drop by mouse and touch, labels, due dates, card status, comments, notifications, My Tasks, card search, member and guest invitation links, board analytics) in criteria 16 and 17. The board preview (criterion 18) is allowed as a decorative illustration with sample data, with `aria-hidden="true"`, no focusable elements, and no text that claims real usage.
4. **Board toolbar separator (Requirement 21 criteria 24 to 28 appended; Requirement 27 criterion 10).** One horizontal separator, 1 px in the `line` color, between the board toolbar (title, role badge, search, action controls) and the Kanban columns area, for admin, member, and guest views, from 375 px to 1920 px, with no overlap and no horizontal page overflow, and never a second line.
5. **Tests (Requirement 32 criteria 20 to 22 appended; Requirement 33 criteria 13 amended, 15 and 16 appended).** Unit tests for the logo target, the welcome page sections and forbidden strings, and the board separator. E2E tests for the logo from `/login` and `/register` (anonymous) and from a board page (logged in), and for 375 px and 1920 px layout checks.
6. **Documentation (Requirement 36 criterion 14 appended).** The README and the spec documents must not mention, link, or embed the example HTML files and describe the look in words only.

#### Before / After
- R38.1 before: "THE Kano_Web SHALL provide a public page `/welcome` rendered as a Server Component that sends no request to the Kano_API and shows what Kano is (1 to 5 sentences) and what a User can do with it, listing at least these items: boards, columns, drag and drop of cards, comments, notifications, My Tasks, invitation of members and guests by link or email, and board analytics."
- R38.1 after: "... presents Kano and what a User can do with it in the sections, order, texts, and visual rules defined in criteria 15 to 21 ..." The former capability list is now carried by criteria 16 and 17 (the page text names boards, columns, drag and drop by mouse and touch, labels, due dates, card status, comments, notifications, My Tasks, card search, member and guest invitation links with read-only guest access, and board analytics). "Invitation by email" is no longer a required page item because it is not shown as a feature card; no behavior changes.
- R38.2 before: "THE Welcome_Page SHALL render exactly one Header and one Footer (Requirement 18 criterion 13) and SHALL provide a "Log in" BaseButton that navigates to `/login` and a "Create account" BaseButton that navigates to `/register`."
- R38.2 after: "... exactly one Header and one Footer ... and SHALL provide the five navigation actions of criterion 16: "Log in" and "Register" in the Header, "Get started" in the hero section, and "Create account" and "Log in" in the bottom call-to-action section, each rendered through BaseButton ..."
- R38.10 before: "... or selects the "Log in" or "Create account" BaseButton on the Welcome_Page, THE Kano_Web SHALL set the Welcome_Cookie, ..."
- R38.10 after: "... or selects any of the five navigation actions of criterion 16 on the Welcome_Page (the Header "Log in" or "Register", "Get started", or the bottom "Create account" or "Log in"), THE Kano_Web SHALL set the Welcome_Cookie, ..." The logo link does not set the cookie (R18.14).
- R33.13 before: "... that the page shows the "Log in" and "Create account" buttons, that the "Log in" button leads to `/login` and sets the `kano_welcome_seen` cookie, that the "Create account" button leads to `/register`, and that a second visit to `/` then redirects to `/login`."
- R33.13 after: "... that the page shows the Header "Log in" and "Register" links, the hero "Get started" button, and the bottom "Create account" and "Log in" buttons (each located within its own section), that the Header "Log in" link leads to `/login` and sets the `kano_welcome_seen` cookie, that the bottom "Create account" button leads to `/register`, and that a second visit to `/` then redirects to `/login`." (Labels are scoped per section because "Log in" now appears twice.)
- R18.13 before and after: unchanged ("exactly one Header and one Footer"). New R18.14 and R18.15 add the logo link (no Before text).
- R17.8, R17.9, R38.5 to R38.9, R38.11 to R38.13: unchanged. New R17.14 states that the logo link does not change `decideRoute`.
- Requirement 27 criterion 9 before and after: unchanged (Join, Log in, and Create account tap targets). New criterion 10 adds the other Welcome_Page controls and the board toolbar.
- New criteria without Before text: R17.14, R18.14, R18.15, R21.24 to R21.28, R27.10, R32.20 to R32.22, R33.15, R33.16, R36.14, R38.15 to R38.21.
- Version marker before: "V7 (no requirement change from V6)". After: "V8 (frontend-only changes to the Header logo, the Welcome_Page, and the board toolbar; V7 had no requirement change from V6)".

#### Consistency check (requirements only)
- R18.13 versus R38.2 and R38.15: consistent, the Welcome_Page uses the shared Header and Footer once each.
- R17.8 and R17.9 versus the logo link: consistent. An anonymous visitor reaches `/welcome` without a redirect (R38.9), an authenticated User or a visitor with a valid refresh cookie is redirected from `/welcome` to `/` (R17.9, R38.8), and `/` for an anonymous visitor with the Welcome_Cookie still redirects to `/login` (R38.6). No path sends an anonymous logo click to `/login`.
- R33.13 and R33.3 versus the new labels: R33.13 amended; R33.3 needed no change.
- R32.19 (decideRoute properties for R38.5 to R38.11) and R38.14: unchanged and still correct.
- R27.9 versus the new buttons: extended through R27.10 and R38.21. The reference examples used 32 px controls, which conflict with R27.6, so 44 px applies.
- Design system conflict: the reference examples used a 40 px headline, bold weight, and an extra radius, which the design system does not define. R38.20 uses the design-system roles, weights, and radii.
- One primary button per region (design-system rule 3) versus the Header "Register" and the hero "Get started": resolved by treating the Header, the hero, and the bottom section as separate regions (R38.20).

### Reason
- improvements2: the Header logo sent an unauthenticated visitor to the login page instead of the Welcome page, the Welcome page needed the refined desktop and mobile look, and the board page needed a clear line between the toolbar and the board content.

### Impact
- **Requirements:** 17 (criterion 14), 18 (criteria 14, 15), 21 (criteria 24 to 28), 27 (criterion 10), 32 (criteria 20 to 22), 33 (criterion 13 amended; 15, 16), 36 (criterion 14), 38 (criteria 1, 2, 10 amended; 15 to 21). Version marker V8.
- **Design and tasks (to be updated in the next steps):** `design.md` needs the Header logo target logic (B3 and B4-V6), the Welcome page structure and copy, the decorative preview, the toolbar separator in the board page (B6-V6), the testing strategy, and the traceability rows for 17, 18, 21, 27, 32, 33, 36, and 38. `tasks.md` needs new frontend and test tasks, and the pending task 33.3 (manual browser verification) and Playwright tasks need the new scenarios.
- **Implementation:** none in this step. The Welcome page, the Header, and the board page code change in a later step.
- **No backend change:** no API, model, migration, or backend test is affected.
- **Open points for the user:** the exact copy in Requirement 38 criteria 16 and 17 is a proposal and can be reworded; the forbidden string list in criterion 19 includes the whole word "free", so any price statement is excluded.

#### Design edits (step 2: `design.md` V7 to V8, classification: design changes, frontend only; no implementation change)
No V1 to V7 text was deleted. Where V8 supersedes earlier text, the old text stays and a "V8 change" note names the replacement.
- Version marker set to V8 with a V8 change summary and section index.
- New decisions D16 (`logoTarget` and `isVisitorAuthenticated`, `decideRoute` and `proxy.ts` unchanged) and D17 (Welcome_Page component split, one copy module `lib/welcomeContent.ts`, `findForbiddenClaims`, one separator element in the board page).
- New sections B12 (Header logo link), B13 (Welcome_Page files, copy, decorative preview, design-system and Tailwind approach, layout by width), B14 (`BoardToolbar` extraction and the single `hr` separator in `BoardView`). V8 notes added to B2 (`/welcome` row), B3 (Header), and B4-V6.
- New Correctness Properties 59 (logo target) and 60 (forbidden-claims scan).
- Testing Strategy: V8 additions (Requirements 32.20 to 32.22, 33.13, 33.15, 33.16). Traceability: V8 amendments table. New open issues 33 to 38.
- Inconsistencies found between requirements V8 and the design: R38.2 versus R38.16 (BaseButton or link for the Header actions), R21.24 (add-column control in the toolbar versus its real place in the Kanban row), R38.20 versus design-system 4.6 (shadow on a dragged card), R38.19 (substring versus whole-word matching), R38.18 versus R38.21 (no focusable element versus a scrolling preview). Recommendations are in design open issues 34 to 38. No requirement text was changed in this step.

#### Refinements after consistency check (V8, no version bump)
Classification: specification refinements, frontend only. Only `requirements.md` and this file changed. No numbering changed. `design.md` and `tasks.md` still need the same refinements (see "Remaining").

1. **R38.2 (links versus buttons).**
   - Before: "... the five navigation actions of criterion 16: "Log in" and "Register" in the Header, "Get started" in the hero section, and "Create account" and "Log in" in the bottom call-to-action section, each rendered through BaseButton ..."
   - After: Header "Log in" and "Register" are rendered as links (anchor elements); "Get started", bottom "Create account", and bottom "Log in" are rendered through BaseButton; all five navigate as in criterion 16.
   - R38.16, R33.13, and R27.10 already say "link" for the Header and "button" elsewhere and were left unchanged. R32.21 now asserts that the Header items are anchors and not BaseButton, and that the others are BaseButton.
2. **R21.24 (add-column control).**
   - Before: "... the action controls available to the current role (member management, analytics link, and the add-column control where present) in one board toolbar ..."
   - After: "... (member management and the analytics link) in one board toolbar ... THE add-column control SHALL NOT be part of the board toolbar and SHALL stay at the end of the row of Columns inside the Kanban columns area."
   - R21.25 to R21.28, R21.20, R27.10, R32.22, and R33.16 were checked and need no change.
3. **R38.20 (shadow).**
   - Before: "flat surfaces with 1 px `line` borders and no gradient, drop shadow, blur, or glass effect"
   - After: "... no gradient, blur, or glass effect, and no drop shadow except the design-system overlay shadow (`shadow-overlay`), which only the one dragged Card of the board preview (criterion 18) MAY carry". R32.21 gained "only the dragged preview Card carries a shadow".
4. **R38.19 (matching rule).**
   - Before: the list ended with "... because none of these statements is true for Kano."
   - After: adds that matching is case-insensitive substring matching for every listed string except "free" (whole word), that unrelated words containing a forbidden string (for example "operating", "integrating", "generating" contain "rating") are also violations, and that the copy must avoid them. The copy of criteria 16 and 17 was checked by hand and contains no such word.
5. **R38.18 and R38.21 (preview scroller).**
   - Before: "`aria-hidden="true"` on its container, SHALL contain no link, button, or other focusable element" (R38.18) and "inside a container that scrolls horizontally" (R38.21).
   - After: `aria-hidden="true"` is on the container of the preview content, which has no focusable element; the horizontal scroller lies outside that container and has `tabindex="-1"` so it is not a tab stop. R38.21 refers to "the horizontal scroller of criterion 18". R32.21 asserts the same.
6. **R18.15, R17.14, R32.20 (one authentication check).**
   - Before (R18.15): "THE Header SHALL treat the visitor as authenticated WHILE the AuthContext holds a User or the access cookie or the refresh cookie is present, and as unauthenticated otherwise, and SHALL recompute the link target ..."
   - After (R18.15): one shared check, used by the logo target and by every authentication-dependent part of the Header navigation, returns authenticated only WHILE the AuthContext status is `authenticated` (a User is held), and unauthenticated in every other status (session restoration in progress, failed restoration, logout). It does not read cookies. The target and navigation are recomputed on every status change, including to `/` when restoration succeeds.
   - R17.14 after: adds that the logo takes its state only from this check and not from `decideRoute` inputs, so a visitor with a valid refresh cookie may see `/welcome` during restoration and the middleware then redirects to `/` (R17.9).
   - R32.20 before: "a visitor with only a refresh cookie gets the target `/`". After: that visitor gets `/welcome` while the status is not `authenticated` and `/` once restoration succeeds; logo and navigation always match.

##### Reason
- The user decided the five points of the consistency check (R38.2 versus R38.16, R21.24, the preview shadow, the forbidden-string matching, the preview scroller) and asked for a single authentication rule for the logo and the navigation.

##### Impact
- Requirements: 17 (14), 18 (15), 21 (24), 32 (20, 21), 38 (2, 18, 19, 20, 21).
- Design (not yet updated): B12 (Header logo, `isVisitorAuthenticated` must use AuthContext status only and no cookies), B13 (Welcome preview scroller, shadow), B14 (add-column outside `BoardToolbar`), Property 59 (refresh-cookie case), design open issues 34 to 38 (resolved by these decisions).
- Tasks (not yet updated): Header logo tasks and tests, Welcome page tasks (scroller, shadow, anchors for Header actions), board toolbar tasks, the forbidden-claims scanner (case-insensitive substring, "free" whole word).

#### Design refinements (V8, no version bump)
Classification: design changes, frontend only. Only `design.md` and this file changed. No backend, guidelines, or requirements change. `design.md` follows the refined requirements above; superseded text was kept and marked.
- **B12, D16, Property 59.** `isVisitorAuthenticated(status)` now uses only the AuthContext `status` (true only for `authenticated`), with no cookie, token, or user input. The logo target and all authentication-dependent Header navigation (My Tasks, bell, user menu, Log in, Register) share this one value. Restore-time behavior is documented: the logo is `/welcome` while `status` is `loading`, and `proxy.ts` redirects `/welcome` to `/` when a valid cookie exists. A 5xx or network restore failure keeps the cookies and sets `status` to `anonymous` (never stuck at `loading`). The first V8 form (User or any token present) is kept as a "Superseded" note.
- **B3, B13.** Header "Log in" and "Register" are anchor links; "Get started", "Create account", and the bottom "Log in" are `BaseButton`.
- **B13.** The preview scroller lies outside the `aria-hidden` container and has `tabindex="-1"`; the preview content has no focusable element. Only the dragged preview card carries `shadow-overlay`; everything else is flat. The first V8 text "no shadow" is marked superseded.
- **B14.** The add-column control stays at the end of the Kanban row, outside `BoardToolbar`.
- **B13, Property 60.** `findForbiddenClaims` uses case-insensitive substring matching, with "free" as a whole word. False-positive words such as "operating", "integrating", and "generating" (contain "rating") are documented and covered by a test.
- **Testing Strategy (R32.20 to R32.22), Traceability.** Test rows updated for the status-only logo cases (including the refresh-cookie-only case), anchors versus `BaseButton`, scroller `tabindex`, single `shadow-overlay`, and add-column placement. Traceability rows 17, 18, 21, 32, and 38 updated.
- **Open issues 33 to 38.** Text kept, each marked "Resolved in V8 refinement".

## V9 - 2026-11-24
Source: `improvements/improvements3.md` and the reference image `improvements/footer-improved.png` (frontend only, no backend change). Only `requirements.md` is changed in this step (now V9). `design.md` and `tasks.md` stay at V8 and will be updated to V9 in the following steps.

### Changes
Classification: **specification change, frontend only**. No design change, implementation change, bug fix, or breaking change is made in this step. No API, model, migration, or backend test is affected.

1. **Footer content (new Requirement 18 criteria 16 to 21).** The shared Footer becomes a single row inside a `max-w-7xl` container. Left: the brand mark (small rounded square in the primary color with a white "K"), the wordmark "Kano" in ink with weight 500 or 600, a separator dot, and the muted text "Portfolio project built in 2026 by JC" with "JC" in the stronger ink color ("2026" and "JC" are fixed text). Right: two icon links, GitHub (`https://github.com`) and LinkedIn (`https://www.linkedin.com`), both placeholders, opened in a new tab with `target="_blank"` and `rel="noopener noreferrer"`. Accessible names "Kano on GitHub" and "Kano on LinkedIn", decorative `aria-hidden` icons, hover effect (icon from `ink-muted` to `ink`, `sunken` background, 150 ms transition), `focus-visible` ring, design-system tokens only. No request, cookie, or environment variable.
2. **Responsive (Requirement 27 criteria 11 and 12 appended).** No horizontal overflow from 375 px to 1920 px, wrapping onto two lines without overlap, and a tap target of at least 44 px by 44 px for each footer link below 768 px.
3. **Tests (Requirement 32 criterion 23 and Requirement 33 criterion 17 appended).** React Testing Library tests for the Footer and a Playwright footer scenario at 375 px and 1920 px (no click-through to external sites).
4. **Version marker** set to V9. Glossary unchanged (no new term). Requirement 36 unchanged (the README needs no new mention).

#### Before / After
- Version marker before: "V8 (frontend-only changes to the Header logo, the Welcome_Page, and the board toolbar; V7 had no requirement change from V6)". After: "V9 (frontend-only change to the shared Footer: brand, portfolio text, and GitHub and LinkedIn links; V8 changed the Header logo, the Welcome_Page, and the board toolbar; no backend change)".
- Footer before (implementation, `web/components/Footer.tsx`): one centered line of `text-xs` muted text "Kano Task Management" with a top border, and no requirement text beyond R18.13 ("exactly one Header and one Footer").
- Footer after (R18.16 to R18.21): single row, brand group left, two external icon links right, as described under Changes.
- R18.13, R18.14, R18.15: unchanged. R27.1 to R27.10, R32.1 to R32.22, R33.1 to R33.16: unchanged. New criteria without Before text: R18.16 to R18.21, R27.11, R27.12, R32.23, R33.17.

#### Consistency check (requirements only)
- R18.13 (one Footer per page) and R38.15 part (f) (the Welcome_Page ends with the Footer): consistent, the Welcome_Page keeps the shared Footer.
- R38.19 (forbidden strings) applies to the Welcome_Page, which includes the shared Footer. The footer text "Portfolio project built in 2026 by JC" and the labels "Kano on GitHub" and "Kano on LinkedIn" contain none of the listed strings (checked by hand: no "rating", "free", "kan-", "uptime", "real time", and so on). R32.23 also asserts this in a test.
- R38.20 (design system): the footer uses Inter 400/500/600, tokens, flat surfaces, and no shadow, so it does not break the rule that only the dragged preview Card carries `shadow-overlay`. The footer hover uses a background color and no shadow.
- R38.2 and R33.13 name five navigation actions of the Welcome_Page. The two footer links are external and are not among those actions. The Welcome_Page now holds two extra links, which does not change R38.2, R38.10 (the footer links do not set the Welcome_Cookie), or R33.13 (its locators are scoped per section).
- R18.14 gives the Header brand the accessible name "Kano". The footer wordmark is plain text and not a link, so there is one link named "Kano" per page. Tests that locate the logo by role link and name "Kano" must use an exact match, because "Kano on GitHub" and "Kano on LinkedIn" contain that string. This is a test-writing note and not a contradiction.
- R27.2 (no overlapping interactive elements) and R27.6 (44 px tap targets): extended to the footer links by R27.11 and R27.12.
- R36.14 (no mention of the HTML example files): not affected. The PNG is cited only as a source in this changelog entry, and `requirements.md` and `design.md` do not name it.
- No contradiction found.

### Reason
- improvements3: the project is a portfolio project, so the Footer shows the author line and links to GitHub and LinkedIn. The URLs are placeholders for now.

### Impact
- **Requirements:** 18 (criteria 16 to 21 appended), 27 (criteria 11 and 12 appended), 32 (criterion 23 appended), 33 (criterion 17 appended), version marker V9.
- **Design (to be updated in the next step):** B3 (Footer component structure and classes), the brand mark, and the icon components. **Open point for the design step:** the installed `lucide-react` version may not include brand icons (GitHub, LinkedIn), because newer versions deprecate or remove them. The design step must check the installed version and, if the icons are absent, use inline SVG components (one component per file, `aria-hidden`), which is a design decision and not a requirement. Also decide whether the brand mark reuses the Header mark component. Testing Strategy (R32.23, R33.17) and the Traceability rows for 18, 27, 32, and 33 need V9 notes.
- **Tasks (to be updated):** Footer implementation task, icon components, unit tests, Playwright footer scenario, and a mention in the pending manual browser verification task 33.3.
- **Implementation:** none in this step. `web/components/Footer.tsx` changes in a later step.
- **No backend change.**

#### Design edits (step 2: `design.md` V8 to V9, classification: design changes, frontend only; no implementation change)
No V1 to V8 design text was deleted. Where V9 supersedes older text (the plain one-line footer), the old text stays and a "V9 change" note names the replacement.
- Version marker set to V9 with a V9 change summary and section index.
- New decision D18 (Footer stays a Server Component, text in `lib/footerContent.ts`, classes as static strings in `components/`, inline SVG brand icons, shared `KanoMark`, brand group never a link).
- New section B15 (Footer): files, markup, token-only classes, layout by width, contrast, security (`target="_blank"` with `rel="noopener noreferrer"`, no tracking, no cookie), interaction with the Header logo test and with the forbidden-claims rule.
- Icon check recorded: installed `lucide-react` is 1.75.0 and has no GitHub or LinkedIn icon, so `components/shared/icons/GithubIcon.tsx` and `LinkedinIcon.tsx` (inline SVG, `aria-hidden`) are designed. No dependency is added.
- V9 notes added to B1 (file tree) and B3 (Header mark replaced by `KanoMark`, Footer redesigned).
- Testing Strategy: V9 additions (RTL tests for R32.23, Playwright footer scenario for R33.17, exact link names). No new Correctness Property (example-based; a future one would be Property 61).
- Traceability: V9 amendments table (Requirements 18, 27, 32, 33, 38.19). Open issues 39 to 44.

##### Before / After (design)
- Footer before: one centered `text-xs` line "Kano Task Management" with `border-t border-line`, no links. After: single row with brand mark, wordmark, separator dot, portfolio text, and two external icon links (B15).
- Header brand mark before: inline "K" `span`. After: shared `KanoMark` with the same classes (look unchanged).

##### Consistency check (requirements V9 versus design V9)
- No requirement is without design coverage: 18.16 to 18.21, 27.11, 27.12, 32.23, and 33.17 map to B15 and the V9 testing section.
- Wording gaps found, not changed in `requirements.md` (see Open issues 40, 42, 44): R18.20 and R32.23 say "focus ring" while the design system defines an outline; R18.16 says "single row" while R27.11 requires wrapping (reconciled with `flex-wrap`); Playwright locators by name "Kano" match the footer links as a substring unless scoped or exact.
- `tasks.md` is still at V8 and needs V9 tasks (Footer, `KanoMark`, icons, `footerContent.ts`, RTL test, Playwright footer spec, README check, and a line in the manual browser verification task 33.3).

#### Refinements after consistency check (V9, no version bump)
Classification: specification refinements, frontend only. Only `requirements.md` and this file changed. No numbering changed. `design.md` was not edited (see "Remaining").

1. **R18.20 and R32.23 (focus indicator).**
   - Before (R18.20): "... WHEN a Footer link receives keyboard focus through `:focus-visible`, THE Footer SHALL show the design-system focus ring on that link."
   - After (R18.20): "... THE Footer SHALL show the visible focus-visible outline as defined in the design system (2 px outline) on that link." The hover wording is unchanged.
   - Before (R32.23): "... and the `focus-visible` ring class; ..."
   - After (R32.23): "... and the `focus-visible` outline classes of the design system (2 px outline); ..."
2. **R18.16 and R27.11 (one row versus wrapping).**
   - Before (R18.16): "THE Footer SHALL render its content in a single row inside a container of the width of `max-w-7xl`, with the brand group (criterion 17) on the left and the link group (criterion 18) on the right, because ..."
   - After (R18.16): "... inside a container of the width of `max-w-7xl`, in one row from 768 px upward with the brand group (criterion 17) on the left and the two icon links of the link group (criterion 18) on the right, and below 768 px the content may wrap onto two lines (Requirement 27 criterion 11), because ..."
   - Before (R27.11): "... and WHEN the brand group and the link group do not fit in one line, THE Footer SHALL wrap them onto two lines without overlap and without adding horizontal scrolling to the page."
   - After (R27.11): "... and WHILE the viewport width is 768 px or more, THE Footer SHALL show the brand group and the link group in one row, and WHILE the viewport width is below 768 px, THE Footer MAY wrap them onto two lines without overlap and without adding horizontal scrolling to the page (Requirement 18 criterion 16)."
3. **R32.23 and R33.17 (substring name matching).**
   - Before (R32.23): the criterion ended with "... each page renders exactly one Footer (Requirement 18 criterion 13), including the Welcome_Page."
   - After (R32.23): adds "The tests SHALL locate the two links inside the Footer (the `contentinfo` role) or with exact name matching, because name matching is substring-based and "Kano on GitHub" and "Kano on LinkedIn" contain "Kano", the accessible name of the Header logo link."
   - Before (R33.17): ended with "THE E2E_Suite SHALL NOT click through to the external sites."
   - After (R33.17): adds "THE E2E_Suite SHALL scope the locators of the two links to the footer (the `contentinfo` role) or use exact name matching, ..., and the logo scenarios of criterion 15 SHALL scope the logo locator to the `banner` role or use exact name matching." R33.15 and R32.20 were not edited, as requested.
4. **R18.19 and R27.12 (tap target).**
   - Before (R18.19): ended with "... so that each icon is decorative and each link is announced once." (no size rule).
   - After (R18.19): adds "THE Footer SHALL give each of the two links a tap target of at least 44 px by 44 px at every viewport width, and 44 px is the tap-target exception to the 4 px spacing scale step, as for the `lg` button."
   - Before (R27.12): "WHILE the viewport width is below 768 px, THE Kano_Web SHALL render the GitHub link and the LinkedIn link each with a tap target of at least 44 px by 44 px, as required by criterion 6."
   - After (R27.12): "WHILE the viewport width is below 768 px, THE Footer SHALL render the GitHub link and the LinkedIn link each with a tap target of at least 44 px by 44 px, as required by criterion 6 and by Requirement 18 criterion 19, which applies the same 44 px at every width as the tap-target exception to the 4 px spacing scale step."

##### Reason
- The user approved four wording fixes from the V9 consistency check (focus indicator, one row versus wrap, substring locators, tap-target size).

##### Impact
- Requirements: 18 (16, 19, 20), 27 (11, 12), 32 (23), 33 (17).
- Design (not edited here), checked against `design.md` V9. Already consistent: B15 uses `size-11` (44 px) at all widths, the outline classes `focus-visible:outline-2 ... outline-primary-500`, `flex-wrap` with `justify-between`, and the Testing Strategy row uses exact link names. Must change:
  - V9 change summary, D18, and B15: replace "single row" with "one row from 768 px upward, may wrap below 768 px".
  - B15 interaction row: replace "focus ring" with the "visible focus-visible outline (2 px)" wording, and mark Open issue 40 resolved. Open issues 42 (one row versus wrap) and 44 (substring locators) are also resolved by this refinement.
  - B15 tap-target row: state that `size-11` (44 px) is the tap-target exception to the 4 px scale step, as for the `lg` button, at every width.
  - B15 layout table, 375 px to 767 px row: "may wrap" instead of a description that implies wrapping is required; the 768 px row stays.
  - Testing Strategy V9 (Playwright footer scenario and RTL Footer test): scope the footer link locators to `getByRole("contentinfo")` or exact names, and scope the logo scenarios (R33.15) to `getByRole("banner")` or `exact: true`. The Header logo RTL test (R32.20) already needs an exact name.
  - Traceability V9 table: rows for 18, 27, 32, and 33 need the new wording.
- Tasks (not yet updated): the Footer tests and the Playwright footer and logo specs need the scoped locators.
- No new inconsistency was found between `requirements.md` V9 and `design.md` V9 beyond the wording items above.

#### Design refinements (V9, no version bump)
Classification: design changes, frontend only. Only `design.md` and this file changed. Superseded text is kept and marked.
- **Layout wording.** V9 change summary, D18, and B15 now say "one row from 768 px upward, may wrap onto two lines below 768 px" (before: "single row"). The B15 layout row for 375 px to 767 px says "may wrap".
- **Focus indicator.** B15 describes the 2 px focus-visible outline of the design system (before: "focus ring"). Open issue 40 resolved.
- **Tap target.** B15 states that 44 px (`size-11`) is the tap-target exception to the 4 px scale at every viewport width (R18.19, R27.12).
- **Tests.** The Footer RTL test and the Playwright footer spec locate links inside the `contentinfo` role or by exact name. The V8 logo scenarios use the `banner` scope with `exact: true`, and the Header logo RTL test notes the banner scope. Open issues 42 (locator part) and 44 resolved.
- **Traceability.** V9 rows for Requirements 18, 27, 32, and 33 use the refined wording.

#### Task edits (tasks.md V8 to V9)
Classification: specification and task planning change, frontend only. Only `tasks.md` and this file are changed in this step. No implementation change yet.
- Tasks 1 to 39 are unchanged and stay as history (same numbering, text, and checkboxes).
- New Footer phase, task 40, with sub-tasks 40.1 to 40.6:
  - 40.1 `lib/footerContent.ts` (footer text, link labels, placeholder URLs).
  - 40.2 shared `KanoMark` component, reused by the Header.
  - 40.3 inline SVG icon components `GithubIcon` and `LinkedinIcon` (`aria-hidden`, no new dependency).
  - 40.4 Footer rewrite (R18.16 to R18.21, R27.11, R27.12).
  - 40.5 React Testing Library tests for the Footer (R32.23), with links located inside the `contentinfo` role or by exact name.
  - 40.6 repository-rule tests (forbidden-claims scan of the Welcome_Page including the Footer, one Footer per page).
- New task 41: Playwright footer spec at 375 px and 1920 px (R33.17) and scoped logo locators (`banner` role or exact name). It supersedes the locator part of task 37.5 (R33.15); 37.5 stays as history.
- New task 42: V9 checkpoint.
- New task 43: manual verification of the Footer in the browser and replacement of the placeholder GitHub and LinkedIn URLs with the real profile URLs.
- Dependency graph: waves 80 to 85 appended for tasks 40 to 43. Earlier waves are unchanged.

### Impact (tasks, added in step 3)
- **Tasks:** `tasks.md` is now V9. Tasks 1 to 39 are unchanged as history. New tasks 40.1 to 40.6, 41, 42, and 43 cover Requirements 18.16 to 18.21, 27.11, 27.12, 32.23, and 33.17. Dependency graph waves 80 to 85 are appended.
- **Classification:** specification and task planning change. No implementation change yet.
- **No backend, migration, or guidelines change.**

#### Implementation change (tasks 23.1, 23.2, 23.3, 23.5, 23.6, 23.7; 2026-11-24, no version bump)
Classification: implementation change (documentation and repository scripts). No requirement, design, or task text changed, and no file in `app/` or `web/` changed.
- **23.1** `docs/violation-report.md` gains a frontend and whole-repository review. One violation was found: G-FE-04 ("every form inside `BaseModal`") against six page and inline forms. It was accepted, because Requirements 19, 21, and 26 ask for those forms, and a guideline rewording is suggested. The checks that found nothing are listed.
- **23.2** `docs/guideline-comparison.md` is filled in. The comments feature was generated in two fresh sub-agent sessions, without and with `guidelines/backend.md` and `guidelines/database.md`. The violation count was 14 before and 1 after. Both samples are saved unchanged in `docs/samples/`.
- **23.3** Root `README.md` written with every Requirement 36 section. Three parts are left as visible TODO placeholders for the owner: the two public URLs (task 22.3 is not done), and the Antigravity and Claude Code subsections (how they were used is not recorded in the repository).
- **23.5** The Screenshots section embeds the three images in `documentations/` (welcome page as the top banner, Dashboard, Board Detail). New `scripts/check_readme_links.py` verifies every relative link and image path. It passes for `README.md` and the new docs.
- **23.6** Verified, nothing added. Dated before/after text exists in V2, V3, V4, V5, V6, V8, and V9, which is more than the 5 refinement entries Requirement 35.6 asks for. No historical entry was changed.
- **23.7** New `scripts/check_repo_hygiene.py` covers the `.gitignore` rules and `git check-ignore` behaviour, tracked `.env*` files, the env-example coverage of every variable the code reads, a secrets scan, the spec files, and no guideline copies in steering. The `web/e2e` literal-credential check reuses the patterns of `web/scripts/scanCredentials.ts`. The first run reported four false positives (a config attribute and three local test-fixture URLs) and no real secret. The scanner was narrowed, and the check now passes.
- **Open points (owner decision):** (1) Requirement 36.10 lists 11 screenshot subjects and task 23.4 names `docs/screenshots/`, but only 3 images exist and they are in `documentations/`. (2) Guideline G-FE-04 conflicts with Requirements 19, 21, and 26 as worded.

## V10 - 2026-11-24
### Changes
- **Specification change (Requirement 36.10).** The README Screenshots section now needs at least three captioned images of Kano_Web in use, stored in `docs/screenshots/`. The eleven subjects that V9 required (Postman run, Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, Login, card drag, notification bell, Playwright report) are now optional examples.
- **Guideline change (G-FE-04, `guidelines/frontend.md`).** `BaseModal` is required only for dialog forms. Page forms and inline board forms are exempt. The quick checklist line was changed to match.
- **Design change (D3 and Traceability row 36).** D3 has a V10 note on the screenshot location, the minimum of three images, and `scripts/check_readme_links.py`. Row 36 names both.
- **Task edits.** Task 23.4 has a V10 note (the list is optional; the three images are in `docs/screenshots/`). Task 22.6 marks the Postman screenshot as optional. Task 23.5 is now complete, and its V9 status line is kept as history.
- **Implementation change.** The three images were moved with `git mv` from `documentations/` to `docs/screenshots/` (`welcome.png`, `dashboard-page.png`, `board-content-page.png`), and the empty `documentations/` folder was removed. `README.md` image paths now point to `docs/screenshots/`. In `docs/violation-report.md`, the G-FE-04 entry changed from Accepted to Fixed (guideline reworded).

#### Before / After
- R36.10 before: "THE README.md Screenshots section SHALL include image files, each with a caption naming its subject, for: a Postman run covering all eight Blueprint_Package endpoint groups against the public URL, the Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, and Login pages, a Card being dragged between Columns, the notification bell showing an unread count greater than zero, and the Playwright HTML report showing all tests passed."
- R36.10 after: "THE README.md Screenshots section SHALL include at least three image files stored in `docs/screenshots/`, each with a caption naming its subject and each showing Kano_Web in use (for example the Welcome_Page, the Dashboard, and Board Detail). Further screenshots, for example a Postman run against the public URL, the Card Detail Modal, My Tasks, Profile, Register, or Login, a Card being dragged between Columns, the notification bell, or the Playwright HTML report, are optional."
- G-FE-04 Rule before: "Render every button with `BaseButton`, status labels with `BaseBadge`, and every form inside `BaseModal`, all from `web/components/shared/`, and never use a raw `<button>` elsewhere."
- G-FE-04 Rule after: "Render every button with `BaseButton`, status labels with `BaseBadge`, and every dialog form inside `BaseModal`, all from `web/components/shared/`, and never use a raw `<button>` elsewhere; page forms and inline board forms are exempt from `BaseModal`."
- G-FE-04 checklist before: "One component per file; buttons are `BaseButton`; forms are inside `BaseModal`." After: "One component per file; buttons are `BaseButton`; dialog forms are inside `BaseModal` (page forms and inline board forms are exempt)."

#### Consistency check
- Requirement 36.10 V10 has design coverage (D3 V10 note, row 36) and task coverage (23.4, 23.5). Task 22.6 no longer requires a screenshot that the requirement does not need.
- G-FE-04 no longer conflicts with Requirement 19 (login and register pages), Requirement 21 (inline quick-add card and add column), or Requirement 26 (profile page). This resolves both open points of the previous implementation entry.
- Requirement 36.12 still holds: `scripts/check_readme_links.py` passes after the move. No other requirement names the screenshot list or `documentations/`.
- `web/__tests__/repo-rules.test.ts` (tagged G-FE-04) checks only raw `<button>`, so the rewording needs no test change.

### Reason
- The owner chose to accept the three existing screenshots instead of capturing eight more, to store them in `docs/screenshots/`, and to apply the recommended G-FE-04 rewording.

### Impact
- **Requirements:** 36.10 only. Version marker V10.
- **Design:** D3 (V10 note), Traceability row 36. Version marker V10.
- **Tasks:** 22.6 (screenshot optional), 23.4 (V10 note), 23.5 (complete). Version marker V10.
- **Guidelines:** `guidelines/frontend.md` G-FE-04 Rule and checklist line.
- **Files:** `docs/screenshots/` (three moved images), `README.md` (paths), `docs/violation-report.md` (G-FE-04 status). No change in `app/` or `web/`.
- **Breaking changes:** none.

## V11 - 2026-11-26
Source: `improvements/kano-improvement-plan.md` plus the approved decisions of this session. Only `requirements.md` (now V11) and this file are changed in this step. `design.md` and `tasks.md` stay at V10 and are updated in the following steps (an explicit exception to the automatic design and task update of the development workflow, requested by the user).

### Changes
Classification: **specification changes**, with two **breaking changes** (marked). No design change, implementation change, or bug fix is made in this step.

1. **Urgent status and label colors (new Requirement 39; amended Glossary Card_Status, 2.16, 11.4, 11.19, 21.22, 23.17, 25.2, 38.17, 38.18).** Card_Status has four values. `URGENT` is not completed, and the `completed_at` rules are unchanged. Chip colors come from one lookup (gray, blue, red, green). Label colors come from a pure `labelColor(text)` function with 8 palette keys and no schema change.
2. **Overdue notification (new Requirement 40; new Glossary term Overdue_Card).** `GET /api/notifications/overdue` in the `notifications` package, computed on read, no stored rows, no scheduled job. Overdue means due date before the current UTC date and status not `DONE`. Recipients: the assignee, or the admin and managers for unassigned Cards, never guests. Index on the Card due date. Explicit exception to Requirement 13 criterion 4. Red "Overdue" tag with the days overdue in the list, a danger chip on the Card face, fetch on page load and on opening the list, no polling.
3. **Card checklist (new Requirement 41; new Glossary term Checklist_Item).** Table `checklist_items`, FLOAT `order`, text 1 to 200, 50 items per Card, endpoints POST (201), PATCH, DELETE (200 object), and the new GET `/api/cards/<id>` (see gap 1). Writers (admin, manager, member) edit, guests read. Progress is computed, never stored. Optimistic toggle with revert.
4. **Workspace links (new Requirement 42; new Glossary term Card_Link).** Table `card_links`, 10 links per Card, `http` and `https` only with a hostname, label defaulting to the hostname, anchors with `target="_blank"` and `rel="noopener noreferrer"`, `link_count` chip. Writers edit, guests read, no notification.
5. **Manager role (new Requirement 43; new Glossary terms Board_Manager and Role_Rank; amended Project Brief, Glossary Board_Member, Board_Participant, Board_Membership, 2.15, 9.1, 9.6, 9.9, 10 (user story, 10.1 to 10.4, 10.7, new 10.11), 11.2, 14.10, 20.1, 21.2, 21.4, 21.5, 21.12, 21.13, 21.21, 23.20, 28.12, 37.1, 37.3 to 37.6, 37.12, 37.14 to 37.17, 37.22).** Ranks guest 0, member 1, manager 2, admin 3 in `app/permissions.py`. Admin and manager manage Columns, invitations, and members below their rank. Only the admin renames and deletes the Board, reads analytics, and grants `manager`. A new role-change endpoint `PATCH /api/boards/<id>/members/<user_id>` carries the two safety rules. `my_role` and `can(role, action)` on the frontend.
6. **Schema, migration, query budget (new Requirement 44; amended 1.4, 1.9, 2.2, 2.9 to 2.11, 3.5, 3.9, new 3.11, 4.3).** 9 tables. One manual V11 Migration_Step with two hand-edited check constraints. Board counts for checklist and links come from one combined grouped query, so Requirement 29 criterion 2 (at most 5 queries) is unchanged.
7. **Tests and docs (new 31.18 to 31.25, 32.24 to 32.30, 36.15; amended 31.5, 31.13, 31.16, 32.16, 32.18).** Property tests for URL validation, `labelColor`, and the role-change decision. Cap, guest, cascade, query-count, rank, member-cannot-manage-columns, and overdue tests. README mention of the new features and the V11 migration.
8. **Welcome page copy (38.17, 38.18, 38.19).** Only the status wording changes. The string "checklist" is removed from the forbidden list because checklists are now a real feature. "subtask" stays forbidden.

#### Before / After
- Version marker before: "V10 (documentation-only change: Requirement 36.10 ...)". After: "V11 (adds the URGENT card status and label colors, the overdue notification, the card checklist, workspace links, and the Manager role in the new Part G, with 9 tables, and removes Column management from the role `member`; V10 was a documentation-only change: ...)".
- Glossary Board_Member before: "In access rules, the term Board_Member covers the roles `admin` and `member` (a Board_Admin is also a Board_Member) and excludes the `guest` role." After: covers `admin`, `manager`, and `member`, and excludes `guest`. Board_Participant and Board_Membership list four roles.
- Glossary Card_Status before: "`NOT_STARTED` (default), `IN_PROGRESS`, or `DONE`, ... "Not started", "In progress", and "Done"." After: adds `URGENT` and "Urgent", and states that only `DONE` is a completed state.
- Project Brief before: roles Board_Admin, Board_Member, Board_Guest; features "card status (Not started, In progress, Done); board members with roles (admin, member, guest);". After: adds Board_Manager; features list four statuses, label colors, overdue notifications, checklists, workspace links, and four roles. Board_Member "Manages cards and comments" now reads "Manages cards, checklists, workspace links, and comments on that board, but not its columns."
- R1.4 before: models "User, Board, Board_Membership, Column, Card, Comment, and Notification ... cards: Card;". After: adds Checklist_Item and Card_Link, both owned by `cards`. R2.2 lists the same two models.
- R1.9 before: "detects all 7 tables (users, boards, board_memberships, columns, cards, comments, notifications)." After: "all 9 tables" with checklist_items and card_links added.
- R2.9 before: "soft delete the Columns, Cards, Comments, and Board_Memberships". After: adds Checklist_Items and Card_Links. R2.10 and R2.11 gain the same two children.
- R2.15 before: role values `admin`, `member`, `guest` ("unchanged for all three roles"). After: `admin`, `manager`, `member`, `guest` ("all four roles").
- R2.16 before: status values `NOT_STARTED`, `IN_PROGRESS`, `DONE`. After: adds `URGENT`.
- R3.5 before: tables for the 7 models. After: adds "after the V11 Migration_Step ... Checklist_Item and Card_Link". R3.9 before: "SHALL add no table, so the 7-table rule ... still holds." After: "(this describes the V6 step; the V11 step adds two tables, see Requirement 44 criterion 1)". R3.11 is new (manual V11 task and blocking rule).
- R4.3 before: creating POSTs ended with "`/api/columns/<id>/cards`, and `/api/cards/<id>/comments`". After: adds `/api/cards/<id>/checklist` and `/api/cards/<id>/links` (both 201).
- R9.1 before: "WHEN a Board_Admin sends POST `/api/boards/<id>/members` ...". After: "Board_Admin or a Board_Manager".
- R9.6 before: "WHEN a Board_Admin sends DELETE ... for a non-admin member, ...". After: "Board_Admin or a Board_Manager ... for a Board_Participant whose role ranks below the role of the caller (Requirement 43 criterion 6)".
- R9.9 before: "IF a Board_Member who is not the Board_Admin sends POST or DELETE to a members endpoint, THEN ... 403". After: "a Board_Member whose role is `member`".
- R10 (**breaking change**) before: "WHEN a Board_Member sends POST `/api/boards/<id>/columns` ..." (and the same for PATCH, DELETE, reorder), user story "As a board member", and 10.7 "IF the current User is not a Board_Member of the Column's Board, THEN ... 403". After: "Board_Admin or a Board_Manager" in 10.1 to 10.4, the user story, and 10.7. New 10.11: a `member` gets 403 on the four Column endpoints.
- R11.2 before: assignee role `admin` or `member`. After: `admin`, `manager`, or `member`. R11.4 before: status must be one of three values. After: four. R11.19 gains: any change among `NOT_STARTED`, `IN_PROGRESS`, and `URGENT` leaves `completed_at` unchanged.
- R14.10 before: "(roles `admin` and `member`)". After: "(roles `admin`, `manager`, and `member`)". R14.7 (analytics admin only) is unchanged and already returns 403 to a manager.
- R20.1 and R37.17 before: role badge `admin`, `member`, or `guest`. After: adds `manager`. R37.17 also lets the Board_Manager remove a Board_Guest.
- R21.2, 21.4, 21.5 before: "WHEN a Board_Member submits/confirms ..." for Column actions. After: "Board_Admin or a Board_Manager".
- R21.12 before: "WHERE the current User is the Board_Admin, ... member management panel (list, add by email, remove) and a link to the analytics view." After: panel for the admin or a manager (with role change), analytics link for the admin only.
- R21.13 before: "WHERE ... a Board_Member who is not the Board_Admin, ... hide the member management controls and the analytics link." After: for a `member`, hide member management, Column controls, and the analytics link. For a manager, hide the analytics link.
- R21.21, R37.15, R37.16, R28.12, R37.3 to R37.6 before: invite links and tokens for the Board_Admin only (and 403 for "a member"). After: Board_Admin or Board_Manager. R37.5 now says "a Board_Member whose role is `member`".
- R21.22 and R25.2 before: badge labels "Not started", "In progress", "Done". After: adds "Urgent". R23.17 before: "exactly the three options". After: "exactly the four options". R23.20 before: assignees `admin` or `member`. After: adds `manager`.
- R37.1 before: "SHALL add no table, so that the 7 tables of Requirement 1 criterion 9 remain." After: "SHALL add no table for this feature (the table count is defined in Requirement 1 criterion 9)." R31.16 gets the same change ("the 9 tables").
- R37.12 before: "a `member` or `admin` who accepts the guest token SHALL keep the role". After: adds `manager`, and a manager who accepts the member token keeps `manager`.
- R37.14 before: guest 403 list ended at the invite-link endpoints. After: adds PATCH members, POST checklist, PATCH and DELETE checklist, POST links, PATCH and DELETE links.
- R37.22 before: "SHALL provide no endpoint that changes a role other than the upgrade of criterion 12." After: "... and the role-change endpoint of Requirement 43 criterion 5."
- R38.17 before: "a status (Not started, In progress, or Done)". After: "(Not started, In progress, Urgent, or Done)". R38.18 gains the label "Urgent". R38.19 before: list contained `"checklist"`. After: `"checklist"` removed.
- R31.5 before: "403 for a Board_Member who is not the Board_Admin on the member add, member remove, Board update, Board delete, and analytics endpoints." After: split into `member` role for member add and remove, and not-admin for Board update, Board delete, and analytics.
- R31.13 gains "acceptance of `URGENT` on PATCH". R31.16 adds the manager for invite-links. R32.16 ("three options") is now "four options". R32.18 adds the Board_Manager for the invitation links.
- New criteria without Before text: 3.11, 10.11, 31.18 to 31.25, 32.24 to 32.30, 36.15, and Requirements 39 to 44 (Part G).

#### Consistency check (requirements only)
Contradictions found and resolved in this step:
- R37.22 (no role-change endpoint) versus the new role-change endpoint: R37.22 was amended.
- R9.6 and R9.9 (admin only) versus managers who may add and remove members: both were amended, and the rank rule of Requirement 43 criteria 6 and 7 was added.
- R9.6 "non-admin member" versus a manager who must not remove another manager: replaced by the rank rule.
- R10, R21.2, R21.4, R21.5, R21.13 versus the loss of Column management for `member`: amended, with new R10.11.
- R1.9, R3.5, R3.9, R37.1, R31.16 ("7 tables", "no table"): amended to 9 tables.
- R2.9 to R2.11 cascades did not cover the two new child tables: amended.
- R11.22 (a guest cannot be assignee) versus a role change to `guest`: new Requirement 43 criterion 10 clears the assignee, in the same way as R9.11.
- R37.12 accept rules did not name the manager: amended.
- R38.19 forbade "checklist" while Requirement 41 adds checklists: the string was removed from the list.
- R4.3 (which POSTs return 201): amended.

Gaps found and closed with an assumption (the user can override each one):
1. The plan says "GET `/api/cards/<id>` includes the checklist", but no requirement defined that endpoint. It is new in Requirement 41 criterion 9 (any Board_Participant, 200, with checklist and links). It is a new endpoint and not a revision of an existing one.
2. The plan lists "transfer ownership" as admin only, but no endpoint exists. Requirement 43 criterion 4 states that none is provided.
3. Overdue items are not stored, so they would not fit the unread count. Requirement 40 criterion 12 excludes them from the bell count, and criterion 13 defines the empty state.
4. The plan gives no limit for the overdue list. Assumption: at most 100 items with the full `total` (Requirement 40 criterion 5), and a 500 ms p95 target like Requirement 29 criterion 4.
5. "Remove members and change roles" for a manager needed a precise rule. It is "caller rank strictly above the target rank and strictly above the new rank, and the new role is never `admin`" (Requirement 43 criteria 6 to 8). As a result a manager cannot change another manager or assign `manager`, and a manager cannot remove or change themselves (403 by the rank rule, 400 for the admin owner).
6. The plan row "Manage lists and labels": labels are plain strings on Cards, so only Columns are manager-managed. No label management requirement was added.
7. The card payload counts: Requirement 44 criterion 5 puts the three counts in the board detail and in the create, update, and position responses. Search and My Tasks do not carry them (assumption, to keep those queries unchanged).
8. Production: R34.3 already requires `flask db upgrade` on the production schema at deployment. No separate production step was added.

Open points that need a decision in the design step (no requirement change made):
- The five invitation and member-management criteria that say "manager" rely on the helpers of `permissions.py` (Requirement 43 criterion 1). The design must replace the V6 helper matrix (A4-V6) and keep property 25.
- Existing tests that use a `member` to create or move Columns (R31 Column tests, the Playwright journey of R33.4 uses the board creator, so it is not affected) must change to admin or manager.
- Files that approach 300 lines (R30.6) are likely in the `cards` package and in `CardDetailModal`. The design must plan the split.
- Welcome page copy (R38.17) does not mention checklists, links, or the Manager role. Only the status wording was changed, as decided.

### Reason
- The mentor's optional improvement plan, adjusted by eight user decisions: four statuses, compute-on-read overdue, checklist, links, one combined board count query, nine tables, a Manager role in which members lose Column management, and a trimmed forbidden-string list.

### Impact
- **Requirements amended:** Version marker, Project Brief, Glossary, 1.4, 1.9, 2.2, 2.9, 2.10, 2.11, 2.15, 2.16, 3.5, 3.9, 4.3, 9.1, 9.6, 9.9, 10 (user story, 10.1 to 10.4, 10.7), 11.2, 11.4, 11.19, 14.10, 20.1, 21.2, 21.4, 21.5, 21.12, 21.13, 21.21, 21.22, 23.17, 23.20, 25.2, 28.12, 31.5, 31.13, 31.16, 32.16, 32.18, 37.1, 37.3 to 37.6, 37.12, 37.14 to 37.17, 37.22, 38.17 to 38.19.
- **Requirements added:** 3.11, 10.11, 31.18 to 31.25, 32.24 to 32.30, 36.15, and Requirements 39 to 44 in the new Part G.
- **Design (not changed yet):** `permissions.py` helpers and the rank rule, the Card model and status map, `checklist_items` and `card_links` models, the cards service (counts query, GET card detail, checklist and link endpoints), the overdue endpoint, the member role-change endpoint, `labelColor`, `lib/status.ts`, `lib/roles.ts` (`can`), the CardDetailModal sections, the Card face chips, the member panel, the notification list, and the Testing Strategy.
- **Tasks (not changed yet):** one V11 manual Migration_Step with two hand-edited constraints, and backend, frontend, and test tasks for Requirements 39 to 44.
- **Breaking changes:** (1) the role `member` can no longer create, rename, delete, or reorder Columns (403). (2) Status accepts a fourth value, and an `URGENT` Card is not completed. Clients that assume three statuses or three roles (`admin`, `member`, `guest`) must be reviewed. The invitation links are now also readable and regenerable by managers.
- **Implementation:** none in this step.

#### Design edits (step 2: `design.md` V10 to V11, classification: design changes; no implementation change, no requirement change, `tasks.md` not changed)
No V1 to V10 design text was deleted. Where V11 supersedes earlier text, the old text stays and a "V11 change" note or a V11 section names the replacement.
- Version marker set to V11 with a V11 change summary and section index. New decisions D19 (four roles, rank rules in `permissions.py`), D20 (checklist and links inside `cards` as packages), D21 (one combined count query, 5 queries), D22 (overdue computed on read with a passed-in UTC date), D23 (`@source "../lib"` so Tailwind sees the status and label class strings).
- New backend sections A15 (four roles, `decide_role_change`, `decide_member_removal`, helper list, V11 endpoint-by-role matrix), A16 (four-value status), A17 (file split of `cards/schema`, `service`, `routes`; checklist and link services; pure `validate_link_url`; extended cascades), A18 (combined count query, GET `/api/cards/<id>`), A19 (overdue endpoint, query, recipients, cap, index), A20 (role-change endpoint, member removal, invite links for managers), A21 (endpoint rows 34 to 42 and amended rows). New frontend sections B16 (`can`, `assignableRoles`, role dropdown, gating), B17 (`STATUS_STYLE`, `labelColor`, class maps), B18 (Card face indicators, `ChecklistSection`, `LinksSection`), B19 (overdue UI), B20 (types, welcome copy), B21 (files).
- Data Models: V11 section with `ChecklistItem` and `CardLink`, changed constraints, the 9-table ER diagram, and the V11 migration table (two hand-edited check constraints, `ix_cards_due_date`, two tables). Correctness Properties 61 to 75 plus an amendment table for earlier properties. Error Handling: 19 V11 rows. Testing Strategy: V11 additions (backend, frontend, Playwright). Part D V11 notes. Traceability: rows for Requirements 39 to 44 and an amended-requirements table. Open issues 45 to 66.
- "V11 change" notes were added in place at: A4-V6 (helper matrix), A9 (query plan), A12-V6 (token exposure), A13 (status constants), B6-V6 (role gating), B7-V6 (`lib/status.ts`), Data Models "ER diagram", Properties 25 and 47.

#### Before / After (design)
- Roles: before `ROLE_RANK = {guest: 0, member: 1, admin: 2}`, levels reader, writer, admin, helpers `require_board_writer` and `get_column_for_writer` for Columns. After `{guest: 0, member: 1, manager: 2, admin: 3}`, a `manager` level, `require_board_manager` and `get_column_for_manager` for Columns, member add and remove, role change, and invite links.
- Columns, members, invite links: before "Admin" or "Member" (writer) in the V6 matrix. After admin and manager; a `member` gets 403 on the four Column endpoints.
- Status: before three values (`lib/status.ts`, A13, `ck_cards_status`). After four values with `STATUS_STYLE` (label, variant, complete class string), red for `URGENT`.
- Board detail: before 4 queries. After 5 queries (the fifth is the combined count query), at most 5 and constant.
- Tables: before 7. After 9 (`checklist_items`, `card_links`). Cascades gain the two tables.
- Analytics member activity: before roles `admin`, `member`. After `admin`, `manager`, `member`.
- Welcome copy: before "(Not started, In progress, or Done)". After "(Not started, In progress, Urgent, or Done)". `FORBIDDEN_CLAIMS` has no "checklist".
- Tailwind: before `@source` for `components/` and `hooks/` only. After also `lib/`.

#### Inconsistencies found between requirements V11 and the design (no requirement text changed; recommendations are in design Open issues 45 to 66)
1. R39.5 puts class strings in `lib/status.ts`, but R15.2 and D18 scan only `app/`, `components/`, `hooks/`. Design adds `@source "../lib"` (Open issue 45).
2. R43.6 (403 by rank) and R43.8 (400 when naming the Board_Admin) overlap, and R9.7 says 400 for an admin who removes himself. Design: owner check first, 400 only for the admin, 403 for a manager (Open issue 47).
3. R42.2 defaults the label to the hostname, which can exceed the 100-character label limit of R42.1 and R42.5. Design cuts to 100 (Open issue 48).
4. R11.15 gives 403 to a non-Board_Member (a guest) on every single-Card endpoint, but R41.9 gives a guest 200 on GET `/api/cards/<id>` (Open issue 49).
5. R43 does not say what a role change to the same role does or the order of 400 and 403; the design returns 200 and validates the body first (Open issue 59).
6. R40.10 says "when the page loads"; a client-side navigation does not remount the Header, so the design refreshes on mount, reload, and list open (Open issue 50).
7. R39.9 and R39.10 assume label and status token names that are not verified against `globals.css` (Open issue 46).

### Impact (design, V11 step 2)
- **Design:** `design.md` is now V11. **Requirements:** unchanged in this step. **Tasks:** `tasks.md` is still V10 and must get V11 tasks next: the manual V11 Migration_Step (two hand-edited check constraints, `ix_cards_due_date`, two tables), `permissions.py` rank helpers and `decide_*`, the `cards` package split, checklist and link models, schemas, services, routes, `counts.py`, GET card detail, the overdue service and route, the member role-change endpoint, the manager guards on columns, members, and invites, the frontend `roles.ts`, `status.ts`, `labelColor.ts`, `overdue.ts`, `linkProvider.ts`, hooks, components, `globals.css` `@source`, welcome copy, and tests for Properties 61 to 75.
- **Breaking changes:** unchanged from the V11 requirements entry (role `member` loses Column management; four statuses and four roles).

#### Task edits (step 3: `tasks.md` V10 to V11, classification: specification and task planning change; no implementation change)
Tasks 1 to 43, their checkboxes, text, and waves 0 to 85 are unchanged history. Only the version line and Overview of `tasks.md` were changed (V11 paragraph), plus new tasks, waves, and notes appended. `requirements.md` and `design.md` were not edited.
- **New tasks 44 to 56, all unchecked.**
  - 44 Backend models, schema, and permissions (44.1 to 44.15): `cards` schema, service, and routes packages; `URGENT` and `ix_cards_due_date`; `ChecklistItem` and `CardLink` models; URL rule and schemas; four-role check; `ROLE_RANK` with manager, `decide_role_change`, `decide_member_removal`; manager helpers; Column, add-member, and invite-link guards moved to the manager level; extended cascades; combined count query; model metadata tests; pure property tests for 61, 68, 72, 73, 75.
  - 45.1 [MANUAL] V11 migration on the development and test databases, hand-edited `ck_cards_status` and `ck_board_memberships_role`, no agent-generated script.
  - 46 Backend features and pytest tests (46.1 to 46.18): conftest and factories for 9 tables, GET `/api/cards/<id>` with counts, checklist, links, overdue, role-change and manager rank rules, tests by role, status and analytics updates, V11 matrix, schema tests, endpoint-list tests. 47 backend checkpoint.
  - 48 [MANUAL] design-system token check (R39.10).
  - 49 Frontend libraries (49.1 to 49.7): types, `lib/status.ts` (four statuses), `lib/labelColor.ts`, `lib/roles.ts` (`can`), `@source "../lib"`, overdue and progress helpers, link provider and validators. 50 Components (50.1 to 50.11): board gating by `can` with Column controls hidden for `member`, member panel with role dropdown, Card face indicators, modal with four statuses and card detail loading, checklist, links, overdue UI, Dashboard and My Tasks, welcome copy, responsive pass, repository rules. 51 Frontend tests (51.1 to 51.5). 52 Playwright (52.1 to 52.4). 53 README and documentation. 54 final checkpoint. 55 [MANUAL] browser verification. 56 [MANUAL] production schema and verification.
- **Superseded earlier tasks (named in the V11 tasks, history kept).** 3.5, 5.1, 8.1, 8.2, 8.4, 9.2, 14.1 to 14.3, 14.5, 17.12, 18.4, 18.5, 18.7, 25.2, 25.6 to 25.9, 27.4, 27.6, 27.7, 27.9 to 27.15, 29.1, 29.3, 29.4, 29.9, 30.1, 30.2, 30.4, 30.8, 30.11, 31.7, 31.9, 35.1, 36.1, 37.2, 37.3, 37.7, 37.9, 40.6.
- **Dependency graph.** Waves 86 to 115 appended (valid JSON, every incomplete task without sub-tasks appears once; parent tasks 44, 45, 46, 49, 50, 51, 52, 53 do not appear). Waves 0 to 85 are unchanged.
- **Notes.** Property coverage 61 to 75, requirement coverage for R39 to R44 and the amended rows, the map of invalidated tests, and the deployment ordering recommendation are in the "V11 Notes" section of `tasks.md`.
- **Open issues handled.** Design Open issues 45 (task 49.5), 46 and 62 (task 48), 47 (46.11, 46.12), 48 (44.4, 46.7), 49 (46.2, 46.16), 50 and 51 (50.7, 49.6), 53 (50.1, 51.5, 52.1), 54 (46.4, 46.6), 55 (50.6), 56 (44.1, 50.3, 50.11), 57 and 58 (44.10, 46.2), 59 (46.11), 60 (50.9), 65 (44.11, 46.1, 53.2), 66 (the note on guideline mismatches in 53.2). Items 52, 61, 63, and 64 are accepted as designed.
- **Inconsistencies reported (no requirement or design text changed):** R15.2 versus the `lib/` class strings; R39.10 versus the rule that agents never edit `guidelines/`; R43.6 versus R43.8 ordering; R11.15 versus R41.9 for guests; R42.2 default label length; R43 silent on same-role change and validation order; Requirement 33 has no V11 criteria; the CHANGELOG remark about removing "checklist" from the forbidden list does not match the current R38.19; the pending deployment waves 67 to 79 come before the new V11 waves because wave ids are append-only (recommendation in the V11 Notes).
- **Classification.** Task planning only. No implementation change and no version bump beyond V11.

## V12 - 2026-11-27
Source: `improvements/improvement5.md` and the scope the user approved after a backend review. Only `requirements.md` (now V12) and this file are changed in this step. `design.md` and `tasks.md` stay at V11 and are revised in the following phases. Tasks 1 to 56 stay unchanged as history.

### Changes
#### Specification changes (`requirements.md`)
- **New Part H** with Requirements 45 to 48. No existing requirement was renumbered, rewritten, or removed.
  - **Requirement 45, board rename and delete (frontend only).** Rename and delete controls in the board toolbar for the Board_Admin only (existing `can(role, "edit_board")` and `can(role, "delete_board")`), a BaseModal rename form with validation, a ConfirmDialog for delete, errors through `useErrorHandler`, navigation to `/` after delete, and a Dashboard that shows the new name or omits the board afterwards. Existing PATCH and DELETE endpoints are used unchanged.
  - **Requirement 46, My Tasks deep link (frontend only).** The task title links to `/boards/<board_id>?card=<card_id>`; the "Open board" link stays plain. The board page opens the CardDetailModal for a card that is in the board data, and ignores an unknown id without error. Decisions stated: the `card` parameter is removed from the URL when the modal closes (history entry replaced, no reload, no board refetch), the modal opens at most once per page load, the first of repeated values wins, an empty value counts as absent, a 403 or 404 board ignores the parameter, `decideRoute` and the `next` rule are unchanged. The page reads `searchParams` as a Promise, per the installed Next.js docs.
  - **Requirement 47, member and card counts (small backend change).** `member_count` (non-deleted memberships of any role, guests included) and `card_count` (non-deleted cards) on every item of GET `/api/boards`, computed with grouped queries (at most 4 queries including the JWT user lookup, constant for 1 or 20 boards); POST returns 1 and 0; PATCH returns the current counts; `openapi.yaml`, `BoardSummary`, and the Board card text with singular and plural forms. Decision: GET `/api/boards/<id>` is unchanged. No table, column, or index is added, so there is no Migration_Step (the index on `cards.board_id` already exists in the model).
  - **Requirement 48, tests and size limits.** Backend count tests, Vitest tests, four Playwright scenarios (rename, delete, deep link, counts), the rule to run `npm test` and `npx playwright test` first and fix every failing test found, updating the broken existing tests instead of deleting them, and a split of the new frontend logic into separate files because `BoardView.tsx` has 291 lines.
- **Appended criteria in existing requirements (pointers, no rewording of old text):** 8.13, 20.9, 20.10, 21.29, 21.30, 25.8, 31.26, 32.31, 33.18, 44.7.
- **Glossary:** added Board_Summary, Member_Count, Card_Count, and Card_Deep_Link.
- **Version marker** set to V12; the V11 text of the marker is kept inside it.

#### Design changes (`design.md`, step 2 of V12)
- `design.md` is now V12 (append-only revision, V11 text kept in full). **V12 change summary** and decisions D24 to D27 added to the Overview.
- **New backend section A22** (`boards/service/counts.py::counts_for_boards`/`counts_for_board`, `BoardSchema` fields, `BoardDetailSchema.Meta.exclude`, `list_boards`/`create_board`/`update_board` changes, `openapi.yaml` `Board` schema additions), placed after A21.
- **New frontend sections B22 to B25**: B22 board rename and delete (`RenameBoardModal.tsx`, `DeleteBoardControl.tsx`, `BoardToolbar.tsx` and `BoardView.tsx` changes); B23 My Tasks deep link (`hooks/useCardDeepLink.ts`, `MyTasksList.tsx` link-target change); B24 reading `searchParams` in the board page (`web/app/(boards)/boards/[id]/page.tsx`); B25 `BoardSummary` type, `formatCount`, `BoardList.tsx` card text. Placed after B21, before Data Models.
- **Correctness Properties 76 to 80** (board counts equal a naive model; constant query count; create/update counts; detail excludes counts; deep-link resolution and open-once rule), plus a V12 prework summary paragraph.
- **Error Handling**: 11 new V12 rows.
- **Testing Strategy**: V12 additions (the run-first-and-fix-failures step, backend count tests, frontend unit tests, four Playwright scenarios with deployment ordering).
- **Part D**: new "V12 notes" subsection (no migration, deployment ordering, no README criterion).
- **Traceability Matrix**: V12 table for Requirements 45 to 48 and an amended-requirements table for the appended criteria (8.13, 20.9, 20.10, 21.29, 21.30, 25.8, 31.26, 32.31, 33.18, 44.7).
- **Open issues 67 to 70** added (`BoardDetailSchema` field exclusion mechanism; `BoardDetail`/`BoardSummary` TypeScript inheritance now implies unsent fields; PATCH query budget left unstated; `formatCount` as a deliberate second count-formatting function alongside `formatBadge`).
- **"V12 change" notes** added in place at: the My Tasks per-task link target (B23, supersedes the plain board link described in the old B6-V6/B21 file lists), the `BoardSummary`/`BoardDetail` shape note (B25), and the board page `searchParams` addition (B24).
- No requirement text was changed by this step; `requirements.md` stays V12 as set in step 1. `tasks.md` is not edited by this step.

#### Implementation changes
- None in this step.

#### Bug fixes
- None.

#### Breaking changes
- None. `member_count` and `card_count` are added fields in the board list, create, and update responses. The meaning of Requirement 25 criterion 2 changes only for the target of the per-task link (see criterion 25.8).

### Reason
- User request in `improvement5.md`: rename and delete board from the board page, open the card from My Tasks, member and card counts on the Dashboard, and a fully passing test suite.

### Impact
- **Requirements added:** 45, 46, 47, 48, and criteria 8.13, 20.9, 20.10, 21.29, 21.30, 25.8, 31.26, 32.31, 33.18, 44.7.
- **Requirements superseded in part:** the target of the per-task link in 25.2 (now 25.8). Criteria 8.2 and 8.1 keep their text and gain the new fields through 8.13.
- **Design components to revise next:** `boards` service `list_boards`, `serialize_board`, a new grouped count helper, `BoardSchema`, `openapi.yaml`, `BoardList`, `BoardToolbar`, `BoardView` split (291 lines), the board page `searchParams`, `MyTasksList`, rename and delete components, Dashboard freshness after rename and delete, `lib/types.ts`, Testing Strategy. **Resolved in this design step (A22, B22 to B25, D24 to D27).**
- **Tasks to add next (below task 56):** backend count helper, schema, and tests; frontend components and tests; the run of both test commands first, then the fixes; Playwright scenarios; backend deployment before the live counts scenario. **Still pending; `tasks.md` is revised in the next phase.**

### Requirement consistency check (development-workflow step 2)
Checked against Requirements 8, 9, 16, 19, 21, 25, 26, 32, 33, 44, 29, 30, 43, and the design Traceability sections. No conflict that needs a decision. Resolved by appended criteria:
- R8.1, R8.2, R8.4 list the fields of the Board responses: 8.13 adds the two counts. R8.3 (detail) and R8.5, R8.7, R8.12 stay valid and are reused by Requirement 45.
- R44.4 and R29.2 (at most 5 queries) concern only GET `/api/boards/<id>`: 44.7 states it, and Requirement 47 criterion 4 gives the list its own budget.
- R25.2 named a plain board link per task: 25.8 replaces that target and keeps the group "Open board" link.
- R21.13, R21.20, and R21.24 list the hidden controls and toolbar content: 21.29 adds rename and delete without editing them. R43.3 and R43.13 already limit `edit_board` and `delete_board` to the Board_Admin.
- R19.11 (`next` only for invite paths) and R17.12 (`decideRoute`): Requirement 46 criterion 10 keeps both unchanged, so a logged-out visit to a deep link goes to `/login` and then to `/`.
- R16 (error handling) is reused through `useErrorHandler`; no edit.
- R30.6 (300 lines): Requirement 48 criterion 6 covers `BoardView.tsx` (291 lines).
- R32.10 and R33.8 already require passing suites: Requirement 48 criterion 4 adds the run-first step.
- Traceability exists only in `design.md`: rows for Requirements 45 to 48 and the amended criteria are due in the design phase.

Open points for the next phases (no requirement change needed):
1. The Dashboard is a Server Component, so Requirement 45 criterion 12 (fresh list after rename or delete, including back navigation) needs a design decision on cache or refresh handling.
2. The Next.js client router can keep an old board page; Requirement 46 criterion 7 requires removing the `card` parameter without a refetch, and the design must pick the documented mechanism (the History API integration in `linking-and-navigating.md`).
3. The live Playwright scenario for counts needs the V12 backend deployed first (Requirement 48 criterion 7).

### Design refinement after the code check (V12, step 2 completed; no version bump)
The design step was interrupted after D24 to D27, A22, B22 to B25, Properties 76 to 80, the first V12 Error Handling, Testing Strategy, Part D, Traceability rows, and Open issues 67 to 70. The remaining work was finished append-only and the first V12 text was checked against the code (`board_service.py`, `board_schemas.py`, `cards/service/counts.py`, `openapi.yaml`, `BoardList.tsx`, `BoardView.tsx` 291 lines, `BoardToolbar.tsx`, `CreateBoardModal.tsx`, `ConfirmDialog.tsx`, `BaseModal.tsx`, `MyTasksList.tsx`, both board `page.tsx` files, `lib/roles.ts`, `lib/types.ts`, `web/__tests__`, `web/e2e`) and the installed Next.js 16.4.6 docs (`page.md`, `use-search-params.md`, `04-linking-and-navigating.md`, `use-router.md`, `staleTimes.md`, `04-glossary.md`). Places where the first V12 text was wrong carry a "V12 refinement" note; the first text stays.

#### Design changes
- **D24 (refined in place, old wording quoted in the note):** helper module `boards/service/board_counts.py` (the first name `counts.py` with `counts_for_board` would shadow the `counts_for_board` that `board_service.py` already imports from `cards/service/counts.py`); new `BoardSummarySchema(BoardSchema)`; `BoardSchema` and `BoardDetailSchema` unchanged.
- **D25 (refined in place):** new file list; `BoardToolbar` owns the displayed name, so `BoardView.tsx` stays at most 298 lines.
- **D27 refinement row (added; the first D27 row stays):** the installed docs say pages are reused on back/forward navigation, so `force-dynamic` alone does not satisfy R45.12; Board_Patches in `sessionStorage` merged by a pure function replace the first reasoning.
- **A22:** refinement note plus new subsection **A22-R** (module, schema split, service changes, POST literals, 4-query budget, OpenAPI `BoardSummary` component, no migration).
- **B22, B23:** refinement notes pointing to B27. **B25:** refinement bullets (`BoardBase` type split, OpenAPI cross-reference, Board card markup).
- **New B26** (Dashboard freshness: `lib/boardPatches.ts`, `hooks/useBoardPatches.ts`, `BoardList` merge) and **new B27** (refined wiring: `BoardToolbar`, `RenameBoardModal`, `DeleteBoardControl` with the busy guard, `lib/deepLink.ts`, `hooks/useCardDeepLink.ts` returning `onModalClose`, `BoardView` line budget, board page, `MyTasksList`, file list).
- **Correctness Properties 81 to 83** (deep-link parsing and URL rebuild, Board_Patch merge, count text) and a V12 amendment table (34, 74, 79 unchanged in substance; 80 clarified).
- **Error Handling:** 7 V12 refinement rows. **Testing Strategy:** V12 refinement (run-first order for `npm test`, `npx playwright test`, and `pytest`; the existing tests to update; `app/tests/test_board_counts.py`; five new Vitest files; `web/e2e/v12Boards.spec.ts` with four scenarios, including back and forward checks). **Part D:** deployment order, environment, verification list. **Traceability:** V12 refinement rows for every criterion of Requirements 45 to 48 and for 8.13, 20.9, 20.10, 21.29, 21.30, 25.8, 31.26, 32.31, 33.18, 44.7.
- **Open issues 71 to 77** (67 and 68 resolved; reading of R46.8; `sessionStorage` fallback; counts after back navigation; the pre-existing `BoardList` retry gap; Playwright cleanup; `useSearchParams` not used).

#### Affected design components (complete V12 list)
Backend: `app/blueprints/boards/service/board_counts.py` (new), `board_service.py` (`serialize_board`, `create_board`, `list_boards`, `update_board`), `boards/schema/board_schemas.py` (`BoardSummarySchema`), `boards/schema/__init__.py`, `app/openapi.yaml` (`BoardSummary`, GET list items, `BoardEnvelope`). Frontend: `components/boards/RenameBoardModal.tsx` (new), `DeleteBoardControl.tsx` (new), `hooks/useCardDeepLink.ts` (new), `hooks/useBoardPatches.ts` (new), `lib/deepLink.ts` (new), `lib/boardPatches.ts` (new), `BoardToolbar.tsx`, `BoardView.tsx`, `BoardList.tsx`, `components/cards/MyTasksList.tsx`, `app/(boards)/boards/[id]/page.tsx`, `lib/types.ts` (`BoardBase`, `BoardSummary`, `BoardDetail`), `lib/format.ts` (`formatCount`). Tests: `app/tests/test_board_counts.py` (new), updates to `test_boards.py`, `test_boards_roles.py`, `web/__tests__/dashboard.test.tsx`, `myTasksAndProfile.test.tsx`, and the `BoardView` test files (`next/navigation` mock), new `web/__tests__/v12*.test.ts(x)` files, `web/e2e/v12Boards.spec.ts`.

#### Requirement consistency check (development-workflow step 2, after the design)
Requirements V12, design V12, and tasks V11 were compared. No conflict needs a user decision.
- Every criterion of Requirements 45 to 48 and every appended criterion has a Traceability row and at least one design section.
- R46.8 versus the V11 modal load (R41.9, A18): resolved by reading (Open issue 72), with a recommended rewording for the next requirements revision; no requirement text changed.
- R45.12 versus the Client Cache: resolved in design (D27 refinement, B26).
- R47.13 (no counting in the browser) is kept: Board_Patches hold only server data.
- Gap: `tasks.md` is still V11 and has no V12 tasks. This is expected; tasks are written in the next phase and must cover A22-R, B22 to B27, Properties 76 to 83, the run-first step, and the deployment order.

#### Implementation changes
- None. No code was changed.

### Tasks revision (V12, step 3 completed; no version bump)
`tasks.md` is now V12 (append-only revision). Tasks 1 to 56, every checkbox, and the waves 0 to 115 are unchanged. The only edited existing lines are the version marker (the V11 text is kept inside it) and the last V11 wave entry, which received a comma so the appended waves keep the JSON valid. A V12 revision paragraph was added after the V11 paragraph, and a `V12 Notes` section was appended at the end of the file. No code, no test, and no other document was changed in this step.
#### Specification changes
- None. `requirements.md` and `design.md` stay as in the previous V12 steps.
#### Implementation tasks added (affected implementation tasks, all unchecked)
- **57 Baseline run before any change:** 57.1 [MANUAL] prepare the local stack, database, and `web/.env.test` (`E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`); 57.2 run `pytest` and `npm test` and record every failure in the new `docs/v12-baseline.md`; 57.3 run `npx playwright test` and record every failure; 57.4 fix the recorded failures that V12 does not cause (no deleted, skipped, or weakened test).
- **58 Backend counts (no migration):** 58.1 `board_counts.py` (`board_counts`, `board_counts_one`); 58.2 `BoardSummarySchema` and the list, create, and update changes; 58.3 `openapi.yaml`; 58.4 update `test_boards.py` and `test_boards_roles.py`; 58.5 `test_board_counts.py`; 58.6 query budget test and Property 77; 58.7 Properties 76, 78, and 79. **59** backend V12 checkpoint.
- **60 Frontend libraries and hooks:** 60.1 `BoardBase`, `BoardSummary`, `BoardDetail` types; 60.2 `formatCount`; 60.3 `lib/deepLink.ts`; 60.4 `lib/boardPatches.ts`; 60.5 `hooks/useBoardPatches.ts`; 60.6 `hooks/useCardDeepLink.ts`.
- **61 Frontend components:** 61.1 `RenameBoardModal`; 61.2 `DeleteBoardControl`; 61.3 `BoardToolbar` wiring; 61.4 `BoardView` (at most 298 lines); 61.5 board page `searchParams`; 61.6 `MyTasksList` link; 61.7 `BoardList` counts and Board_Patches merge; 61.8 repository-rule tests for the V12 files.
- **62 Frontend tests:** 62.1 dashboard tests; 62.2 My Tasks tests; 62.3 `next/navigation` mock in the six `BoardView` test files; 62.4 to 62.8 new `v12DeepLink`, `v12BoardPatches`, `v12Counts`, `v12RenameDelete`, `v12BoardDeepLink` tests with Properties 81, 82, 83, 74 (reused), and 80.
- **63 Playwright:** 63.1 to 63.3 `web/e2e/v12Boards.spec.ts` with the four scenarios (rename, delete, My Tasks deep link, counts), each on its own uniquely named Board; 63.4 no-literal-credentials check over the new spec.
- **64 Full verification:** 64.1 `pytest`, `npm test`, `npm run build`, and the repository checks until all pass; 64.2 [MANUAL] restart the local stack with the V12 code; 64.3 `npx playwright test` until every test passes.
- **65 Documentation:** 65.1 `README.md` (Features and Test Steps); 65.2 `docs/deployment.md` verification list and a drift review of the other documents.
- **66 Final checkpoint; 67 [MANUAL]** deploy the API first and verify the counts on production; **68 [MANUAL]** deploy the web app and run the end-to-end suite against production; **69 [MANUAL]** browser verification of rename, delete, deep link, and counts.
- **Dependency graph:** waves 116 to 142 appended (append-only). Every incomplete task without subtasks appears in exactly one wave.
#### Coverage
- Requirements 45 to 48 and the appended criteria 8.13, 20.9, 20.10, 21.29, 21.30, 25.8, 31.26, 32.31, 33.18, 44.7 each map to at least one task (see the V12 Notes of `tasks.md`). Properties 76 to 83 are each assigned to one test task. Open issues 67 to 77 are resolved, applied, or accepted in the tasks.
#### Requirement consistency check (development-workflow step 2, after the tasks)
Requirements V12, design V12, and tasks V12 were compared. No orphaned task, no requirement without a task, and no contradiction that blocks work. Differences between documents, handled in the tasks without editing any specification text:
1. Properties 76 and 78 in the design name `counts_for_boards` and `counts_for_board`, while A22-R renames them to `board_counts` and `board_counts_one`. Tasks use the A22-R names.
2. The first text of B22 and B23 conflicts with B27. Tasks follow B27.
3. Part D V12 notes say that no README change is designed, while the documentation was requested. Tasks 65.1 and 65.2 update the README Features and Test Steps and `docs/deployment.md`.
4. Requirement 46 criterion 8 reads as "no GET `/api/cards/<id>` request", while the V11 modal always loads the Card. Tasks follow the reading of Open issue 72, and task 62.8 tests exactly that.
5. Earlier tasks use no lint command, so `npm run lint` is not part of the V12 verification.
Recommendation for the next requirements revision: reword Requirement 46 criterion 8 as in Open issue 72, and update the names in Properties 76 and 78 (items 1 and 4). No change is needed before the tasks are executed.
#### Implementation changes
- None. No code was changed.

## V13 - 2026-11-28
### Changes
- Design change: removed the root `vercel.json` (legacy `builds` and `routes` keys). The backend project relies on Vercel's Flask auto-detection of `app/wsgi.py`, with Framework Preset Flask and no build, install, or output overrides. Added D10 (V13 refinement) and a V13 note in the deployment section of `design.md`. The V12 D10 row and `vercel.json` block are kept as history.
- Implementation change: deleted `vercel.json`; added root `.python-version` (`3.12`); updated `docs/deployment.md` (architecture table row, serverless risks).
- Bug fix: production `kano-api` returned `404 NOT_FOUND` on every path. The Vercel build finished in 125 ms, the Resources tab showed only "Static Assets" (153 files from `app/`) and no function, and Observability showed no invocations. Cause as diagnosed: the legacy `builds` config prevented the Python function from being built. Not yet verified by a new deployment.
- Not changed: requirements (version header only), application code, `app/wsgi.py`, `.vercelignore`, environment variables.
### Reason
- The deployed backend must serve `/api/health` (Requirements 34.1 and 34.7 are unchanged).
### Impact
- Requirements: none.
- Design: D10 (superseded in part by D10 (V13 refinement)) and the Backend project text of the Vercel deployment section.
- Tasks: new task 70 (70.1 done; 70.2 to 70.4 manual and open). Task 22.1 is unchanged and kept as history.
- Breaking changes: none for the API. Anyone who relied on the root `vercel.json` must use Framework Preset Flask.
- Open: the fix is unverified until 70.2 and 70.3 pass. If it fails, this entry must be corrected, not removed.

## V14 - 2026-11-28
### Changes
- Design change: added a root `pyproject.toml` with `[tool.vercel] entrypoint = "app.wsgi:app"`. Added D10 (V14 refinement) in `design.md`. V13 text is kept.
- Implementation change: created `pyproject.toml`; updated `docs/deployment.md` (entrypoint note). `app/wsgi.py` and all application code are unchanged.
- Bug fix: after V13, the function deployed but every request failed with `ModuleNotFoundError: No module named 'app'` raised from `/var/task/wsgi.py` line 9. Cause as diagnosed: Vercel treated `app/` as the source root and copied its contents to `/var/task`, so the package `app` did not exist. Not yet verified by a new deployment.
### Reason
- The deployed backend must serve `/api/health` (Requirements 34.1 and 34.7 are unchanged).
### Impact
- Requirements: none (version header only).
- Design: D10 gains a V14 refinement.
- Tasks: new task 70.5. Tasks 70.2 to 70.4 stay open and must run after 70.5.
- Breaking changes: none.
- Open and unverified: dependency discovery. Dependencies are only in `app/requirements.txt`; if the next log shows a missing module, add a root `requirements.txt` with `-r app/requirements.txt`. Fallback for the entrypoint: a root `index.py`. If the fix fails, correct this entry, do not remove it.
### V14 correction - 2026-11-28 (same version; V14 was never verified)
- Result of the first V14 attempt: the deployment from commit `1b0bbe8` (which contained `pyproject.toml`) produced the same `ModuleNotFoundError: No module named 'app'` from `/var/task/wsgi.py` line 9. Vercel ignored `[tool.vercel] entrypoint`, or applied it without changing how `app/` was deployed. The `pyproject.toml` approach did not fix the bug.
- Implementation change: deleted `pyproject.toml`. Added a root `index.py` (`from app.wsgi import app`) as the Vercel entrypoint, so `app/` is deployed as a package. Added a root `requirements.txt` (`-r app/requirements.txt`) so the dependencies are found from the root. `app/wsgi.py` and all application code are unchanged.
- Design change: D10 (V14 refinement) and the `design.md` version header now describe the root `index.py` entrypoint. The failed `pyproject.toml` attempt is recorded as history in that row.
- Docs: the `docs/deployment.md` entrypoint note is rewritten.
- Tasks: 70.5 fallback marked done; new task 70.6.
- Verification: local only. From the repository root, `import index` loads the app, and `GET /api/health` through the Flask test client returns `200 {"data":{"status":"ok"}}`. Not yet verified on Vercel (task 70.6, manual step).
