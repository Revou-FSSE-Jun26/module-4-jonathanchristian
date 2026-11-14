# Requirements Document

**Version:** V4

## Introduction

Kano is a Trello-like task management application. Users create boards, organize work into columns, move cards between columns by drag-and-drop, collaborate through comments, and track assigned tasks. The system is a monorepo with a Flask REST API in `app/` and a Next.js frontend in `web/`, both deployed as separate Vercel projects.

### Project Brief

**Overview.** Kano lets teams plan work on boards. Each board has columns, and each column holds cards ordered by a FLOAT order value. The project is built through an AI-driven workflow using Kiro, Antigravity, and Claude Code (specifications, guidelines, code generation, tests and documentation).

**User roles (per board).**
- Board_Admin: the user who created the board. Manages members, oversees all cards, and sees analytics and notifications for the board.
- Board_Member: a user added to a board by email. Manages cards and comments on that board.

**Core features.** JWT authentication with short-lived access tokens and long-lived refresh tokens; board, column, and card management; board members with roles; drag-and-drop with FLOAT ordering; comments; notifications on assignment and comment; card search; My Tasks view; user profile; board analytics.

**Tech stack.**
- Backend: Python 3.14, Flask, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, flask-cors, PostgreSQL (psycopg2-binary), python-dotenv, Gunicorn, pytest.
- Frontend: Next.js (App Router, TypeScript), React, Tailwind CSS, react-hot-toast, React Testing Library, Playwright.
- Deployment: Vercel (two projects). Railway is an optional alternative for the backend.
- AI tools: Kiro and Claude Code.

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
`-- web/                     (Next.js frontend; app/, components/shared/, hooks/, lib/; no src/)
```

## Glossary

- **Kano_API**: The Flask backend located in `app/`.
- **Kano_Web**: The Next.js frontend located in `web/`.
- **User**: A registered account holder.
- **Board**: A container of columns and cards owned by one creator.
- **Board_Admin**: The User who created a Board; holds the admin role on that Board.
- **Board_Member**: A User added to a Board by email; holds the member role on that Board.
- **Board_Membership**: The record linking a User to a Board with a role (`admin` or `member`).
- **Column**: An ordered stage within a Board, ordered by a FLOAT value.
- **Card**: A task within a Column with title, description, due date, labels, assignee, and a FLOAT order value.
- **Comment**: A text note attached to a Card by a User.
- **Notification**: A record for a User created when a Card is assigned to the User or when a Comment is added to a Card the User is assigned to or has commented on.
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

## Requirements

## Part A: Backend

### Requirement 1: Backend Project Structure and Setup

**User Story:** As a developer, I want a consistent Flask project layout and dependency setup, so that the backend is easy to maintain and run.

#### Acceptance Criteria

