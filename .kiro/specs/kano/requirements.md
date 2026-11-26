# Requirements Document

**Version:** V11 (adds the URGENT card status and label colors, the overdue notification, the card checklist, workspace links, and the Manager role in the new Part G, with 9 tables, and removes Column management from the role `member`; V10 was a documentation-only change: Requirement 36.10 now asks for at least three screenshots stored in `docs/screenshots/`; V9 was a frontend-only change to the shared Footer: brand, portfolio text, and GitHub and LinkedIn links; V8 changed the Header logo, the Welcome_Page, and the board toolbar; no backend change)

## Introduction

Kano is a Trello-like task management application. Users create boards, organize work into columns, move cards between columns by drag-and-drop, collaborate through comments, and track assigned tasks. The system is a monorepo with a Flask REST API in `app/` and a Next.js frontend in `web/`, both deployed as separate Vercel projects.

### Project Brief

**Overview.** Kano lets teams plan work on boards. Each board has columns, and each column holds cards ordered by a FLOAT order value. The project is built through an AI-driven workflow using Kiro, Antigravity, and Claude Code (specifications, guidelines, code generation, tests and documentation).

**User roles (per board).**
- Board_Admin: the user who created the board. Manages members, oversees all cards, and sees analytics and notifications for the board.
- Board_Manager: a user promoted to manager by the Board_Admin. Manages columns, invitation links, and members and guests below the manager rank, and works on cards like a Board_Member.
- Board_Member: a user added to a board by email or through the member invitation link. Manages cards, checklists, workspace links, and comments on that board, but not its columns.
- Board_Guest: a user who joined a board through the guest invitation link. Has read-only access to the board, its cards, its comments, and its members list.

**Core features.** JWT authentication with short-lived access tokens and long-lived refresh tokens; board, column, and card management; card status (Not started, In progress, Urgent, Done) and label colors; overdue notifications; card checklists; workspace links on cards; board members with roles (admin, manager, member, guest); board invitation links for members and guests; drag-and-drop with FLOAT ordering; comments; notifications on assignment and comment; card search; My Tasks view; user profile (name and password; the email is fixed); board analytics; welcome page for first-time visitors.

**Tech stack.**
- Backend: Python 3.14, Flask, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, flask-cors, PostgreSQL (psycopg2-binary), python-dotenv, Gunicorn, pytest.
- Frontend: Next.js (App Router, TypeScript), React, Tailwind CSS, react-hot-toast, React Testing Library, Playwright.
- Deployment: Vercel (two projects). Railway is an optional alternative for the backend.
- AI tools: Kiro, Antigravity, and Claude Code.

**Non-functional requirements.** See Requirements 27 (responsiveness), 28 (security), 29 (performance), and 30 (maintainability).

### Folder Structure

```
kano-app/
|-- .kiro/specs/kano/        (requirements.md, design.md, tasks.md, CHANGELOG.md)
|-- guidelines/              (frontend.md, backend.md, database.md)
|-- app/                     (Flask backend, project root of the backend)
|   |-- __init__.py            (application factory create_app)
|   |-- config.py              (environment configuration)
|   |-- extensions.py          (SQLAlchemy, Migrate, JWTManager instances)
|   |-- errors.py              (error handlers, Response_Envelope helpers)
|   |-- permissions.py         (shared Board_Membership and role checks)
|   |-- wsgi.py                (entry point)
|   |-- blueprints/<feature>/  (routes.py, service.py, schema.py incl. SQLAlchemy models)
|   |-- tests/
|   |-- migrations/            (generated manually by the user)
|   `-- venv/                  (already exists)
`-- web/                     (Next.js frontend; app/, components/shared/, hooks/, lib/, e2e/, .env.test.example; no src/)
```

## Glossary

- **Kano_API**: The Flask backend located in `app/`.
- **Kano_Web**: The Next.js frontend located in `web/`.
- **User**: A registered account holder.
- **Board**: A container of columns and cards owned by one creator.
- **Board_Admin**: The User who created a Board; holds the admin role on that Board.
- **Board_Manager**: A User promoted to the manager role on a Board by the Board_Admin; the role ranks between Board_Admin and Board_Member.
- **Board_Member**: A User added to a Board by email or through a member Invite_Link; holds the member role on that Board. In access rules, the term Board_Member covers the roles `admin`, `manager`, and `member` (a Board_Admin and a Board_Manager are also Board_Members) and excludes the `guest` role.
- **Board_Guest**: A User who joined a Board through a guest Invite_Link; holds the guest role on that Board. A Board_Guest is read-only and is not a Board_Member.
- **Board_Participant**: A User with a non-deleted Board_Membership on a Board, of any role (`admin`, `manager`, `member`, or `guest`).
- **Board_Membership**: The record linking a User to a Board with a role (`admin`, `manager`, `member`, or `guest`).
- **Column**: An ordered stage within a Board, ordered by a FLOAT value.
- **Card**: A task within a Column with title, description, due date, labels, assignee, Card_Status, an optional `completed_at` timestamp, a FLOAT order value, up to 50 Checklist_Items, and up to 10 Card_Links.
- **Card_Status**: The progress state of a Card, stored as one of the exact strings `NOT_STARTED` (default), `IN_PROGRESS`, `URGENT`, or `DONE`, and shown to users as "Not started", "In progress", "Urgent", and "Done". Only `DONE` is a completed state.
- **Comment**: A text note attached to a Card by a User.
- **Notification**: A record for a User created when a Card is assigned to the User, or when a Comment is added to a Card the User is assigned to or when the User is the Board_Admin of the Card's Board (never for the Comment author).
- **Order_Value**: A FLOAT used to position Columns and Cards; a new position is computed so existing rows need not be renumbered.
- **Soft_Delete**: Marking a row with `is_deleted = true` and a `deleted_at` timestamp instead of removing the row.
- **Response_Envelope**: The JSON shape `{ "data": ... }` for success or `{ "error": "..." }` for failure.
- **JWT**: A JSON Web Token signed by Flask-JWT-Extended, with an expiry, a `sub` claim holding the `user_id`, and a `type` claim.
- **Access_Token**: A JWT with `type` = `access`, issued at login and at refresh, valid for 3600 seconds (1 hour), and accepted by every protected endpoint except POST `/api/auth/refresh`.
- **Refresh_Token**: A JWT with `type` = `refresh`, issued at login, valid for 604800 seconds (7 days), and accepted only by POST `/api/auth/refresh`.
- **Auth_Cookie**: A regular (non-httpOnly) browser cookie so Server Components and the middleware can read a token. There are two: the access cookie holding the Access_Token and the refresh cookie holding the Refresh_Token.
- **AuthContext**: The React context that holds the current User, Access_Token, and Refresh_Token in Kano_Web.
- **ApiError**: The typed error class in `web/lib/errors.ts` with `statusCode` and `message` fields.
- **Migration_Step**: A manual user action: `flask db init`, `flask db migrate`, and `flask db upgrade`.
- **Blueprint_Package**: A directory `app/blueprints/<feature>/` containing `routes.py`, `service.py`, and `schema.py` (Marshmallow schemas and SQLAlchemy models).
- **Guidelines**: The documents `guidelines/frontend.md`, `guidelines/backend.md`, and `guidelines/database.md`.
- **E2E_Suite**: The Playwright test suite run against the live Vercel frontend URL.
- **Invite_Token**: A random, URL-safe, unique string stored on a Board in one of two columns, `member_invite_token` or `guest_invite_token`, that identifies the role granted to a User who accepts it. A Board has exactly one member Invite_Token and one guest Invite_Token at a time.
- **Invite_Link**: The URL `<Kano_Web origin>/invite/<Invite_Token>` built from an Invite_Token.
- **Welcome_Page**: The public page `/welcome` that introduces Kano to a visitor who has not logged in.
- **Welcome_Cookie**: The non-httpOnly cookie `kano_welcome_seen` (value `1`, `SameSite=Lax`, path `/`, lifetime 31536000 seconds) that records that the visitor has already seen the Welcome_Page.
- **Checklist_Item**: A to-do entry of a Card with text, an `is_done` flag, and a FLOAT Order_Value; the progress of a Card is computed as done items over total items and is never stored.
- **Card_Link**: A URL (with a label) to an external work file, such as a Google Drive, OneDrive, Dropbox, or Notion document, attached to a Card; Kano stores only the URL.
- **Overdue_Card**: A non-deleted Card of a non-deleted Board whose due date is earlier than the current UTC date and whose Card_Status is not `DONE`.
- **Role_Rank**: The integer rank of a role on a Board: `guest` 0, `member` 1, `manager` 2, `admin` 3.

## Requirements

## Part A: Backend

### Requirement 1: Backend Project Structure and Setup

**User Story:** As a developer, I want a consistent Flask project layout and dependency setup, so that the backend is easy to maintain and run.

#### Acceptance Criteria

