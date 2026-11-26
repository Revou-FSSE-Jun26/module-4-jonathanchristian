# Kano API (backend)

Flask REST API for **Kano**, a Trello-like task management app. This folder (`app/`) is the backend; the Next.js frontend lives in `web/`.

## What Kano is

Kano lets teams plan work on **boards**. A board has **columns** (for example To Do, Doing, Done), and each column holds **cards** that members can assign, comment on, and drag between columns. Every card has a **status** (Not started, In progress, Urgent, Done), an optional **checklist** (up to 50 items) and up to 10 **workspace links**. Users get **notifications** when a card is assigned to them or commented on, can search cards, see their own tasks across boards, see which of their cards are **overdue**, and board admins get simple **analytics**. Admins and managers invite people with **invitation links**, one for members and one for view-only guests.

**Roles are per board.** There are four, ranked `guest` < `member` < `manager` < `admin`:

| Role | How a user gets it | What they can do |
|---|---|---|
| `admin` | creates the board (the only admin; nobody can be promoted to it) | everything: rename or delete the board, see analytics, plus all manager actions |
| `manager` | granted by the admin through a role change | everything a member can do, plus: create, rename, reorder, and delete columns; add members by email; read and regenerate the invitation links; change the role of, or remove, members and guests |
| `member` | added by email, or accepts the member invitation link | manage cards, checklist items, links, status, and their own comments; a member cannot manage columns |
| `guest` | accepts the guest invitation link | read-only: board detail, members list, comments, card search. Every write answers 403 |

**Rank rule for member management.** A caller may change or remove only someone of a strictly lower rank, and may grant only a rank below its own, so only the admin can grant `manager`, and a manager cannot touch another manager or the admin. The Board creator is never changed or removed (the admin who targets themselves gets 400, a manager who targets the admin gets 403). Changing a member to `guest` clears that user's card assignments on the board.

A guest cannot be a card assignee and never receives notifications. The email of an account is fixed after registration; users change only their name and password.

## Aim of the project

Kano is a learning and portfolio project built with an AI-driven workflow (specifications, guidelines, generated code, and tests). The backend aims to be:

- **Predictable:** every response uses one envelope (`{"data": ...}` or `{"error": "..."}`) and fixed status codes, so the frontend has a single contract (see `openapi.yaml`).
- **Safe:** salted password hashes, short-lived access tokens plus refresh tokens, server-side membership and role checks on every endpoint, parameterized queries only, secrets only from the environment.
- **Recoverable:** nothing is hard deleted. Deletes are soft deletes that cascade in one transaction.
- **Fast:** board detail runs a fixed number of queries (5) regardless of card count, and common reads answer within 500 ms.
- **Maintainable:** one package per feature, thin routes, logic in services, every file at most 300 lines. The rules are in `../guidelines/backend.md` and `../guidelines/database.md`.

## Tech stack

Python 3.14, Flask 3, SQLAlchemy 2 (Flask-SQLAlchemy), Flask-Migrate (Alembic), Flask-JWT-Extended, Marshmallow, flask-cors, PostgreSQL via `psycopg2-binary`, python-dotenv, Gunicorn, pytest, Hypothesis.

## Project layout

```
app/
  __init__.py          create_app() application factory
  config.py            Config.from_env(): reads and validates environment variables
  extensions.py        db, migrate, jwt instances
  errors.py            ok()/fail(), ApiError family, error handlers, serializers
  permissions/         rules.py (pure: role ranks, role_allows, decide_role_change, decide_member_removal)
                       and helpers.py (level checks reader, writer, manager, admin: 404, then 403)
  soft_delete.py       SoftDeleteMixin, active(), soft_delete_where()
  ordering.py          FLOAT order formulas
  health.py            GET /api/health
  wsgi.py              entry point for flask run / gunicorn / Vercel
  blueprints/<feature>/ routes.py, service.py, schema.py (each may be a package once it nears 300 lines:
                       boards, cards, and notifications are packages: boards has routes/, service/, schema/;
                       cards has routes/, service/, schema/; notifications has routes/ and service/)
                       auth, users, boards, columns, cards, comments, notifications, analytics
  migrations/          Alembic migrations (created and applied by you, never by the agent)
  tests/               pytest suite
  openapi.yaml         API reference for frontend development
```