1. THE Kano_API SHALL use `app/` as the backend project root with the directories `blueprints/`, `tests/`, and `migrations/`.
2. THE Kano_API SHALL provide exactly one Blueprint_Package under `app/blueprints/` for each of auth, boards, columns, cards, comments, notifications, analytics, and users (8 packages in total), each containing `routes.py`, `service.py`, and `schema.py`.
3. THE Kano_API SHALL implement in each Blueprint_Package the Flask route handlers of that feature in `routes.py`, the business and data-access logic of that feature in `service.py`, and the Marshmallow schemas and SQLAlchemy model(s) of that feature in `schema.py`.
4. THE Kano_API SHALL define each of the models User, Board, Board_Membership, Column, Card, Comment, and Notification exactly once, in the `schema.py` of its owning Blueprint_Package (users: User; boards: Board and Board_Membership; columns: Column; cards: Card; comments: Comment; notifications: Notification), with no `app/models/` directory, and the auth and analytics Blueprint_Packages SHALL define no model.
5. THE Kano_API SHALL provide in `app/` the shared modules `__init__.py` (application factory `create_app`), `config.py`, `extensions.py` (SQLAlchemy, Migrate, and JWTManager instances), `errors.py` (error handlers and Response_Envelope helpers), `permissions.py` (shared Board_Membership and role check helpers), and `wsgi.py` (entry point).
6. THE `service.py` of every Blueprint_Package that enforces Board_Membership or a role SHALL perform the check through the helpers in `app/permissions.py`, as required by Requirement 28 criterion 10.
7. THE Kano_API SHALL allow a Blueprint_Package to import the models of another Blueprint_Package only from the `schema.py` of that package, and to call functions from the `service.py` of another Blueprint_Package, and SHALL NOT allow a Blueprint_Package to import the `routes.py` of another Blueprint_Package.
8. THE Kano_API SHALL reference a model of another Blueprint_Package by string name in every relationship and foreign key that points to that model, so that no circular import occurs.
9. THE application factory SHALL import the `schema.py` of every Blueprint_Package that defines a model before Flask-Migrate runs, so that `flask db migrate` detects all 7 tables (users, boards, board_memberships, columns, cards, comments, notifications).
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
2. THE Kano_API SHALL define models for User, Board, Board_Membership, Column, Card, Comment, and Notification.
3. THE Kano_API SHALL name each primary key `<table_name>_id` (for example `user_id`, `board_id`, `card_id`) and use a UUID type generated by the application when the row is created.
4. THE Kano_API SHALL define every foreign key with an explicit, named constraint using the pattern `fk_<child_table>_<parent_table>`.
5. THE Kano_API SHALL include `created_at`, `updated_at`, `deleted_at` (nullable timestamp), and `is_deleted` (boolean, default false) on every model, store all timestamps in UTC, set `created_at` and `updated_at` to the current UTC time on insert, and set `updated_at` to the current UTC time on every update.
6. THE Kano_API SHALL define the Card `order` column as `db.Column(db.Float)` and the Column `order` column as a FLOAT, and SHALL NOT allow a NULL Order_Value on either.
7. WHEN a delete operation is requested for any resource, THE Kano_API SHALL set `is_deleted` to true and `deleted_at` to the current UTC timestamp instead of removing the row, and SHALL keep the row's other column values unchanged.
8. THE Kano_API SHALL exclude rows where `is_deleted` is true from every query result and every count.
9. WHEN a Board is soft deleted, THE Kano_API SHALL soft delete the Columns, Cards, Comments, and Board_Memberships belonging to that Board in the same database transaction, using the same `deleted_at` value as the Board.
10. WHEN a Column is soft deleted, THE Kano_API SHALL soft delete the Cards belonging to that Column, and the Comments belonging to those Cards, in the same database transaction, using the same `deleted_at` value as the Column.
11. WHEN a Card is soft deleted, THE Kano_API SHALL soft delete the Comments belonging to that Card in the same database transaction, using the same `deleted_at` value as the Card.
12. THE Kano_API SHALL enforce a unique email per non-deleted User and a unique (board, user) pair per non-deleted Board_Membership, so that a soft deleted row does not block creating a new row with the same email or the same (board, user) pair.
13. IF a cascading soft delete fails part-way, THEN THE Kano_API SHALL roll back the whole transaction, leave every affected row unchanged, and return status 500 in the Response_Envelope.
14. IF a write violates a unique constraint, a named foreign key constraint, or a NOT NULL constraint, THEN THE Kano_API SHALL reject the write, leave the stored data unchanged, and return an error in the Response_Envelope without exposing database details.

### Requirement 3: Manual Database Migrations

**User Story:** As the project owner, I want to generate and apply migrations myself, so that I control schema changes.

#### Acceptance Criteria

1. THE Kano_API SHALL install Flask-Migrate and initialize it in the application factory so that the `flask db init`, `flask db migrate`, and `flask db upgrade` commands are available from `app/`.
2. THE Kano_API SHALL leave generation of migration files to the user as a manual Migration_Step and SHALL NOT commit generated migration scripts as part of automated implementation tasks.
3. THE tasks.md document SHALL contain one manual task for the user to run `flask db init`, `flask db migrate`, and `flask db upgrade`, in that order, against the local PostgreSQL database.
4. WHILE the manual Migration_Step task is incomplete, THE tasks.md document SHALL mark every task that requires database tables (including route, service, and pytest tasks that use the database) as blocked by that manual task.
5. WHEN the user marks the manual Migration_Step task complete, THE tasks.md document SHALL allow the blocked tasks to start, and the tables for User, Board, Board_Membership, Column, Card, Comment, and Notification SHALL exist in the local PostgreSQL database.
6. IF the database schema has not been applied, THEN THE Kano_API SHALL return status 500 through the 500 error handler with a generic `{ "error": "<message>" }` Response_Envelope that contains no SQL text, table names, or connection details, and SHALL log the underlying exception.
7. IF the database is unreachable when a request needs it, THEN THE Kano_API SHALL return status 500 through the same 500 error handler with the same generic Response_Envelope, and SHALL keep running to serve later requests.

### Requirement 4: Response Envelope, Validation, and Error Handling

**User Story:** As a frontend developer, I want uniform API responses and errors, so that the client can handle them predictably.

#### Acceptance Criteria

1. WHEN a request succeeds, THE Kano_API SHALL return the exact success status code defined in criterion 3 with a JSON body whose only top-level key is `data`, in the form `{ "data": ... }`.
2. THE Kano_API SHALL set the status code on the HTTP status line of every response and SHALL NOT repeat the status code as a field in the JSON body, and the JSON body SHALL contain no top-level key other than `data` or `error`.
3. WHEN a POST request creates a resource (POST `/api/auth/register`, `/api/boards`, `/api/boards/<id>/members`, `/api/boards/<id>/columns`, `/api/columns/<id>/cards`, and `/api/cards/<id>/comments`), THE Kano_API SHALL return status 201, and WHEN any other request succeeds (POST `/api/auth/login`, POST `/api/auth/refresh`, every GET including `/api/health`, every PATCH including `/api/cards/<id>/position`, `/api/boards/<id>/columns/reorder`, and `/api/notifications/<id>/read`, and every DELETE), THE Kano_API SHALL return status 200.
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