1. THE Kano_API SHALL use `app/` as the backend project root with the directories `blueprints/`, `tests/`, and `migrations/`.
2. THE Kano_API SHALL provide exactly one Blueprint_Package under `app/blueprints/` for each of auth, boards, columns, cards, comments, notifications, analytics, and users (8 packages in total), each containing `routes.py`, `service.py`, and `schema.py`.
3. THE Kano_API SHALL implement in each Blueprint_Package the Flask route handlers of that feature in `routes.py`, the business and data-access logic of that feature in `service.py`, and the Marshmallow schemas and SQLAlchemy model(s) of that feature in `schema.py`.
4. THE Kano_API SHALL define each of the models User, Board, Board_Membership, Column, Card, Checklist_Item, Card_Link, Comment, and Notification exactly once, in the `schema.py` of its owning Blueprint_Package (users: User; boards: Board and Board_Membership; columns: Column; cards: Card, Checklist_Item, and Card_Link; comments: Comment; notifications: Notification), with no `app/models/` directory, and the auth and analytics Blueprint_Packages SHALL define no model.
5. THE Kano_API SHALL provide in `app/` the shared modules `__init__.py` (application factory `create_app`), `config.py`, `extensions.py` (SQLAlchemy, Migrate, and JWTManager instances), `errors.py` (error handlers and Response_Envelope helpers), `permissions.py` (shared Board_Membership and role check helpers), and `wsgi.py` (entry point).
6. THE `service.py` of every Blueprint_Package that enforces Board_Membership or a role SHALL perform the check through the helpers in `app/permissions.py`, as required by Requirement 28 criterion 10.
7. THE Kano_API SHALL allow a Blueprint_Package to import the models of another Blueprint_Package only from the `schema.py` of that package, and to call functions from the `service.py` of another Blueprint_Package, and SHALL NOT allow a Blueprint_Package to import the `routes.py` of another Blueprint_Package.
8. THE Kano_API SHALL reference a model of another Blueprint_Package by string name in every relationship and foreign key that points to that model, so that no circular import occurs.
9. THE application factory SHALL import the `schema.py` of every Blueprint_Package that defines a model before Flask-Migrate runs, so that `flask db migrate` detects all 9 tables (users, boards, board_memberships, columns, cards, comments, notifications, checklist_items, card_links).
10. THE Kano_API SHALL install dependencies into the existing `app/venv` using `py -m pip install`.
11. THE Kano_API SHALL list Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, flask-cors, psycopg2-binary, python-dotenv, Gunicorn, and pytest in `app/requirements.txt`, each pinned to an exact version (`name==version`).
12. WHEN the Kano_API starts, THE Kano_API SHALL read the database URL, JWT secret, Access_Token expiry `JWT_ACCESS_TOKEN_EXPIRES` (in seconds), Refresh_Token expiry `JWT_REFRESH_TOKEN_EXPIRES` (in seconds), and allowed CORS origins (comma-separated list) from environment variables loaded by python-dotenv.
13. IF a required environment variable (database URL, JWT secret, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES`, or allowed CORS origins) is missing or empty at startup, THEN THE Kano_API SHALL fail to start and report an error naming the missing variable, without including any variable values.
14. THE Kano_API SHALL provide `app/.env.example` listing every environment variable read by the Kano_API, each with a placeholder value and no real secrets.
15. THE Kano_API SHALL name classes in PascalCase and functions, variables, modules, and packages in snake_case, in conformance with PEP 8.

### Requirement 2: Database Models and Soft Delete

**User Story:** As a developer, I want a consistent PostgreSQL schema with UUID keys and soft deletes, so that data is traceable and recoverable.

#### Acceptance Criteria

1. THE Kano_API SHALL store data in PostgreSQL accessed through SQLAlchemy.
2. THE Kano_API SHALL define models for User, Board, Board_Membership, Column, Card, Comment, Notification, Checklist_Item, and Card_Link.
3. THE Kano_API SHALL name each primary key `<table_name>_id` (for example `user_id`, `board_id`, `card_id`) and use a UUID type generated by the application when the row is created.
4. THE Kano_API SHALL define every foreign key with an explicit, named constraint using the pattern `fk_<child_table>_<parent_table>`.
5. THE Kano_API SHALL include `created_at`, `updated_at`, `deleted_at` (nullable timestamp), and `is_deleted` (boolean, default false) on every model, store all timestamps in UTC, set `created_at` and `updated_at` to the current UTC time on insert, and set `updated_at` to the current UTC time on every update.
6. THE Kano_API SHALL define the Card `order` column as `db.Column(db.Float)` and the Column `order` column as a FLOAT, and SHALL NOT allow a NULL Order_Value on either.
7. WHEN a delete operation is requested for any resource, THE Kano_API SHALL set `is_deleted` to true and `deleted_at` to the current UTC timestamp instead of removing the row, and SHALL keep the row's other column values unchanged.
8. THE Kano_API SHALL exclude rows where `is_deleted` is true from every query result and every count.
9. WHEN a Board is soft deleted, THE Kano_API SHALL soft delete the Columns, Cards, Comments, Checklist_Items, Card_Links, and Board_Memberships belonging to that Board in the same database transaction, using the same `deleted_at` value as the Board.
10. WHEN a Column is soft deleted, THE Kano_API SHALL soft delete the Cards belonging to that Column, and the Comments, Checklist_Items, and Card_Links belonging to those Cards, in the same database transaction, using the same `deleted_at` value as the Column.
11. WHEN a Card is soft deleted, THE Kano_API SHALL soft delete the Comments, Checklist_Items, and Card_Links belonging to that Card in the same database transaction, using the same `deleted_at` value as the Card.
12. THE Kano_API SHALL store every User email lowercased (normalized on registration and when matching the email of an add-member request; the email cannot change after registration, see Requirement 7) and SHALL enforce a unique lowercased email per non-deleted User and a unique (board, user) pair per non-deleted Board_Membership, so that a soft deleted row does not block creating a new row with the same email or the same (board, user) pair.
13. IF a cascading soft delete fails part-way, THEN THE Kano_API SHALL roll back the whole transaction, leave every affected row unchanged, and return status 500 in the Response_Envelope.
14. IF a write violates a unique constraint, a named foreign key constraint, or a NOT NULL constraint, THEN THE Kano_API SHALL reject the write, leave the stored data unchanged, and return an error in the Response_Envelope without exposing database details.
15. THE Kano_API SHALL restrict the Board_Membership `role` column to the values `admin`, `manager`, `member`, and `guest` with a database check constraint, and SHALL keep the partial unique index of criterion 12 unchanged for all four roles.
16. THE Kano_API SHALL store on each Card a `status` column restricted to the values `NOT_STARTED`, `IN_PROGRESS`, `URGENT`, and `DONE` with a database check constraint, NOT NULL with the default `NOT_STARTED`, and a nullable `completed_at` UTC timestamp column.
17. THE Kano_API SHALL store the Invite_Tokens as the two columns `member_invite_token` and `guest_invite_token` on the `boards` table, each nullable (so that existing rows stay valid) and each protected by a unique constraint that ignores NULL values, and SHALL add no new table.

### Requirement 3: Manual Database Migrations

**User Story:** As the project owner, I want to generate and apply migrations myself, so that I control schema changes.

#### Acceptance Criteria

1. THE Kano_API SHALL install Flask-Migrate and initialize it in the application factory so that the `flask db init`, `flask db migrate`, and `flask db upgrade` commands are available from `app/`.
2. THE Kano_API SHALL leave generation of migration files to the user as a manual Migration_Step and SHALL NOT commit generated migration scripts as part of automated implementation tasks.
3. THE tasks.md document SHALL contain one manual task for the user to run `flask db init`, `flask db migrate`, and `flask db upgrade`, in that order, against the local PostgreSQL database.
4. WHILE the manual Migration_Step task is incomplete, THE tasks.md document SHALL mark every task that requires database tables (including route, service, and pytest tasks that use the database) as blocked by that manual task.
5. WHEN the user marks the manual Migration_Step task complete, THE tasks.md document SHALL allow the blocked tasks to start, and the tables for User, Board, Board_Membership, Column, Card, Comment, and Notification (and, after the V11 Migration_Step of Requirement 44, Checklist_Item and Card_Link) SHALL exist in the local PostgreSQL database.
6. IF the database schema has not been applied, THEN THE Kano_API SHALL return status 500 through the 500 error handler with a generic `{ "error": "<message>" }` Response_Envelope that contains no SQL text, table names, or connection details, and SHALL log the underlying exception.
7. IF the database is unreachable when a request needs it, THEN THE Kano_API SHALL return status 500 through the same 500 error handler with the same generic Response_Envelope, and SHALL keep running to serve later requests.
8. WHEN the V6 models are implemented (Requirement 2 criteria 15 to 17), THE tasks.md document SHALL contain one additional manual Migration_Step task in which the user runs `flask db migrate` and `flask db upgrade` from `app/` against the local development database and the test database, and SHALL mark every V6 task that needs the new columns (status, `completed_at`, Invite_Tokens, role `guest`) and every pytest task that uses them as blocked by that task. The production database is not deployed yet, so no production migration applies to V6.
9. THE V6 Migration_Step SHALL add new columns to the existing tables `boards` and `cards` and a check constraint on `board_memberships.role`, and SHALL add no table (this describes the V6 step; the V11 step adds two tables, see Requirement 44 criterion 1).
10. WHERE the user wants cards that are currently in a Column named `Done` (case-insensitive) to count as completed, THE user MAY run an optional manual SQL backfill that sets `status` to `DONE` and `completed_at` to the Card's `updated_at` for those non-deleted Cards, and this backfill SHALL NOT be an automated task. Existing Cards without the backfill keep `status` `NOT_STARTED` and `completed_at` NULL.
11. WHEN the V11 models are implemented (Requirement 44), THE tasks.md document SHALL contain one additional manual Migration_Step task as defined in Requirement 44 criterion 1, and SHALL mark every V11 task that needs the new constraint values, the new index, or the new tables, and every pytest task that uses them, as blocked by that task.

### Requirement 4: Response Envelope, Validation, and Error Handling

**User Story:** As a frontend developer, I want uniform API responses and errors, so that the client can handle them predictably.

#### Acceptance Criteria

1. WHEN a request succeeds, THE Kano_API SHALL return the exact success status code defined in criterion 3 with a JSON body whose only top-level key is `data`, in the form `{ "data": ... }`.
2. THE Kano_API SHALL set the status code on the HTTP status line of every response and SHALL NOT repeat the status code as a field in the JSON body, and the JSON body SHALL contain no top-level key other than `data` or `error`.
3. WHEN a POST request creates a resource (POST `/api/auth/register`, `/api/boards`, `/api/boards/<id>/members`, `/api/boards/<id>/columns`, `/api/columns/<id>/cards`, `/api/cards/<id>/comments`, `/api/cards/<id>/checklist`, and `/api/cards/<id>/links`), THE Kano_API SHALL return status 201, and WHEN any other request succeeds (POST `/api/auth/login`, POST `/api/auth/refresh`, POST `/api/invites/<token>/accept`, POST `/api/boards/<id>/invite-links/<role>/regenerate`, every GET including `/api/health`, every PATCH including `/api/cards/<id>/position`, `/api/boards/<id>/columns/reorder`, and `/api/notifications/<id>/read`, and every DELETE), THE Kano_API SHALL return status 200.
4. WHEN a DELETE request succeeds, THE Kano_API SHALL return status 200 with a body of the form `{ "data": ... }` containing a JSON object (for example the id of the deleted resource), and SHALL NOT return status 204 or an empty body.
5. IF a request fails, THEN THE Kano_API SHALL return the exact HTTP status code defined in criterion 6 for the failure type, with a JSON body whose only top-level key is `error`, in the form `{ "error": "<message>" }`, where `<message>` is a non-empty string of at most 500 characters.
6. THE Kano_API SHALL map failures to status codes as follows: request validation failure 400; missing, malformed, invalid, expired, or wrong-type JWT (a Refresh_Token on a protected endpoint or an Access_Token on POST `/api/auth/refresh`) 401; permission or Board_Membership failure 403; missing or soft-deleted resource, or a path id that is not a valid UUID, 404; unsupported method 405; unique-constraint conflict (duplicate) 409; unhandled exception or database failure 500.
7. IF a requirement states that the Kano_API returns an error without naming a status code, THEN THE Kano_API SHALL apply the mapping in criterion 6, returning 409 for a unique-constraint violation, 400 for a foreign-key or NOT NULL violation, and 500 for any other unexpected failure.
8. THE Kano_API SHALL return every error message as a human-readable string, and for status 500 the message SHALL be generic and contain no stack trace, SQL text, or database details.
9. THE Kano_API SHALL validate every request body and query string with a Marshmallow schema defined in the Blueprint_Package `schema.py`.
10. IF request validation fails, THEN THE Kano_API SHALL return status 400 with an error message that names each invalid field, and SHALL NOT change any stored data.
11. IF an unhandled exception occurs, THEN THE Kano_API SHALL return status 500 with a generic error message that contains no stack trace, SQL text, or database details, SHALL log the exception, and SHALL roll back any uncommitted database changes from that request.
12. IF a requested resource does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
13. IF a request to a protected endpoint has a missing, malformed, invalid-signature, expired, or wrong-type JWT (a Refresh_Token), THEN THE Kano_API SHALL return status 401.
14. IF an authenticated User lacks permission for the requested resource, THEN THE Kano_API SHALL return status 403.
15. THE Kano_API SHALL serialize every UUID as a lowercase hyphenated string of 36 characters and every timestamp as an ISO 8601 UTC string ending in `Z` or `+00:00`.
16. THE Kano_API SHALL enable CORS only for the origins listed in the allowed-origins environment variable and SHALL allow the `Authorization` and `Content-Type` headers.
17. IF a request comes from an origin that is not in the allowed-origins environment variable, THEN THE Kano_API SHALL omit the CORS allow-origin header from the response.
18. IF a request is sent to a path or method that the Kano_API does not define, THEN THE Kano_API SHALL return status 404 or 405 respectively, in the `{ "error": "<message>" }` form.

### Requirement 5: Health Check

**User Story:** As an operator, I want a health endpoint, so that I can verify the deployed API is running.

#### Acceptance Criteria

1. WHEN a client sends GET `/api/health` with or without an Authorization header, THE Kano_API SHALL return status 200 with the body `{ "data": { "status": "ok" } }` within 500 ms, without requiring authentication.
2. WHEN a client sends GET `/api/health`, THE Kano_API SHALL return the response without reading or writing any database rows.
3. IF a client sends a request to `/api/health` with a method other than GET, THEN THE Kano_API SHALL return status 405 with `{ "error": "<message>" }` indicating the method is not allowed.
4. IF an unhandled exception occurs while processing GET `/api/health`, THEN THE Kano_API SHALL return status 500 with `{ "error": "<message>" }` containing a generic message that exposes no internal details.

### Requirement 6: Authentication

**User Story:** As a visitor, I want to register and log in, so that I can access my boards.

#### Acceptance Criteria

1. WHEN a client sends POST `/api/auth/register` with a name of 1 to 100 characters, an email in valid format of up to 254 characters, and a password of 8 to 128 characters, THE Kano_API SHALL create a User with the email stored lowercased and a salted password hash and return status 201 with the User profile (user id, name, email, created_at) excluding the password and password hash.
2. IF the email in a registration request matches, case-insensitively, the email of a non-deleted User, THEN THE Kano_API SHALL return status 409 with an error message indicating the email is already registered and SHALL NOT create a User.
3. IF a registration request has a missing or empty name, a name longer than 100 characters, a missing or malformed email, an email longer than 254 characters, or a missing password, a password shorter than 8 characters, or a password longer than 128 characters, THEN THE Kano_API SHALL return status 400 with an error message identifying the invalid field and SHALL NOT create a User.
4. WHEN a client sends POST `/api/auth/login` with a valid email (matched after lowercasing) and password of a non-deleted User, THE Kano_API SHALL return status 200 with `{ "data": { "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "refresh_expires_in": 604800, "user": <profile> } }`, where `expires_in` equals `JWT_ACCESS_TOKEN_EXPIRES`, `refresh_expires_in` equals `JWT_REFRESH_TOKEN_EXPIRES` (both in seconds, the values shown are the defaults), and the profile excludes the password and password hash.
5. THE Kano_API SHALL issue the Access_Token with `type` = `access` and an expiry of `JWT_ACCESS_TOKEN_EXPIRES` seconds (3600 in the default configuration), SHALL issue the Refresh_Token with `type` = `refresh` and an expiry of `JWT_REFRESH_TOKEN_EXPIRES` seconds (604800 in the default configuration), and SHALL include the `user_id` as the `sub` claim of both tokens.
6. IF a login request has an unknown email, a wrong password, or an email that belongs only to a soft-deleted User, THEN THE Kano_API SHALL return status 401 with an identical error message in every one of these cases and SHALL NOT issue an Access_Token or a Refresh_Token.
7. IF a login request has a missing or empty email or password, or a malformed email, THEN THE Kano_API SHALL return status 400 with an error message identifying the invalid field and SHALL NOT issue an Access_Token or a Refresh_Token.
8. THE Kano_API SHALL store only salted password hashes and SHALL exclude the password hash from every API response.
9. WHEN a client sends a request to a protected endpoint with an Access_Token whose subject belongs to a soft-deleted or nonexistent User, THE Kano_API SHALL return status 401.
10. WHEN a client sends POST `/api/auth/refresh` with the header `Authorization: Bearer <refresh_token>` carrying a valid, unexpired Refresh_Token whose subject belongs to a non-deleted User, THE Kano_API SHALL return status 200 with `{ "data": { "access_token", "token_type": "Bearer", "expires_in": 3600 } }`, where the new Access_Token has `type` = `access`, the same `sub`, and an expiry of `JWT_ACCESS_TOKEN_EXPIRES` seconds, and SHALL NOT return a new Refresh_Token.
11. IF a POST `/api/auth/refresh` request has a missing, malformed, invalid-signature, or expired Refresh_Token, THEN THE Kano_API SHALL return status 401.
12. IF a POST `/api/auth/refresh` request carries an Access_Token, THEN THE Kano_API SHALL return status 401 and SHALL NOT issue a token.
13. IF a POST `/api/auth/refresh` request carries a Refresh_Token whose subject belongs to a soft-deleted or nonexistent User, THEN THE Kano_API SHALL return status 401 and SHALL NOT issue a token.
14. IF a request to any protected endpoint other than POST `/api/auth/refresh` carries a Refresh_Token, THEN THE Kano_API SHALL return status 401 and SHALL NOT perform the action.
15. THE Kano_API SHALL keep Refresh_Tokens stateless, with no server-side storage, rotation, or revocation, so a Refresh_Token remains usable until it expires, and a client logout SHALL only clear the tokens held by the client.

### Requirement 7: Users

**User Story:** As a user, I want to view and update my profile, so that my details stay current.

#### Acceptance Criteria

1. WHEN an authenticated client sends GET `/api/users/me`, THE Kano_API SHALL return status 200 with the current User's `user_id`, name, and email, and SHALL exclude the password and password hash.
2. WHEN an authenticated client sends PATCH `/api/users/me` with a `name` of 1 to 100 characters and/or a `password` of 8 to 128 characters together with a `current_password` that matches the stored password, THE Kano_API SHALL update only the supplied fields, store a supplied password as a salted hash, return status 200 with the updated profile (user id, name, email, created_at) excluding the password and password hash, and set `updated_at` to the current UTC timestamp.
3. IF a PATCH `/api/users/me` request contains an `email` field with any value, THEN THE Kano_API SHALL return status 400 with an error message naming the field `email` and leave the User unchanged, because the email cannot be changed after registration.
4. IF a PATCH `/api/users/me` request contains a `password` and the `current_password` is missing or does not match the stored password, THEN THE Kano_API SHALL return status 400 (and not status 403) with an error message naming the field `current_password`, and leave the User unchanged, including the name when the same request also contains a name.
5. IF a PATCH `/api/users/me` request has an empty name, a name longer than 100 characters, a password shorter than 8 or longer than 128 characters, a `current_password` without a `password`, or a body with neither `name` nor `password`, THEN THE Kano_API SHALL return status 400 with an error message identifying each invalid field and leave the User unchanged.
6. IF a request to GET or PATCH `/api/users/me` has a missing, malformed, invalid-signature, expired, or wrong-type JWT (a Refresh_Token), or a JWT whose subject belongs to a soft-deleted or nonexistent User, THEN THE Kano_API SHALL return status 401 and leave the User unchanged.
7. THE Kano_API SHALL NOT provide any endpoint to delete or deactivate a User, and soft-deleted Users SHALL exist only as seed data created directly in the database by tests (Requirements 6.6, 6.9, 6.13, and 31.11 are tested with such seed data).
8. THE Kano_API SHALL exclude `password`, `current_password`, and the password hash from every response and from all log output of PATCH `/api/users/me`, including requests that fail with status 400.

### Requirement 8: Boards

**User Story:** As a user, I want to create and manage boards, so that I can organize projects.

#### Acceptance Criteria

1. WHEN an authenticated client sends POST `/api/boards` with a name of 1 to 100 characters, THE Kano_API SHALL create the Board, create a Board_Membership with the admin role for the creator in the same transaction, and return status 201 with the Board including its `board_id`, name, and the creator's role.
2. WHEN an authenticated client sends GET `/api/boards`, THE Kano_API SHALL return every non-deleted Board in which the current User has a non-deleted Board_Membership, including the User's role on each Board, ordered by `created_at` descending, and SHALL return an empty list with status 200 if the User has no Boards.
3. WHEN a Board_Member sends GET `/api/boards/<id>`, THE Kano_API SHALL return the Board with its non-deleted Columns ordered by Order_Value ascending and each Column's non-deleted Cards ordered by Order_Value ascending.
4. WHEN a Board_Admin sends PATCH `/api/boards/<id>` with a name of 1 to 100 characters, THE Kano_API SHALL update the Board name, and return status 200 with the updated Board.
5. WHEN a Board_Admin sends DELETE `/api/boards/<id>`, THE Kano_API SHALL soft delete the Board and return status 200.
6. IF a User without a non-deleted Board_Membership sends GET, PATCH, or DELETE `/api/boards/<id>` for an existing non-deleted Board, THEN THE Kano_API SHALL return status 403 and leave the Board unchanged.
7. IF a Board_Member who is not the Board_Admin sends PATCH or DELETE `/api/boards/<id>`, THEN THE Kano_API SHALL return status 403 and leave the Board unchanged.
8. IF a Board name is missing, empty, consists only of whitespace, or is longer than 100 characters in a POST or PATCH request, THEN THE Kano_API SHALL return status 400 and leave existing data unchanged.
9. IF the Board identified by `<id>` does not exist, is soft deleted, or `<id>` is not a valid UUID, THEN THE Kano_API SHALL return status 404 for GET, PATCH, and DELETE `/api/boards/<id>`.
10. IF a Board creation request fails after the Board row is created but before the admin Board_Membership and the two Invite_Tokens (Requirement 37 criterion 3) are stored, THEN THE Kano_API SHALL roll back all of these records and return status 500 with the Response_Envelope.
11. WHEN a Board_Guest sends GET `/api/boards/<id>`, THE Kano_API SHALL return the same Board detail as for a Board_Member (Columns and Cards ordered as in criterion 3), with `my_role` equal to `guest`.
12. IF a Board_Guest sends PATCH or DELETE `/api/boards/<id>`, THEN THE Kano_API SHALL return status 403 and leave the Board unchanged.

### Requirement 9: Board Members and Roles

**User Story:** As a board admin, I want to add and remove members by email, so that I control who can access the board.

#### Acceptance Criteria

1. WHEN a Board_Admin or a Board_Manager sends POST `/api/boards/<id>/members` with a valid email, THE Kano_API SHALL create a Board_Membership with the member role for the non-deleted User whose stored (lowercased) email equals the lowercased request email, and return status 201 with the new membership's user name, email, and role.
2. IF the email in an add-member request is missing, is longer than 254 characters, or is not a valid email format, THEN THE Kano_API SHALL return status 400 and create no Board_Membership.
3. IF no non-deleted User has the email in an add-member request, THEN THE Kano_API SHALL return status 404 and create no Board_Membership.
4. IF the User with the email in an add-member request already has a non-deleted Board_Membership on the Board, THEN THE Kano_API SHALL return status 409 and leave the existing Board_Membership unchanged.
5. WHEN a Board_Member sends GET `/api/boards/<id>/members`, THE Kano_API SHALL return every non-deleted Board_Membership of the Board, each with user_id, user name, email, and role, ordered by Board_Membership creation time ascending.
6. WHEN a Board_Admin or a Board_Manager sends DELETE `/api/boards/<id>/members/<user_id>` for a Board_Participant whose role ranks below the role of the caller (Requirement 43 criterion 6), THE Kano_API SHALL soft delete that Board_Membership and return status 200.
7. IF a Board_Admin sends DELETE `/api/boards/<id>/members/<user_id>` where `user_id` is the Board_Admin's own user_id, THEN THE Kano_API SHALL return status 400 and leave the Board_Membership unchanged.
8. IF a DELETE `/api/boards/<id>/members/<user_id>` request names a User who has no non-deleted Board_Membership on the Board, THEN THE Kano_API SHALL return status 404.
9. IF a Board_Member whose role is `member` sends POST or DELETE to a members endpoint, THEN THE Kano_API SHALL return status 403 and make no change.
10. IF a User without a non-deleted Board_Membership on the Board sends GET, POST, or DELETE to a members endpoint, THEN THE Kano_API SHALL return status 403.
11. WHEN a Board_Membership is soft deleted, THE Kano_API SHALL set the assignee to empty on every non-deleted Card of that Board assigned to the removed User, within the same transaction as the removal.
12. WHEN a User whose Board_Membership was soft deleted sends any request to that Board's endpoints, THE Kano_API SHALL return status 403.
13. WHEN a Board_Guest sends GET `/api/boards/<id>/members`, THE Kano_API SHALL return the member list as described in criterion 5, with the role `guest` included for guest rows.
14. IF a Board_Guest sends POST or DELETE to a members endpoint, THEN THE Kano_API SHALL return status 403 and make no change.
15. WHEN a Board_Admin sends DELETE `/api/boards/<id>/members/<user_id>` for a Board_Guest, THE Kano_API SHALL soft delete that Board_Membership and return status 200, as in criterion 6.

### Requirement 10: Columns

**User Story:** As a board admin or manager, I want to add, rename, delete, and reorder columns, so that the board reflects my workflow.

#### Acceptance Criteria

1. WHEN a Board_Admin or a Board_Manager sends POST `/api/boards/<id>/columns` with a name of 1 to 100 characters, THE Kano_API SHALL create a Column with an Order_Value greater than the highest Order_Value among the non-deleted Columns of the Board (or 1.0 if the Board has no non-deleted Columns), and return status 201 with the created Column.
2. WHEN a Board_Admin or a Board_Manager sends PATCH `/api/columns/<id>` with a name of 1 to 100 characters, THE Kano_API SHALL update the Column name and return status 200 with the updated Column.
3. WHEN a Board_Admin or a Board_Manager sends DELETE `/api/columns/<id>`, THE Kano_API SHALL soft delete the Column and its Cards and return status 200.
4. WHEN a Board_Admin or a Board_Manager sends PATCH `/api/boards/<id>/columns/reorder` with a Column identifier (UUID) and a new Order_Value greater than 0, THE Kano_API SHALL store the new Order_Value for that Column and return status 200 with the updated Column.
5. IF a reorder request references a Column that does not belong to the Board, THEN THE Kano_API SHALL return status 400 and leave every Column Order_Value unchanged.
6. IF a Column name is empty, consists only of whitespace, or is longer than 100 characters, THEN THE Kano_API SHALL return status 400 and leave the Column data unchanged.
7. IF the current User is not a Board_Admin or a Board_Manager of the Column's Board, THEN THE Kano_API SHALL return status 403 and leave the Column data unchanged.
8. IF a reorder request has a Column identifier that is not a valid UUID, or an Order_Value that is not a number greater than 0, THEN THE Kano_API SHALL return status 400 and leave every Column Order_Value unchanged.
9. IF the Column or Board targeted by a request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404 and leave the data unchanged.
10. IF a Board_Guest sends POST `/api/boards/<id>/columns`, PATCH `/api/columns/<id>`, DELETE `/api/columns/<id>`, or PATCH `/api/boards/<id>/columns/reorder`, THEN THE Kano_API SHALL return status 403 and leave the Column data unchanged.
11. IF a Board_Member whose role is `member` sends POST `/api/boards/<id>/columns`, PATCH `/api/columns/<id>`, DELETE `/api/columns/<id>`, or PATCH `/api/boards/<id>/columns/reorder`, THEN THE Kano_API SHALL return status 403 and leave the Column data unchanged (V11 breaking change: the role `member` no longer manages Columns).

### Requirement 11: Cards

**User Story:** As a board member, I want to create, edit, move, find, and delete cards, so that I can track work.

#### Acceptance Criteria

1. WHEN a Board_Member sends POST `/api/columns/<id>/cards` with a title, THE Kano_API SHALL create a Card with an Order_Value greater than the highest existing non-deleted Order_Value in that Column (or 1.0 if the Column has no Cards) and return status 201 with the created Card.
2. THE Kano_API SHALL store on each Card a title (required, 1 to 200 characters), description (optional, up to 5,000 characters), due date (optional, ISO 8601 date), labels (optional list of up to 10 strings, each 1 to 30 characters), assignee (optional, a Board_Member with the role `admin`, `manager`, or `member`), status (Card_Status, default `NOT_STARTED`), completed_at (optional UTC timestamp), Order_Value, and Column.
3. WHEN a Board_Member sends PATCH `/api/cards/<id>` with card fields, THE Kano_API SHALL update only the supplied fields, leave all other fields unchanged, and return the updated Card.
4. IF a create or update request has a missing or empty title, a title longer than 200 characters, a description longer than 5,000 characters, a due date that is not a valid ISO 8601 date, a labels list that exceeds 10 items or contains an item outside 1 to 30 characters, or a `status` that is not exactly `NOT_STARTED`, `IN_PROGRESS`, `URGENT`, or `DONE` (case-sensitive, so an empty string, null, or lowercase value is invalid), THEN THE Kano_API SHALL return status 400 and leave the Card unchanged.
5. IF the assignee in a create or update request is not a Board_Member of the Card's Board, THEN THE Kano_API SHALL return status 400 and leave the Card unchanged.
6. WHEN a Board_Member sends DELETE `/api/cards/<id>`, THE Kano_API SHALL soft delete the Card and its Comments and return status 200.
7. WHEN a Board_Member sends PATCH `/api/cards/<id>/position` with a `column_id` (UUID) and an `order` (float greater than 0), THE Kano_API SHALL validate the body with CardPositionSchema, move the Card to that Column with that Order_Value, and return the updated Card.
8. IF a position request names a Column in a different Board than the Card, or a Column that does not exist or is soft deleted, THEN THE Kano_API SHALL return status 400 and leave the Card's Column and Order_Value unchanged.
9. IF a position request has a `column_id` that is not a valid UUID or an `order` that is not a float greater than 0, THEN THE Kano_API SHALL return status 400 and leave the Card's Column and Order_Value unchanged.
10. WHEN an authenticated client sends GET `/api/cards?assignee=me`, THE Kano_API SHALL return the non-deleted Cards assigned to the current User on non-deleted Boards, each with its Board id, Board name, and Column name, and SHALL return an empty list when no Cards match.
11. WHEN an authenticated client sends GET `/api/cards?q=<text>` where the text is 1 to 100 characters, THE Kano_API SHALL return the non-deleted Cards, across Boards where the current User is a Board_Participant (admin, member, or guest), whose title or description contains the text, case-insensitively, and SHALL return an empty list when no Cards match.
12. WHERE the query parameter `board_id` is supplied together with `q`, THE Kano_API SHALL restrict the search results to that Board.
13. IF `board_id` is supplied together with `q` and the current User is not a Board_Participant of that Board, THEN THE Kano_API SHALL return status 403.
14. IF a GET `/api/cards` request has neither `assignee=me` nor `q`, has an empty `q`, has a `q` longer than 100 characters, or has a `board_id` that is not a valid UUID, THEN THE Kano_API SHALL return status 400.
15. IF the current User is not a Board_Member of the Card's Board, THEN THE Kano_API SHALL return status 403 for every Card endpoint that targets a single Card and for card creation in a Column of that Board.
16. WHEN a Board_Admin requests GET `/api/boards/<id>`, THE Kano_API SHALL return all non-deleted Cards of the Board regardless of assignee.
17. WHEN a Board_Member sends POST `/api/columns/<id>/cards`, THE Kano_API SHALL create the Card with `status` `NOT_STARTED` and `completed_at` NULL, and IF the request body contains a `status` field, THEN THE Kano_API SHALL return status 400 with an error message naming the field `status` and create no Card.
18. WHEN a Board_Member sends PATCH `/api/cards/<id>` with a valid `status`, THE Kano_API SHALL update the status together with any other supplied fields, leave unsupplied fields unchanged, and return the updated Card.
19. WHEN the `status` of a Card changes to `DONE` from another value, THE Kano_API SHALL set `completed_at` to the current UTC time, WHEN the `status` changes from `DONE` to another value, THE Kano_API SHALL set `completed_at` to NULL, and IF the `status` is unchanged (including `DONE` to `DONE`, and any change among `NOT_STARTED`, `IN_PROGRESS`, and `URGENT`, because `URGENT` is not a completed state) or not supplied, THEN THE Kano_API SHALL leave `completed_at` unchanged.
20. THE Kano_API SHALL include `status` and `completed_at` in every Card representation it returns (board detail, search, My Tasks, create, update, and position responses).
21. WHEN a Board_Member sends PATCH `/api/cards/<id>/position`, THE Kano_API SHALL leave the `status` and `completed_at` of the Card unchanged, including when the target Column is named `Done` (case-insensitive), and SHALL NOT require a Card with `status` `DONE` to be in any particular Column.
22. IF the assignee in a create or update request is a Board_Guest, THEN THE Kano_API SHALL return status 400 and leave the Card unchanged.
23. IF a Board_Guest sends POST `/api/columns/<id>/cards`, PATCH `/api/cards/<id>`, DELETE `/api/cards/<id>`, or PATCH `/api/cards/<id>/position`, THEN THE Kano_API SHALL return status 403, leave the Card unchanged, and, for PATCH, SHALL NOT change the status or the assignee.
24. THE Kano_API SHALL treat every Card that existed before the V6 migration as having `status` `NOT_STARTED` and `completed_at` NULL, unless the optional manual backfill of Requirement 3 criterion 10 was run.

### Requirement 12: Comments

**User Story:** As a board member, I want to comment on cards, so that the team can discuss work.

#### Acceptance Criteria

1. WHEN a Board_Member sends POST `/api/cards/<id>/comments` with content of 1 to 2,000 characters that contains at least one non-whitespace character, THE Kano_API SHALL create a Comment owned by the current User and return status 201 with the Comment, including its id, content, author name, and creation time.
2. WHEN a Board_Member sends GET `/api/cards/<id>/comments`, THE Kano_API SHALL return the non-deleted Comments of the Card ordered by creation time ascending, each with the author name, and SHALL return an empty list with status 200 if the Card has no Comments.
3. WHEN the Comment owner sends PATCH `/api/comments/<id>` with content of 1 to 2,000 characters that contains at least one non-whitespace character, THE Kano_API SHALL update the Comment content, set `updated_at` to the current UTC timestamp, and return status 200 with the updated Comment.
4. WHEN the Comment owner sends DELETE `/api/comments/<id>`, THE Kano_API SHALL soft delete the Comment and return status 200.
5. IF a comment create or update request has missing content, content that is empty or whitespace only, or content longer than 2,000 characters, THEN THE Kano_API SHALL return status 400 and leave the stored Comments unchanged.
6. IF a comment request has a missing, invalid, or expired JWT, THEN THE Kano_API SHALL return status 401.
7. IF a User other than the Comment owner sends PATCH or DELETE `/api/comments/<id>`, THEN THE Kano_API SHALL return status 403 and leave the Comment unchanged, including when that User is a Board_Admin.
8. IF the current User is not a Board_Participant of the Card's Board, THEN THE Kano_API SHALL return status 403 for comment creation and listing and SHALL NOT create or return any Comment.
9. IF the Card or Comment identified in a comment request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
10. WHEN a Board_Guest sends GET `/api/cards/<id>/comments`, THE Kano_API SHALL return the non-deleted Comments of the Card as described in criterion 2.
11. IF a Board_Guest sends POST `/api/cards/<id>/comments`, PATCH `/api/comments/<id>`, or DELETE `/api/comments/<id>`, THEN THE Kano_API SHALL return status 403 and leave the Comments unchanged.

### Requirement 13: Notifications

**User Story:** As a user, I want to be notified about assignments and comments, so that I can react quickly.

#### Acceptance Criteria

1. WHEN a Card is created with an assignee other than the current User, or a Card update changes the assignee to a User other than the current User, THE Kano_API SHALL create one Notification of type `assignment` for the new assignee with the Card reference and a message containing the Card title.
2. WHEN a Comment is added to a Card whose assignee is not the Comment author, THE Kano_API SHALL create one Notification of type `comment` for the Card assignee with the Card reference and a message containing the Card title and the Comment author name.
3. WHEN a Comment is added to a Card, THE Kano_API SHALL create one Notification of type `comment` for the Board_Admin, unless the Board_Admin is the Comment author or is the Card assignee who already received a Notification for that Comment.
4. THE Kano_API SHALL store on each Notification the recipient, type (`assignment` or `comment`), Card reference, message (1 to 255 characters), `is_read` flag (default false), and creation time.
5. WHEN an authenticated client sends GET `/api/notifications` with optional `page` and `per_page` parameters, THE Kano_API SHALL return only the current User's non-deleted Notifications, ordered newest first, with pagination metadata (page, per_page, total) and the unread count of all the User's non-deleted unread Notifications.
6. WHERE `page` and `per_page` are omitted, THE Kano_API SHALL use page 1 and 20 per page.
7. IF `page` or `per_page` is not an integer from 1 to 2,147,483,647, or `per_page` exceeds 100, THEN THE Kano_API SHALL return status 400 and return no Notifications.
8. IF `page` exceeds the last page, THEN THE Kano_API SHALL return status 200 with an empty list, the unchanged total, and the unread count.
9. WHEN the recipient sends PATCH `/api/notifications/<id>/read`, THE Kano_API SHALL set `is_read` to true and return the Notification, and repeating the request SHALL return status 200 with `is_read` still true.
10. IF a User other than the recipient sends PATCH `/api/notifications/<id>/read`, THEN THE Kano_API SHALL return status 403 and leave `is_read` unchanged.
11. IF the Notification in a PATCH `/api/notifications/<id>/read` request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
12. THE Kano_API SHALL create no Notification for a Board_Guest, because a Board_Guest cannot be an assignee, and SHALL create no Notification when a User accepts an Invite_Link.

### Requirement 14: Analytics

**User Story:** As a board admin, I want board analytics, so that I can monitor team activity.

#### Acceptance Criteria

1. WHEN a Board_Admin sends GET `/api/boards/<id>/analytics`, THE Kano_API SHALL return status 200 with the Card count for every non-deleted Column of the Board (0 for a Column without Cards), the number of Cards completed this week, and the member activity for every Board_Member.
2. THE Kano_API SHALL treat a non-deleted Card of the Board as completed when its `status` is `DONE`, regardless of the Column it is in, and count it in the current week when its `completed_at` falls from Monday 00:00:00 UTC of the current week up to and including the request time.
3. IF no non-deleted Card of the Board has `status` `DONE` with a `completed_at` in the current week, THEN THE Kano_API SHALL return 0 as the number of Cards completed this week.
4. THE Kano_API SHALL compute member activity as, for each Board_Member, the number of non-deleted Cards of the Board assigned to that Board_Member and the number of non-deleted Comments written by that Board_Member on Cards of the Board, returning 0 for each count when none exist.
5. THE Kano_API SHALL compute all analytics values through SQLAlchemy joins and aggregations in the analytics service layer.
6. THE Kano_API SHALL exclude soft-deleted Columns, Cards, Comments, and Board_Memberships from every analytics count.
7. IF a Board_Member who is not the Board_Admin requests the analytics of a Board, THEN THE Kano_API SHALL return status 403 and no analytics data.
8. IF the Board does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
9. IF a request to the analytics endpoint has a missing, invalid, or expired JWT, THEN THE Kano_API SHALL return status 401.
10. IF a Board_Guest requests the analytics of a Board, THEN THE Kano_API SHALL return status 403 and no analytics data, and the member activity of criterion 4 SHALL list only Board_Members (roles `admin`, `manager`, and `member`).

## Part B: Frontend

### Requirement 15: Frontend Project Structure and Setup

**User Story:** As a developer, I want a clear Next.js layout, so that frontend code is organized around the API routes.

#### Acceptance Criteria

1. THE Kano_Web SHALL be scaffolded inside `web/` using Next.js with the App Router and TypeScript, with routes in `web/app/` and no `src/` directory.
2. THE Kano_Web SHALL use Tailwind CSS for styling, with Tailwind utility classes applied in `web/app/` pages and components and a Tailwind configuration that scans `web/app/`, `web/components/`, and `web/hooks/` for class names.
3. THE Kano_Web SHALL place shared components in `web/components/shared/`, hooks in `web/hooks/`, and library code in `web/lib/`.
4. THE Kano_Web SHALL organize pages and feature components in one directory per API resource (auth, boards, cards, comments, notifications, users), and each directory SHALL contain only files for that resource.
5. THE Kano_Web SHALL provide `web/.env.example` listing exactly the variables `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL`, each with a placeholder URL value and no real secrets.
6. WHEN `npm run build` is run from `web/` on a fresh clone with `.env.local` created from `web/.env.example`, THE Kano_Web SHALL complete the build with exit code 0 and zero TypeScript compile errors.
7. IF `NEXT_PUBLIC_API_BASE_URL` or `API_BASE_URL` is missing when the apiClient makes a request, THEN THE Kano_Web SHALL throw an error naming the missing variable and SHALL NOT send the request.

### Requirement 16: API Client, Errors, and Toasts

**User Story:** As a frontend developer, I want a typed API client and consistent error feedback, so that API calls are uniform.

#### Acceptance Criteria

1. WHEN a request returns a 2xx status with a Response_Envelope body, THE apiClient in `lib/apiClient.ts` SHALL return the value of the `data` field typed as the caller-supplied generic type.
2. WHILE running in a Client Component, THE apiClient SHALL read the base URL from `NEXT_PUBLIC_API_BASE_URL`.
3. WHILE running in a Server Component, THE apiClient SHALL read the base URL from `API_BASE_URL`.
4. IF the base URL variable for the current runtime is missing or empty, THEN THE apiClient SHALL throw an ApiError with `statusCode` 0 and a message indicating that the API base URL is not configured, without sending a request.
5. WHERE an Access_Token is available, THE apiClient SHALL attach the header `Authorization: Bearer <access_token>`, and WHERE no Access_Token is available, THE apiClient SHALL omit the `Authorization` header.
6. IF a response has a non-2xx status, THEN THE apiClient SHALL throw an ApiError with the response `statusCode` and the `error` message from the Response_Envelope.
7. IF a response has a non-2xx status and its body is not a valid Response_Envelope, THEN THE apiClient SHALL throw an ApiError with the response `statusCode` and a generic message indicating an unexpected server response.
8. IF a request fails because of a network error or does not receive a response within 10 seconds, THEN THE apiClient SHALL throw an ApiError with `statusCode` 0 and a message indicating that the server could not be reached.
9. THE Kano_Web SHALL define the ApiError class in `lib/errors.ts` with a numeric `statusCode` field and a string `message` field.
10. THE Kano_Web SHALL provide `lib/toast.ts` with `showSuccess`, `showError`, and `showLoading` helpers that call `toast.success()`, `toast.error()`, and `toast.loading()` from react-hot-toast, each accepting a message string of 1 to 200 characters.
11. WHEN the `hooks/useErrorHandler.ts` hook receives an ApiError with status 400, 401, 403, 404, 409, or 500, THE useErrorHandler hook SHALL show one error toast with a distinct message for that status code.
12. IF the useErrorHandler hook receives an ApiError with a status code not in the set 400, 401, 403, 404, 409, 500, or an error that is not an ApiError, THEN THE useErrorHandler hook SHALL show one error toast with a generic message.
13. WHEN the useErrorHandler hook handles an ApiError with status 401, THE useErrorHandler hook SHALL clear both the access cookie and the refresh cookie and the AuthContext User, Access_Token, and Refresh_Token state, and redirect the User to `/login`.
14. WHILE running in a Client Component (browser runtime), WHEN a protected request sent by the apiClient with an Access_Token returns status 401 and a Refresh_Token is available, THE apiClient SHALL send POST `/api/auth/refresh` once with `Authorization: Bearer <refresh_token>`, store the returned Access_Token in AuthContext memory and in the access cookie (lifetime in seconds equal to the `expires_in` value of the refresh response), and retry the original request once with the new Access_Token.
15. WHILE running in a Client Component (browser runtime) and a refresh request is in flight, THE apiClient SHALL share that single request among all protected requests that receive status 401, and SHALL NOT send a second refresh request.
16. WHILE running in a Client Component (browser runtime), IF the refresh request returns status 401, or the retried original request returns status 401, THEN THE apiClient SHALL clear both cookies and the AuthContext state, redirect to `/login`, and throw an ApiError with `statusCode` 401.
17. THE apiClient SHALL NOT attempt a refresh for a 401 response from POST `/api/auth/login`, POST `/api/auth/register`, or POST `/api/auth/refresh`.
18. WHILE running in a Server Component, THE apiClient SHALL NOT send POST `/api/auth/refresh`, SHALL NOT write or delete any cookie, and SHALL, on a 401 response, throw an ApiError with `statusCode` 401, so that the page redirects to `/login`; renewing an expired Access_Token for server rendering SHALL be done only by the middleware of Requirement 17 criterion 7.

### Requirement 17: Authentication State and Cookie

**User Story:** As a user, I want to stay logged in across page loads, so that I do not log in repeatedly.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide an AuthContext holding the current User, Access_Token, and Refresh_Token, with `login`, `logout`, and `updateUser` functions.
2. WHEN a login succeeds, THE AuthContext SHALL store the Access_Token and the Refresh_Token in memory, SHALL store the Access_Token in the access cookie with a lifetime in seconds equal to the `expires_in` value of the login response, and SHALL store the Refresh_Token in the refresh cookie with a lifetime in seconds equal to the `refresh_expires_in` value of the login response, each cookie with path `/` and `SameSite=Lax`.
3. WHEN the application loads and an access cookie or a refresh cookie exists, THE AuthContext SHALL restore the session by calling GET `/api/users/me` with the Access_Token (refreshing it first through POST `/api/auth/refresh` when only the refresh cookie exists) and, on success, set the current User and both tokens from the response and the cookies.
4. IF session restoration ends with status 401 after the refresh flow of Requirement 16 criteria 14 to 16, THEN THE AuthContext SHALL clear both cookies, clear the User, Access_Token, and Refresh_Token state, and redirect to `/login`.
5. IF the GET `/api/users/me` call during session restoration fails with a network error or a status of 500 or above, THEN THE AuthContext SHALL keep both cookies, leave the User unset, and trigger the useErrorHandler toast.
6. WHEN a User logs out, THE AuthContext SHALL clear both cookies, clear the User, Access_Token, and Refresh_Token state, and redirect to `/login`, without sending any request to the Kano_API.
7. WHEN a visitor requests a protected route and the access cookie is missing or expired while a valid refresh cookie exists, THE Kano_Web middleware SHALL send POST `/api/auth/refresh` with the Refresh_Token, set the new access cookie on the response (lifetime in seconds equal to the `expires_in` value of the refresh response, path `/`, `SameSite=Lax`), and let the request continue, before any protected page content renders.
8. WHEN an unauthenticated visitor requests a protected route, THE Kano_Web SHALL redirect the visitor to `/login` before rendering any protected page content, with two exceptions: a request for `/` without the Welcome_Cookie redirects to `/welcome` (Requirement 38), and a request for `/invite/<token>` redirects to `/login?next=<encoded path>` (Requirement 37). A protected route is every route except `/welcome`, `/login`, and `/register`. An unauthenticated visitor is one with no usable access cookie and no valid refresh cookie, or one whose refresh request returned status 401 (in which case the middleware also deletes both cookies).
9. WHEN an authenticated User requests `/login`, `/register`, or `/welcome`, THE Kano_Web SHALL redirect the User to `/`.
10. WHEN a Server Component fetches data, THE Kano_Web SHALL read the Access_Token from the access cookie and pass it to the apiClient.
11. WHEN `updateUser` is called with a User object, THE AuthContext SHALL replace the current User state with that object without changing the tokens or the cookies.
12. THE Kano_Web middleware SHALL take its routing decision from one side-effect-free function `decideRoute` whose inputs are the request pathname, the authentication state (authenticated, refreshable, or unauthenticated), and whether the Welcome_Cookie is present, and whose output is exactly one outcome (continue, redirect to a target path, refresh then continue), covering every case of criteria 7 to 9 and Requirement 38.
13. THE Kano_Web middleware SHALL treat `/invite/<token>` as a protected route, including the refresh step of criterion 7, so that an authenticated visitor with an expired access cookie and a valid refresh cookie reaches the invite page.
14. THE Header logo link of Requirement 18 criterion 14 SHALL NOT change the inputs or the outputs of `decideRoute`: a request for `/welcome` from an unauthenticated visitor continues without a redirect (Requirement 38 criterion 9), a request for `/welcome` from an authenticated User or from a visitor with a valid refresh cookie redirects to `/` (criterion 9 and Requirement 38 criterion 8), and a request for `/` from an unauthenticated visitor with the Welcome_Cookie still redirects to `/login` (Requirement 38 criterion 6), so the logo link never leads an unauthenticated visitor to `/login`. The logo link takes its authentication state only from the shared Header check of Requirement 18 criterion 15 and not from the inputs of `decideRoute`; a visitor with a valid refresh cookie whose session restoration is still in progress may therefore see the target `/welcome`, and the middleware then redirects that request to `/` by criterion 9.

### Requirement 18: Shared Components

**User Story:** As a developer, I want reusable UI components, so that the interface is consistent.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide `BaseButton` in `components/shared/` with exactly three variants: `primary`, `secondary`, and `destructive`.
2. WHERE no variant is supplied, THE BaseButton SHALL render the `primary` variant.
3. WHILE a BaseButton is disabled, THE BaseButton SHALL ignore click events and expose the disabled state to assistive technology.
4. THE Kano_Web SHALL provide `BaseBadge` in `components/shared/` with at least four color variants, and THE BaseBadge SHALL render the same text color and background color on every page for a given variant.
5. THE Kano_Web SHALL provide `BaseModal` in `components/shared/` as the reusable modal shell used as the wrapper for all forms.
6. THE Kano_Web SHALL render every button in pages and feature components, including My Tasks and Profile, through `BaseButton`.
7. WHEN the Escape key is pressed while a BaseModal is open, THE BaseModal SHALL close within 100 ms.
8. WHEN the backdrop is clicked while a BaseModal is open, THE BaseModal SHALL close within 100 ms.
9. WHEN a click occurs inside the BaseModal content area, THE BaseModal SHALL remain open.
10. WHEN a BaseModal opens, THE BaseModal SHALL move keyboard focus to the first focusable element inside the modal within 100 ms, or to the modal container if it has no focusable element.
11. WHILE a BaseModal is open, THE BaseModal SHALL keep keyboard focus within the modal when the Tab key is pressed.
12. WHEN a BaseModal closes, THE BaseModal SHALL return keyboard focus to the element that had focus before the modal opened.
13. THE Kano_Web SHALL provide shared layout components `Header` and `Footer` in `components/`, and every page SHALL render exactly one Header and one Footer.
14. THE Header SHALL render the Kano brand (the "K" logo mark and the wordmark "Kano") as one link with the accessible name "Kano", on every page that renders the Header, and the link target SHALL be `/welcome` WHILE the visitor is unauthenticated (regardless of whether the Welcome_Cookie is present) and `/` WHILE the visitor is authenticated, so that the link never targets `/login`, never sets or deletes the Welcome_Cookie, and sends no request to the Kano_API.
15. THE Header SHALL derive one authentication state from the AuthContext through a single shared check and SHALL use that same check for the logo link target of criterion 14 and for every authentication-dependent part of the Header navigation (the Log in and Register links, the user controls, and the NotificationBell), so that the logo and the navigation cannot disagree. The check SHALL return authenticated only WHILE the AuthContext status is `authenticated` (the AuthContext holds a User), and SHALL return unauthenticated in every other status, including WHILE the session restoration of Requirement 17 criterion 3 is in progress, after a failed session restoration, and after a logout. The check SHALL NOT read the access cookie or the refresh cookie. THE Header SHALL recompute the link target and the navigation whenever the AuthContext status changes (for example to `/welcome` after a logout or after a failed session restoration that clears both cookies, and to `/` when a session restoration succeeds).
16. THE Footer SHALL render its content inside a container of the width of `max-w-7xl`, in one row from 768 px upward with the brand group (criterion 17) on the left and the two icon links of the link group (criterion 18) on the right, and below 768 px the content may wrap onto two lines (Requirement 27 criterion 11), because Kano is a portfolio project and the two links point to the author's public profiles.
17. THE Footer brand group SHALL show, in this order from left to right: a brand mark that is a small rounded square in the `primary` color holding the white letter "K"; the wordmark "Kano" in the ink color with the font weight 500 or 600; a separator dot marked `aria-hidden="true"`; and the muted text "Portfolio project built in 2026 by JC", where "JC" is rendered in the ink color. THE Footer SHALL render "2026" and "JC" as fixed text and SHALL NOT compute the year, and SHALL NOT render the brand group as a link.
18. THE Footer link group SHALL contain exactly two icon links: a GitHub link whose target is the placeholder URL `https://github.com` and a LinkedIn link whose target is the placeholder URL `https://www.linkedin.com`, each with `target="_blank"` and `rel="noopener noreferrer"`, so that a click opens the target in a new browser tab and gives the opened page no access to the Kano_Web window.
19. THE Footer SHALL give the GitHub link the accessible name "Kano on GitHub" and the LinkedIn link the accessible name "Kano on LinkedIn" through an `aria-label`, and SHALL mark the icon inside each link `aria-hidden="true"`, so that each icon is decorative and each link is announced once. THE Footer SHALL give each of the two links a tap target of at least 44 px by 44 px at every viewport width, and 44 px is the tap-target exception to the 4 px spacing scale step, as for the `lg` button.
20. WHEN a pointer hovers over a Footer link, THE Footer SHALL change the icon color from the `ink-muted` color to the `ink` color and the link background to the `sunken` color, with a color transition of 150 ms, and WHEN a Footer link receives keyboard focus through `:focus-visible`, THE Footer SHALL show the visible focus-visible outline as defined in the design system (2 px outline) on that link.
21. THE Footer SHALL use only design-system tokens (Requirement 38 criterion 20: the Inter font in the weights 400, 500, and 600, the defined color, radius, and spacing tokens, flat surfaces, no gradient, blur, or shadow), SHALL send no request to the Kano_API, SHALL set and read no cookie, and SHALL read no environment variable.

### Requirement 19: Register and Login Pages

**User Story:** As a visitor, I want to register and log in, so that I can use Kano.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide a `/register` page with controlled inputs for name, email, and password.
2. IF a registration form field is invalid (empty name after trimming whitespace, name longer than 100 characters, email not in the form `local@domain.tld`, or password shorter than 8 characters), THEN THE Kano_Web SHALL show a field-level error next to each invalid field, SHALL NOT send any request, and SHALL keep the entered values in the form.
3. WHEN a valid registration form is submitted, THE Kano_Web SHALL send POST `/api/auth/register`, disable the submit button until the response arrives, and, on a 201 response, redirect to `/login` (keeping a valid `next` query parameter, see criterion 11) and show a success toast.
4. IF the registration request returns status 409, THEN THE Kano_Web SHALL show an email-already-in-use error on the email field, SHALL stay on `/register`, and SHALL keep the entered values in the form.
5. IF the registration request fails with status 400, 500, or no response (network error), THEN THE Kano_Web SHALL show an error toast through useErrorHandler, SHALL stay on `/register`, and SHALL keep the entered values in the form.
6. THE Kano_Web SHALL provide a `/login` page with controlled inputs for email and password.
7. IF a login form field is invalid (email not in the form `local@domain.tld` or empty password), THEN THE Kano_Web SHALL show a field-level error next to each invalid field and SHALL NOT send any request.
8. WHEN a valid login form is submitted, THE Kano_Web SHALL send POST `/api/auth/login`, disable the submit button until the response arrives, store the JWT through the AuthContext on a 200 response, and redirect to the `next` path when it is valid (criterion 11) or to `/` when `next` is missing or invalid.
9. IF the login request returns status 401, THEN THE Kano_Web SHALL show a single invalid-credentials error message on the page that does not indicate whether the email or the password was wrong, SHALL stay on `/login`, and SHALL clear the password input.
10. IF the login request fails with status 400, 500, or no response (network error), THEN THE Kano_Web SHALL show an error toast through useErrorHandler, SHALL stay on `/login`, and SHALL keep the entered email.
11. THE Kano_Web SHALL accept a `next` query parameter on `/login` and `/register` only when its decoded value starts with `/invite/` followed by 1 to 128 characters from `A-Z`, `a-z`, `0-9`, `_`, and `-`, and contains no other character (no further slash, backslash, query, fragment, scheme, or host), and SHALL ignore any other value so that no redirect leaves the Kano_Web origin.
12. WHERE a valid `next` parameter is present on `/login` or `/register`, THE Kano_Web SHALL keep it in the links between the login page and the register page.

### Requirement 20: Dashboard Page

**User Story:** As a user, I want to see all my boards, so that I can open or create one.

#### Acceptance Criteria

1. WHEN an authenticated User requests `/`, THE Kano_Web SHALL render the page as a Server Component that fetches GET `/api/boards` and lists every returned Board with its name and a role badge showing `admin`, `manager`, `member`, or `guest` for the User.
2. WHEN the User opens the create-board form, THE Kano_Web SHALL show a BaseModal containing a single board name input and a submit BaseButton.
3. IF the board name in the create-board form is empty or longer than 100 characters, THEN THE Kano_Web SHALL show a field-level error, SHALL NOT send the request, and SHALL keep the BaseModal open with the entered text retained.
4. WHEN the User submits a valid board name, THE Kano_Web SHALL send POST `/api/boards`, close the BaseModal on status 201, show the new Board in the list with the `admin` role badge, and show a success toast.
5. IF the POST `/api/boards` request fails, THEN THE Kano_Web SHALL keep the BaseModal open with the entered name retained, leave the Board list unchanged, and show an error toast through the useErrorHandler hook.
6. WHEN a Board is selected, THE Kano_Web SHALL navigate to `/boards/<id>`.
7. IF the User has no boards, THEN THE Kano_Web SHALL show an empty-state message and a create-board BaseButton that opens the create-board form.
8. IF the GET `/api/boards` request fails with a status other than 401, THEN THE Kano_Web SHALL show an error message on the page with a retry BaseButton, and SHALL NOT show the empty-state message.

### Requirement 21: Board Detail Page

**User Story:** As a board member, I want a Kanban view, so that I can manage columns and cards visually.

#### Acceptance Criteria

1. WHEN a Board_Member requests `/boards/[id]`, THE Kano_Web SHALL fetch GET `/api/boards/<id>` in a Server Component and render the Columns and Cards in a Kanban layout, with Columns sorted by ascending Order_Value and the Cards in each Column sorted by ascending Order_Value.
2. WHEN a Board_Admin or a Board_Manager submits the add-column form with a name of 1 to 100 characters, THE Kano_Web SHALL send POST `/api/boards/<id>/columns` and, on success, show the new Column after the last existing Column without a page reload.
3. IF the add-column name is empty or longer than 100 characters, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request.
4. WHEN a Board_Admin or a Board_Manager submits a Column rename with a name of 1 to 100 characters, THE Kano_Web SHALL send PATCH `/api/columns/<id>` and, on success, show the new name without a page reload.
5. WHEN a Board_Admin or a Board_Manager confirms deletion of a Column, THE Kano_Web SHALL send DELETE `/api/columns/<id>` and, on success, remove the Column and its Cards from the display without a page reload.
6. WHEN a Board_Member submits the add-card form in a Column with a title of 1 to 200 characters, THE Kano_Web SHALL send POST `/api/columns/<id>/cards` and, on success, show the new Card at the end of that Column without a page reload.
7. IF the add-card title is empty or longer than 200 characters, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request.
8. IF a create, rename, or delete request for a Column or Card returns an error, THEN THE Kano_Web SHALL leave the displayed Columns and Cards unchanged and trigger the useErrorHandler toast.
9. WHEN a Board_Member types in the card search input, THE Kano_Web SHALL wait 300 ms after the last keystroke and then send GET `/api/cards?q=<text>&board_id=<id>` and show only the matching Cards.
10. WHEN the card search input is cleared, THE Kano_Web SHALL show all Cards of the Board in their Order_Value positions.
11. IF the search request returns no Cards, THEN THE Kano_Web SHALL show a no-results message in place of the Cards.
12. WHERE the current User is the Board_Admin or a Board_Manager, THE Kano_Web SHALL show the member management panel (list, add by email, remove, role change), and WHERE the current User is the Board_Admin, THE Kano_Web SHALL show a link to the analytics view.
13. WHERE the current User is a Board_Member whose role is `member`, THE Kano_Web SHALL hide the member management controls, the add-column control, the column rename and delete controls, and the analytics link, and WHERE the current User is a Board_Manager, THE Kano_Web SHALL hide the analytics link.
14. WHEN a Board_Admin opens the analytics view, THE Kano_Web SHALL fetch GET `/api/boards/<id>/analytics` and show the Card count per Column, the number of Cards completed this week, and, for each Board_Member, the number of assigned Cards and the number of Comments written.
15. IF the board request returns status 403 or 404, THEN THE Kano_Web SHALL show an access-denied message for 403 or a not-found message for 404, together with a link to `/`, and SHALL NOT render any Column or Card.
16. IF the analytics request returns an error, THEN THE Kano_Web SHALL show an error message in the analytics view and trigger the useErrorHandler toast.
17. WHEN the POST `/api/columns/<id>/cards` request of criterion 6 returns status 201, THE Kano_Web SHALL show the new Card in its Column and open the CardDetailModal for that Card, so that the User can fill in description, due date, labels, assignee, and status. The quick-add card form SHALL still ask only for the title (criterion 7 applies).
18. WHEN the User closes the CardDetailModal opened by criterion 17 without saving, THE Kano_Web SHALL keep the Card on the board with its title only, status `NOT_STARTED`, and no other details.
19. IF the card creation request fails, THEN THE Kano_Web SHALL NOT open the CardDetailModal, SHALL show no new Card, and SHALL trigger the useErrorHandler toast (criterion 8).
20. WHERE the current User is a Board_Guest, THE Kano_Web SHALL show a read-only indicator badge with the text "Guest" on the board page and SHALL hide or disable every edit control: add column, add card, column rename and delete, card drag and drop, comment form, status control, assignee control, card delete, member management panel, and analytics link.
21. WHERE the current User is the Board_Admin or a Board_Manager, THE Kano_Web SHALL show in the member management panel the two Invite_Links, member and guest, as specified in Requirement 37 criteria 15 to 17.
22. THE Kano_Web SHALL show the Card_Status of each Card on the board as a BaseBadge with the labels "Not started", "In progress", "Urgent", and "Done", and SHALL update the badge without a page reload when the status changes in the CardDetailModal.
23. WHEN a Board_Member moves a Card between Columns, THE Kano_Web SHALL leave the displayed Card_Status of that Card unchanged.
24. THE Kano_Web SHALL group the board title, the role badge, the card search input, and the action controls available to the current role (member management and the analytics link) in one board toolbar placed above the Kanban columns area. THE add-column control SHALL NOT be part of the board toolbar and SHALL stay at the end of the row of Columns inside the Kanban columns area.
25. WHILE a Board is rendered, THE Kano_Web SHALL show exactly one horizontal separator between the board toolbar and the Kanban columns area, exposed as one element with the role `separator` and horizontal orientation, drawn as a line 1 px thick in the `line` color of the Kano design system, spanning the full width of the toolbar, and placed after the last line of toolbar controls and before the Kanban columns area in document order.
26. WHILE the viewport width is between 375 px and 1920 px inclusive, THE Kano_Web SHALL show the separator of criterion 25 without overlapping any toolbar control or any Column, and without adding horizontal scrolling to the page, and WHEN the toolbar controls wrap onto more than one line at a narrow width, THE separator SHALL stay below the last line of controls.
27. THE Kano_Web SHALL show the separator of criterion 25 for the Board_Admin, the Board_Member, and the Board_Guest views, and SHALL NOT show it in the access-denied and not-found states of criterion 15, which render no toolbar and no Column.
28. THE Kano_Web SHALL NOT render any other separator line between the board toolbar and the Kanban columns area, so that the toolbar and the columns area are not divided by a second line (for example a border on both the toolbar and the columns area).

### Requirement 22: Drag and Drop

**User Story:** As a board member, I want to drag cards between columns, so that I can update progress quickly.

#### Acceptance Criteria

1. THE `hooks/useDragAndDrop.ts` hook SHALL manage card dragging between Columns for mouse input using the native HTML5 Drag and Drop API.
2. WHEN a Card is dropped on a Column that contains other Cards, THE useDragAndDrop hook SHALL compute the Order_Value as the midpoint between the Order_Values of the two neighboring Cards at the drop position.
3. WHEN a Card is dropped at the end of a Column that contains Cards, THE useDragAndDrop hook SHALL compute the Order_Value as the highest Order_Value in that Column plus 1.
4. WHEN a Card is dropped at the start of a Column that contains Cards, THE useDragAndDrop hook SHALL compute the Order_Value as half of the lowest Order_Value in that Column.
5. WHEN a Card is dropped on an empty Column, THE useDragAndDrop hook SHALL set the Order_Value to 1.0.
6. WHEN a Card is dropped at a valid position, THE useDragAndDrop hook SHALL apply the new Column and Order_Value to local React state within 100 ms, before the API responds, and SHALL send PATCH `/api/cards/<id>/position` with the target `column_id` and the computed `order`.
7. IF the position request returns a non-2xx response or fails with a network error, THEN THE useDragAndDrop hook SHALL restore the Card to its original Column and Order_Value within 100 ms and trigger the useErrorHandler toast.
8. IF a Card is dropped outside any Column or on its own current position, THEN THE useDragAndDrop hook SHALL leave the Card state unchanged and SHALL NOT send a position request.
9. IF the computed Order_Value is not a positive float, THEN THE useDragAndDrop hook SHALL leave the Card state unchanged, SHALL NOT send a position request, and SHALL trigger the useErrorHandler toast.
10. WHILE a position request for a Card is pending, THE useDragAndDrop hook SHALL ignore further drag starts on that Card.
11. WHEN the page is reloaded after a successful drop, THE Kano_Web SHALL show the Card in the new Column and position.
12. THE `hooks/useDragAndDrop.ts` hook SHALL also support dragging a Card between Columns by touch input, in addition to the mouse input of criterion 1.
13. WHEN a touch stays on a Card for 300 ms without moving more than 10 px, THE useDragAndDrop hook SHALL start a touch drag of that Card and, from that moment, SHALL prevent the page from scrolling for the rest of that touch.
14. IF a touch on a Card moves more than 10 px, or ends or is cancelled, before 300 ms have passed, or the page scrolls during those 300 ms, THEN THE useDragAndDrop hook SHALL NOT start a touch drag, SHALL leave the Card state unchanged, and SHALL NOT send a position request, so that vertical and horizontal scrolling keep working.
15. WHILE a touch drag is active, THE useDragAndDrop hook SHALL determine the target Column and the drop position from the current touch point with `document.elementFromPoint`, and WHEN the touch ends over a Column, SHALL compute the Order_Value with the rules of criteria 2 to 5 and apply the same optimistic update, position request, and revert on failure as criteria 6 and 7.
16. IF a touch drag ends outside any Column, ends on the Card's own current position, or is cancelled by the browser, THEN THE useDragAndDrop hook SHALL leave the Card state unchanged and SHALL NOT send a position request.
17. WHILE a touch drag is not active, THE Kano_Web SHALL allow the page and the Kanban board container to scroll by touch, and the Cards SHALL NOT use any CSS `touch-action` value that blocks panning.
18. WHERE the current User is a Board_Guest, THE useDragAndDrop hook SHALL NOT start a mouse drag or a touch drag, SHALL leave the Card state unchanged, and SHALL NOT send a position request.
19. WHEN a Card is dropped at a valid position, THE useDragAndDrop hook SHALL send only `column_id` and `order` in the position request and SHALL NOT change the Card_Status in local state.

### Requirement 23: Card Detail Modal and Comments

**User Story:** As a board member, I want to open a card and discuss it, so that I can collaborate.

#### Acceptance Criteria

1. WHEN a Card is selected, THE Kano_Web SHALL open `CardDetailModal.tsx`, a Client Component that composes `CommentList.tsx` inside `BaseModal`, and SHALL show the Card title, description, due date, labels, and assignee within 300 ms of the selection.
2. WHEN a Board_Member submits an edited Card title, description, due date, labels, or assignee in the CardDetailModal, THE CardDetailModal SHALL send PATCH `/api/cards/<id>` with only the changed fields, update the displayed Card with the returned values, and show a success toast.
3. IF the Card title is empty or longer than 200 characters, THEN THE CardDetailModal SHALL show a field-level error and SHALL NOT send the PATCH request.
4. IF the PATCH `/api/cards/<id>` request returns an error, THEN THE CardDetailModal SHALL keep the modal open, keep the user's entered values in the form, and trigger the useErrorHandler toast.
5. WHEN the CardDetailModal opens, THE CommentList SHALL load Comments from GET `/api/cards/<id>/comments` and show the author name and creation time of each Comment, ordered by creation time ascending.
6. IF the GET `/api/cards/<id>/comments` request returns an error, THEN THE CommentList SHALL show an error message in place of the list and trigger the useErrorHandler toast.
7. IF the Card has no Comments, THEN THE CommentList SHALL show an empty-state message.
8. WHEN a User submits non-empty comment text in the comment form, THE CardDetailModal SHALL send POST `/api/cards/<id>/comments`, append the new Comment at the end of the CommentList, and clear the comment input.
9. IF the comment text is empty or contains only whitespace, THEN THE CardDetailModal SHALL show a field-level error and SHALL NOT send the POST request.
10. IF a POST, PATCH, or DELETE comment request returns an error, THEN THE CommentList SHALL leave the displayed Comments unchanged, keep the entered text in the input, and trigger the useErrorHandler toast.
11. WHERE a Comment is owned by the current User, THE CommentList SHALL show edit and delete controls for that Comment.
12. WHEN the current User saves non-empty edited text on an owned Comment, THE CommentList SHALL send PATCH `/api/comments/<id>` and show the updated text.
13. WHEN the current User confirms deletion of an owned Comment, THE CommentList SHALL send DELETE `/api/comments/<id>` and remove the Comment from the list.
14. WHERE a Comment is not owned by the current User, THE CommentList SHALL hide the edit and delete controls for that Comment, including when the current User is the Board_Admin.
15. WHEN a Board_Member confirms deletion of a Card in the CardDetailModal, THE Kano_Web SHALL send DELETE `/api/cards/<id>`, close the modal, and remove the Card from the board.
16. IF the DELETE `/api/cards/<id>` request returns an error, THEN THE CardDetailModal SHALL keep the modal open and the Card on the board, and trigger the useErrorHandler toast.
17. THE CardDetailModal SHALL show a status control with exactly the four options "Not started", "In progress", "Urgent", and "Done", preselected with the current Card_Status of the Card.
18. WHEN a Board_Member changes the status in the CardDetailModal and saves, THE CardDetailModal SHALL send PATCH `/api/cards/<id>` with only the changed fields (criterion 2), update the Card on the board with the returned `status` and `completed_at`, and show a success toast.
19. IF the PATCH request that carries a status change returns an error, THEN THE CardDetailModal SHALL keep the modal open, keep the previously saved status on the board, keep the entered values in the form, and trigger the useErrorHandler toast.
20. THE CardDetailModal SHALL offer only Board_Members with the role `admin`, `manager`, or `member` as assignee options and SHALL NOT offer a Board_Guest.
21. WHERE the current User is a Board_Guest, THE CardDetailModal SHALL show the Card title, description, due date, labels, assignee, status, and Comments as read-only, with disabled inputs, and SHALL hide the save button, the delete button, the comment form, and the edit and delete controls of Comments.
22. WHEN the CardDetailModal is opened by Requirement 21 criterion 17 for a newly created Card, THE CardDetailModal SHALL show the title already entered and let the User save the details with the same PATCH request as criterion 18, using a single save button.

### Requirement 24: Notifications UI

**User Story:** As a user, I want to see unread notifications, so that I know when something needs attention.

#### Acceptance Criteria

1. WHILE the User is authenticated, THE `hooks/useNotifications.ts` hook SHALL send GET `/api/notifications` with `page` 1 and `per_page` 20 immediately on mount and then every 30 seconds, and SHALL replace the notification state and unread count with the response.
2. WHILE the unread count is greater than zero, THE `NotificationBell.tsx` component in the Header SHALL show the unread count as a number, displaying "99+" when the count exceeds 99.
3. WHILE the unread count is zero, THE `NotificationBell.tsx` component SHALL NOT show a count indicator.
4. WHEN the User opens the notification list, THE Kano_Web SHALL show the Notifications returned by the last successful poll, newest first, each with its message and creation time, and SHALL visually distinguish unread Notifications from read Notifications.
5. IF the notification list contains no Notifications, THEN THE Kano_Web SHALL show an empty-state message in the notification list.
6. WHEN the User selects an unread Notification in the notification list, THE Kano_Web SHALL send PATCH `/api/notifications/<id>/read`, mark that Notification as read, and decrease the unread count by one, to a minimum of zero.
7. IF the PATCH `/api/notifications/<id>/read` request fails, THEN THE Kano_Web SHALL keep the Notification unread, leave the unread count unchanged, and trigger the useErrorHandler toast.
8. WHEN the User logs out or the component using the useNotifications hook unmounts, THE useNotifications hook SHALL stop polling and cancel any pending poll timer.
9. IF a polling request fails, THEN THE useNotifications hook SHALL keep the previous notification state and unread count without showing an error toast, and SHALL send the next request at the next 30-second interval.

### Requirement 25: My Tasks Page

**User Story:** As a user, I want to see all cards assigned to me, so that I can plan my work.

#### Acceptance Criteria

1. WHEN an authenticated User opens `/my-tasks`, THE Kano_Web SHALL fetch GET `/api/cards?assignee=me` and group the returned Cards under their Board names, with one group per Board.
2. THE Kano_Web SHALL show for each task the Card title, the due date in the User's local date format (or a "no due date" indicator when the Card has no due date), the Column name, the Card_Status as a BaseBadge ("Not started", "In progress", "Urgent", or "Done"), and a link to `/boards/<id>` for the Card's Board.
3. WHILE the GET `/api/cards?assignee=me` request is pending, THE Kano_Web SHALL show a loading indicator in place of the task list.
4. IF the request returns an empty list, THEN THE Kano_Web SHALL show an empty-state message and no Board groups.
5. IF the GET `/api/cards?assignee=me` request returns an ApiError, THEN THE Kano_Web SHALL show an error message on the page, trigger the useErrorHandler toast, and show no task list.
6. WHEN a Card is soft deleted or its assignee is cleared, THE Kano_Web SHALL omit that Card the next time `/my-tasks` is loaded.
7. THE Kano_Web SHALL keep Cards with the status `DONE` in the My Tasks list, marked with the "Done" badge, and SHALL NOT filter Cards by status.

### Requirement 26: Profile Page

**User Story:** As a user, I want to update my name and email, so that my account details are accurate.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide a `/profile` page with a form whose controlled name input is pre-populated from the current User held in the AuthContext, and that shows the email of the current User as read-only text without an editable email input.
2. WHEN a profile form is submitted with a name of 1 to 100 characters, THE Kano_Web SHALL send PATCH `/api/users/me` with the name (and with `password` and `current_password` only when criterion 6 applies), disable the submit button until the request completes, update the AuthContext with the returned User, and show a success toast.
3. IF a profile form field is invalid (empty name, name longer than 100 characters, a new password shorter than 8 or longer than 128 characters, or a password section where only one of the two inputs is filled), THEN THE Kano_Web SHALL show a field-level error next to each invalid field and SHALL NOT send the request.
4. IF the PATCH `/api/users/me` request returns status 400 with an error that names `current_password`, THEN THE Kano_Web SHALL show a wrong-current-password error on the current password input, SHALL leave the AuthContext User unchanged, and SHALL keep the entered name.
5. IF the PATCH `/api/users/me` request fails with any other error status or no response, THEN THE Kano_Web SHALL show an error toast through the useErrorHandler hook, SHALL leave the AuthContext User unchanged, and SHALL keep the entered form values.
6. THE Kano_Web SHALL provide in the profile form an optional change-password section with a current password input and a new password input, and WHEN both inputs are filled and valid, THE Kano_Web SHALL include `password` and `current_password` in the PATCH request.
7. IF an unauthenticated visitor requests `/profile`, THEN THE Kano_Web SHALL redirect the visitor to `/login`.
8. WHEN a profile update that included a password succeeds, THE Kano_Web SHALL clear the current password and new password inputs, and the password inputs SHALL be rendered as masked inputs and never be pre-populated.

### Requirement 27: Responsive Layout

**User Story:** As a mobile user, I want the app to be usable on small screens, so that I can work from my phone.

#### Acceptance Criteria

1. WHILE the viewport width is between 375 px and 1920 px inclusive, THE Kano_Web SHALL render every page (Dashboard, Board Detail, My Tasks, Profile, Register, Login) so that the document's horizontal scroll width does not exceed the viewport width, except inside the Kanban board container.
2. WHILE the viewport width is between 375 px and 1920 px inclusive, THE Kano_Web SHALL render every page so that no two interactive elements (buttons, links, inputs) have overlapping bounding boxes.
3. WHILE the viewport width is below 768 px, THE Kano_Web SHALL render each Kanban Column at a fixed width of at least 240 px and make the board container scroll horizontally so that every Column can be reached.
4. WHILE the viewport width is below 768 px, THE BaseModal SHALL limit its height to the viewport height and scroll its content vertically when the content exceeds that height.
5. WHILE the viewport width is below 768 px and a BaseModal is open, THE BaseModal SHALL keep its width within the viewport so that the modal has no horizontal scrollbar and its close control stays visible without scrolling.
6. WHILE the viewport width is below 768 px, THE Kano_Web SHALL render every interactive element with a tap target of at least 44 px by 44 px.
7. IF the viewport width is below 375 px, THEN THE Kano_Web SHALL allow horizontal page scrolling and SHALL keep all page content reachable without truncation.
8. WHILE the viewport width is below 768 px, THE Kano_Web SHALL let a Board_Member drag a Card between Columns by touch, as specified in Requirement 22 criteria 12 to 17.
9. THE Kano_Web SHALL apply criteria 1, 2, and 6 to the Welcome_Page and to the invite page `/invite/<token>` as well, and WHILE the viewport width is below 768 px, the Join, Log in, and Create account buttons SHALL have a tap target of at least 44 px by 44 px.
10. THE Kano_Web SHALL apply criteria 1 and 2 to the board toolbar and its separator (Requirement 21 criteria 24 to 28), and WHILE the viewport width is below 768 px, every interactive element of the Welcome_Page (the Header logo link, the Header Log in and Register links, the Get started button, the Create account button, and the bottom Log in button) SHALL have a tap target of at least 44 px by 44 px, as required by criterion 6 and Requirement 38 criterion 21.
11. WHILE the viewport width is between 375 px and 1920 px inclusive, THE Kano_Web SHALL apply criteria 1 and 2 to the Footer of Requirement 18 criteria 16 to 21, and WHILE the viewport width is 768 px or more, THE Footer SHALL show the brand group and the link group in one row, and WHILE the viewport width is below 768 px, THE Footer MAY wrap them onto two lines without overlap and without adding horizontal scrolling to the page (Requirement 18 criterion 16).
12. WHILE the viewport width is below 768 px, THE Footer SHALL render the GitHub link and the LinkedIn link each with a tap target of at least 44 px by 44 px, as required by criterion 6 and by Requirement 18 criterion 19, which applies the same 44 px at every width as the tap-target exception to the 4 px spacing scale step.

## Part C: Non-Functional Requirements

### Requirement 28: Security

**User Story:** As a stakeholder, I want sensible security controls, so that user data is protected.

#### Acceptance Criteria

1. WHEN a User is created through POST `/api/auth/register`, THE Kano_API SHALL store the password only as a salted hash produced by an adaptive hashing function, and the stored value SHALL differ from the submitted password.
2. THE Kano_API SHALL exclude passwords, password hashes, and JWTs from all application log output, including log output produced for requests that fail with status 400, 401, or 500.
3. THE Kano_API SHALL execute every database access through SQLAlchemy parameterized queries and SHALL NOT build SQL statements by concatenating or formatting request values into SQL text.
4. WHEN a request value contains SQL metacharacters (for example `'`, `;`, or `--`) in any field or query parameter, THE Kano_API SHALL treat the value as literal data and SHALL NOT change the executed SQL structure.
5. THE Kano_API SHALL read the JWT secret and database credentials from environment variables and SHALL NOT include any real secret value in any file committed to the repository.
6. IF the JWT secret environment variable (used to sign both the Access_Token and the Refresh_Token) is missing or empty at application startup, THEN THE Kano_API SHALL fail to start and report the missing variable name without printing any secret value.
7. THE Kano_Web SHALL set the access cookie and the refresh cookie without the httpOnly attribute so that Server Components and the middleware can read them.
8. THE README.md SHALL document the XSS exposure that results from the non-httpOnly access cookie and refresh cookie, which covers both tokens, SHALL state that the 7-day Refresh_Token cookie raises the impact of an XSS compromise, and SHALL list these mitigations: the short Access_Token expiry (3600 seconds), the Refresh_Token expiry, escaping of user content by React, and no use of `dangerouslySetInnerHTML` in `web/`.
9. THE Kano_Web SHALL NOT use `dangerouslySetInnerHTML` in any file under `web/`.
10. WHEN an endpoint that requires Board_Membership or a specific role receives a request, THE Kano_API SHALL verify the Board_Membership and role on the server before performing the action, regardless of any frontend control state.
11. IF an authenticated User sends a request to an endpoint for which the User lacks the required Board_Membership or role, THEN THE Kano_API SHALL return status 403, leave all data unchanged, and not disclose data of the target resource in the response.
12. THE Kano_API SHALL generate every Invite_Token with a cryptographically secure random generator with at least 32 bytes of entropy, and SHALL return the Invite_Tokens only to a Board_Admin or a Board_Manager of the Board (GET invite-links and regenerate) and, for the single token in the path, to an authenticated User who sends GET `/api/invites/<token>`.
13. THE Kano_API SHALL exclude Invite_Tokens from all application log output, including log output produced for requests that fail with status 400, 401, 403, 404, or 500.
14. THE Kano_API SHALL verify the role of the caller on the server for every write endpoint, so that a Board_Guest receives status 403 regardless of any frontend control state.
15. THE Kano_Web SHALL redirect after login or registration only to a relative path that passes the `next` validation of Requirement 19 criterion 11, so that no open redirect is possible.

### Requirement 29: Performance

**User Story:** As a user, I want fast responses, so that the app feels responsive.

#### Acceptance Criteria

1. WHEN a client sends GET `/api/boards/<id>` for a Board with up to 20 Columns and 500 non-deleted Cards, THE Kano_API SHALL respond within 500 ms at the 95th percentile, measured over at least 100 consecutive requests on the local development environment with the PostgreSQL database running on the same machine.
2. WHEN a client sends GET `/api/boards/<id>`, THE Kano_API SHALL execute no more than 5 database queries per request, and the number of queries SHALL be identical for a Board with 10 Cards and a Board with 500 Cards.
3. THE Kano_API SHALL define a database index on each foreign key column used for filtering (Board_Membership `user_id` and `board_id`, Column `board_id`, Card `column_id` and assignee, Comment `card_id`, Notification recipient) and on the Column and Card Order_Value columns.
4. WHEN a client sends GET `/api/cards?q=<text>` or GET `/api/cards?assignee=me` for a User who is a Board_Member of up to 20 Boards containing 2,000 non-deleted Cards in total, THE Kano_API SHALL respond within 500 ms at the 95th percentile, measured over at least 100 consecutive requests on the local development environment.
5. IF a measured 95th percentile response time in criterion 1 or 4 exceeds 500 ms, THEN THE Kano_API test report SHALL mark the performance check as failed and SHALL report the measured value in milliseconds.

### Requirement 30: Maintainability and Guidelines

**User Story:** As a maintainer, I want enforced coding guidelines, so that generated code stays consistent.

#### Acceptance Criteria

1. THE repository SHALL contain `guidelines/frontend.md`, `guidelines/backend.md`, and `guidelines/database.md` in the repository root, and SHALL NOT contain copies of them in `.kiro/steering/`.
2. THE Guidelines SHALL state every guideline as an entry with three labeled parts: a Rule (one sentence), a Rationale (1 to 3 sentences), and a Kano Example (a reference to a concrete Kano file, component, or endpoint).
3. THE Guidelines SHALL contain no two entries, within one file or across the three files, that address the same topic, and no two entries that give conflicting instructions.
4. THE repository SHALL contain one before/after comparison document that shows, for at least 1 AI-generated output produced without the Guidelines and the same output produced with the Guidelines, the count of Guideline violations in each version, with the count lower in the "after" version.
5. THE repository SHALL contain a violation report listing at least 3 Guideline violations found in AI-generated code, and each entry SHALL name the violated guideline, the file where the violation occurred, and the fix applied.
6. THE repository SHALL contain in `app/` only Python source files that each contain code for exactly one feature (Blueprint_Package) or one shared concern, in `web/` only React component files that each define exactly one component, and no source file in `app/` or `web/` that exceeds 300 lines.
7. IF a source file in `app/` or `web/` exceeds 300 lines, or a Python source file in `app/` mixes code of more than one feature, THEN THE file SHALL be split, and a split Python module SHALL become a package of the same name containing one module per resource (for example `app/blueprints/boards/service/`) whose `__init__.py` keeps `routes`, `service`, and `schema` importable under those names.

## Part D: Testing

### Requirement 31: Backend Tests

**User Story:** As a developer, I want automated backend tests, so that regressions are caught early.

#### Acceptance Criteria

1. THE Kano_API SHALL provide pytest unit tests in `app/tests/` for the service layer and Marshmallow schemas, covering at minimum: Order_Value computation with FLOAT values (new-last, midpoint between two neighbors, and before the first Card), exclusion of rows where `is_deleted` is true from query results and counts, and acceptance and rejection of boundary values for each schema (Board and Column names of 0, 1, 100, and 101 characters; Card title of 200 and 201 characters; password of 7 and 8 characters).
2. THE Kano_API SHALL provide pytest end-to-end tests that call at least one success-path endpoint and at least one error-path endpoint for each of the eight Blueprint_Packages (auth, boards, columns, cards, comments, notifications, analytics, users) against a test PostgreSQL database that is separate from the development database.
3. THE Kano_API end-to-end tests SHALL assert the Response_Envelope shape (`data` on success, `error` on failure) and the HTTP status code on every request.
4. THE Kano_API comments tests SHALL cover status 201 on success, 400 on missing content, 400 on empty content, 401 when unauthenticated, and 403 when a non-owner (including a Board_Admin) edits or deletes a Comment.
5. THE Kano_API tests SHALL cover role enforcement: 403 for a User without a Board_Membership on Board, Column, Card, and Comment endpoints, and 403 for a Board_Member whose role is `member` on the member add and member remove endpoints, and 403 for a Board_Member who is not the Board_Admin on the Board update, Board delete, and analytics endpoints.
6. THE Kano_API tests SHALL cover soft-delete cascades: soft deleting a Board, a Column, and a Card each sets `is_deleted` to true on their child rows, and later GET requests for the deleted resources return status 404.
7. THE Kano_API tests SHALL create their own test data and SHALL leave no data that affects other tests, so that the suite gives the same result when run in any order and when run twice in a row.
8. WHEN `pytest -v` is run from `app/` against the test PostgreSQL database after the manual Migration_Step is complete, THE Kano_API test suite SHALL finish with 0 failures and 0 errors.
9. WHILE the manual Migration_Step is incomplete, THE tests that require database tables SHALL be treated as blocked.
10. IF the test database is unreachable or the schema has not been applied, THEN THE Kano_API test run SHALL stop with an error message that names the unavailable test database and SHALL NOT run tests against the development database.
11. THE Kano_API auth tests SHALL cover: login returning an Access_Token with `type` = `access` and expiry 3600 seconds and a Refresh_Token with `type` = `refresh` and expiry 604800 seconds, both with `sub` equal to the `user_id`, together with `expires_in` equal to 3600 and `refresh_expires_in` equal to 604800 in the response data; POST `/api/auth/refresh` returning 200 with a new Access_Token that is accepted by GET `/api/users/me`; status 401 for a refresh request with an expired Refresh_Token, a missing token, an Access_Token, or a Refresh_Token of a soft-deleted User; status 401 when a Refresh_Token is sent to GET `/api/users/me` or any other protected endpoint; and status 401 on GET and PATCH `/api/users/me` and on one other protected endpoint for an Access_Token whose subject belongs to a soft-deleted User. The soft-deleted User SHALL be seed data created directly in the test database, because Requirement 7 criterion 7 provides no endpoint to delete a User.
12. THE Kano_API users tests SHALL cover PATCH `/api/users/me`: name update (boundaries 0, 1, 100, and 101 characters); password change with a correct `current_password` (boundaries 7, 8, 128, and 129 characters) followed by a login with the new password; status 400 naming `current_password` for a wrong or missing `current_password` with the name left unchanged; status 400 for a body that contains `email` (with any value, including the current email) with the User unchanged; and that no response contains the password or the password hash.
13. THE Kano_API cards tests SHALL cover Card_Status: default `NOT_STARTED` on create; status 400 for a `status` in the create body and for each of `done`, an empty string, null, and an unknown value on PATCH, and acceptance of `URGENT` on PATCH; the `completed_at` rules of Requirement 11 criterion 19 (set on entering `DONE`, cleared on leaving `DONE`, unchanged on `DONE` to `DONE` and on updates without status); `status` and `completed_at` present in board detail, search, and My Tasks; and that a position change leaves both unchanged, including a move into a Column named `Done`.
14. THE Kano_API analytics tests SHALL cover the V6 completed-this-week rule: a Card with `DONE` and `completed_at` at Monday 00:00:00 UTC is counted, one second earlier is not counted, a `DONE` Card in a Column that is not named `Done` is counted, a Card in a Column named `Done` with another status is not counted, and a soft-deleted `DONE` Card is not counted.
15. THE Kano_API tests SHALL cover the Board_Guest role: status 403 for every write endpoint listed in Requirement 37 criterion 14, status 200 for the guest read endpoints, status 400 when a Board_Guest is set as assignee, and status 403 on analytics and invite-links.
16. THE Kano_API invitation tests SHALL cover: tokens created with the Board and lazily created for a Board with NULL tokens; the token properties of Requirement 37 criterion 2; GET invite-links and regenerate for the admin and for a manager and status 403 for a member, a guest, and a non-participant; regenerate invalidating the old token (status 404 on the old token) while the other role's token stays valid; accept creating a `member` and a `guest` membership; the upgrade of a guest through a member token; no downgrade of a member or admin through a guest token; repeated accept being idempotent; accept after a soft-deleted membership creating a new active membership; status 404 for an unknown token and for a soft-deleted Board; status 401 without a token; and that the invitation feature adds no table (the 9 tables of Requirement 1 criterion 9 after V11).
17. THE Kano_API tests for Requirement 31 criteria 12 to 16 SHALL be property-based where the behavior varies with input (the `completed_at` state machine over sequences of status changes, and the accept-role decision function over all role and token-role pairs).
18. THE Kano_API tests SHALL include a property-based test of the Card_Link URL validation over generated strings, asserting that a URL is accepted if and only if, after trimming, its scheme is `http` or `https` (case-insensitive), it has a non-empty hostname, and it is at most 2048 characters, and that `javascript:`, `data:`, `file:`, and scheme-less values are rejected with status 400.
19. THE Kano_API tests SHALL cover the caps: the 50th Checklist_Item of a Card is accepted and the 51st returns status 400, the 10th Card_Link is accepted and the 11th returns status 400, and a soft-deleted item or link does not count toward the cap.
20. THE Kano_API tests SHALL cover that a Board_Guest receives status 403 on POST `/api/cards/<id>/checklist`, PATCH and DELETE `/api/checklist/<id>`, POST `/api/cards/<id>/links`, PATCH and DELETE `/api/links/<id>`, and PATCH `/api/boards/<id>/members/<user_id>`, that a User without a Board_Membership receives status 403 on the same endpoints and on GET `/api/cards/<id>`, and that a Board_Guest receives status 200 on GET `/api/cards/<id>`.
21. THE Kano_API tests SHALL cover the cascades: soft deleting a Card, a Column, and a Board each sets `is_deleted` to true on the Checklist_Items and Card_Links below it with the same `deleted_at` value, and later GET requests for the deleted Card return status 404.
22. THE Kano_API tests SHALL assert that the number of database queries of GET `/api/boards/<id>` is at most 5 and is identical for a Board with 10 Cards and a Board with 500 Cards when the Cards have Checklist_Items and Card_Links, and that the `checklist_done`, `checklist_total`, and `link_count` values are correct and exclude soft-deleted rows.
23. THE Kano_API tests SHALL cover the rank rules of Requirement 43: a property-based test of the role-change decision over all combinations of caller role, target role, and new role, asserting that a change is allowed if and only if the Role_Rank of the caller is above the Role_Rank of the target and above the Role_Rank of the new role and the new role is not `admin`; a Board_Manager cannot change or remove a Board_Manager or the Board_Admin; the Board_Admin cannot be demoted or removed; only the Board_Admin can grant `manager`; and a change to `guest` clears the assignee of the Cards assigned to that User.
24. THE Kano_API tests SHALL cover that a Board_Member whose role is `member` receives status 403 on every Column endpoint of Requirement 10 criterion 11 while keeping full Card, Checklist_Item, Card_Link, Comment, and status access, and that a Board_Manager and a Board_Admin succeed on the Column endpoints.
25. THE Kano_API tests SHALL cover GET `/api/notifications/overdue`: a Card due yesterday and not `DONE` is returned with `days_overdue` 1, a Card due today is not returned, a `DONE` Card is not returned, an `URGENT` Card past due is returned, a Card assigned to another User is not returned to a User who is not its assignee, an unassigned Card is returned to the Board_Admin and the Board_Manager and not to a `member` or a `guest`, soft-deleted Cards and Boards are not returned, the response contains at most 100 items with the full `total`, and no Notification row is created.

### Requirement 32: Frontend Unit Tests

**User Story:** As a developer, I want component tests, so that UI behavior is verified.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide React Testing Library tests that render BaseButton in each of its `primary`, `secondary`, and `destructive` variants and assert that each variant renders a distinct variant-specific class and that a click fires the `onClick` handler exactly once.
2. THE Kano_Web SHALL provide React Testing Library tests for BaseModal that assert the modal content is absent while closed, present while open, closed by the Escape key, closed by a backdrop click, and that keyboard focus moves into the modal on open.
3. THE Kano_Web SHALL provide React Testing Library tests for the register form that assert a field-level error is shown and no request is submitted for each of: an empty name, a malformed email, and a password of 7 characters. The tests SHALL also assert that a valid form (password of 8 characters) is submitted.
4. THE Kano_Web SHALL provide React Testing Library tests for the login form that assert a field-level error is shown and no request is submitted for an empty email and for an empty password, and that a valid form is submitted.
5. THE Kano_Web SHALL provide React Testing Library tests for CommentList that assert edit and delete controls are shown for a Comment owned by the current User and hidden for a Comment owned by another User.
6. THE Kano_Web SHALL provide React Testing Library tests for NotificationBell that assert the unread count is shown for counts of 1 and 99 and that no count is shown when the unread count is 0.
7. THE Kano_Web SHALL provide apiClient tests, with the network mocked, that assert the header `Authorization: Bearer <token>` is sent when an Access_Token is available and omitted when none is available. The tests SHALL also assert that the `data` field is returned for a 2xx response, and that an ApiError carrying the response `statusCode` and the `error` message is thrown for each of the statuses 400, 401 (with no Refresh_Token available), 403, 404, 409, and 500.
8. THE Kano_Web SHALL provide useDragAndDrop tests, with the position request mocked to fail, that assert the Card is restored to its original Column and Order_Value and that the useErrorHandler toast is triggered once. The tests SHALL also assert that the Card is moved in local state before the mocked request resolves.
9. THE Kano_Web unit tests SHALL run without network access and without a running Kano_API, using mocked API responses only.
10. WHEN `npm test` is run from `web/`, THE Kano_Web test suite SHALL execute once without watch mode, pass every test with zero failures, and exit with code 0.
11. IF any Kano_Web unit test fails, THEN THE `npm test` command SHALL exit with a non-zero code and print the name of each failed test.
12. THE Kano_Web SHALL provide apiClient tests, with the network mocked, that assert: a 401 from a protected request triggers exactly one POST `/api/auth/refresh` and one retry of the original request with the new Access_Token; two concurrent 401 responses share a single refresh request; a refresh response of 401 clears both cookies and the AuthContext state and redirects to `/login`; and a 401 from POST `/api/auth/login` does not trigger a refresh.
13. THE Kano_Web SHALL provide useDragAndDrop tests for the touch path, with touch events simulated through React Testing Library (`touchstart`, `touchmove`, `touchend`, `touchcancel`), fake timers, and `document.elementFromPoint` mocked, that assert: a touch held 300 ms without moving starts a drag; a touch that moves more than 10 px or ends before 300 ms starts no drag and sends no request; a touch ended over a Column moves the Card in local state before the mocked position request resolves; a failing mocked request restores the Card to its original Column and Order_Value and triggers the useErrorHandler toast once; and a touch ended outside any Column or cancelled sends no request and leaves the state unchanged.
14. THE Kano_Web SHALL provide tests, with the network mocked, that assert: the apiClient running in a Server Component never sends POST `/api/auth/refresh`, never writes a cookie, and throws an ApiError with `statusCode` 401 on a 401 response; and a login response sets the access cookie lifetime from `expires_in` and the refresh cookie lifetime from `refresh_expires_in`, using values other than 3600 and 604800 to show that no constant is used.
15. THE Kano_Web SHALL provide React Testing Library tests for the profile form that assert: the email is shown as read-only text and no email input exists; a name of 0 and 101 characters shows a field-level error without a request; a password section with only one filled input shows a field-level error without a request; a new password of 7 characters shows an error and one of 8 characters is submitted together with `current_password`; a `current_password` error response (status 400) shows the error on the current password input; and the request body never contains `email`.
16. THE Kano_Web SHALL provide React Testing Library tests for the CardDetailModal that assert: the status control shows the four options with the current status preselected; changing only the status sends PATCH with only `status`; the board Card and the My Tasks row show the matching status badge after the update; a failing PATCH keeps the modal open and the previous status; and the guest view renders read-only controls without save, delete, and comment form.
17. THE Kano_Web SHALL provide tests for the new-card flow that assert: the CardDetailModal opens for the new Card after a 201 response; no modal opens after a failing creation request; and closing the modal keeps the Card with its title only.
18. THE Kano_Web SHALL provide tests for the invitation UI that assert: the MemberPanel shows the member and guest links with copy buttons for the Board_Admin and the Board_Manager and not for others; regenerate asks for confirmation and replaces the link only after a 200 response; the invite page shows the board name and role and joins through POST accept; an unknown token (status 404) shows the not-found message without a Join button; and a guest view hides every edit control listed in Requirement 21 criterion 20 and starts no drag.
19. THE Kano_Web SHALL provide property-based tests for the `decideRoute` function of Requirement 17 criterion 12 over all combinations of pathname class (`/`, `/welcome`, `/login`, `/register`, `/invite/<token>`, other protected route), authentication state, and Welcome_Cookie presence, asserting the outcomes of Requirement 38 criteria 5 to 11, and for the `next` validation of Requirement 19 criterion 11 over generated strings (valid invite paths accepted; absolute URLs, protocol-relative URLs, backslashes, extra slashes, and paths outside `/invite/` rejected).
20. THE Kano_Web SHALL provide React Testing Library tests for the Header logo link (Requirement 18 criteria 14 and 15) that assert: an unauthenticated visitor gets the target `/welcome` both with and without the Welcome_Cookie and on the `/login` and `/register` pages; an authenticated User (AuthContext status `authenticated`) gets the target `/`; a visitor with only a refresh cookie gets the target `/welcome` WHILE the AuthContext status is not `authenticated` (including during session restoration) and the target `/` once the restoration succeeds; the logo target and the Header navigation (Log in and Register links versus user controls) always match the same authentication state in every AuthContext status; the target changes to `/welcome` after a logout; the target is never `/login`; clicking the link sets and deletes no cookie and sends no request; and each page renders exactly one Header and one Footer.
21. THE Kano_Web SHALL provide React Testing Library tests for the Welcome_Page that assert: the sections of Requirement 38 criterion 15 appear in the stated order; the Header shows the Log in link to `/login` and the Register link to `/register`, both rendered as anchor elements and not through BaseButton; the hero shows the eyebrow, the headline, the subheadline, and the Get started BaseButton to `/register`; the features section shows the four feature cards of criterion 17 of Requirement 38; the bottom section shows the Create account BaseButton to `/register` and the Log in BaseButton to `/login`; the board preview content container has `aria-hidden="true"` and contains no focusable element, and its horizontal scroller lies outside that container and has `tabindex="-1"`; only the dragged preview Card carries a shadow; the page sends no request to the Kano_API; and the rendered text, `aria-label`, `alt`, and `title` values contain none of the forbidden claim strings of Requirement 38 criterion 19 (case-insensitive) and no testimonial, quotation, or star rating.
22. THE Kano_Web SHALL provide React Testing Library tests for the board page that assert: exactly one element with the role `separator` lies between the board toolbar and the Kanban columns area for the Board_Admin, Board_Member, and Board_Guest views; the separator follows the toolbar controls and precedes the columns area in document order; the separator is absent in the access-denied and not-found states; and no second separator element or toolbar-side and columns-side border is rendered between the two areas.
23. THE Kano_Web SHALL provide React Testing Library tests for the Footer that assert: the brand mark with the letter "K", the wordmark "Kano", and the text "Portfolio project built in 2026 by JC" are rendered, with "JC" in its own element; exactly two links are rendered, the link named "Kano on GitHub" with `href` `https://github.com` and the link named "Kano on LinkedIn" with `href` `https://www.linkedin.com`, each with `target` `_blank` and `rel` containing `noopener` and `noreferrer`; the icons are `aria-hidden`; the link classes contain the hover classes (`hover:text-ink`, `hover:bg-sunken`), the transition class, and the `focus-visible` outline classes of the design system (2 px outline); the brand group is not a link; the Footer text and `aria-label` values contain none of the forbidden strings of Requirement 38 criterion 19; the Footer sends no request; and each page renders exactly one Footer (Requirement 18 criterion 13), including the Welcome_Page. The tests SHALL locate the two links inside the Footer (the `contentinfo` role) or with exact name matching, because name matching is substring-based and "Kano on GitHub" and "Kano on LinkedIn" contain "Kano", the accessible name of the Header logo link.
24. THE Kano_Web SHALL provide property-based tests for `labelColor` asserting that the result is always one of the eight palette keys, that the same text always returns the same key, that texts differing only in case or surrounding whitespace return the same key, and that every key has a complete static class string.
25. THE Kano_Web SHALL provide tests for the status color map asserting that the four statuses map to four distinct class strings (neutral gray, primary blue, danger red, success green), that the labels are "Not started", "In progress", "Urgent", and "Done", and that the board Card and the My Tasks row show the matching badge.
26. THE Kano_Web SHALL provide tests for `can(role, action)` asserting, over every combination of role and action, that the result equals the permission table of Requirement 43 criterion 3, and that the role dropdown lists only the roles assignable by the current User (Board_Admin: guest, member, manager; Board_Manager: guest, member; others: none).
27. THE Kano_Web SHALL provide tests for the checklist asserting: the progress `3/5` and a bar of 60 percent for 3 done of 5 items, no progress indicator for 0 items, an optimistic toggle applied within 100 ms and restored with one error toast when the request fails, read-only checkboxes for a Board_Guest, and a disabled add control at 50 items.
28. THE Kano_Web SHALL provide tests for the Card_Links asserting: the add form rejects an empty value, `javascript:alert(1)`, `data:` and `file:` values, and a value longer than 2048 characters without sending a request, each link anchor carries `target` `_blank` and `rel` containing `noopener` and `noreferrer`, the count chip is hidden at 0 and shown above 0, the provider icon function returns the generic icon for an unknown hostname, and a Board_Guest sees the list without add, edit, or delete controls.
29. THE Kano_Web SHALL provide tests for the overdue UI asserting: the card chip is shown if and only if the due date is before the current UTC date and the status is not `DONE`, an overdue item in the notification list shows the red "Overdue" tag and the text "N days overdue" ("1 day overdue" for 1), the overdue request is sent on page load and when the list opens and never on a timer, and overdue items are not counted in the NotificationBell count.
30. THE Kano_Web SHALL provide tests asserting that the Board_Member whose role is `member` sees no column controls, member management controls, or analytics link, that the Board_Manager sees the column controls, the member panel, and both invitation links but no analytics link, and that the Welcome_Page copy passes the forbidden-string scan of Requirement 38 criterion 19 after V11.

### Requirement 33: End-to-End Tests

**User Story:** As a stakeholder, I want browser tests on the live site, so that the deployed system is verified end to end.

#### Acceptance Criteria

1. WHERE the environment variable holding the live Vercel frontend URL is set, THE E2E_Suite SHALL run Playwright against that URL.
2. IF the environment variable holding the live Vercel frontend URL is missing or is not a valid absolute http or https URL, THEN THE E2E_Suite SHALL exit before running any test with a non-zero exit code and an error message naming the variable.
3. WHEN the E2E_Suite runs the auth scenarios, THE E2E_Suite SHALL verify four cases: a login with the credentials `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` redirects to `/`, a login with the same email and a wrong password built at run time from `E2E_USER_PASSWORD` shows the invalid-credentials error on `/login` and stays on `/login`, an unauthenticated visit to a protected route (with the Welcome_Cookie set first) redirects to `/login`, and a logout redirects to `/login` and a following visit to `/` redirects to `/login` again. Every scenario that visits `/` while unauthenticated SHALL first set the `kano_welcome_seen` cookie.
4. WHEN the E2E_Suite runs the Kanban journey, THE E2E_Suite SHALL execute these 8 steps in order: (1) register a new User with a unique generated email per run and the password from `E2E_USER_PASSWORD`, (2) log in as that User, (3) create a Board, (4) add at least 2 Columns, (5) create a Card in the first Column, (6) drag the Card to the second Column, (7) reload the page and confirm the Card is shown in the second Column, (8) add a Comment to the Card and then edit that Comment and confirm the edited text is shown.
5. IF a step of the Kanban journey fails, THEN THE E2E_Suite SHALL mark the journey test as failed, skip the remaining steps of that journey, and keep the failure details in the HTML report.
6. THE E2E_Suite SHALL use Playwright auto-waiting and web-first assertions and SHALL NOT call `waitForTimeout` anywhere in the test code.
7. THE E2E_Suite SHALL use an assertion timeout of 10 seconds and a per-test timeout of 60 seconds, with no test retried more than 2 times.
8. WHEN `npx playwright test` is run, THE E2E_Suite SHALL finish with all tests passed, exit code 0, and generate an HTML report.
9. THE repository SHALL contain the full Playwright HTML report from a run in which all tests passed, including the result of every test, which is viewable with `npx playwright show-report`.
10. THE E2E_Suite in `web/e2e/` SHALL read the live URL and the test credentials only from the variables `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`, loaded by `playwright.config.ts` with dotenv from the git-ignored file `web/.env.test`, where a value already present in the process environment takes precedence over the file, and SHALL keep the validation of criterion 2 for `E2E_BASE_URL`.
11. IF `E2E_USER_EMAIL` or `E2E_USER_PASSWORD` is missing or empty when a test needs it, THEN THE E2E_Suite SHALL fail that test immediately with a message naming the missing variable and SHALL NOT print any variable value.
12. THE repository SHALL contain a check that fails when any file in `web/e2e/` contains a literal password or a literal e-mail credential (an e-mail address string literal or a password string literal used for login or registration), in the same style as the check for `waitForTimeout` in criterion 6.
13. WHEN the E2E_Suite runs the welcome scenario, THE E2E_Suite SHALL verify with a fresh browser context (no cookies) that a visit to `/` redirects to `/welcome`, that the page shows the Header "Log in" and "Register" links, the hero "Get started" button, and the bottom "Create account" and "Log in" buttons (each located within its own section), that the Header "Log in" link leads to `/login` and sets the `kano_welcome_seen` cookie, that the bottom "Create account" button leads to `/register`, and that a second visit to `/` then redirects to `/login`.
14. THE login-based E2E tests SHALL require an account for `E2E_USER_EMAIL` that already exists on the target database, which the user creates manually before the run, while the registration scenarios SHALL register a unique generated email per run with the password from `E2E_USER_PASSWORD`.
15. WHEN the E2E_Suite runs the logo scenarios, THE E2E_Suite SHALL verify that an unauthenticated visitor who opens `/login` (with the `kano_welcome_seen` cookie set by that visit) and clicks the Header logo lands on `/welcome`, that an unauthenticated visitor on `/register` who clicks the logo lands on `/welcome`, and that a logged-in User on a board page who clicks the logo lands on `/` (the Dashboard) and not on `/welcome` or `/login`.
16. WHEN the E2E_Suite runs the layout scenarios at viewport widths of 375 px and 1920 px, THE E2E_Suite SHALL verify for `/welcome` that the document has no horizontal scroll and that, at 375 px, the Header links and the three call-to-action buttons have a tap target of at least 44 px by 44 px, and for a board page that exactly one visible separator lies between the board toolbar and the Kanban columns area, with no overlap of the toolbar controls and no horizontal scroll of the page outside the Kanban board container.
17. WHEN the E2E_Suite runs the footer scenario at viewport widths of 375 px and 1920 px on `/welcome` (unauthenticated) and on the Dashboard (logged in), THE E2E_Suite SHALL verify that the Footer shows the brand and the text "Portfolio project built in 2026 by JC", that the "Kano on GitHub" and "Kano on LinkedIn" links are visible with the `href` values `https://github.com` and `https://www.linkedin.com` and `target` `_blank`, that the document has no horizontal scroll, and that at 375 px each of the two links has a tap target of at least 44 px by 44 px. THE E2E_Suite SHALL NOT click through to the external sites. THE E2E_Suite SHALL scope the locators of the two links to the footer (the `contentinfo` role) or use exact name matching, because name matching is substring-based and "Kano on GitHub" and "Kano on LinkedIn" contain "Kano", and the logo scenarios of criterion 15 SHALL scope the logo locator to the `banner` role or use exact name matching.

## Part E: Deployment and Documentation

### Requirement 34: Deployment

**User Story:** As a stakeholder, I want the app live on public URLs, so that it can be used and verified.

#### Acceptance Criteria

1. THE Kano_API SHALL be deployed as one Vercel project and Kano_Web SHALL be deployed as a separate Vercel project, each reachable over HTTPS at its own public URL without requiring a Vercel login.
2. WHERE Railway is chosen as an alternative for the Kano_API, THE deployment documentation SHALL describe the Railway configuration with Gunicorn, including the start command, the required environment variable names, and the Railway public URL.
3. WHEN the Kano_API is deployed, THE user SHALL apply the schema to the production database by running `flask db upgrade` as a manual Migration_Step before the deployed Kano_API is verified.
4. WHEN the deployed Kano_API is verified, THE GET `/api/health` request SHALL return status 200 with `{ "data": { "status": "ok" } }`, THE POST `/api/auth/register` request SHALL return status 201, and THE POST `/api/auth/login` request SHALL return status 200 with an Access_Token and a Refresh_Token, each sent from Postman against the public URL.
5. WHEN the deployed Kano_API is verified, THE deployed Kano_API SHALL answer at least one request to each of the eight Blueprint_Package groups (auth, boards, columns, cards, comments, notifications, analytics, users) with a body in the Response_Envelope form.
6. WHEN the deployed Kano_Web is verified, THE deployed Kano_Web SHALL load each of the Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, and Login pages against the deployed Kano_API, with no failed network requests (status 4xx or 5xx caused by configuration) and no uncaught errors in the browser console.
7. THE deployment configuration SHALL set the Kano_API allowed-origins environment variable to the exact public URL of the deployed Kano_Web, and THE deployment configuration SHALL set `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL` to the public URL of the deployed Kano_API.
8. WHEN a User registers, logs in, creates a board, adds columns, creates and drags a card, adds and edits a comment, searches for a card, and views the notification bell on the deployed application, THE deployed application SHALL complete each step without an error toast or error page at a desktop viewport of 1280 px width and at a mobile viewport of 375 px width.
9. IF a browser request from the deployed Kano_Web origin to the deployed Kano_API is blocked by CORS, THEN THE deployment SHALL be treated as failed verification, and THE user SHALL correct the allowed-origins environment variable and redeploy the Kano_API before re-running the verification.
10. IF the production database schema has not been applied when a deployed Kano_API endpoint that uses the database is called, THEN THE deployed Kano_API SHALL return status 500 in the Response_Envelope with a generic error message and without exposing database details.

### Requirement 35: Repository Hygiene

**User Story:** As a reviewer, I want a clean repository, so that I can evaluate the project.

#### Acceptance Criteria

1. THE repository SHALL contain a `.gitignore` at the repository root that excludes `.env`, `.env.local`, `.env.test`, and every other `.env*` file except `.env.example` and `.env.test.example`, and that excludes `__pycache__/`, `.next/`, `node_modules/`, and `app/venv/`.
2. THE repository SHALL commit `app/.env.example`, `web/.env.example`, and `web/.env.test.example` (listing `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`), each listing every environment variable name that the corresponding project reads, with a placeholder value that is not a real credential.
3. THE repository SHALL contain no real secrets (JWT secret, database password, or API key) in any tracked file or in any commit of the Git history.
4. THE repository SHALL have a commit history in which each of the six phases (specification writing, guideline authoring, backend implementation, frontend implementation, testing, and deployment) is represented by at least 1 commit whose message names the phase.
5. THE repository SHALL keep the specification documents `requirements.md`, `design.md`, `tasks.md`, and `CHANGELOG.md` in `.kiro/specs/kano/`.
6. THE CHANGELOG.md SHALL contain at least 5 refinement entries, and each entry SHALL show the text before the refinement, the text after the refinement, the version number, and the date.
7. IF a tracked file matches an exclusion pattern of the `.gitignore` or contains a real secret, THEN THE repository SHALL be treated as failing this requirement until the file is removed from tracking and the secret is rotated.

### Requirement 36: Project Documentation

**User Story:** As a reviewer, I want a complete README, so that I can understand, run, and verify the project.

#### Acceptance Criteria

1. THE README.md SHALL be located in the repository root and SHALL contain the sections Overview, AI Workflow Summary, Features, Technologies, Local Run Steps, Test Steps, and Screenshots, each under its own heading.
2. THE README.md Overview section SHALL state what Kano is in 1 to 5 sentences and name the two deployed projects (Kano_API and Kano_Web) with their public URLs.
3. THE README.md Features section SHALL list at least one entry for each of: JWT authentication with access and refresh tokens, board management, column management, card management, board members with roles, drag-and-drop with FLOAT ordering, comments, notifications, card search, My Tasks view, user profile, and board analytics.
4. THE AI Workflow Summary SHALL contain one subsection for each of the following topics, with at least 3 sentences per subsection: how the project brief was written, how Kiro generated and iterated the specifications, how Guidelines were authored and applied, how code was reviewed against the Guidelines, how violations were documented and resolved, how Antigravity was used in the workflow, and how Claude Code generated and refined tests and documentation.
5. THE AI Workflow Summary SHALL link to the Guidelines, the violation report, and the before/after comparison required by Requirement 30, and every link SHALL resolve to an existing file in the repository.
6. THE README.md Technologies section SHALL list Next.js, React, TypeScript, Tailwind CSS, react-hot-toast, Playwright, Flask, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, PostgreSQL, python-dotenv, Gunicorn, Vercel, Railway (marked as an optional alternative), Kiro, Antigravity, and Claude Code.
7. THE README.md Local Run Steps SHALL list these steps as a numbered sequence in this order: clone the repository; create and activate a Python virtual environment; install dependencies from `app/requirements.txt`; copy `app/.env.example` to `app/.env` and set its values; run `flask db upgrade` (marked as a manual Migration_Step); start the API with `flask run`; run `npm install` in `web/`; copy `web/.env.example` to `web/.env.local` and set its values; run `npm run dev`.
8. THE README.md Local Run Steps SHALL state the prerequisite versions (Python 3.14, Node.js, and PostgreSQL) and the local URLs where Kano_API and Kano_Web are reachable after startup.
9. THE README.md Test Steps SHALL list the commands `pytest -v` (run in `app/`), `npm test` (run in `web/`), `npx playwright install`, `npx playwright test`, and `npx playwright show-report`, and SHALL name the environment variable that holds the live Vercel frontend URL for the Playwright run.
10. THE README.md Screenshots section SHALL include at least three image files stored in `docs/screenshots/`, each with a caption naming its subject and each showing Kano_Web in use (for example the Welcome_Page, the Dashboard, and Board Detail). Further screenshots, for example a Postman run against the public URL, the Card Detail Modal, My Tasks, Profile, Register, or Login, a Card being dragged between Columns, the notification bell, or the Playwright HTML report, are optional.
11. THE README.md SHALL document the XSS exposure of the non-httpOnly access cookie and refresh cookie (both tokens) and its mitigations, and SHALL document that Refresh_Tokens are stateless and cannot be revoked on logout, as required by Requirement 28 criterion 8 and Requirement 6 criterion 15.
12. IF a link or image path in README.md does not resolve to an existing file or URL, THEN THE repository SHALL be treated as failing this requirement until the link or image path is corrected.
13. THE README.md SHALL, in addition to criteria 1 to 12, list in Features the card status, the board invitation links with the guest role, and the welcome page; SHALL document in Test Steps the file `web/.env.test` (created from `web/.env.test.example`) with the variables `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` and the need for a pre-existing account; and SHALL state in Local Run Steps that the V6 schema changes need `flask db migrate` and `flask db upgrade` as a manual Migration_Step.
14. THE README.md, and every document in `.kiro/specs/kano/`, SHALL NOT mention by file name, link to, or embed the AI-generated HTML example files stored in the `improvements/` folder that served as visual references for the Welcome_Page and the board page, and SHALL describe the resulting look and behavior in words only (Requirement 38 criteria 15 to 21 and Requirement 21 criteria 24 to 28).
15. THE README.md SHALL, in addition to criteria 1 to 14, list in Features the Urgent card status and label colors, overdue notifications, card checklists, workspace links (URLs only, no file upload), and the Manager role with its permissions; SHALL state in Local Run Steps that the V11 schema changes need `flask db migrate` and `flask db upgrade` as a manual Migration_Step, in which the user hand-edits the `cards.status` and `board_memberships.role` check constraints because the migration generator does not detect them; and SHALL state that the role `member` no longer manages Columns.

## Part F: V6 Improvements

### Requirement 37: Board Invitation Links and Guest Role

**User Story:** As a Board_Admin, I want to share a member link and a guest link for my board, so that people can join with the right access without me typing their email.

#### Acceptance Criteria

1. THE Kano_API SHALL store the Invite_Tokens of a Board as the two columns `member_invite_token` and `guest_invite_token` of the `boards` table and SHALL add no table for this feature (the table count is defined in Requirement 1 criterion 9).
2. THE Kano_API SHALL generate each Invite_Token with a cryptographically secure random generator with at least 32 bytes of entropy, as a URL-safe string of 43 to 128 characters from `A-Z`, `a-z`, `0-9`, `_`, and `-`, unique across all Boards and across both roles.
3. WHEN a Board is created, THE Kano_API SHALL create both Invite_Tokens in the same transaction as the Board and the admin Board_Membership, and WHEN a Board_Admin or a Board_Manager sends GET `/api/boards/<id>/invite-links` for a Board whose Invite_Tokens are NULL (a Board that existed before V6), THE Kano_API SHALL create the missing tokens, store them, and return them.
4. WHEN a Board_Admin or a Board_Manager sends GET `/api/boards/<id>/invite-links`, THE Kano_API SHALL return status 200 with `{ "data": { "member": { "role": "member", "token": "<token>" }, "guest": { "role": "guest", "token": "<token>" } } }`.
5. IF a Board_Member whose role is `member`, a Board_Guest, or a User without a non-deleted Board_Membership sends GET `/api/boards/<id>/invite-links` or POST `/api/boards/<id>/invite-links/<role>/regenerate`, THEN THE Kano_API SHALL return status 403, leave the tokens unchanged, and not disclose any token.
6. WHEN a Board_Admin or a Board_Manager sends POST `/api/boards/<id>/invite-links/<role>/regenerate` with `<role>` equal to `member` or `guest`, THE Kano_API SHALL replace the Invite_Token of that role with a new token, make the old token invalid immediately, leave the token of the other role unchanged, and return status 200 with `{ "data": { "role": "<role>", "token": "<new token>" } }`.
7. IF `<role>` in a regenerate request is neither `member` nor `guest`, THEN THE Kano_API SHALL return status 400 and leave both tokens unchanged.
8. IF the Board in a GET invite-links or regenerate request does not exist, is soft deleted, or `<id>` is not a valid UUID, THEN THE Kano_API SHALL return status 404.
9. WHEN an authenticated client sends GET `/api/invites/<token>` with a valid Invite_Token of a non-deleted Board, THE Kano_API SHALL return status 200 with `{ "data": { "board_id", "board_name", "role", "current_role" } }`, where `role` is the role of the token and `current_role` is the role of the current User on that Board or null when the User has no non-deleted Board_Membership.
10. IF the token in a GET `/api/invites/<token>` or POST `/api/invites/<token>/accept` request is unknown, has been replaced by a regenerate request, does not match the format of criterion 2, or belongs to a soft-deleted Board, THEN THE Kano_API SHALL return status 404, create no Board_Membership, and disclose no Board data.
11. WHEN an authenticated client sends POST `/api/invites/<token>/accept` with a valid Invite_Token and the User has no non-deleted Board_Membership on the Board, THE Kano_API SHALL create a Board_Membership with the role of the token (`member` or `guest`) and return status 200 with `{ "data": { "board_id", "role" } }`.
12. IF the User already has a non-deleted Board_Membership on the Board when accepting an Invite_Token, THEN THE Kano_API SHALL change nothing and return status 200 with the existing role, except that a `guest` who accepts the member token SHALL be upgraded to `member` and the response SHALL carry the role `member`; a `member`, `manager`, or `admin` who accepts the guest token SHALL keep the role, a `manager` who accepts the member token SHALL keep the role `manager`, and an `admin` who accepts any token SHALL keep the role `admin`.
13. IF the User has only a soft-deleted Board_Membership on the Board when accepting an Invite_Token, THEN THE Kano_API SHALL create a new non-deleted Board_Membership with the role of the token, leave the soft-deleted row unchanged, and return status 200, so that the partial unique index of Requirement 2 criterion 12 is respected.
14. IF a Board_Guest sends any of the following requests, THEN THE Kano_API SHALL return status 403 and leave the data unchanged: PATCH or DELETE `/api/boards/<id>`; POST or DELETE on `/api/boards/<id>/members`; POST `/api/boards/<id>/columns`; PATCH `/api/boards/<id>/columns/reorder`; PATCH or DELETE `/api/columns/<id>`; POST `/api/columns/<id>/cards`; PATCH or DELETE `/api/cards/<id>`; PATCH `/api/cards/<id>/position`; POST `/api/cards/<id>/comments`; PATCH or DELETE `/api/comments/<id>`; GET `/api/boards/<id>/analytics`; GET `/api/boards/<id>/invite-links`; POST `/api/boards/<id>/invite-links/<role>/regenerate`; PATCH `/api/boards/<id>/members/<user_id>`; POST `/api/cards/<id>/checklist`; PATCH or DELETE `/api/checklist/<id>`; POST `/api/cards/<id>/links`; PATCH or DELETE `/api/links/<id>`. A Board_Guest MAY send GET `/api/boards/<id>`, GET `/api/boards/<id>/members`, GET `/api/cards/<id>/comments`, GET `/api/cards` (search), and the invite and notification endpoints for the guest's own account.
15. WHERE the current User is the Board_Admin or a Board_Manager, THE Kano_Web SHALL show in the member management panel the member Invite_Link (labelled as able to edit) and the guest Invite_Link (labelled as view only), each as the full URL `<origin>/invite/<token>` with a copy BaseButton that copies the URL to the clipboard and shows a success toast, and IF the clipboard is not available, THEN THE Kano_Web SHALL show an error toast and keep the URL visible as selectable text.
16. WHEN the Board_Admin or a Board_Manager selects the regenerate BaseButton of a link, THE Kano_Web SHALL open a BaseModal that states that the old link stops working, and WHEN the Board_Admin or a Board_Manager confirms, THE Kano_Web SHALL send POST `/api/boards/<id>/invite-links/<role>/regenerate`, show the new link and a success toast on status 200, and IF the request fails, THEN THE Kano_Web SHALL keep the old link displayed and trigger the useErrorHandler toast.
17. THE Kano_Web SHALL show the role of every Board_Membership in the member management panel as a BaseBadge (`admin`, `manager`, `member`, or `guest`) and SHALL let the Board_Admin or a Board_Manager remove a Board_Guest with the same control as a Board_Member.
18. WHEN an authenticated User requests `/invite/<token>`, THE Kano_Web SHALL fetch GET `/api/invites/<token>` and show the board name, the role the User would get ("Member: can edit" or "Guest: view only"), and a Join BaseButton; WHEN the User selects Join, THE Kano_Web SHALL send POST `/api/invites/<token>/accept`, disable the button until the response arrives, and on status 200 redirect to `/boards/<board_id>` and show a success toast.
19. IF the GET `/api/invites/<token>` or the accept request returns status 404, THEN THE Kano_Web SHALL show a not-found message for the invitation with a link to `/` and SHALL NOT show the Join BaseButton, and IF the User already holds a role that the token would not change (criterion 12), THEN THE Kano_Web SHALL show the current role and an open-board link instead of the Join BaseButton.
20. WHEN an unauthenticated visitor requests `/invite/<token>`, THE Kano_Web middleware SHALL redirect the visitor to `/login?next=<URL-encoded /invite/<token>>` (a visitor may switch to `/register`, which keeps the `next` parameter by Requirement 19 criterion 12), and after a successful login THE Kano_Web SHALL return the visitor to `/invite/<token>` under the validation of Requirement 19 criterion 11.
21. THE Kano_API SHALL keep an Invite_Token valid with no expiry time and no limit on the number of uses until a regenerate request replaces it or the Board is soft deleted, and accepting a token SHALL NOT consume it.
22. THE Kano_API SHALL keep adding a member by email (Requirement 9 criterion 1) unchanged, creating the role `member`, and SHALL provide no endpoint that changes a role other than the upgrade of criterion 12 and the role-change endpoint of Requirement 43 criterion 5.
23. IF a request to GET `/api/invites/<token>` or POST `/api/invites/<token>/accept` has a missing, malformed, invalid-signature, expired, or wrong-type JWT, THEN THE Kano_API SHALL return status 401 and make no change.

### Requirement 38: Welcome Page

**User Story:** As a first-time visitor, I want an introduction to Kano before I log in, so that I understand what the app offers.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide a public page `/welcome` rendered as a Server Component that sends no request to the Kano_API and presents Kano and what a User can do with it in the sections, order, texts, and visual rules defined in criteria 15 to 21 (V8 replaces the V6 text "1 to 5 sentences plus a list of eight capabilities", see criterion 17 for where each capability is now named).
2. THE Welcome_Page SHALL render exactly one Header and one Footer (Requirement 18 criterion 13) and SHALL provide the five navigation actions of criterion 16: "Log in" and "Register" in the Header, each rendered as a link (an anchor element) with the non-primary and primary style stated in criterion 16, and "Get started" in the hero section and "Create account" and "Log in" in the bottom call-to-action section, each rendered through BaseButton, all five navigating to `/login` or `/register` as stated in criterion 16.
3. WHILE the viewport width is between 375 px and 1920 px inclusive, THE Welcome_Page SHALL satisfy Requirement 27 criteria 1, 2, and 9.
4. THE Welcome_Cookie SHALL be named `kano_welcome_seen`, SHALL have the value `1`, SHALL NOT be httpOnly, and SHALL have `SameSite=Lax`, the path `/`, and a lifetime of 31536000 seconds.
5. WHEN an unauthenticated visitor without the Welcome_Cookie requests `/`, THE Kano_Web middleware SHALL redirect the visitor to `/welcome` before rendering any page content.
6. WHEN an unauthenticated visitor with the Welcome_Cookie requests `/`, THE Kano_Web middleware SHALL redirect the visitor to `/login`.
7. WHEN an unauthenticated visitor requests a protected route other than `/` and `/invite/<token>`, THE Kano_Web middleware SHALL redirect the visitor to `/login`, with or without the Welcome_Cookie.
8. WHEN an authenticated User requests `/welcome`, THE Kano_Web middleware SHALL redirect the User to `/`.
9. THE Kano_Web SHALL serve `/welcome`, `/login`, and `/register` to an unauthenticated visitor without a redirect, with or without the Welcome_Cookie.
10. WHEN an unauthenticated visitor requests `/login` or `/register` and the Welcome_Cookie is absent, or selects any of the five navigation actions of criterion 16 on the Welcome_Page (the Header "Log in" or "Register", "Get started", or the bottom "Create account" or "Log in"), THE Kano_Web SHALL set the Welcome_Cookie, so that the first-visit redirect of criterion 5 happens at most until the visitor has opened the login or register page.
11. WHEN an unauthenticated visitor requests `/invite/<token>`, THE Kano_Web middleware SHALL redirect the visitor to `/login?next=<URL-encoded path>` (Requirement 37 criterion 20) with or without the Welcome_Cookie, and SHALL NOT redirect to `/welcome`.
12. WHEN an authenticated User requests `/`, THE Kano_Web middleware SHALL continue to the Dashboard and SHALL NOT redirect to `/welcome`, with or without the Welcome_Cookie.
13. WHEN a User logs out, THE Kano_Web SHALL keep the Welcome_Cookie, so that a following request for `/` redirects to `/login` (criterion 6).
14. THE E2E_Suite SHALL cover criteria 5 to 11 as specified in Requirement 33 criteria 3 and 13.
15. THE Welcome_Page SHALL contain exactly these parts in this order from top to bottom: (a) the Header; (b) a hero section with an eyebrow badge, one `h1` headline, a subheadline, and one primary call to action; (c) a decorative board preview (criterion 18); (d) a features section with a heading, one introductory sentence, and four feature cards; (e) a bottom call-to-action section with a heading, one supporting sentence, and two buttons; (f) the Footer. THE Welcome_Page SHALL contain no other section, in particular no metrics bar, no testimonial, and no trust note.
16. THE Welcome_Page SHALL use these texts and targets: Header: a "Log in" link to `/login` (non-primary style) and a "Register" link to `/register` (primary style); hero eyebrow "Kanban boards for teams"; hero headline "Organize work smoothly, from idea to done"; hero subheadline "Plan work on boards and columns, move cards by drag and drop, and keep your team aligned with comments, notifications, and invitation links."; hero primary button "Get started" to `/register`; features heading "Everything your team needs to execute" with the introductory sentence "Kano keeps boards simple so your team can focus on what to do next."; bottom heading "Ready to bring calm to your project planning?" with the supporting sentence "Create an account to start your first board, or log in to pick up where you left off."; bottom primary button "Create account" to `/register` and bottom secondary button "Log in" to `/login`.
17. THE features section SHALL contain exactly four feature cards, each with an icon, a title, and a description, with these titles and descriptions: "Drag and drop on mouse and touch" ("Move cards between columns with a mouse or by touch, and Kano keeps the order you chose."); "Stay organized at a glance" ("Add labels, due dates, and a status (Not started, In progress, Urgent, or Done) to every card."); "Collaborate with your team" ("Comment on cards, get notifications about assignments and comments, and invite members or read-only guests with a link."); "Find and focus" ("Search the cards of a board, see the cards assigned to you in My Tasks, and let board admins view analytics."). Together with criterion 16, the page text SHALL name boards, columns, drag and drop by mouse and touch, labels, due dates, card status, comments, notifications, My Tasks, card search, member and guest invitation links with read-only guest access, and board analytics.
18. THE board preview SHALL be a static illustration of a Board with sample data (at least three Columns with sample Cards, colored label chips from the design-system label colors, avatar initials, status badges that use only the labels "Not started", "In progress", "Urgent", and "Done", and one Card shown as being dragged next to a dashed drop placeholder), SHALL be marked decorative with `aria-hidden="true"` on the container of the preview content, SHALL contain no link, button, or other focusable element inside that preview content, SHALL be wrapped in a horizontal scroller (criterion 21) that lies outside the `aria-hidden` container and has `tabindex="-1"` so that the scroller is not a tab stop, SHALL send no request, and SHALL contain no ticket identifiers, user or team counts, metrics, or other text that claims real usage.
19. THE Welcome_Page SHALL NOT contain, in its visible text or in any `aria-label`, `alt`, `title`, or page description value, any of the following strings (compared case-insensitively): "10,000", "trusted by", "uptime", "99.9", "latency", "100ms", "4.9", "satisfaction", "rating", the whole word "free", "credit card", "60 seconds", "real-time", "real time", "websocket", "fuzzy", "threaded", "subtask", and "KAN-", and SHALL contain no testimonial, quotation, named customer, or star rating, because none of these statements is true for Kano. THE comparison SHALL be a case-insensitive substring match for every listed string except "free", which SHALL be matched as a whole word, so a word that merely contains a forbidden string (for example "operating", "integrating", or "generating" contain "rating") is also a violation, and the copy of the Welcome_Page SHALL avoid such words.
20. THE Welcome_Page SHALL follow the Kano design system in `guidelines/design-system.md`: the Inter font in the weights 400, 500, and 600 only, only the defined color, radius (`rounded-md` and `rounded-lg`), and spacing tokens, flat surfaces with 1 px `line` borders and no gradient, blur, or glass effect, and no drop shadow except the design-system overlay shadow (`shadow-overlay`), which only the one dragged Card of the board preview (criterion 18) MAY carry, the `canvas` page background, `surface` cards, a `sunken` bottom call-to-action panel, the headline in the Display role from 768 px and the H1 role below 768 px, icons from the design-system icon library, text contrast of at least 4.5:1, and one primary button per region (the Header "Register", the hero "Get started", and the bottom "Create account" each form the only primary button of their region).
21. WHILE the viewport width is 768 px or more, THE Welcome_Page SHALL center the hero content, show the preview Columns side by side, show the feature cards in two columns, and show the two bottom buttons side by side, and WHILE the viewport width is below 768 px, THE Welcome_Page SHALL show every section in a single column, show the hero button and the two bottom buttons stacked at full width with a height of at least 44 px, show the feature cards stacked, and keep the preview Columns at a fixed width of at least 240 px inside the horizontal scroller of criterion 18, so that the page itself has no horizontal scroll (Requirement 27 criteria 1, 2, 6, 9, and 10).

## Part G: V11 Improvements

### Requirement 39: Urgent Card Status and Label Colors

**User Story:** As a board member, I want an Urgent status and varied label colors, so that I can see priority and categories at a glance.

#### Acceptance Criteria

1. THE Kano_API SHALL accept `URGENT` as a Card_Status value in PATCH `/api/cards/<id>` and store it under the check constraint of Requirement 2 criterion 16.
2. WHEN the Card_Status of a Card changes between any two of `NOT_STARTED`, `IN_PROGRESS`, and `URGENT`, THE Kano_API SHALL leave `completed_at` unchanged.
3. THE Kano_API SHALL count a Card as completed in the analytics of Requirement 14 only WHEN its `status` is `DONE`, so that an `URGENT` Card is never counted as completed.
4. THE Kano_API SHALL leave the `status` and `completed_at` of every existing Card unchanged when the V11 Migration_Step is applied.
5. THE Kano_Web SHALL define in `lib/status.ts` one lookup object that maps each Card_Status to its label and to a complete static Tailwind class string (no class name built dynamically), using only design-system tokens: `NOT_STARTED` neutral gray, `IN_PROGRESS` primary blue, `URGENT` danger red, and `DONE` success green.
6. THE Kano_Web SHALL render the status chip on the Card face, in the CardDetailModal, and in the My Tasks list with the class string of criterion 5 for the status of the Card.
7. THE Kano_Web SHALL provide a pure function `labelColor(text)` that trims and lowercases the text, computes a stable hash, and returns exactly one of the eight palette keys `gray`, `blue`, `green`, `yellow`, `orange`, `red`, `purple`, and `pink`.
8. THE `labelColor` function SHALL return the same key for the same normalized text on every Board, device, and call, and SHALL return the same key for texts that differ only in letter case or surrounding whitespace.
9. THE Kano_Web SHALL define one lookup object that maps each palette key to a complete static class string built from design-system tokens, with a contrast ratio of at least 4.5:1 between text and background.
10. IF the design system has no token pair for a palette key, THEN THE `guidelines/design-system.md` document SHALL define that token pair before the key is used.
11. THE Kano_Web SHALL render every label chip on the Card face and in the CardDetailModal with the class string of `labelColor` for the label text.
12. THE Kano_API SHALL keep Card labels as a list of strings, so that label colors need no schema change and no migration.

### Requirement 40: Overdue Notification

**User Story:** As a board member, I want to be told which tasks are past their deadline and not completed, so that I can act on them.

#### Acceptance Criteria

1. WHEN an authenticated client sends GET `/api/notifications/overdue`, THE Kano_API SHALL return status 200 with `{ "data": { "items": [...], "total": <integer> } }`, implemented in the `notifications` Blueprint_Package.
2. THE Kano_API SHALL return as `items` the Overdue_Cards for which the current User is the assignee and holds the role `admin`, `manager`, or `member` on the Board, together with the Overdue_Cards that have no assignee on Boards where the current User holds the role `admin` or `manager`.
3. WHEN the current User holds only the role `guest` on every Board, THE Kano_API SHALL return status 200 with an empty `items` list and `total` 0.
4. THE Kano_API SHALL treat a Card as overdue only WHEN its due date is earlier than the current UTC date, so that a Card due today is not overdue, and SHALL treat a Card with the status `URGENT` as not done.
5. THE Kano_API SHALL return for each item the `card_id`, `title`, `due_date`, `status`, `column_name`, `board_id`, `board_name`, and `days_overdue` (the whole number of days from the due date to the current UTC date, at least 1), ordered by due date ascending, with at most 100 items, and with `total` equal to the number of all matching Cards.
6. THE Kano_API SHALL compute the overdue items on every request, SHALL create no Notification row, SHALL use no scheduled job, and SHALL leave the stored Notifications, their `is_read` flags, and the unread count of GET `/api/notifications` unchanged, as a deliberate exception to the stored-Notification rule of Requirement 13 criterion 4.
7. THE Kano_API SHALL define a database index on the Card due date column.
8. WHEN a client sends GET `/api/notifications/overdue` for a User who is a Board_Participant of up to 20 Boards containing 2,000 non-deleted Cards in total, THE Kano_API SHALL respond within 500 ms at the 95th percentile, measured over at least 100 consecutive requests on the local development environment.
9. IF a request to GET `/api/notifications/overdue` has a missing, invalid, expired, or wrong-type JWT, THEN THE Kano_API SHALL return status 401.
10. WHEN the page loads for an authenticated User, and WHEN the User opens the notification list, THE Kano_Web SHALL send GET `/api/notifications/overdue` and SHALL NOT poll it on a timer.
11. THE Kano_Web SHALL show each overdue item in the notification list with a red "Overdue" BaseBadge and the text "N days overdue" ("1 day overdue" for 1), and WHEN the User selects an overdue item, THE Kano_Web SHALL navigate to `/boards/<board_id>`.
12. THE Kano_Web SHALL exclude overdue items from the unread count shown by the NotificationBell of Requirement 24 criterion 2, because overdue items are not stored Notifications.
13. THE Kano_Web SHALL show the empty-state message of Requirement 24 criterion 5 only WHEN the notification list has no stored Notifications and no overdue items.
14. WHEN a Card has a due date earlier than the current UTC date and a Card_Status other than `DONE`, THE Kano_Web SHALL show on the Card face a danger chip with the text "Overdue" using the design-system classes `bg-danger-soft text-danger-ink`, and SHALL hide the chip otherwise, without sending a request.
15. IF the GET `/api/notifications/overdue` request fails, THEN THE Kano_Web SHALL keep the previous overdue items without showing an error toast, as in Requirement 24 criterion 9.

### Requirement 41: Card Checklist

**User Story:** As a board member, I want a to-do checklist inside a card, so that I can track the progress of the task.

#### Acceptance Criteria

1. THE Kano_API SHALL store each Checklist_Item in the table `checklist_items` with the primary key `checklist_item_id` (UUID), the foreign key `card_id` (constraint `fk_checklist_items_cards`, indexed), `text`, `is_done` (boolean, NOT NULL, default false), `order` (FLOAT, NOT NULL), and the columns of Requirement 2 criterion 5, with no `ON DELETE CASCADE`.
2. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends POST `/api/cards/<id>/checklist` with a `text` of 1 to 200 characters that contains at least one non-whitespace character, THE Kano_API SHALL create a Checklist_Item with `is_done` false and an Order_Value greater than the highest Order_Value among the non-deleted Checklist_Items of the Card (or 1.0 if there is none), and return status 201 with the item.
3. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends PATCH `/api/checklist/<id>` with any of `text` (same rule as criterion 2), `is_done` (boolean), and `order` (float greater than 0), THE Kano_API SHALL update only the supplied fields and return status 200 with the item.
4. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends DELETE `/api/checklist/<id>`, THE Kano_API SHALL soft delete the item and return status 200 with `{ "data": { "checklist_item_id": "<id>" } }`.
5. IF a POST request would make the 51st non-deleted Checklist_Item of a Card, THEN THE Kano_API SHALL return status 400 and create no item.
6. IF a checklist create or update request has a missing, empty, whitespace-only, or longer than 200 characters `text`, a non-boolean `is_done`, an `order` that is not a float greater than 0, or a PATCH body with none of the three fields, THEN THE Kano_API SHALL return status 400 and leave the item unchanged.
7. IF a Board_Guest sends a POST, PATCH, or DELETE checklist request, or a User without a non-deleted Board_Membership on the Board sends any checklist request or GET `/api/cards/<id>`, THEN THE Kano_API SHALL return status 403 and leave the data unchanged.
8. IF the Card or the Checklist_Item of a request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
9. WHEN a Board_Participant sends GET `/api/cards/<id>`, THE Kano_API SHALL return status 200 with the Card, its `checklist` (non-deleted items ordered by Order_Value ascending, each with `checklist_item_id`, `text`, `is_done`, `order`), `checklist_done`, `checklist_total`, and its `links` (Requirement 42).
10. THE Kano_API SHALL compute `checklist_done` and `checklist_total` from the non-deleted Checklist_Items on every request, SHALL NOT store them, and SHALL leave the `status`, `completed_at`, and notifications unchanged when a Checklist_Item changes.
11. THE Kano_API SHALL implement the checklist inside the `cards` Blueprint_Package and SHALL add no ninth Blueprint_Package.
12. THE Kano_Web SHALL show in the CardDetailModal a checklist section with a checkbox, the text, and a delete control for each item, an inline add form, and inline text editing, and WHERE the current User is a Board_Guest, THE Kano_Web SHALL show the items read-only without the add form and the edit and delete controls.
13. IF the add form text is empty, whitespace-only, or longer than 200 characters, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request, and WHILE the Card has 50 items, THE Kano_Web SHALL disable the add form and show the limit message.
14. WHEN a Board_Admin, a Board_Manager, or a Board_Member toggles a checkbox, THE Kano_Web SHALL apply the new `is_done` value to local state within 100 ms, before the API responds, and send PATCH `/api/checklist/<id>`, and IF the request fails, THEN THE Kano_Web SHALL restore the previous value within 100 ms and trigger the useErrorHandler toast.
15. IF a checklist add, edit, or delete request fails, THEN THE Kano_Web SHALL leave the displayed items unchanged, keep the entered text, and trigger the useErrorHandler toast.
16. WHILE the Card has at least one Checklist_Item, THE Kano_Web SHALL show on the Card face the progress `done/total` (for example `3/5`) and a thin progress bar of the width done divided by total, built from design-system tokens, and WHILE the Card has no Checklist_Item, THE Kano_Web SHALL show no progress indicator.
17. WHEN an item is added, toggled, or deleted in the CardDetailModal, THE Kano_Web SHALL update the progress on the Card face without a page reload.

### Requirement 42: Workspace Links

**User Story:** As a board member, I want to attach links to external work files on a card, so that the team can open the files from the task.

#### Acceptance Criteria

1. THE Kano_API SHALL store each Card_Link in the table `card_links` with the primary key `card_link_id` (UUID), the foreign key `card_id` (constraint `fk_card_links_cards`, indexed), the foreign key `created_by` (constraint `fk_card_links_users`), `url` (at most 2048 characters, NOT NULL), `label` (at most 100 characters, NOT NULL), and the columns of Requirement 2 criterion 5, with no `ON DELETE CASCADE`.
2. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends POST `/api/cards/<id>/links` with a `url` and an optional `label`, THE Kano_API SHALL create the Card_Link with the current User as `created_by`, use the hostname of the `url` as `label` when `label` is omitted, and return status 201 with the link.
3. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends PATCH `/api/links/<id>` with `label` and/or `url`, THE Kano_API SHALL validate the supplied values with the rules of criterion 5, update only the supplied fields, and return status 200 with the link.
4. WHEN a Board_Admin, a Board_Manager, or a Board_Member sends DELETE `/api/links/<id>`, THE Kano_API SHALL soft delete the link and return status 200 with `{ "data": { "card_link_id": "<id>" } }`.
5. THE Kano_API SHALL trim the `url`, SHALL accept it only WHEN its scheme is `http` or `https` (case-insensitive), it has a non-empty hostname, it contains no whitespace, and it has at most 2048 characters, and SHALL accept a supplied `label` only WHEN it has 1 to 100 characters after trimming.
6. IF a link create or update request has a `url` that fails criterion 5 (including the schemes `javascript:`, `data:`, and `file:`) or a `label` that fails criterion 5, THEN THE Kano_API SHALL return status 400 and leave the data unchanged.
7. IF a POST request would make the 11th non-deleted Card_Link of a Card, THEN THE Kano_API SHALL return status 400 and create no link.
8. IF a Board_Guest sends a POST, PATCH, or DELETE link request, or a User without a non-deleted Board_Membership on the Board sends any link request, THEN THE Kano_API SHALL return status 403 and leave the data unchanged, and IF the Card or the Card_Link does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
9. THE Kano_API SHALL return the non-deleted links of a Card in GET `/api/cards/<id>` ordered by creation time ascending, SHALL create no Notification for a link request, and SHALL NOT request the content of any stored URL.
10. THE Kano_API SHALL implement the links inside the `cards` Blueprint_Package and SHALL add no ninth Blueprint_Package.
11. THE Kano_Web SHALL show in the CardDetailModal a section "Workspace links" with the label, the hostname, and an open icon for each link, an inline add form (URL and optional label), and edit and delete controls, and WHERE the current User is a Board_Guest, THE Kano_Web SHALL show the list without the add form and the edit and delete controls.
12. THE Kano_Web SHALL render each link as an anchor with `href` set to the stored URL, `target` set to `_blank`, and `rel` set to `noopener noreferrer`, SHALL render the label as text, and SHALL NOT use `dangerouslySetInnerHTML`.
13. IF the URL in the add or edit form fails the rules of criterion 5, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request.
14. THE Kano_Web SHALL provide a pure function that maps a hostname to a provider icon key (Google Drive, OneDrive, Dropbox, or Notion) and returns a generic key for any other hostname.
15. WHILE the `link_count` of a Card is greater than 0, THE Kano_Web SHALL show on the Card face a chip with an icon and the count in the meta row, and WHILE the `link_count` is 0, THE Kano_Web SHALL hide the chip.
16. IF a link add, edit, or delete request fails, THEN THE Kano_Web SHALL leave the displayed links unchanged, keep the entered values, and trigger the useErrorHandler toast.

### Requirement 43: Manager Role and Role Permissions

**User Story:** As a board admin, I want a Manager role between Admin and Member, so that I can delegate the structure and the people of a board.

#### Acceptance Criteria

1. THE Kano_API SHALL define the Role_Rank mapping (`guest` 0, `member` 1, `manager` 2, `admin` 3) once in `app/permissions.py`, and SHALL take every role-based decision through the helpers of `app/permissions.py`, extended with the manager level, without a second role table in another module.
2. THE Kano_API SHALL treat the role `manager` as a Board_Member in every rule written with the term Board_Member, including the assignee rule, card search, comments, and Card access.
3. THE Kano_API SHALL grant by role as follows: the roles `admin`, `manager`, and `member` may view the Board and may create, edit, move, and delete Cards and change their status, and may add, edit, toggle, and delete Checklist_Items, Card_Links, and Comments (Comments under Requirement 12 criterion 7); the roles `admin` and `manager` may in addition create, rename, delete, and reorder Columns, add Board_Participants by email, remove and change the role of Board_Participants under criteria 5 to 9, and read and regenerate the Invite_Tokens; only the role `admin` may rename and delete the Board, read the analytics of Requirement 14, and grant the role `manager`; the role `guest` may only view.
4. THE Kano_API SHALL provide no endpoint to transfer the ownership of a Board, so that the Board_Admin who created the Board stays the only `admin`.
5. WHEN a Board_Admin or a Board_Manager sends PATCH `/api/boards/<id>/members/<user_id>` with a `role` equal to `guest`, `member`, or `manager`, THE Kano_API SHALL set the role of that Board_Membership and return status 200 with the `user_id`, name, email, and role.
6. IF the Role_Rank of the caller is not above the Role_Rank of the current role of the target Board_Membership in a PATCH or DELETE request of `/api/boards/<id>/members/<user_id>`, THEN THE Kano_API SHALL return status 403 and leave the Board_Membership unchanged.
7. IF the Role_Rank of the new `role` in a PATCH request is not below the Role_Rank of the caller, THEN THE Kano_API SHALL return status 403 and leave the Board_Membership unchanged, so that only the Board_Admin can grant `manager`.
8. IF a PATCH request names the user_id of the Board_Admin who owns the Board, THEN THE Kano_API SHALL return status 400 and leave the Board_Membership unchanged, and IF a request has a `role` that is missing or is not `guest`, `member`, or `manager` (including `admin`), THEN THE Kano_API SHALL return status 400.
9. IF the target of a PATCH request has no non-deleted Board_Membership on the Board, THEN THE Kano_API SHALL return status 404, and IF the caller is a Board_Member whose role is `member`, a Board_Guest, or a User without a non-deleted Board_Membership, THEN THE Kano_API SHALL return status 403 and leave the data unchanged.
10. WHEN the role of a Board_Membership is changed to `guest`, THE Kano_API SHALL set the assignee to empty on every non-deleted Card of that Board assigned to that User, within the same transaction as the change.
11. THE Kano_API SHALL create no Notification when a role is changed.
12. THE Kano_API SHALL return in GET `/api/boards/<id>` the field `my_role` equal to the role of the current User on that Board (`admin`, `manager`, `member`, or `guest`).
13. THE Kano_Web SHALL provide a helper `can(role, action)` in `lib/roles.ts` that returns the result of the permission rule of criterion 3 for each of the actions `view_board`, `edit_cards`, `manage_columns`, `manage_members`, `view_invite_links`, `change_roles`, `grant_manager`, `edit_board`, `delete_board`, and `view_analytics`, and SHALL use it only to show, hide, or disable controls, because the Kano_API enforces the rule.
14. THE Kano_Web SHALL list in the role dropdown of the member management panel only the roles the current User may assign (Board_Admin: `guest`, `member`, `manager`; Board_Manager: `guest`, `member`), and SHALL show neither the dropdown nor the remove control for a Board_Membership whose Role_Rank is not below the Role_Rank of the current User.
15. THE Kano_Web SHALL show each role as a BaseBadge with a distinct variant for `admin`, `manager`, `member`, and `guest`.

### Requirement 44: V11 Schema, Migration, and Board Query Budget

**User Story:** As the project owner, I want the V11 schema changes applied in one controlled step and the board payload kept fast, so that the new features do not slow the board.

#### Acceptance Criteria

1. THE user SHALL run one manual V11 Migration_Step (`flask db migrate` and `flask db upgrade` from `app/`) against the local development database and the test database, in which the user edits the generated migration by hand to (a) replace the check constraint on `cards.status` so that it allows `NOT_STARTED`, `IN_PROGRESS`, `URGENT`, and `DONE`, and (b) replace the check constraint on `board_memberships.role` so that it allows `admin`, `manager`, `member`, and `guest`, because the migration generator does not detect check-constraint changes.
2. THE V11 Migration_Step SHALL also add the index on the Card due date column and the tables `checklist_items` and `card_links` with an index on each `card_id` column, SHALL leave every existing row unchanged, and SHALL bring the database to 9 tables (users, boards, board_memberships, columns, cards, comments, notifications, checklist_items, card_links).
3. THE Kano_API SHALL define a database index on `checklist_items.card_id`, `card_links.card_id`, and the Card due date column, in addition to the indexes of Requirement 29 criterion 3.
4. WHEN a client sends GET `/api/boards/<id>`, THE Kano_API SHALL obtain `checklist_done`, `checklist_total`, and `link_count` for every Card of the Board with one combined grouped query keyed by `card_id` that counts only non-deleted rows, so that the total number of database queries stays at most 5 (Requirement 29 criterion 2) and identical for a Board with 10 Cards and a Board with 500 Cards.
5. THE Kano_API SHALL include `checklist_done`, `checklist_total`, and `link_count` (each 0 when none exist) in every Card of the board detail and in the Card of the create, update, and position responses.
6. THE Kano_API SHALL keep the 8 Blueprint_Packages of Requirement 1 criterion 2 and SHALL keep every source file at or below 300 lines (Requirement 30 criterion 6) after adding the checklist and the links.