Each feature package follows the same split: `routes.py` parses input and returns `ok(...)`, `service.py` holds the logic and queries, and `schema.py` holds the SQLAlchemy model and Marshmallow schemas. The boards package also owns the invitation links (`service/invite_service.py`, `service/accept.py`, `routes/invite_routes.py`); the card status rule is the pure function `apply_status_change` in `cards/service/status.py`. The `cards` package also owns the checklist (`service/checklist_service.py`, `routes/checklist_routes.py`), the workspace links (`service/link_service.py`, `routes/link_routes.py`, the pure URL rule `schema/url_rules.py`), and the per-card counts (`service/counts.py`). Overdue cards are computed on read by `notifications/service/overdue_service.py`.

## Database schema

PostgreSQL, 9 tables. Conventions that apply to all of them:

- Primary key `<singular_table>_id`, a UUID generated by the application.
- Every table also has `created_at`, `updated_at`, `deleted_at` (all `timestamptz`, UTC) and `is_deleted` (boolean, default false).
- Foreign keys are named `fk_<child_table>_<parent_table>`.
- Rows are never deleted; reads always filter `is_deleted = false`. Uniqueness is enforced with partial unique indexes `WHERE is_deleted = false`, so a deleted email or membership does not block a new one.
- `order` is a FLOAT greater than 0. Moving a card stores one new value (for example the midpoint of its neighbours) without renumbering siblings; ties are broken by `created_at`.

```
users 1 ──< board_memberships >── 1 boards 1 ──< columns 1 ──< cards 1 ──< comments
  │                                   │                          │  │
  │  boards.created_by                └──< cards (board_id)      │  ├──< notifications (card_id)
  │  cards.assignee_id ───────────────────────────────────────────┘  ├──< checklist_items (card_id)
  │  comments.author_id, notifications.recipient_id                  └──< card_links (card_id)
  │  card_links.created_by
```

| Table | Columns (besides the common ones) | Constraints and indexes |
|---|---|---|
| `users` | `user_id`, `name` varchar(100), `email` varchar(254), `password_hash` varchar(255) | email always lowercase (`ck_users_email_lowercase`); unique partial index `uq_users_email_active` on `email` |
| `boards` | `board_id`, `name` varchar(100), `created_by` → `users`, `member_invite_token` varchar(128) null, `guest_invite_token` varchar(128) null | `fk_boards_users`; index on `created_by`; unique constraints `uq_boards_member_invite_token` and `uq_boards_guest_invite_token` (many NULLs allowed, so boards from before the invitation feature stay valid) |
| `board_memberships` | `board_membership_id`, `board_id` → `boards`, `user_id` → `users`, `role` (`admin`, `manager`, `member`, or `guest`) | `fk_board_memberships_boards`, `fk_board_memberships_users`; role check `ck_board_memberships_role`; unique partial index `uq_board_memberships_board_user_active` on (`board_id`, `user_id`); indexes on `board_id` and `user_id` |
| `columns` | `column_id`, `board_id` → `boards`, `name` varchar(100), `order` float | `fk_columns_boards`; `order > 0`; index (`board_id`, `order`) |
| `cards` | `card_id`, `board_id` → `boards` (denormalized from the column, never changes), `column_id` → `columns`, `title` varchar(200), `description` text (max 5000), `due_date` date, `labels` varchar(30)[] (default empty), `assignee_id` → `users` (nullable), `order` float, `status` varchar(20) (default `NOT_STARTED`), `completed_at` timestamptz (nullable) | `fk_cards_boards`, `fk_cards_columns`, `fk_cards_users`; `order > 0`; description length check; `ck_cards_status` (`NOT_STARTED`, `IN_PROGRESS`, `URGENT`, or `DONE`); indexes (`column_id`, `order`), `board_id`, `assignee_id`, `due_date` (overdue query) |
| `comments` | `comment_id`, `card_id` → `cards`, `author_id` → `users`, `content` text (1 to 2000) | `fk_comments_cards`, `fk_comments_users`; length check; index (`card_id`, `created_at`) |
| `checklist_items` | `checklist_item_id`, `card_id` → `cards`, `text` varchar(200), `is_done` boolean (default false), `order` float | `fk_checklist_items_cards`; `ck_checklist_items_text_len`, `ck_checklist_items_order_positive`; index (`card_id`, `order`) |
| `card_links` | `card_link_id`, `card_id` → `cards`, `created_by` → `users`, `url` varchar(2048), `label` varchar(100) | `fk_card_links_cards`, `fk_card_links_users`; `ck_card_links_url_len`, `ck_card_links_label_len`; index on `card_id`; the `http`/`https` rule is enforced by the API, not by the database |
| `notifications` | `notification_id`, `recipient_id` → `users`, `card_id` → `cards`, `board_id` → `boards`, `type` (`assignment` or `comment`), `message` varchar(255), `is_read` boolean (default false) | `fk_notifications_users`, `fk_notifications_cards`, `fk_notifications_boards`; type check; index (`recipient_id`, `created_at`); partial index on unread rows |