1. WHEN a client sends POST `/api/auth/register` with a name of 1 to 100 characters, an email in valid format of up to 254 characters, and a password of 8 to 128 characters, THE Kano_API SHALL create a User with a salted password hash and return status 201 with the User profile (user id, name, email, created_at) excluding the password and password hash.
2. IF the email in a registration request matches, case-insensitively, the email of a non-deleted User, THEN THE Kano_API SHALL return status 409 with an error message indicating the email is already registered and SHALL NOT create a User.
3. IF a registration request has a missing or empty name, a name longer than 100 characters, a missing or malformed email, an email longer than 254 characters, or a missing password, a password shorter than 8 characters, or a password longer than 128 characters, THEN THE Kano_API SHALL return status 400 with an error message identifying the invalid field and SHALL NOT create a User.
4. WHEN a client sends POST `/api/auth/login` with a valid email and password of a non-deleted User, THE Kano_API SHALL return status 200 with `{ "data": { "access_token", "refresh_token", "token_type": "Bearer", "expires_in": 3600, "user": <profile> } }`, where the profile excludes the password and password hash.
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
2. WHEN an authenticated client sends PATCH `/api/users/me` with a name of 1 to 100 characters and/or a valid email of up to 254 characters, THE Kano_API SHALL update only the supplied fields, return status 200 with the updated profile excluding the password, and set `updated_at` to the current UTC timestamp.
3. IF a PATCH `/api/users/me` request contains a password field, THEN THE Kano_API SHALL return status 400 and leave the User unchanged.
4. IF the new email in a PATCH `/api/users/me` request belongs to another non-deleted User (compared case-insensitively), THEN THE Kano_API SHALL return status 409 and leave the User unchanged.
5. IF a PATCH `/api/users/me` request has an empty name, a name longer than 100 characters, an email that is malformed or longer than 254 characters, or a body with neither name nor email, THEN THE Kano_API SHALL return status 400 with an error message identifying the invalid field and leave the User unchanged.
6. IF a request to GET or PATCH `/api/users/me` has a missing, invalid, or expired JWT, THEN THE Kano_API SHALL return status 401 and leave the User unchanged.
7. IF the User identified by the JWT subject does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404 for GET or PATCH `/api/users/me`.

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
10. IF a Board creation request fails after the Board row is created but before the admin Board_Membership is stored, THEN THE Kano_API SHALL roll back both records and return status 500 with the Response_Envelope.

### Requirement 9: Board Members and Roles

**User Story:** As a board admin, I want to add and remove members by email, so that I control who can access the board.

#### Acceptance Criteria

1. WHEN a Board_Admin sends POST `/api/boards/<id>/members` with a valid email, THE Kano_API SHALL create a Board_Membership with the member role for the non-deleted User whose email matches case-insensitively, and return status 201 with the new membership's user name, email, and role.
2. IF the email in an add-member request is missing, is longer than 254 characters, or is not a valid email format, THEN THE Kano_API SHALL return status 400 and create no Board_Membership.
3. IF no non-deleted User has the email in an add-member request, THEN THE Kano_API SHALL return status 404 and create no Board_Membership.
4. IF the User with the email in an add-member request already has a non-deleted Board_Membership on the Board, THEN THE Kano_API SHALL return status 409 and leave the existing Board_Membership unchanged.
5. WHEN a Board_Member sends GET `/api/boards/<id>/members`, THE Kano_API SHALL return every non-deleted Board_Membership of the Board, each with user_id, user name, email, and role, ordered by Board_Membership creation time ascending.
6. WHEN a Board_Admin sends DELETE `/api/boards/<id>/members/<user_id>` for a non-admin member, THE Kano_API SHALL soft delete that Board_Membership and return status 200.
7. IF a Board_Admin sends DELETE `/api/boards/<id>/members/<user_id>` where `user_id` is the Board_Admin's own user_id, THEN THE Kano_API SHALL return status 400 and leave the Board_Membership unchanged.
8. IF a DELETE `/api/boards/<id>/members/<user_id>` request names a User who has no non-deleted Board_Membership on the Board, THEN THE Kano_API SHALL return status 404.
9. IF a Board_Member who is not the Board_Admin sends POST or DELETE to a members endpoint, THEN THE Kano_API SHALL return status 403 and make no change.
10. IF a User without a non-deleted Board_Membership on the Board sends GET, POST, or DELETE to a members endpoint, THEN THE Kano_API SHALL return status 403.
11. WHEN a Board_Membership is soft deleted, THE Kano_API SHALL set the assignee to empty on every non-deleted Card of that Board assigned to the removed User, within the same transaction as the removal.
12. WHEN a User whose Board_Membership was soft deleted sends any request to that Board's endpoints, THE Kano_API SHALL return status 403.

