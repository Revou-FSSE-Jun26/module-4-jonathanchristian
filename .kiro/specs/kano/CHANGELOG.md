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