**Cascading soft delete** (one transaction, one shared `deleted_at`):

| Deleted | Also soft deleted |
|---|---|
| Board | its memberships (all roles), columns, cards, comments, checklist items, and links (notifications are kept); its invitation tokens stop working |
| Column | its cards and their comments, checklist items, and links |
| Card | its comments, checklist items, and links |
| Membership | nothing; the member's card assignments on that board are cleared |

## API endpoints

All paths are under `/api`. The full request and response reference, with examples, is in [`openapi.yaml`](openapi.yaml) (open it in Swagger Editor or any OpenAPI viewer).

**Conventions**

- Success body `{"data": ...}`, failure body `{"error": "<message>"}`. 201 only for the eight creating POSTs (register, create board, add member, create column, create card, create comment, add checklist item, add link); every other success is 200, including login, refresh, regenerate, accept, and role change (DELETE returns 200 with an object).
- Errors: 400 validation, 401 bad/missing/expired/wrong-type token, 403 not allowed, 404 missing, soft-deleted, or malformed id, 405 wrong method, 409 duplicate, 500 generic `"Internal server error"`.
- Send `Authorization: Bearer <access_token>`. The refresh token works only on `POST /api/auth/refresh`.
- Checks run in this order: 401, 404, 403 (not a participant, then a role below the required level, or not the comment author), then body validation (400). The one exception is the role change, whose body is validated first (400 even for a caller who would get 403).
- "Who" below: **participant** = any role, **writer** = admin, manager, or member (a guest gets 403), **manager** = admin or manager (a member or guest gets 403), **admin** = admin only.

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | Health check, no database access |
| POST | `/api/auth/register` | public | Register (201) |
| POST | `/api/auth/login` | public | Access and refresh tokens plus user |
| POST | `/api/auth/refresh` | refresh token | New access token |
| GET | `/api/users/me` | user | Own profile |
| PATCH | `/api/users/me` | user | Update `name` and/or `password` (with `current_password`); an `email` field is always 400 |
| POST | `/api/boards` | user | Create board, caller becomes admin, both invitation tokens are created (201) |
| GET | `/api/boards` | user | List own boards (with `my_role`), newest first |
| GET | `/api/boards/<id>` | participant | Board with columns and cards (each card carries `checklist_done`, `checklist_total`, `link_count`) |
| PATCH | `/api/boards/<id>` | admin | Rename board |
| DELETE | `/api/boards/<id>` | admin | Soft delete board tree |
| POST | `/api/boards/<id>/members` | manager | Add member by email, always role `member` (201) |
| GET | `/api/boards/<id>/members` | participant | List members with roles |
| PATCH | `/api/boards/<id>/members/<user_id>` | manager, rank rule | Change a member's role to `guest`, `member`, or `manager` (never `admin`) |
| DELETE | `/api/boards/<id>/members/<user_id>` | manager, rank rule | Remove a member or guest (never the board creator) |
| GET | `/api/boards/<id>/invite-links` | manager | Read the member and guest tokens (created on first use for older boards) |
| POST | `/api/boards/<id>/invite-links/<role>/regenerate` | manager | Replace the `member` or `guest` token; the old one stops working |
| GET | `/api/invites/<token>` | user | What the token grants and the caller's current role |
| POST | `/api/invites/<token>/accept` | user | Join the board (200 in every case, never lowers a role) |
| POST | `/api/boards/<id>/columns` | manager | Create column (201) |
| PATCH | `/api/boards/<id>/columns/reorder` | manager | Set a column's order |
| PATCH | `/api/columns/<id>` | manager | Rename column |
| DELETE | `/api/columns/<id>` | manager | Soft delete column, cards, comments, checklist items, links |
| POST | `/api/columns/<id>/cards` | writer | Create card, always `NOT_STARTED` (201) |
| GET | `/api/cards?assignee=me` | user | My Tasks |
| GET | `/api/cards?q=<text>[&board_id=<id>]` | user | Search cards in boards where the caller has any role |
| GET | `/api/cards/<id>` | participant | Card detail: the card, its `checklist`, its `links`, and the counts |
| PATCH | `/api/cards/<id>` | writer | Partial card update, including `status` |
| DELETE | `/api/cards/<id>` | writer | Soft delete card, comments, checklist items, links |
| PATCH | `/api/cards/<id>/position` | writer | Move card (`column_id`, `order`); status is untouched |
| POST | `/api/cards/<id>/checklist` | writer | Add a checklist item, at most 50 per card (201) |
| PATCH | `/api/checklist/<id>` | writer | Edit `text`, `is_done`, or `order` of an item |
| DELETE | `/api/checklist/<id>` | writer | Soft delete an item |
| POST | `/api/cards/<id>/links` | writer | Add a workspace link, at most 10 per card (201) |
| PATCH | `/api/links/<id>` | writer | Edit `url` or `label` of a link |
| DELETE | `/api/links/<id>` | writer | Soft delete a link |
| POST | `/api/cards/<id>/comments` | writer | Add comment (201) |
| GET | `/api/cards/<id>/comments` | participant | List comments, oldest first |
| PATCH | `/api/comments/<id>` | comment author | Edit comment (an admin who is not the author, and any guest, get 403) |
| DELETE | `/api/comments/<id>` | comment author | Soft delete comment |
| GET | `/api/notifications?page=&per_page=` | user | Own notifications, paginated, with `unread_count` |
| GET | `/api/notifications/overdue` | user | Own overdue cards (computed on read, nothing stored) |
| PATCH | `/api/notifications/<id>/read` | recipient | Mark as read (idempotent) |
| GET | `/api/boards/<id>/analytics` | admin | Cards per column, completed this week, member activity |