### Requirement 10: Columns

**User Story:** As a board member, I want to add, rename, delete, and reorder columns, so that the board reflects my workflow.

#### Acceptance Criteria

1. WHEN a Board_Member sends POST `/api/boards/<id>/columns` with a name of 1 to 100 characters, THE Kano_API SHALL create a Column with an Order_Value greater than the highest Order_Value among the non-deleted Columns of the Board (or 1.0 if the Board has no non-deleted Columns), and return status 201 with the created Column.
2. WHEN a Board_Member sends PATCH `/api/columns/<id>` with a name of 1 to 100 characters, THE Kano_API SHALL update the Column name and return status 200 with the updated Column.
3. WHEN a Board_Member sends DELETE `/api/columns/<id>`, THE Kano_API SHALL soft delete the Column and its Cards and return status 200.
4. WHEN a Board_Member sends PATCH `/api/boards/<id>/columns/reorder` with a Column identifier (UUID) and a new Order_Value greater than 0, THE Kano_API SHALL store the new Order_Value for that Column and return status 200 with the updated Column.
5. IF a reorder request references a Column that does not belong to the Board, THEN THE Kano_API SHALL return status 400 and leave every Column Order_Value unchanged.
6. IF a Column name is empty, consists only of whitespace, or is longer than 100 characters, THEN THE Kano_API SHALL return status 400 and leave the Column data unchanged.
7. IF the current User is not a Board_Member of the Column's Board, THEN THE Kano_API SHALL return status 403 and leave the Column data unchanged.
8. IF a reorder request has a Column identifier that is not a valid UUID, or an Order_Value that is not a number greater than 0, THEN THE Kano_API SHALL return status 400 and leave every Column Order_Value unchanged.
9. IF the Column or Board targeted by a request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404 and leave the data unchanged.

### Requirement 11: Cards

**User Story:** As a board member, I want to create, edit, move, find, and delete cards, so that I can track work.

#### Acceptance Criteria

1. WHEN a Board_Member sends POST `/api/columns/<id>/cards` with a title, THE Kano_API SHALL create a Card with an Order_Value greater than the highest existing non-deleted Order_Value in that Column (or 1.0 if the Column has no Cards) and return status 201 with the created Card.
2. THE Kano_API SHALL store on each Card a title (required, 1 to 200 characters), description (optional, up to 5,000 characters), due date (optional, ISO 8601 date), labels (optional list of up to 10 strings, each 1 to 30 characters), assignee (optional, a Board_Member), Order_Value, and Column.
3. WHEN a Board_Member sends PATCH `/api/cards/<id>` with card fields, THE Kano_API SHALL update only the supplied fields, leave all other fields unchanged, and return the updated Card.
4. IF a create or update request has a missing or empty title, a title longer than 200 characters, a description longer than 5,000 characters, a due date that is not a valid ISO 8601 date, or a labels list that exceeds 10 items or contains an item outside 1 to 30 characters, THEN THE Kano_API SHALL return status 400 and leave the Card unchanged.
5. IF the assignee in a create or update request is not a Board_Member of the Card's Board, THEN THE Kano_API SHALL return status 400 and leave the Card unchanged.
6. WHEN a Board_Member sends DELETE `/api/cards/<id>`, THE Kano_API SHALL soft delete the Card and its Comments and return status 200.
7. WHEN a Board_Member sends PATCH `/api/cards/<id>/position` with a `column_id` (UUID) and an `order` (float greater than 0), THE Kano_API SHALL validate the body with CardPositionSchema, move the Card to that Column with that Order_Value, and return the updated Card.
8. IF a position request names a Column in a different Board than the Card, or a Column that does not exist or is soft deleted, THEN THE Kano_API SHALL return status 400 and leave the Card's Column and Order_Value unchanged.
9. IF a position request has a `column_id` that is not a valid UUID or an `order` that is not a float greater than 0, THEN THE Kano_API SHALL return status 400 and leave the Card's Column and Order_Value unchanged.
10. WHEN an authenticated client sends GET `/api/cards?assignee=me`, THE Kano_API SHALL return the non-deleted Cards assigned to the current User on non-deleted Boards, each with its Board id, Board name, and Column name, and SHALL return an empty list when no Cards match.
11. WHEN an authenticated client sends GET `/api/cards?q=<text>` where the text is 1 to 100 characters, THE Kano_API SHALL return the non-deleted Cards, across Boards where the current User is a Board_Member, whose title or description contains the text, case-insensitively, and SHALL return an empty list when no Cards match.
12. WHERE the query parameter `board_id` is supplied together with `q`, THE Kano_API SHALL restrict the search results to that Board.
13. IF `board_id` is supplied together with `q` and the current User is not a Board_Member of that Board, THEN THE Kano_API SHALL return status 403.
14. IF a GET `/api/cards` request has neither `assignee=me` nor `q`, has an empty `q`, has a `q` longer than 100 characters, or has a `board_id` that is not a valid UUID, THEN THE Kano_API SHALL return status 400.
15. IF the current User is not a Board_Member of the Card's Board, THEN THE Kano_API SHALL return status 403 for every Card endpoint that targets a single Card and for card creation in a Column of that Board.
16. WHEN a Board_Admin requests GET `/api/boards/<id>`, THE Kano_API SHALL return all non-deleted Cards of the Board regardless of assignee.

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
8. IF the current User is not a Board_Member of the Card's Board, THEN THE Kano_API SHALL return status 403 for comment creation and listing and SHALL NOT create or return any Comment.
9. IF the Card or Comment identified in a comment request does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.

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

### Requirement 14: Analytics

**User Story:** As a board admin, I want board analytics, so that I can monitor team activity.

#### Acceptance Criteria

1. WHEN a Board_Admin sends GET `/api/boards/<id>/analytics`, THE Kano_API SHALL return status 200 with the Card count for every non-deleted Column of the Board (0 for a Column without Cards), the number of Cards completed this week, and the member activity for every Board_Member.
2. THE Kano_API SHALL treat a Card as completed when it is in the Column of the Board whose name is `Done` (case-insensitive), and count it in the current week when its `updated_at` falls from Monday 00:00:00 UTC of the current week up to and including the request time.
3. IF the Board has no Column named `Done` (case-insensitive), THEN THE Kano_API SHALL return 0 as the number of Cards completed this week.
4. THE Kano_API SHALL compute member activity as, for each Board_Member, the number of non-deleted Cards of the Board assigned to that Board_Member and the number of non-deleted Comments written by that Board_Member on Cards of the Board, returning 0 for each count when none exist.
5. THE Kano_API SHALL compute all analytics values through SQLAlchemy joins and aggregations in the analytics service layer.
6. THE Kano_API SHALL exclude soft-deleted Columns, Cards, Comments, and Board_Memberships from every analytics count.
7. IF a Board_Member who is not the Board_Admin requests the analytics of a Board, THEN THE Kano_API SHALL return status 403 and no analytics data.
8. IF the Board does not exist or is soft deleted, THEN THE Kano_API SHALL return status 404.
9. IF a request to the analytics endpoint has a missing, invalid, or expired JWT, THEN THE Kano_API SHALL return status 401.

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
14. WHEN a protected request sent by the apiClient with an Access_Token returns status 401 and a Refresh_Token is available, THE apiClient SHALL send POST `/api/auth/refresh` once with `Authorization: Bearer <refresh_token>`, store the returned Access_Token in AuthContext memory and in the access cookie, and retry the original request once with the new Access_Token.
15. WHILE a refresh request is in flight, THE apiClient SHALL share that single request among all protected requests that receive status 401, and SHALL NOT send a second refresh request.
16. IF the refresh request returns status 401, or the retried original request returns status 401, THEN THE apiClient SHALL clear both cookies and the AuthContext state, redirect to `/login`, and throw an ApiError with `statusCode` 401.
17. THE apiClient SHALL NOT attempt a refresh for a 401 response from POST `/api/auth/login`, POST `/api/auth/register`, or POST `/api/auth/refresh`.

### Requirement 17: Authentication State and Cookie

**User Story:** As a user, I want to stay logged in across page loads, so that I do not log in repeatedly.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide an AuthContext holding the current User, Access_Token, and Refresh_Token, with `login`, `logout`, and `updateUser` functions.
2. WHEN a login succeeds, THE AuthContext SHALL store the Access_Token and the Refresh_Token in memory, SHALL store the Access_Token in the access cookie with a lifetime in seconds equal to the `expires_in` value of the login response (3600), and SHALL store the Refresh_Token in the refresh cookie with a lifetime of 604800 seconds, each cookie with path `/` and `SameSite=Lax`.
3. WHEN the application loads and an access cookie or a refresh cookie exists, THE AuthContext SHALL restore the session by calling GET `/api/users/me` with the Access_Token (refreshing it first through POST `/api/auth/refresh` when only the refresh cookie exists) and, on success, set the current User and both tokens from the response and the cookies.
4. IF session restoration ends with status 401 after the refresh flow of Requirement 16 criteria 14 to 16, THEN THE AuthContext SHALL clear both cookies, clear the User, Access_Token, and Refresh_Token state, and redirect to `/login`.
5. IF the GET `/api/users/me` call during session restoration fails with a network error or a status of 500 or above, THEN THE AuthContext SHALL keep both cookies, leave the User unset, and trigger the useErrorHandler toast.
6. WHEN a User logs out, THE AuthContext SHALL clear both cookies, clear the User, Access_Token, and Refresh_Token state, and redirect to `/login`, without sending any request to the Kano_API.
7. WHEN a visitor requests a protected route and the access cookie is missing or expired while a valid refresh cookie exists, THE Kano_Web middleware SHALL send POST `/api/auth/refresh` with the Refresh_Token, set the new access cookie on the response (lifetime 3600 seconds, path `/`, `SameSite=Lax`), and let the request continue, before any protected page content renders.
8. WHEN an unauthenticated visitor requests a protected route, THE Kano_Web SHALL redirect the visitor to `/login` before rendering any protected page content. An unauthenticated visitor is one with no usable access cookie and no valid refresh cookie, or one whose refresh request returned status 401 (in which case the middleware also deletes both cookies).
9. WHEN an authenticated User requests `/login` or `/register`, THE Kano_Web SHALL redirect the User to `/`.
10. WHEN a Server Component fetches data, THE Kano_Web SHALL read the Access_Token from the access cookie and pass it to the apiClient.
11. WHEN `updateUser` is called with a User object, THE AuthContext SHALL replace the current User state with that object without changing the tokens or the cookies.

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