### Card status

A card's `status` is exactly `NOT_STARTED` (default), `IN_PROGRESS`, `URGENT`, or `DONE`. It cannot be sent when creating a card (400) and changes only through `PATCH /api/cards/<id>`. The server maintains `completed_at`: it is set to now when the status changes to `DONE`, cleared when it leaves `DONE`, and untouched when the status is unchanged or omitted (a move among `NOT_STARTED`, `IN_PROGRESS`, and `URGENT` never touches it). Only `DONE` counts as completed, in analytics and in the overdue list. Moving a card to another column, even one named `Done`, changes neither field. Analytics counts a card as completed this week when its `status` is `DONE` and `completed_at` is between Monday 00:00 UTC and now, whatever column it is in.

### Checklist and workspace links

Both belong to a card and are managed by writers (admin, manager, member); every role can read them through `GET /api/cards/<id>`. Progress is never stored: `checklist_done`, `checklist_total`, and `link_count` are counted from the non-deleted rows on every read (board detail uses one grouped query, so the query count stays fixed). Changing a checklist or a link never creates a notification and never changes `status` or `completed_at`.

- **Checklist items:** `text` 1 to 200 characters (trimmed), `is_done` (only the JSON booleans `true` and `false` are accepted), and a float `order` greater than 0 (new items go last, 1.0 for the first). At most 50 active items per card; the 51st add is 400. The card row is locked while adding, so two simultaneous adds cannot pass the cap.
- **Links:** `url` and `label`. The URL is trimmed, 1 to 2048 characters, has no whitespace or control character, uses the scheme `http` or `https` (any letter case), and has a host name; `javascript:`, `data:`, `file:`, scheme-less, and `//host` values are 400. `label` is 1 to 100 characters after trimming; when omitted it is the lower-case host name (cut to 100 characters). At most 10 active links per card; the 11th add is 400. The server never requests the stored URL.

### Overdue cards

`GET /api/notifications/overdue` returns `{ "items": [...], "total": N }`: cards whose due date is before today (UTC), whose status is not `DONE` (`URGENT` counts as open), in non-deleted cards, columns, and boards. A card assigned to the caller is listed when the caller is admin, manager, or member of that board; an unassigned card is listed for the admin and the managers only. A guest gets an empty list. Items are ordered by due date, then creation time, at most 100, while `total` counts every match; each item has `card_id`, `title`, `due_date`, `status`, `column_name`, `board_id`, `board_name`, and `days_overdue`. It writes no notification row and does not change `GET /api/notifications` or its `unread_count`.

### Invitation links

Each board has a member token and a guest token (256 bits of randomness, URL-safe). The web app builds the link `<origin>/invite/<token>`. The admin and the managers read them with `GET /api/boards/<id>/invite-links` and can replace either one with the regenerate endpoint; a replaced token answers 404 immediately. Tokens do not expire and are not used up by accepting. `POST /api/invites/<token>/accept` creates a membership with the token's role; a guest who uses the member link becomes a member; a member, manager, or admin never loses a role; repeating or racing the request leaves exactly one active membership. Unknown, malformed, replaced, and soft-deleted-board tokens all answer 404 without board data. Tokens are removed from request lines in the logs.

## Setup

### Prerequisites