### Requirement 19: Register and Login Pages

**User Story:** As a visitor, I want to register and log in, so that I can use Kano.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide a `/register` page with controlled inputs for name, email, and password.
2. IF a registration form field is invalid (empty name after trimming whitespace, name longer than 100 characters, email not in the form `local@domain.tld`, or password shorter than 8 characters), THEN THE Kano_Web SHALL show a field-level error next to each invalid field, SHALL NOT send any request, and SHALL keep the entered values in the form.
3. WHEN a valid registration form is submitted, THE Kano_Web SHALL send POST `/api/auth/register`, disable the submit button until the response arrives, and, on a 201 response, redirect to `/login` and show a success toast.
4. IF the registration request returns status 409, THEN THE Kano_Web SHALL show an email-already-in-use error on the email field, SHALL stay on `/register`, and SHALL keep the entered values in the form.
5. IF the registration request fails with status 400, 500, or no response (network error), THEN THE Kano_Web SHALL show an error toast through useErrorHandler, SHALL stay on `/register`, and SHALL keep the entered values in the form.
6. THE Kano_Web SHALL provide a `/login` page with controlled inputs for email and password.
7. IF a login form field is invalid (email not in the form `local@domain.tld` or empty password), THEN THE Kano_Web SHALL show a field-level error next to each invalid field and SHALL NOT send any request.
8. WHEN a valid login form is submitted, THE Kano_Web SHALL send POST `/api/auth/login`, disable the submit button until the response arrives, store the JWT through the AuthContext on a 200 response, and redirect to `/`.
9. IF the login request returns status 401, THEN THE Kano_Web SHALL show a single invalid-credentials error message on the page that does not indicate whether the email or the password was wrong, SHALL stay on `/login`, and SHALL clear the password input.
10. IF the login request fails with status 400, 500, or no response (network error), THEN THE Kano_Web SHALL show an error toast through useErrorHandler, SHALL stay on `/login`, and SHALL keep the entered email.

### Requirement 20: Dashboard Page

**User Story:** As a user, I want to see all my boards, so that I can open or create one.

#### Acceptance Criteria

1. WHEN an authenticated User requests `/`, THE Kano_Web SHALL render the page as a Server Component that fetches GET `/api/boards` and lists every returned Board with its name and a role badge showing `admin` or `member` for the User.
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
2. WHEN a Board_Member submits the add-column form with a name of 1 to 100 characters, THE Kano_Web SHALL send POST `/api/boards/<id>/columns` and, on success, show the new Column after the last existing Column without a page reload.
3. IF the add-column name is empty or longer than 100 characters, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request.
4. WHEN a Board_Member submits a Column rename with a name of 1 to 100 characters, THE Kano_Web SHALL send PATCH `/api/columns/<id>` and, on success, show the new name without a page reload.
5. WHEN a Board_Member confirms deletion of a Column, THE Kano_Web SHALL send DELETE `/api/columns/<id>` and, on success, remove the Column and its Cards from the display without a page reload.
6. WHEN a Board_Member submits the add-card form in a Column with a title of 1 to 200 characters, THE Kano_Web SHALL send POST `/api/columns/<id>/cards` and, on success, show the new Card at the end of that Column without a page reload.
7. IF the add-card title is empty or longer than 200 characters, THEN THE Kano_Web SHALL show a field-level error and SHALL NOT send the request.
8. IF a create, rename, or delete request for a Column or Card returns an error, THEN THE Kano_Web SHALL leave the displayed Columns and Cards unchanged and trigger the useErrorHandler toast.
9. WHEN a Board_Member types in the card search input, THE Kano_Web SHALL wait 300 ms after the last keystroke and then send GET `/api/cards?q=<text>&board_id=<id>` and show only the matching Cards.
10. WHEN the card search input is cleared, THE Kano_Web SHALL show all Cards of the Board in their Order_Value positions.
11. IF the search request returns no Cards, THEN THE Kano_Web SHALL show a no-results message in place of the Cards.
12. WHERE the current User is the Board_Admin, THE Kano_Web SHALL show the member management panel (list, add by email, remove) and a link to the analytics view.
13. WHERE the current User is a Board_Member who is not the Board_Admin, THE Kano_Web SHALL hide the member management controls and the analytics link.
14. WHEN a Board_Admin opens the analytics view, THE Kano_Web SHALL fetch GET `/api/boards/<id>/analytics` and show the Card count per Column, the number of Cards completed this week, and, for each Board_Member, the number of assigned Cards and the number of Comments written.
15. IF the board request returns status 403 or 404, THEN THE Kano_Web SHALL show an access-denied message for 403 or a not-found message for 404, together with a link to `/`, and SHALL NOT render any Column or Card.
16. IF the analytics request returns an error, THEN THE Kano_Web SHALL show an error message in the analytics view and trigger the useErrorHandler toast.

### Requirement 22: Drag and Drop

**User Story:** As a board member, I want to drag cards between columns, so that I can update progress quickly.

#### Acceptance Criteria

1. THE `hooks/useDragAndDrop.ts` hook SHALL manage card dragging between Columns using the native HTML5 Drag and Drop API.
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
2. THE Kano_Web SHALL show for each task the Card title, the due date in the User's local date format (or a "no due date" indicator when the Card has no due date), the Column name, and a link to `/boards/<id>` for the Card's Board.
3. WHILE the GET `/api/cards?assignee=me` request is pending, THE Kano_Web SHALL show a loading indicator in place of the task list.
4. IF the request returns an empty list, THEN THE Kano_Web SHALL show an empty-state message and no Board groups.
5. IF the GET `/api/cards?assignee=me` request returns an ApiError, THEN THE Kano_Web SHALL show an error message on the page, trigger the useErrorHandler toast, and show no task list.
6. WHEN a Card is soft deleted or its assignee is cleared, THE Kano_Web SHALL omit that Card the next time `/my-tasks` is loaded.

### Requirement 26: Profile Page

**User Story:** As a user, I want to update my name and email, so that my account details are accurate.

#### Acceptance Criteria

1. THE Kano_Web SHALL provide a `/profile` page with a form whose controlled inputs for name and email are pre-populated from the current User held in the AuthContext.
2. WHEN a profile form is submitted with a name of 1 to 100 characters and a well-formed email address of up to 254 characters, THE Kano_Web SHALL send PATCH `/api/users/me` with the name and email, disable the submit button until the request completes, update the AuthContext with the returned User, and show a success toast.
3. IF a profile form field is invalid (empty name, name longer than 100 characters, malformed email, or email longer than 254 characters), THEN THE Kano_Web SHALL show a field-level error next to the invalid field and SHALL NOT send the request.
4. IF the PATCH `/api/users/me` request returns status 409, THEN THE Kano_Web SHALL show an email-already-in-use error on the email field and SHALL leave the AuthContext User unchanged.
5. IF the PATCH `/api/users/me` request fails with any status other than 409, THEN THE Kano_Web SHALL show an error toast through the useErrorHandler hook, SHALL leave the AuthContext User unchanged, and SHALL keep the entered form values.
6. THE Kano_Web SHALL NOT include a password field in the profile form.
7. IF an unauthenticated visitor requests `/profile`, THEN THE Kano_Web SHALL redirect the visitor to `/login`.

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
5. THE Kano_API tests SHALL cover role enforcement: 403 for a User without a Board_Membership on Board, Column, Card, and Comment endpoints, and 403 for a Board_Member who is not the Board_Admin on the member add, member remove, Board update, Board delete, and analytics endpoints.
6. THE Kano_API tests SHALL cover soft-delete cascades: soft deleting a Board, a Column, and a Card each sets `is_deleted` to true on their child rows, and later GET requests for the deleted resources return status 404.
7. THE Kano_API tests SHALL create their own test data and SHALL leave no data that affects other tests, so that the suite gives the same result when run in any order and when run twice in a row.
8. WHEN `pytest -v` is run from `app/` against the test PostgreSQL database after the manual Migration_Step is complete, THE Kano_API test suite SHALL finish with 0 failures and 0 errors.
9. WHILE the manual Migration_Step is incomplete, THE tests that require database tables SHALL be treated as blocked.
10. IF the test database is unreachable or the schema has not been applied, THEN THE Kano_API test run SHALL stop with an error message that names the unavailable test database and SHALL NOT run tests against the development database.
11. THE Kano_API auth tests SHALL cover: login returning an Access_Token with `type` = `access` and expiry 3600 seconds and a Refresh_Token with `type` = `refresh` and expiry 604800 seconds, both with `sub` equal to the `user_id`; POST `/api/auth/refresh` returning 200 with a new Access_Token that is accepted by GET `/api/users/me`; status 401 for a refresh request with an expired Refresh_Token, a missing token, an Access_Token, or a Refresh_Token of a soft-deleted User; and status 401 when a Refresh_Token is sent to GET `/api/users/me` or any other protected endpoint.

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