- Python 3.14 (the project's virtual environment uses it; see the note on `psycopg2-binary` below)
- A recent PostgreSQL, running locally
- The commands below are for Windows (PowerShell). On macOS or Linux use `python3` and `source venv/bin/activate`.

### 1. Create the databases

Create two empty PostgreSQL databases: one for development (for example `kano`) and one for tests whose name **ends in `_test`** (for example `kano_test`). Create a user that owns both.

```sql
CREATE USER kano_user WITH PASSWORD 'choose-a-password';
CREATE DATABASE kano OWNER kano_user;
CREATE DATABASE kano_test OWNER kano_user;
```

### 2. Create the virtual environment and install packages

From the repository root:

```powershell
cd app
py -m venv venv
venv\Scripts\activate
py -m pip install -r requirements.txt
```

### 3. Configure the environment

Copy `.env.example` to `.env` (never commit `.env`) and replace every placeholder:

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Development database, `postgresql+psycopg2://user:password@localhost:5432/kano` |
| `JWT_SECRET_KEY` | Long random secret used to sign tokens |
| `JWT_ACCESS_TOKEN_EXPIRES` | Access token lifetime in seconds (default 3600) |
| `JWT_REFRESH_TOKEN_EXPIRES` | Refresh token lifetime in seconds (default 604800) |
| `CORS_ORIGINS` | Comma-separated allowed browser origins, no trailing slash (for example `http://localhost:3000`) |
| `TEST_DATABASE_URL` | Test database; must differ from `DATABASE_URL` and its name must end with `_test` |

The app refuses to start and names every missing or invalid variable (without printing values). To generate a secret: `py -c "import secrets; print(secrets.token_urlsafe(48))"`.

### 4. Apply the database migrations

Migrations are created and applied by you; the code never generates them. `migrations/versions/` holds the initial schema, the "v6 schema update" (card `status` and `completed_at`, the two invitation token columns, the `guest` role, and the check constraints `ck_cards_status` and `ck_board_memberships_role`), and the "v11 schema update" (the `URGENT` status, the `manager` role, the `checklist_items` and `card_links` tables, and the index `ix_cards_due_date`). Alembic does not detect check constraints, so the replacements of `ck_cards_status` and `ck_board_memberships_role` were added to those scripts by hand. A downgrade of the v11 step fails while a card has the status `URGENT` or a membership has the role `manager`; change those rows first. With the virtual environment active, from `app/`:

```powershell
flask db upgrade
```

Then apply the same schema to the test database by running `flask db upgrade` once with `DATABASE_URL` pointed at `kano_test` (for example in a temporary shell: `$env:DATABASE_URL = "<the kano_test URL>"; flask db upgrade`). Check that the 9 tables exist in both databases and that both are at the latest revision (`flask db current`); the test suite fails with `UndefinedColumn` errors otherwise. If you change a model, create a new migration yourself with `flask db migrate -m "message"`, review it, and upgrade both databases.

### 5. Run the API

From `app/` with the virtual environment active:

```powershell
flask run
```

The API listens on `http://127.0.0.1:5000`. Check it:

```powershell
curl http://127.0.0.1:5000/api/health
# {"data":{"status":"ok"}}
```

For a production-style server use `gunicorn "app.wsgi:app"` from the repository root. `wsgi.py` exposes the `app` object.

### 6. Run the tests

From `app/`:

```powershell
pytest -v                 # full suite (takes a few minutes: it includes property-based tests)
pytest -m "not perf"      # skip the performance checks
pytest -m perf            # performance and query-count checks only
pytest -m unit            # pure tests that need no database
```

The suite refuses to run unless `TEST_DATABASE_URL` is set, differs from `DATABASE_URL`, and names a database ending in `_test` with the schema applied (all 9 tables). Each test creates its own data and every table is emptied after each test, so never point `TEST_DATABASE_URL` at data you want to keep. `tests/test_file_size.py` fails if any `.py` file is over 300 lines (`python ../scripts/check_file_size.py app` runs the same check).

## Deployment note

The backend is meant to run on Vercel (Python runtime) with `app/` as the project root; Railway is an alternative. Set the same environment variables there. The local virtual environment uses Python 3.14, and a `psycopg2-binary` wheel for that version may not exist on every platform or hosting runtime. If installation fails, pin a supported Python version (for example with a `.python-version` file) or switch the driver (`psycopg2` built from source, or `psycopg[binary]`, which also changes the URL prefix to `postgresql+psycopg://`).

## Further reading

- `openapi.yaml` - request and response reference for every endpoint
- `../guidelines/backend.md`, `../guidelines/database.md` - coding and data rules
- `../.kiro/specs/kano/` - requirements, design, and task plan

## Postman Collection

Full API documentation with request/response examples can be seen through this link:
`https://documenter.getpostman.com/view/57333016/2sBYPv4D23`