### Requirement 33: End-to-End Tests

**User Story:** As a stakeholder, I want browser tests on the live site, so that the deployed system is verified end to end.

#### Acceptance Criteria

1. WHERE the environment variable holding the live Vercel frontend URL is set, THE E2E_Suite SHALL run Playwright against that URL.
2. IF the environment variable holding the live Vercel frontend URL is missing or is not a valid absolute http or https URL, THEN THE E2E_Suite SHALL exit before running any test with a non-zero exit code and an error message naming the variable.
3. WHEN the E2E_Suite runs the auth scenarios, THE E2E_Suite SHALL verify four cases: a login with valid credentials redirects to `/`, a login with invalid credentials shows the invalid-credentials error on `/login` and stays on `/login`, an unauthenticated visit to a protected route redirects to `/login`, and a logout redirects to `/login` and a following visit to `/` redirects to `/login` again.
4. WHEN the E2E_Suite runs the Kanban journey, THE E2E_Suite SHALL execute these 8 steps in order: (1) register a new User with a unique email per run, (2) log in as that User, (3) create a Board, (4) add at least 2 Columns, (5) create a Card in the first Column, (6) drag the Card to the second Column, (7) reload the page and confirm the Card is shown in the second Column, (8) add a Comment to the Card and then edit that Comment and confirm the edited text is shown.
5. IF a step of the Kanban journey fails, THEN THE E2E_Suite SHALL mark the journey test as failed, skip the remaining steps of that journey, and keep the failure details in the HTML report.
6. THE E2E_Suite SHALL use Playwright auto-waiting and web-first assertions and SHALL NOT call `waitForTimeout` anywhere in the test code.
7. THE E2E_Suite SHALL use an assertion timeout of 10 seconds and a per-test timeout of 60 seconds, with no test retried more than 2 times.
8. WHEN `npx playwright test` is run, THE E2E_Suite SHALL finish with all tests passed, exit code 0, and generate an HTML report.
9. THE repository SHALL contain the full Playwright HTML report from a run in which all tests passed, including the result of every test, which is viewable with `npx playwright show-report`.

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

1. THE repository SHALL contain a `.gitignore` at the repository root that excludes `.env`, `.env.local`, and every other `.env*` file except `.env.example`, and that excludes `__pycache__/`, `.next/`, `node_modules/`, and `app/venv/`.
2. THE repository SHALL commit `app/.env.example` and `web/.env.example`, each listing every environment variable name that the corresponding project reads, with a placeholder value that is not a real credential.
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
4. THE AI Workflow Summary SHALL contain one subsection for each of the following topics, with at least 3 sentences per subsection: how the project brief was written, how Kiro generated and iterated the specifications, how Guidelines were authored and applied, how code was reviewed against the Guidelines, how violations were documented and resolved, and how Claude Code generated and refined tests and documentation.
5. THE AI Workflow Summary SHALL link to the Guidelines, the violation report, and the before/after comparison required by Requirement 30, and every link SHALL resolve to an existing file in the repository.
6. THE README.md Technologies section SHALL list Next.js, React, TypeScript, Tailwind CSS, react-hot-toast, Playwright, Flask, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Marshmallow, PostgreSQL, python-dotenv, Gunicorn, Vercel, Railway (marked as an optional alternative), Kiro, and Claude Code.
7. THE README.md Local Run Steps SHALL list these steps as a numbered sequence in this order: clone the repository; create and activate a Python virtual environment; install dependencies from `app/requirements.txt`; copy `app/.env.example` to `app/.env` and set its values; run `flask db upgrade` (marked as a manual Migration_Step); start the API with `flask run`; run `npm install` in `web/`; copy `web/.env.example` to `web/.env.local` and set its values; run `npm run dev`.
8. THE README.md Local Run Steps SHALL state the prerequisite versions (Python 3.14, Node.js, and PostgreSQL) and the local URLs where Kano_API and Kano_Web are reachable after startup.
9. THE README.md Test Steps SHALL list the commands `pytest -v` (run in `app/`), `npm test` (run in `web/`), `npx playwright install`, `npx playwright test`, and `npx playwright show-report`, and SHALL name the environment variable that holds the live Vercel frontend URL for the Playwright run.
10. THE README.md Screenshots section SHALL include image files, each with a caption naming its subject, for: a Postman run covering all eight Blueprint_Package endpoint groups against the public URL, the Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, and Login pages, a Card being dragged between Columns, the notification bell showing an unread count greater than zero, and the Playwright HTML report showing all tests passed.
11. THE README.md SHALL document the XSS exposure of the non-httpOnly access cookie and refresh cookie (both tokens) and its mitigations, and SHALL document that Refresh_Tokens are stateless and cannot be revoked on logout, as required by Requirement 28 criterion 8 and Requirement 6 criterion 15.
12. IF a link or image path in README.md does not resolve to an existing file or URL, THEN THE repository SHALL be treated as failing this requirement until the link or image path is corrected.
