# Design Document

**Version:** V14 (V14 makes a root `index.py` the Vercel entrypoint, with a root `requirements.txt` that includes `app/requirements.txt`, so the package `app` stays importable on Vercel; a first `pyproject.toml` attempt did not work and was removed; see D10 (V14 refinement); V13 text follows) V13 (V13 changes only the backend Vercel deployment: the root `vercel.json` is removed and Vercel's Flask auto-detection of `app/wsgi.py` is used, see D10 (V13 refinement); no other design change; V12 text follows) V12 (revised against requirements V12: board rename and delete on the board page in new Part H (R45), a My Tasks deep link that opens the CardDetailModal (R46), `member_count` and `card_count` on every item of GET `/api/boards` (R47, the only backend change), and the V12 test and size rules (R48); V11 added the URGENT card status and label colors, the overdue notification, the card checklist, workspace links, and the Manager role in Part G, with 9 tables, and removed Column management from the role `member`; V10 was documentation-only: Requirement 36.10 screenshots; V9 was frontend-only: the shared Footer; V8 changed the Header logo, the Welcome_Page, and the board toolbar; initial design was V3)

> **V12 change summary.** V12 adds, in Part H of the requirements: board rename and delete controls in the board toolbar for the Board_Admin (R45), a My Tasks title link that opens the CardDetailModal through a `card` query parameter (R46), `member_count` and `card_count` on every Board_Summary of GET, POST, and PATCH `/api/boards` (R47), and the V12 test and file-size rules (R48). The backend change is limited to `board_service.list_boards`, `create_board`, and `update_board` plus a new grouped count helper; `GET /api/boards/<id>` is unchanged (R47 criterion 7). The frontend adds a rename form, a delete flow, and the Card_Deep_Link handling in new files, because `BoardView.tsx` is 291 lines, and updates `BoardList`, `BoardToolbar`, `MyTasksList`, the Dashboard and board pages, and `lib/types.ts`. No table, column, index, or Migration_Step is added. No V11 text was deleted. Where V12 supersedes earlier text (the per-task My Tasks link target of B6-V6/B21, the `BoardSummary` shape of B10/B20, the Dashboard "no new list request" assumption), the old text stays and a "V12 change" note names the replacement. Index of V12 sections: decisions D24 to D27 (Overview), A22 (backend, placed after A21), B22 to B27 (frontend, placed after B21), Correctness Properties 76 to 83 and the V12 amendment table, Error Handling (V12 rows), Testing Strategy (V12 additions), Part D V12 notes, Traceability (V12 tables), Open issues 67 to 77. `tasks.md` is not edited by this revision. **V12 refinement after the code check (same version, no bump):** the first V12 text of D24, D25, D27, A22, B22, B23, and Open issues 67 and 68 was checked against the real code and the installed Next.js docs and corrected in place where it was wrong (the schema split in A22, the `BoardView.tsx` line budget in B22, the Dashboard freshness in D27 and B26, the module name in A22). Each corrected place carries a "V12 refinement" note, and the CHANGELOG V12 entry lists them.

> **V11 change summary.** V11 adds, in Part G of the requirements: the fourth status `URGENT` and deterministic label colors (R39), a compute-on-read overdue endpoint in the `notifications` package (R40), the card checklist (R41) and workspace links (R42) inside the `cards` package, the Manager role with rank rules (R43), and the V11 schema, migration, and query budget (R44). No V10 text was deleted. Where V11 supersedes earlier text (the three-role helper matrix of A4-V6, the three-value status of A13 and `lib/status.ts`, the "7 tables" statements, "admin only" for columns, members, and invite links, the four-query board plan), the old text stays and a "V11 change" note or the V11 sections name the replacement. Index of V11 sections: decisions D19 to D23 (Overview), A15 to A21 (backend, placed before Data Models), B16 to B21 (frontend), Data Models "V11 data models and migration", Correctness Properties 61 to 75 and the amendment table, Error Handling (V11 rows), Testing Strategy (V11 additions), Part D V11 notes, Traceability (V11 table), Open issues 45 to 66. `requirements.md` and `tasks.md` are not edited by this revision.

> **V9 change summary.** V9 is a frontend-only revision (no endpoint, model, migration, or backend test changes). It redesigns the shared `Footer` (B15): a Server Component with one row from 768 px upward that may wrap onto two lines below 768 px (V9 refinement; the first V9 text said "a single row", superseded), the brand group on the left (brand mark, wordmark, separator dot, portfolio text) and two external icon links (GitHub, LinkedIn) on the right, built only from design-system tokens. It adds a content module `lib/footerContent.ts`, one inline-SVG icon component per brand (the installed `lucide-react` 1.75.0 has no GitHub or LinkedIn icon), and a shared `KanoMark` so the Header and the Footer show the same "K" badge. No new Correctness Property is added (example-based, see the Testing Strategy V9 additions). `proxy.ts`, `decideRoute`, `Header` behavior, and every API are unchanged. Where V9 supersedes older text (the plain one-line footer), the old text stays and a "V9 change" note names the replacement. Index of V9 sections: D18 (decision), B1 and B3 V9 notes, B15, Testing Strategy (V9 additions), Traceability (V9 table), Open issues 39 to 44.

> **V8 change summary.** V8 is a frontend-only revision (no endpoint, model, migration, or backend test changes). It adds (1) the Header logo link target `logoTarget` (B12), (2) the redesigned Welcome_Page structure, copy, and decorative preview (B13), (3) the single 1 px separator between the board toolbar and the board content (B14), plus the V8 testing strategy, Correctness Properties 59 and 60, traceability rows, and Open issues 33 to 38. Where V8 supersedes V6 text (the B2 `/welcome` row, the B7-V6 welcome responsive note, the `WelcomeActions` row of B1, and the single-toolbar markup of `BoardView`), the V6 text stays and a "V8 change" note names the replacement. `proxy.ts` and `decideRoute` are unchanged. Index of V8 sections: D16 and D17 (decisions), B12, B13, B14, Correctness Properties 59 and 60, Testing Strategy (V8 additions), Traceability (V8 table), Open issues 33 to 38.

> **V8 design refinements (no version bump).** After the V8 consistency check the requirements were refined (CHANGELOG V8, "Refinements after consistency check"). This design follows them: (1) `isVisitorAuthenticated` uses only the AuthContext `status` and no cookie or token (B12, D16, Property 59); (2) the Header "Log in" and "Register" are anchor links and the other Welcome actions are `BaseButton` (B3, B13); (3) the preview scroller lies outside the `aria-hidden` container and has `tabindex="-1"`, and only the dragged preview card carries `shadow-overlay` (B13); (4) the add-column control stays at the end of the Kanban row, outside `BoardToolbar` (B14); (5) the forbidden-claims scan is a case-insensitive substring match with "free" as a whole word (B13, Property 60). Superseded text is kept and marked "V8 change" or "Superseded". Open issues 33 to 38 are marked resolved.

> **V6 change summary.** V6 adds card status, the guest role, board invitation links, a fixed email with password change, a welcome page, and E2E credentials from `web/.env.test`. Amended or new design sections are marked with a "V6 change" note. No V5 decision was deleted. Where V6 supersedes a V5 decision, the V5 text stays and the note says what replaced it. Index of V6 sections: D12 to D15 (decisions), V6 migration note, A3 (users PATCH), A4 and A4-V6 (roles and permission matrix), A7 and A8 (notifications, analytics), A10, A11 (endpoints), A12-V6 (security), A13 (card status), A14 (invitations), B1 to B11 (frontend), Data Models (V6 columns, ER, migration), Correctness Properties 44 to 58, Error Handling, Testing Strategy (V6), D1 and D3 notes, Traceability (V6 table, rows 37 and 38), Open issues 21 to 32.

## Overview

Kano is a Trello-like task manager. This document designs a single combined spec: a Flask REST API in `app/` (Part A), a Next.js App Router frontend in `web/` (Part B), the test suites (Part C), and deployment and documentation (Part D). Sections are ordered backend first, then frontend, then testing and deployment, as the user asked.

Key design decisions:

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Per-feature Blueprint_Packages `app/blueprints/<feature>/{routes,service,schema}.py`. `schema.py` holds Marshmallow schemas and the SQLAlchemy model(s). | Required by Requirement 1. Keeps one feature per file set. |
| D2 | `routes.py` parses and validates input and calls `service.py`. `service.py` holds business and data-access logic and raises `ApiError`. Routes never touch the session. | Thin routes make the envelope and status handling uniform. |
| D3 | Cross-feature rule: models are imported only from the other feature's `schema.py`. `service.py` may call another feature's `service.py`. `routes.py` is never imported across features. Cross-feature relationships and FKs use string names. | Requirement 1.7 and 1.8. Prevents circular imports. |
| D4 | `boards/service.py` reads `Column` and `Card` (and `Comment` for cascades) directly from their `schema.py` files. | Requirement-ambiguity decision. Avoids a boards, columns, cards service cycle. |
| D5 | Shared lookups and role checks live in `app/permissions.py`, the only shared module that imports several `schema.py` files. It never imports a `service.py`. | Requirement 1.6 and 28.10. One place enforces 404-then-403 ordering. |
| D6 | Status code lives only on the HTTP status line. Body is `{ "data": ... }` or `{ "error": "..." }`. | Requirement 4 (V3, option A). |
| D7 | Soft delete everywhere through a `SoftDeleteMixin`. Services use explicit `select(...).where(is_deleted is false)` queries. Relationships are `lazy="raise"` so no soft-deleted child can leak through lazy loading. | Requirement 2.8. Also gives fixed query counts (Requirement 29.2). |
| D8 | FLOAT ordering is computed on the server for create and on the client for drop. Pure functions in `app/ordering.py` and `web/lib/order.ts` hold the logic. | Requirements 10, 11, 22. Pure functions are property-testable. |
| D9 | Two JWT types, both sent as `Authorization: Bearer`: an access token (`type=access`, 3600 s) for every protected endpoint and a refresh token (`type=refresh`, 604800 s) accepted only by `POST /api/auth/refresh`. Each is mirrored into its own non-httpOnly cookie so Server Components and the middleware can read them. Refresh tokens are stateless: no rotation, no server-side revocation (assumption, see Open issues). | Requirements 6, 16, 17, 28.7. XSS trade-off for both tokens is documented in Requirement 28.8. |
| D10 | Two Vercel projects. The backend project root is the repository root with a root `vercel.json` that routes to `app/wsgi.py`. The frontend project root is `web/`. | The package is named `app` and must be importable. See the deployment risk notes. |
| D10 (V13 refinement) | **V13; supersedes the `vercel.json` part of the D10 row above.** The backend project root stays the repository root, with Framework Preset Flask and no build, install, or output overrides. There is no `vercel.json`. Vercel auto-detects `app/wsgi.py` (it exports `app`). A root `.python-version` pins Python `3.12`. | The legacy `builds` and `routes` keys made the production deployment publish `app/` as static assets with no function, so every path returned `404 NOT_FOUND`. The D10 row and the `vercel.json` block in the deployment section are kept as V12 history. |
| D10 (V14 refinement) | **V14; adds to D10 (V13 refinement).** The Vercel entrypoint is a root `index.py` that only does `from app.wsgi import app`. A root `requirements.txt` contains `-r app/requirements.txt`. There is no `pyproject.toml`. `app/wsgi.py` stays the entrypoint for `flask run` and Gunicorn. | With auto-detection of `app/wsgi.py`, Vercel used `app/` as the source root and copied its files to `/var/task`, so the package `app` did not exist and `from app import create_app` raised `ModuleNotFoundError`. A root-level entrypoint keeps `app/` deployed as a package, so all `from app.<module>` imports stay unchanged. History: the first V14 attempt, a root `pyproject.toml` with `[tool.vercel] entrypoint = "app.wsgi:app"`, was deployed and produced the same traceback, so it was removed. |
| D11 | Denormalized `board_id` on `cards` and `notifications`. | Keeps search, permission checks, and notification navigation to one join, and keeps `notifications` independent of `cards` code. A card cannot change Board (Requirement 11.8), so the value is immutable. |
| D12 | **V6.** Three roles per Board: `admin`, `member`, `guest`. Permission helpers are split by level: reader (any role), writer (`admin` or `member`), admin. The old single `require_board_member` is replaced by `require_board_reader` and `require_board_writer` so that no call site can silently let a guest write. | Requirements 8.11, 8.12, 9.13 to 9.15, 28.14, 37.14. The glossary term Board_Member excludes the guest, so the helper names say what they allow. |
| D13 | **V6.** Invitation logic lives inside the `boards` Blueprint_Package (`boards/service/invite_service.py`, `boards/service/accept.py`, `boards/routes/invite_routes.py`). The two tokens are columns of `boards`. No ninth package and no new table. | Requirement 1.2 allows exactly 8 packages and Requirement 37.1 allows no new table. |
| D14 | **V6.** Card status is stored on `cards` (`status`, `completed_at`) and changes only through PATCH `/api/cards/<id>`. The transition rule is the pure function `apply_status_change`. Moving a card never changes its status. Analytics uses `status = DONE` and `completed_at`, not the Column named `Done`. | Requirements 11.17 to 11.21, 14.2. Supersedes the V5 rule "completed = in Column named Done with `updated_at` in this week" (see A8 and Open issue 3). |
| D15 | **V6.** Route decisions come from one pure function `decideRoute` (replaces `guardDecision`). The first-visit redirect to `/welcome` uses the cookie `kano_welcome_seen`. `/invite/<token>` is a protected route that sends anonymous visitors to `/login?next=...`. The `next` value is validated by one pure function `safeNext`. | Requirements 17.7 to 17.13, 19.11, 38. One function makes the whole routing table property-testable and prevents open redirects. |

**V8 decisions (frontend only).**

| # | Decision | Rationale |
|---|----------|-----------|
| D16 | **V8.** The Header logo target comes from one pure function `logoTarget(isAuthenticated)` in `lib/logoTarget.ts`, with the input computed by a second pure function `isVisitorAuthenticated(status)` (**V8 refinement:** AuthContext `status` only, no cookie and no token; the first V8 form `isVisitorAuthenticated({ user, accessToken, refreshToken })` is superseded, see B12). The target is `/welcome` or `/`, never `/login`. `decideRoute`, `proxy.ts`, and the Welcome_Cookie logic are not touched. | Requirements 18.14, 18.15, 17.14. A pure function makes "never `/login`" property-testable, and leaving `decideRoute` alone keeps Properties 52 and 53 valid. |
| D17 | **V8.** The Welcome_Page is a Server Component tree of small presentational components (one per file, each at most 300 lines), with one Client Component for the call-to-action buttons. All copy and link targets live in one constants module `lib/welcomeContent.ts`, and a pure function `findForbiddenClaims(text)` scans that copy. The board preview is decorative (`aria-hidden`, no focusable element). The separator on the board page is a single element in a new `BoardToolbar` boundary, so no second border can appear (V8 refinement: the add-column control is not part of that toolbar, and the forbidden-claims scan is a case-insensitive substring match with "free" as a whole word). | Requirements 38.15 to 38.21, 21.24 to 21.28. One copy module makes the forbidden-claims check (R38.19) testable over exactly what is rendered, and `BoardView.tsx` is already near the 300-line limit (Requirement 30.6). |

**V9 decision (frontend only).**

| # | Decision | Rationale |
|---|----------|-----------|
| D18 | **V9.** The Footer stays a Server Component with no state and no handlers. Hover and focus come from Tailwind classes only. Its text, the two placeholder URLs, and the two `aria-label` values live in `lib/footerContent.ts`, its Tailwind classes stay in `components/` as complete static strings (the Tailwind scanner covers `components/` and `hooks/`, not `lib/`). GitHub and LinkedIn marks are inline SVG components in `components/shared/icons/`, because the installed `lucide-react` has no brand icons. The "K" badge is one shared `KanoMark` used by the Header and the Footer. The brand group is plain text and never a link. | Requirements 18.16 to 18.21, 27.11, 27.12. A Server Component keeps the footer out of the client bundle. Keeping classes in `components/` avoids classes that are never generated. One `KanoMark` keeps both badges identical. A text-only brand group leaves exactly one link named "Kano" per page (R18.14). V9 refinement: the layout is one row from 768 px upward and may wrap onto two lines below 768 px (the first V9 text said "single row", superseded). |

**V11 decisions.**

| # | Decision | Rationale |
|---|----------|-----------|
| D19 | **V11.** Four roles ranked once in `permissions.py`: `ROLE_RANK = {guest: 0, member: 1, manager: 2, admin: 3}`. Levels are `reader`, `writer`, `manager`, `admin`. `role_allows` keeps its formula. Two new pure functions, `decide_role_change` and `decide_member_removal`, hold every rank rule. | R43.1 to R43.9. One table means one place to test (Properties 72 and 73). |
| D20 | **V11.** Checklist items and workspace links are two models inside the `cards` package (R41.11, R42.10). `cards/schema`, `cards/service`, and `cards/routes` become packages, one module per resource, so no file passes 300 lines. | R1.2 allows 8 packages. R30.6 limits files to 300 lines. |
| D21 | **V11.** Per-card counts for the board payload come from one grouped query that left-joins two grouped subqueries (checklist, links) onto the board's cards. The board request stays at 5 queries. | R44.4, Property 25 (now 71). |
| D22 | **V11.** Overdue items are computed on read in `notifications/service/overdue_service.py` and are never stored. The "today" value is passed in as a parameter, so the query and the pure `days_overdue` are testable with a fixed date. | R40.1 to R40.6. A deliberate exception to R13.4. |
| D23 | **V11.** Status and label class strings are complete static strings in `lib/status.ts` and `lib/labelColor.ts`. Tailwind must scan `lib/`, so `globals.css` gains `@source "../lib";` (a superset of the folders R15.2 lists). | R39.5, R39.9. Without it the classes are never generated (see D18 and Open issue 45). |

**V12 decisions.**

| # | Decision | Rationale |
|---|----------|-----------|
| D24 | **V12.** `member_count` and `card_count` are computed in `board_service.list_boards`, `create_board`, and `update_board` by a new helper module `boards/service/board_counts.py` (**V12 refinement:** the first text said `counts.py`, which clashes with the existing `cards/service/counts.py` and its function `counts_for_board`) whose `counts_for_boards(board_ids)` runs two `GROUP BY board_id` queries (memberships, cards) over the given ids. A new `BoardSummarySchema(BoardSchema)` in `board_schemas.py` adds the two integer fields and is the schema of `serialize_board`; `BoardSchema` and `BoardDetailSchema` are unchanged, so GET `/api/boards/<id>` keeps its shape with no `Meta.exclude` (**V12 refinement:** the first text added the fields to `BoardSchema` and excluded them in the detail schema). `get_board_detail` does not call the helper. | R47.1 to R47.4, R47.7. Mirrors the A18 pattern at board level, keeps the 5-query budget of GET detail (D21) untouched, and gives the list its own budget. `BoardSummarySchema` matches the existing TypeScript name `BoardSummary` and the new OpenAPI schema `BoardSummary` (A22). |
| D25 | **V12.** The rename form, the delete flow, and the Card_Deep_Link handling live in new files, one responsibility each: `components/boards/RenameBoardModal.tsx`, `components/boards/DeleteBoardControl.tsx` (button plus `ConfirmDialog`), `hooks/useCardDeepLink.ts`, `lib/deepLink.ts` (pure), `lib/boardPatches.ts` (pure) with `hooks/useBoardPatches.ts` (B26). `BoardToolbar.tsx` owns the displayed name and the rename and delete state, so `BoardView.tsx` gains only about 4 lines (291 to at most 296, B22 line budget). **V12 refinement:** the first text let `BoardView` hold `boardName` state and handlers, which would have taken it past 300 lines. | R48.6 (every file at most 300 lines; `BoardView.tsx` is 291). One component or hook per file matches D20's split rule. |
| D26 | **V12.** The `card` query parameter is read once in the board page Server Component through its `searchParams` prop (a `Promise` in the installed Next.js 16.4.6, confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`) and passed down as a plain `string | null` prop to `BoardView`. Removing the parameter on modal close uses `window.history.replaceState` directly (the "Native History API" pattern documented in `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`), not `router.replace`, so no new Server Component request and no Client Cache invalidation occurs (`router.refresh()` and `router.replace` are documented to re-fetch or clear the Client Cache; a direct `window.history.replaceState` call is documented to update the URL bar and any `usePathname`/`useSearchParams` reader without a request). | R46.7, R46.9. Keeps the deep-link open/close cycle to zero extra network requests, matching R46.8's "no GET `/api/cards/<id>` request" and R46.7's "no new GET `/api/boards/<id>` request". |
| D27 | **V12.** The Dashboard stays a Server Component (`force-dynamic`, unchanged from B2). Freshness after rename, delete, and back navigation (R45.12) is achieved the same way the existing Dashboard already achieves freshness after create (B2: `router.refresh()` on retry only) and after any other Server Component navigation: `BoardToolbar`'s rename and delete handlers call `router.push("/")` (delete) or stay on the page (rename, no navigation), and the Dashboard's own `export const dynamic = "force-dynamic"` (already present, B2) forces a fresh server fetch of `GET /api/boards` on every request to `/`, including a browser back-button navigation, because `force-dynamic` opts the route out of the static and dynamic Client Cache periods described in `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md` (both `static` and `dynamic` `staleTimes` apply only to statically generated or fully prefetched segments; a `force-dynamic` page is always re-rendered on the server for a new navigation, and back/forward navigation to a dynamic page that was not prefetched issues a new request). No `router.refresh()` call is required on the Dashboard itself; the existing create-board flow already updates the in-memory list via `onCreated`, and a later navigation away and back re-fetches server-side. | R45.12. Reuses the existing `force-dynamic` export instead of adding `revalidatePath`, `revalidateTag`, or a new `router.refresh()` call, which would duplicate behavior `force-dynamic` already provides for a page-level navigation. |
| D27 (V12 refinement) | **V12 refinement; supersedes the freshness reasoning of the D27 row above.** The installed docs contradict that row: `01-app/04-glossary.md` ("Client Cache") says pages "are reused during browser back/forward navigation", and `staleTimes.md` says the setting "doesn't change back/forward caching behavior". So a back navigation to `/` after a rename shows the old RSC payload. In addition, `BoardList` copies `initialBoards` into `useState` once, so even a fresh payload would not replace the list. Design (B26): a successful rename or delete records a Board_Patch in `sessionStorage` (`kano_board_patches`: renamed Boards as `{board_id, name, updated_at}` from the PATCH response, deleted Board ids). `BoardList` applies the stored patches to the list it renders with the pure function `applyBoardPatches(boards, patches)` in `lib/boardPatches.ts`: deleted ids are removed, and a rename replaces the name only when the listed Board's `updated_at` is older than the patch's (both are server timestamps, so a later rename by someone else wins). The function is idempotent, so a fresh list from the server is unchanged and a cached list from a back navigation is corrected, with no extra request and no clock comparison between browser and server. Delete navigates with `router.push("/")`: `staleTimes.dynamic` defaults to 0 for a page that is neither static nor fully prefetched, so a push renders `/` on the server. Rejected alternatives: a "stale" flag plus `router.refresh()` (the flag is consumed by the first Dashboard mount after a push, so the older cached entry reached by the back button still shows the old list); `revalidatePath` (needs a Server Action, and the app calls Flask from the browser); `bfcacheId` as a key (`use-router.md` calls it a last resort, and it keeps the state on back navigation, which is the stale case). | R45.12, R20.10. One pure function covers all three paths of R45.12 (link, push, back button) and is property-testable (Property 82). |

Pure logic (ordering, validation boundaries, recipient computation, pagination, week boundaries, optimistic-move reducers, route-guard decisions, badge formatting) is isolated in side-effect-free functions so it can be tested with property-based tests. See Correctness Properties.

### Manual migration dependency

> **MANUAL STEP (user-owned, Requirement 3):** `flask db init`, `flask db migrate`, `flask db upgrade`, in that order, from `app/` against the local PostgreSQL database. Production and the test database get `flask db upgrade` as separate manual runs. No automated task generates or commits migration scripts.

Parts of this design that depend on that step: every endpoint that reads or writes the database (all except `GET /api/health`), all service and end-to-end pytest tests, the performance checks (Requirement 29), the production verification (Requirement 34), and the Playwright suite. Pure-function unit tests, schema tests, and all frontend unit tests do not depend on it.

> **V6 change, manual migration (Requirement 3.8 to 3.10).** V6 adds columns to existing tables, so the user runs a second manual Migration_Step, `flask db migrate` and `flask db upgrade` from `app/`, against the development database and the test database. Production is not deployed yet, so its first `flask db upgrade` applies the complete history including V6. Alembic autogenerate does not detect changes to check constraints on existing tables, so the user must review the generated script and add the check constraints by hand (details under Data Models, "V6 schema changes and migration"). This design commits no migration script. Everything that reads `status`, `completed_at`, the invite tokens, or the role `guest` in the database is blocked until that step is done. Pure functions (`apply_status_change`, `resolve_accept`, `start_of_week_utc`, `role_allows`, `decideRoute`, `safeNext`) and all frontend unit tests are not blocked.

## Architecture

### System context

```mermaid
flowchart LR
    Browser["Browser (Kano_Web UI)"] -->|"HTML, RSC"| Web["Next.js on Vercel (web/)"]
    Browser -->|"fetch + Bearer access token (client components); refresh on 401"| API
    Web -->|"fetch + Bearer access token from cookie (server components); middleware refresh"| API["Flask API on Vercel (app/)"]
    API -->|"SQLAlchemy, psycopg2-binary"| PG[("PostgreSQL")]
    PW["Playwright E2E"] -->|"E2E_BASE_URL"| Web
```

### Backend folder layout (flat; `app/` is the backend root)

```
app/
|-- __init__.py          create_app(config_overrides=None)
|-- config.py            Config.from_env(): validates env vars, fails fast
|-- extensions.py        db (SQLAlchemy), migrate (Migrate), jwt (JWTManager)
|-- errors.py            ApiError family, error handlers, ok()/fail() envelope helpers
|-- permissions.py       get_board_or_404, require_board_member, require_board_admin, ...
|-- soft_delete.py       SoftDeleteMixin, active(), soft_delete_where(), utcnow()   (additional shared module)
|-- ordering.py          next_last_order, midpoint_order, before_first_order       (additional shared module)
|-- health.py            GET /api/health, no database access                        (additional shared module)
|-- wsgi.py              entry point exposing `app`
|-- requirements.txt     pinned (name==version)
|-- .env.example
|-- blueprints/
|   |-- auth/            routes.py, service.py, schema.py   (no model)
|   |-- users/           routes.py, service.py, schema.py   (User)
|   |-- boards/          routes.py, service.py, schema.py   (Board, BoardMembership; V6: also invitation links and accept, see A14)
|   |-- columns/         routes.py, service.py, schema.py   (Column)
|   |-- cards/           routes.py, service.py, schema.py   (Card)
|   |-- comments/        routes.py, service.py, schema.py   (Comment)
|   |-- notifications/   routes.py, service.py, schema.py   (Notification)
|   `-- analytics/       routes.py, service.py, schema.py   (no model)
|-- tests/               pytest (unit + e2e)
|-- migrations/          generated manually by the user
`-- venv/                already exists; not recreated
```

There is no `app/routes/`, `app/services/`, or `app/models/` directory. `GET /api/health` is registered by `create_app` from one extra shared module, `app/health.py`, which has no database access.

Because `app/` itself is the Python package `app` (it contains `__init__.py`), all internal imports are absolute (`from app.extensions import db`). `wsgi.py` inserts the repository root into `sys.path` before importing, so both `flask run` from `app/` and Vercel work.

### Model ownership

| Blueprint_Package | Owns model(s) | Table(s) |
|---|---|---|
| users | User | `users` |
| boards | Board, BoardMembership (V6: Board also holds the two Invite_Token columns; the invitation endpoints belong to this package) | `boards`, `board_memberships` |
| columns | Column | `columns` |
| cards | Card | `cards` |
| comments | Comment | `comments` |
| notifications | Notification | `notifications` |
| auth | none | none |
| analytics | none | none |

### Module dependency direction (acyclic)

```mermaid
flowchart TD
    subgraph routes
      R[routes.py of each feature]
    end
    R --> S[own service.py]
    R --> SC[own schema.py]
    S --> P[permissions.py]
    S --> SD[soft_delete.py / ordering.py]
    P --> USch[users/schema]
    P --> BSch[boards/schema]
    P --> CoSch[columns/schema]
    P --> CaSch[cards/schema]
    P --> CmSch[comments/schema]
    auth_s[auth/service] --> users_s[users/service]
    cards_s[cards/service] --> notif_s[notifications/service]
    comments_s[comments/service] --> notif_s
    boards_s[boards/service] -. reads models .-> CoSch
    boards_s -. reads models .-> CaSch
    boards_s -. reads models .-> CmSch
    columns_s[columns/service] -. cascade reads .-> CaSch
    columns_s -. cascade reads .-> CmSch
    analytics_s[analytics/service] -. join reads .-> BSch
    analytics_s -. join reads .-> CoSch
    analytics_s -. join reads .-> CaSch
    analytics_s -. join reads .-> CmSch
    analytics_s -. join reads .-> USch
```

Rules that keep the graph acyclic:

1. No `schema.py` imports any other module of another feature. Cross-feature relationships and FKs use string names (for example `db.ForeignKey("columns.column_id", name="fk_cards_columns")`, `db.relationship("Column", lazy="raise")`).
2. `permissions.py` imports `schema.py` files only and never a `service.py`. Therefore `cards/service` and `comments/service` get Column, Card, and membership lookups from `permissions.py` and do not import `columns/schema` or `boards/schema` directly.
3. Service-to-service calls exist only in three places: `auth` to `users`, `cards` to `notifications`, `comments` to `notifications`.
4. `routes.py` imports only its own `service.py` and `schema.py` plus `errors.py`.
5. `create_app` imports every model-defining `schema.py` (users, boards, columns, cards, comments, notifications) before `Migrate.init_app`, so `flask db migrate` detects all 7 tables (Requirement 1.9).
6. **V6.** `boards/service` keeps owning Board_Memberships, including the invitation accept (a membership write). `cards/service` imports nothing from `boards` except through `permissions.py` and `notifications/service`, and never imports a `routes.py`. The invitation routes are registered by the `boards` blueprint under `/api/invites/...` and `/api/boards/<id>/invite-links...`, so no other package is involved.
7. **V6.** `apply_status_change` (cards), `resolve_accept` (boards), `role_allows` (permissions), and `start_of_week_utc` (analytics) are pure functions with no import of `db`, so they are unit and property testable without a database.

### File size and split rule (Requirement 30.6, 30.7)

Every Python and TSX file stays at or below 300 lines. Splits are decided now where growth is likely:

| File | Planned split when over 300 lines |
|---|---|
| `blueprints/boards/service.py` | `boards/service/` package: `board_service.py`, `member_service.py`, `cascade.py`, with `__init__.py` re-exporting so `from app.blueprints.boards import service` still works |
| `blueprints/cards/service.py` | `cards/service/`: `card_service.py`, `position_service.py`, `search_service.py` |
| `blueprints/boards/schema.py` | `boards/schema/`: `models.py`, `board_schemas.py`, `member_schemas.py` |
| `blueprints/cards/routes.py` | `cards/routes/`: `card_routes.py`, `search_routes.py` |
| **V6** `blueprints/boards/service/` (with invitations) | `board_service.py`, `member_service.py`, `cascade.py`, `invite_service.py` (tokens, lazy creation, regenerate, lookup), `accept.py` (pure `resolve_accept` and the accept transaction) |
| **V6** `blueprints/boards/routes.py` | `boards/routes/`: `board_routes.py`, `member_routes.py`, `invite_routes.py` |
| **V6** `blueprints/boards/schema.py` | `boards/schema/`: `models.py`, `board_schemas.py`, `member_schemas.py`, `invite_schemas.py` |
| **V6** `blueprints/cards/service.py` | `cards/service/`: add `status.py` (pure `apply_status_change`, `CARD_STATUSES`) next to `card_service.py`, `position_service.py`, `search_service.py` |
| **V6** `web/components/boards/MemberPanel.tsx` | `MemberPanel.tsx` (shell), `MemberList.tsx`, `AddMemberForm.tsx`, `InviteLinksPanel.tsx`, `InviteLinkRow.tsx`, one component per file |
| **V6** `web/components/cards/CardDetailModal.tsx` | `CardDetailModal.tsx` (shell and save logic), `CardDetailForm.tsx`, `StatusSelect.tsx`, with `CommentList.tsx` unchanged |

The package `__init__.py` keeps `routes`, `service`, and `schema` importable under those names.

### Request lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Flask (CORS, JWT)
    participant R as routes.py
    participant S as service.py
    participant P as permissions.py
    participant DB as PostgreSQL
    C->>F: HTTP request (Authorization: Bearer)
    F->>F: CORS check, JWT verify, user lookup (1 query)
    F->>R: dispatch (uuid path converter)
    R->>R: load_json(Schema) -> 400 on ValidationError
    R->>S: call service(current_user, validated)
    S->>P: require_board_member / admin
    P->>DB: board + membership (1 query)
    S->>DB: reads/writes, one transaction
    S-->>R: dict / model
    R-->>C: ok(data, status) -> { "data": ... }
    Note over F,C: any ApiError, ValidationError, IntegrityError or Exception becomes { "error": "..." } with rollback
```

## Components and Interfaces

## Part A: Backend

### A1. Application factory and configuration (Requirements 1.5, 1.12, 1.13, 28.5, 28.6, 4.16, 4.17)

`Config.from_env()` reads these variables through python-dotenv and raises `ConfigError("Missing required environment variable: NAME")` for any that is missing or empty. The message names the variable and never prints values.

| Variable | Used for | Required at startup |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy URI (`postgresql+psycopg2://...`) | yes |
| `JWT_SECRET_KEY` | signing secret for both access and refresh tokens | yes |
| `JWT_ACCESS_TOKEN_EXPIRES` | access token lifetime in seconds, positive integer; `.env.example` placeholder `3600` | yes |
| `JWT_REFRESH_TOKEN_EXPIRES` | refresh token lifetime in seconds, positive integer; `.env.example` placeholder `604800` | yes |
| `CORS_ORIGINS` | comma-separated allowed origins | yes |
| `TEST_DATABASE_URL` | pytest only; must differ from `DATABASE_URL` | tests only |

`create_app(config_overrides=None)`:

1. Build `Config`. Tests pass overrides that point `DATABASE_URL` at `TEST_DATABASE_URL`.
2. Set `JWT_ACCESS_TOKEN_EXPIRES` and `JWT_REFRESH_TOKEN_EXPIRES` on `app.config` as `timedelta(seconds=...)` (Flask-JWT-Extended reads them as defaults), then `db.init_app`, `jwt.init_app`, import all model-defining `schema.py` files, then `migrate.init_app(app, db)`.
3. Engine options: when the environment variable `VERCEL` is set, use `poolclass=NullPool` (no pooled connections in a serverless function). Otherwise `pool_size=5`, `pool_pre_ping=True`.
4. `CORS(app, resources={r"/api/*": {"origins": cfg.cors_origins, "allow_headers": ["Authorization", "Content-Type"]}})` with `supports_credentials=False`. flask-cors omits the allow-origin header for an origin not in the list (Requirement 4.17).
5. Register error handlers and JWT callbacks from `errors.py`, register the health blueprint and the 8 feature blueprints under `/api`.
6. Never log request bodies or `Authorization` headers. A logging filter drops records that contain `password` or `Bearer` text (Requirement 28.2). **V6 change:** the same filter, attached to the root logger and to the `werkzeug` logger, also rewrites every record with `redact_invite_tokens(text)` (see A12-V6) so an Invite_Token in a request path never reaches the log (Requirement 28.13). `current_password` is dropped by the existing `password` rule.

### A2. Error handling and Response_Envelope (`errors.py`, Requirement 4)

```python
def ok(data, status=200):            # -> flask Response {"data": data}
def fail(message, status):           # -> flask Response {"error": message[:500]}
class ApiError(Exception):           # status, message
class BadRequest(ApiError): ...      # 400
class Unauthorized(ApiError): ...    # 401
class Forbidden(ApiError): ...       # 403
class NotFound(ApiError): ...        # 404
class Conflict(ApiError): ...        # 409
```

| Source | Handler result |
|---|---|
| `ApiError` | its status and message |
| `marshmallow.ValidationError` | 400, message lists each invalid field name (`"name: Length must be between 1 and 100"`) |
| `werkzeug` `NotFound` / `MethodNotAllowed` (unknown path, bad method, non-UUID path id) | 404 / 405 with `{ "error": "..." }` |
| `sqlalchemy.exc.IntegrityError` | rollback, then by `pgcode`: `23505` gives 409, `23503` and `23502` give 400, anything else 500; message is generic, no SQL text |
| `OperationalError`, `ProgrammingError` (missing table, DB down) | rollback, log, 500 generic (Requirement 3.6, 3.7) |
| any other `Exception` | rollback, `logger.exception`, 500 `"Internal server error"` |
| JWT callbacks (`unauthorized_loader`, `invalid_token_loader` (also fires for a wrong token type), `expired_token_loader`, `revoked`, `user_lookup_error_loader`) | 401 envelope |

`load_json(schema)` in `errors.py` reads `request.get_json(silent=True)`, rejects a non-object body with 400, and calls `schema.load(data)`. All schemas use `unknown = RAISE`, so a `password` key in `PATCH /api/users/me` fails with 400 (Requirement 7.3). Query strings use the same pattern through `schema.load(request.args)`.

Success status is chosen in `routes.py`: `ok(data, 201)` for the six creating POSTs, `ok(data)` otherwise. DELETE routes return `ok({"<resource>_id": "<uuid>"})`.

Serialization: `UuidField` outputs `str(uuid)` (lowercase, 36 characters). `UtcDateTime` outputs `value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")`.

### A3. Authentication and users (Requirements 6, 7, 28.1)

- Password hashing: `werkzeug.security.generate_password_hash(password)` (salted, adaptive scrypt). Verification uses `check_password_hash`. A dummy hash check is run when the email is unknown so both login failures take similar time.
- Emails are trimmed and lowercased on write and on lookup (see the normalization bullet below), the stored value is always lowercase, and the partial unique index on `email` therefore gives the case-insensitive uniqueness of Requirements 2.12, 6.2, and 7.4.
- Two token types (Requirements 6.4, 6.5, 6.10 to 6.15). Both are signed with `JWT_SECRET_KEY` and carry `sub = str(user.user_id)` (a string because current PyJWT rejects non-string subjects). Flask-JWT-Extended sets the `type` claim itself:

  | Token | Created by | `type` | Lifetime | Accepted by |
  |---|---|---|---|---|
  | access | `create_access_token(identity=str(user_id))` | `access` | `JWT_ACCESS_TOKEN_EXPIRES` (3600 s) | every protected endpoint (`@jwt_required()`) |
  | refresh | `create_refresh_token(identity=str(user_id))` | `refresh` | `JWT_REFRESH_TOKEN_EXPIRES` (604800 s) | only `POST /api/auth/refresh` (`@jwt_required(refresh=True)`) |

- Type enforcement: `@jwt_required()` (default) rejects a refresh token and `@jwt_required(refresh=True)` rejects an access token. Flask-JWT-Extended raises its wrong-token error in both cases (it would answer 422 by default). The `invalid_token_loader` registered in `errors.py` maps it to 401 in the envelope (Requirement 4.6). A test asserts the 401 for each direction, so a library default change is caught.
- `jwt.user_lookup_loader` loads the non-deleted User by id once per request and caches it on `flask.g`. A missing or soft-deleted user returns `None`, which the lookup-error callback turns into 401 (Requirement 6.9). This is query 1 of every protected request.
- `POST /api/auth/refresh` (`auth/service.refresh(identity)`): `@jwt_required(refresh=True)`, then loads the non-deleted User by `get_jwt_identity()` and raises `Unauthorized` if missing (Requirement 6.13), then returns `create_access_token(...)`. It does not issue a new refresh token (no rotation), and it keeps no server state (Requirement 6.15).
- `GET/PATCH /api/users/me` use the cached user. **V6 change (supersedes the V5 PATCH, which accepted `email` and rejected `password`):** PATCH accepts only `name` and/or `password` with `current_password`, and the email can never change (Requirements 7.2 to 7.5, 7.8). `UserUpdateSchema` declares `name` (1 to 100, stripped), `password` (8 to 128), `current_password` (load only, non-empty string), and an explicit `email = fields.Raw(load_only=True)` whose validator always raises `ValidationError("email cannot be changed")`, so a body that contains `email` with any value (including the current one, null, or an empty string) returns 400 naming `email` (the `unknown = RAISE` rule alone would also reject it, but the explicit field gives the clear message). A `@validates_schema` hook rejects a body with neither `name` nor `password`, a `current_password` without `password`, and a `password` without `current_password` (400 naming `current_password`). `users/service.update_me` runs in this order: (1) if `password` is present, `check_password_hash(user.password_hash, current_password)`; a mismatch raises `BadRequest("current_password: does not match")` before any field is touched, so the name of the same request is not saved (never 403); (2) set `name`; (3) set `password_hash = generate_password_hash(password)` (same salted adaptive hash as registration, reused through `users/service.hash_password`); (4) one commit. There is no token invalidation: access and refresh tokens stay valid after a password change (Requirement 6.15, stateless, see Open issue 13). `UserSchema` output never contains a password field, and the log filter drops any record that contains `password` or `current_password`, including those of failed requests (Requirement 7.8). A token whose subject is a soft-deleted or nonexistent user never reaches the route: the lookup loader answers 401 on every protected endpoint, including these two (Requirements 6.9 and 7.6). There is no 404 for a missing current user.
- No endpoint deletes or deactivates a user (Requirement 7.7). Soft-deleted users exist only as seed data: tests insert a `User` row with `is_deleted = true` directly through the test session (a `make_deleted_user` fixture). Requirements 6.6, 6.9, 6.13, and 31.11 are tested with those rows.
- Email normalization: `normalize_email(value) = value.strip().lower()` in `users/schema.py`, applied by a Marshmallow `pre_load` hook on every schema that carries an email (`RegisterSchema`, `LoginSchema`, `UserUpdateSchema`, `MemberAddSchema`), so register, login lookup, PATCH, and add-member lookup all work on the lowercased value, and the stored column is always lowercase (Requirements 2.12, 6.1, 7.2, 9.1).
- The login response is `{ "data": { "access_token": "<jwt>", "refresh_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600, "refresh_expires_in": 604800, "user": { ... } } }`. `expires_in` is `JWT_ACCESS_TOKEN_EXPIRES` and `refresh_expires_in` is `JWT_REFRESH_TOKEN_EXPIRES`, both in seconds. The refresh response is `{ "data": { "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 } }`. Register returns the user profile only and no tokens.
- Logout is client-only. Because refresh tokens are stateless, a stolen refresh token stays usable until it expires (assumption, see Open issues).

### A4. Permissions helpers (`permissions.py`, Requirements 1.6, 28.10, 28.11)

```python
def get_board_or_404(board_id) -> Board
def require_board_member(board_id, user_id) -> tuple[Board, BoardMembership]   # 404 then 403
def require_board_admin(board_id, user_id) -> tuple[Board, BoardMembership]    # 404, 403 non-member, 403 non-admin
def get_column_for_member(column_id, user_id) -> tuple[Column, Board, BoardMembership]
def get_card_for_member(card_id, user_id)   -> tuple[Card, Board, BoardMembership]
def get_comment_for_member(comment_id, user_id) -> tuple[Comment, Card, BoardMembership]
def assert_assignee_is_member(board_id, assignee_id) -> None                   # 400
```

Each helper does one joined query that selects the resource with its Board and the caller's active membership (`board_memberships.is_deleted = false`). Order of checks: resource missing or soft deleted gives 404, then missing membership gives 403, then role gives 403. A 403 response body contains only a generic message, never resource data (Requirement 28.11). Every `service.py` that enforces membership or role calls these helpers (Requirement 1.6).

**V6 change: this helper list is superseded by A4-V6 below.** The signatures above are kept for history. In V6 `require_board_member` and the `*_for_member` helpers no longer exist, because "member" was ambiguous once the guest role was added.

> **V11 change.** The helper list, `ROLE_RANK`, `LEVEL_RANK`, and the endpoint-by-role matrix below are superseded by A15 (four roles, `require_board_manager`, `get_column_for_manager`, new card, checklist, and link helpers, the V11 matrix). The V6 text stays as history. `role_allows` and the check order (404, 403 no membership, 403 role) are unchanged.

#### A4-V6. Role levels, helpers, and the endpoint by role matrix (Requirements 8.11, 8.12, 9.13 to 9.15, 10.10, 11.22, 11.23, 12.10, 12.11, 14.10, 28.14, 37.14)

Role levels (pure, in `permissions.py`, no database access):

```python
ROLE_RANK = {"guest": 0, "member": 1, "admin": 2}
LEVEL_RANK = {"reader": 0, "writer": 1, "admin": 2}      # reader = any role, writer = admin or member
def role_allows(role: str | None, level: str) -> bool:    # None (no active membership) -> False
    return role is not None and ROLE_RANK[role] >= LEVEL_RANK[level]
```

| V6 helper | Replaces (V5) | Behavior |
|---|---|---|
| `require_board_reader(board_id, user_id)` | `require_board_member` for read endpoints | 404, 403 without active membership, any role passes |
| `require_board_writer(board_id, user_id)` | `require_board_member` for write endpoints | 404, 403 without membership, 403 for `guest` |
| `require_board_admin(board_id, user_id)` | unchanged | 404, 403 for `member`, `guest`, and non-participants |
| `get_column_for_writer(column_id, user_id)` | `get_column_for_member` | column rename, delete, create card; guest gets 403 |
| `get_card_for_reader(card_id, user_id)` and `get_card_for_writer(card_id, user_id)` | `get_card_for_member` | reader for GET comments; writer for PATCH, DELETE, position, create comment |
| `get_comment_for_reader(comment_id, user_id)` and `get_comment_for_writer(comment_id, user_id)` | `get_comment_for_member` | the comment PATCH and DELETE use the writer variant and then the owner check, so a guest who is the author of an old Comment (possible after being removed and re-joining as guest) still gets 403 (Requirement 12.11) |
| `assert_assignee_is_writer(board_id, assignee_id)` | `assert_assignee_is_member` | 400 unless the assignee has an active membership with role `admin` or `member`; a guest, a removed member, and a non-participant all give 400 (Requirements 11.5, 11.22) |

Every helper still does one joined query and returns the membership, so the number of queries per request does not change (Property 25). Check order stays 404, then 403 for no membership, then 403 for role. A guest on a write endpoint gets 403 with the generic message, never resource data.

Matrix (server-verified; `ok` = allowed; `403` = forbidden; "any user" = authenticated, no Board role needed):

| Endpoint group | admin | member | guest | non-participant |
|---|---|---|---|---|
| GET board detail, GET members, GET card comments | ok | ok | ok | 403 |
| GET `/api/cards?q=...` (with or without `board_id`) | ok | ok | ok | 403 with `board_id`, boards not included without it |
| PATCH or DELETE board; POST or DELETE members; GET analytics | ok | 403 | 403 | 403 |
| GET invite-links; POST regenerate | ok | 403 | 403 | 403 |
| POST column; PATCH, DELETE column; PATCH reorder | ok | ok | 403 | 403 |
| POST card; PATCH, DELETE card; PATCH position | ok | ok | 403 | 403 |
| POST comment | ok | ok | 403 | 403 |
| PATCH or DELETE comment | author only | author only | 403 | 403 |
| GET `/api/invites/<token>`; POST accept | any user (token-gated) | any user | any user | any user |
| POST and GET `/api/boards`, `/api/cards?assignee=me`, notifications, users/me, refresh | any user | any user | any user | any user |

`role_allows` is the single decision point, so Property 47 can test the whole matrix as a table over role and level.

### A5. Soft delete and cascade (`soft_delete.py`, Requirement 2)

```python
class SoftDeleteMixin:        # created_at, updated_at, deleted_at, is_deleted
def utcnow() -> datetime      # timezone-aware UTC
def active(model)             # model.is_deleted.is_(False)
def soft_delete_where(session, model, *conditions, deleted_at) -> int
```

Cascade rules, all inside one `db.session` transaction with a single `deleted_at = utcnow()` captured once and reused (Requirements 2.9 to 2.11):

| Deleted | Also soft deleted |
|---|---|
| Board | Board_Memberships, Columns, Cards, Comments of that Board (Notifications are kept) |
| Column | Cards of the Column, Comments of those Cards |
| Card | Comments of the Card |
| Board_Membership | no row cascade; assignee cleared on the member's Cards of that Board in the same transaction (Requirement 9.11) |

Each cascade runs bulk `UPDATE ... SET is_deleted = true, deleted_at = :ts WHERE <parent ids> AND is_deleted = false`. The commit happens once at the end of the service function. Any exception triggers `db.session.rollback()` in the handler, leaving every row unchanged (Requirement 2.13, 8.10). Comment ids of a Column cascade use a subquery on `cards.column_id`.

### A6. FLOAT order strategy (`ordering.py`, Requirements 10.1, 10.4, 11.1, 11.7, 22)

```python
def next_last_order(current_max: float | None) -> float:   # None -> 1.0, else max + 1.0
def midpoint_order(prev: float, nxt: float) -> float:      # (prev + nxt) / 2
def before_first_order(first: float) -> float:             # first / 2
```

Create uses `SELECT max(order)` over active rows of the parent (Board for columns, Column for cards). Reorder and position endpoints store the order supplied by the client after schema validation (`order` is a float greater than 0, finite). Ties are broken by `created_at` in every ordered query. The same three formulas are implemented on the client in `web/lib/order.ts`.

### A7. Notifications creation rules (`notifications/service.py`, Requirement 13)

`create_notification(recipient_id, type, card, message)` inserts one row. Pure function `comment_recipients(author_id, assignee_id, admin_id) -> list[UUID]` returns the de-duplicated set of `{assignee_id, admin_id}` minus `author_id` minus `None`. Callers:

| Trigger | Caller | Recipients |
|---|---|---|
| Card created with assignee, or PATCH changes assignee | `cards/service` | new assignee, unless it is the current user (type `assignment`) |
| Comment added | `comments/service` | `comment_recipients(author, card.assignee_id, board admin)`, type `comment` |

The message is `Assigned to you: "<title>"` or `<author name> commented on "<title>"`. The title is shortened with `...` so the message never exceeds 255 characters. The notification row is inserted in the same transaction as the triggering write. Listing: `page` and `per_page` are validated by `NotificationQuerySchema` (integers from 1 to 2147483647, `per_page` at most 100, defaults 1 and 20). The query is `ORDER BY created_at DESC, notification_id DESC LIMIT per_page OFFSET (page-1)*per_page`. `total` and `unread_count` come from two `count()` queries on active rows of the recipient. A page past the last returns an empty list with the unchanged `total` and `unread_count`. Marking read is idempotent.

**V6 change (Requirement 13.12).** Guests are never notification recipients: a guest cannot be an assignee (`assert_assignee_is_writer`) and is never the Board_Admin, so `comment_recipients` needs no change. Accepting an invitation, changing a status, and moving a card create no notification. A status change that is part of a PATCH which also changes the assignee still creates the `assignment` notification by the existing rule.

### A8. Analytics queries (`analytics/service.py`, Requirement 14)

All use SQLAlchemy joins and aggregation, with every joined table filtered on `is_deleted = false`.

```python
# cards per column, 0 for empty columns -> outer join
select(Column.column_id, Column.name, func.count(Card.card_id))
  .select_from(Column).outerjoin(Card, and_(Card.column_id == Column.column_id, Card.is_deleted.is_(False)))
  .where(Column.board_id == board_id, Column.is_deleted.is_(False))
  .group_by(Column.column_id, Column.name).order_by(Column.order)

# completed this week  (V6 change: status and completed_at; V5 used the Column named "Done" and updated_at)
week_start = start_of_week_utc(now)   # Monday 00:00:00 UTC, pure function, unchanged
select(func.count(Card.card_id))
  .where(Card.board_id == board_id, Card.is_deleted.is_(False), Card.status == "DONE",
         Card.completed_at >= week_start, Card.completed_at <= now)
# no join with columns: a DONE card counts whatever Column it is in (Requirement 14.2);
# cards of a soft-deleted Column are already soft deleted by the cascade (A5), so no extra filter is needed.

# member activity (V6 change: guests excluded): only memberships with role in ("admin", "member")
# assigned cards and written comments per active member (two aggregates left-joined to memberships)
select(BoardMembership.user_id, ...).where(BoardMembership.board_id == board_id,
         BoardMembership.is_deleted.is_(False), BoardMembership.role.in_(("admin", "member")))
```

**V6 change.** If no non-deleted Card has `status = DONE` with `completed_at` in the current week, the completed count is 0 (Requirement 14.3). Cards counted before V6 through the Column named `Done` are not counted after V6 unless the optional backfill (Data Models, V6 migration) was run, which is a breaking change for the numbers (CHANGELOG V6). Cards per Column count every non-deleted Card whatever its status. Only the Board_Admin may call the endpoint (403 for `member`, `guest`, and non-participants, 404 if the Board is missing). `start_of_week_utc` is unchanged and is also used by the tests with the boundary `Monday 00:00:00 UTC` (inclusive) and one second earlier (excluded).

### A9. Board detail query plan (Requirements 8.3, 11.16, 29.1, 29.2)

> **V11 change.** The four-query plan below becomes five queries: query 5 is the combined count query of A18 (`checklist_done`, `checklist_total`, `link_count` per Card). The total stays at most 5 and identical for 10 and 500 Cards (Property 71, which extends Property 25). The V5 text stays as history.

`GET /api/boards/<id>` runs exactly four queries regardless of Card count: (1) JWT user lookup, (2) Board joined with the caller's membership, (3) active Columns ordered by `order`, (4) active Cards of the Board ordered by `order`, `created_at`, with the assignee loaded through `joinedload`. Columns and Cards are grouped in Python. The response includes `my_role`. Members and admins see all Cards (Requirement 11.16 adds no extra filter).

### A10. Card search and My Tasks (`GET /api/cards`, Requirement 11.10 to 11.14)

`CardQuerySchema` accepts `assignee` (only `me`), `q` (1 to 100 characters), `board_id` (UUID). Valid combinations: `assignee=me`, or `q` with optional `board_id`. Anything else is 400. `q` is escaped for LIKE (`\`, `%`, `_`) and used as `Card.title.ilike(pattern, escape="\\") | Card.description.ilike(pattern, escape="\\")`, so SQL and LIKE metacharacters are literal (Requirement 28.4). Rows join `Column`, `Board`, and the caller's active `BoardMembership`, and return `board_id`, `board_name`, `column_name`. With `board_id`, the membership is checked first (403 for a non-member). **V6 change:** the membership join accepts every role, so a Board_Guest can search the Cards of Boards where the guest holds a membership (Requirement 11.11, 11.13). Every returned Card (search and My Tasks) includes `status` and `completed_at` (Requirement 11.20). `CardQuerySchema` is unchanged. `assignee=me` is unaffected by roles: a guest cannot be an assignee, and removal of a membership already clears the assignee.

### A11. Endpoint table

Legend: Auth `-` = none, `JWT` = any authenticated user holding a valid access token (a refresh token gets 401), `Refresh` = a valid refresh token only (an access token gets 401), `Member` / `Admin` / `Owner` / `Recipient` = per-resource role (server-verified). **V6 change:** `Member` in this table now means the writer level (role `admin` or `member`, a guest gets 403), `Participant` means any role including `guest` (reader level), and `Token` means any authenticated user holding a valid Invite_Token. See the matrix in A4-V6. Success 201 for the six creating POSTs, 200 for everything else; DELETE returns 200 with a data object. Errors list the statuses beyond the always-possible 500 (and 401 for JWT endpoints).

| # | Method | Path | Auth / role | Request schema | Success | Error statuses | Requirement |
|---|---|---|---|---|---|---|---|
| 1 | GET | `/api/health` | - | none | 200 `{status:"ok"}` | 405, 500 | 5 |
| 2 | POST | `/api/auth/register` | - | `RegisterSchema` (name 1-100, email <=254, password 8-128) | 201 user profile | 400, 409 | 6.1-6.3 |
| 3 | POST | `/api/auth/login` | - | `LoginSchema` (email, password) | 200 `{access_token, refresh_token, token_type, expires_in, refresh_expires_in, user}` | 400, 401 | 6.4-6.9 |
| 3a | POST | `/api/auth/refresh` | Refresh | none (token in `Authorization` header) | 200 `{access_token, token_type, expires_in}` | 401 | 6.10-6.15 |
| 4 | GET | `/api/users/me` | JWT | none | 200 profile | 401 | 7.1, 7.6 |
| 5 | PATCH | `/api/users/me` | JWT | **V6:** `UserUpdateSchema` (`name`, `password` with `current_password`; `email` always 400; V5 accepted email and rejected password) | 200 profile | 400 (incl. wrong or missing `current_password`), 401 | 7.2-7.8 |
| 6 | POST | `/api/boards` | JWT | `BoardCreateSchema` (name 1-100, not blank) | 201 board with `my_role` | 400 | 8.1, 8.8, 8.10 |
| 7 | GET | `/api/boards` | JWT | none | 200 list, `created_at` desc | none | 8.2 |
| 8 | GET | `/api/boards/<uuid:id>` | Participant | none | 200 board, columns, cards (with `status`, `completed_at`), `my_role` may be `guest` | 403, 404 | 8.3, 8.6, 8.9, 8.11, 11.16 |
| 9 | PATCH | `/api/boards/<uuid:id>` | Admin | `BoardUpdateSchema` | 200 board | 400, 403, 404 | 8.4, 8.7 |
| 10 | DELETE | `/api/boards/<uuid:id>` | Admin | none | 200 `{board_id}` | 403, 404 | 8.5, 2.9 |
| 11 | POST | `/api/boards/<uuid:id>/members` | Admin | `MemberAddSchema` (email) | 201 member | 400, 403, 404, 409 | 9.1-9.4, 9.9, 9.10 |
| 12 | GET | `/api/boards/<uuid:id>/members` | Participant | none | 200 list, creation asc, roles incl. `guest` | 403, 404 | 9.5, 9.10, 9.13 |
| 13 | DELETE | `/api/boards/<uuid:id>/members/<uuid:user_id>` | Admin | none | 200 `{user_id}` | 400 (self), 403, 404 | 9.6-9.8, 9.11, 9.12 |
| 14 | POST | `/api/boards/<uuid:id>/columns` | Member | `ColumnCreateSchema` | 201 column | 400, 403, 404 | 10.1, 10.6, 10.7 |
| 15 | PATCH | `/api/columns/<uuid:id>` | Member | `ColumnUpdateSchema` | 200 column | 400, 403, 404 | 10.2 |
| 16 | DELETE | `/api/columns/<uuid:id>` | Member | none | 200 `{column_id}` | 403, 404 | 10.3, 2.10 |
| 17 | PATCH | `/api/boards/<uuid:id>/columns/reorder` | Member | `ColumnReorderSchema` (`column_id` UUID, `order` float > 0) | 200 column | 400, 403, 404 | 10.4, 10.5, 10.8 |
| 18 | POST | `/api/columns/<uuid:id>/cards` | Member | `CardCreateSchema` | 201 card | 400, 403, 404 | 11.1, 11.2, 11.4, 11.5 |
| 19 | PATCH | `/api/cards/<uuid:id>` | Member | `CardUpdateSchema` (partial) | 200 card | 400, 403, 404 | 11.3-11.5 |
| 20 | DELETE | `/api/cards/<uuid:id>` | Member | none | 200 `{card_id}` | 403, 404 | 11.6, 2.11 |
| 21 | PATCH | `/api/cards/<uuid:id>/position` | Member | `CardPositionSchema` (`column_id`, `order`) | 200 card | 400, 403, 404 | 11.7-11.9 |
| 22 | GET | `/api/cards?assignee=me` and `/api/cards?q=&board_id=` | JWT (search: Participant of each board searched) | `CardQuerySchema` | 200 list with `status`, `completed_at` | 400, 403 | 11.10-11.14, 11.20 |
| 23 | POST | `/api/cards/<uuid:id>/comments` | Member | `CommentCreateSchema` (content 1-2000, non-blank) | 201 comment | 400, 403, 404 | 12.1, 12.5, 12.8, 13.2, 13.3 |
| 24 | GET | `/api/cards/<uuid:id>/comments` | Participant | none | 200 list, creation asc | 403, 404 | 12.2, 12.8, 12.10 |
| 25 | PATCH | `/api/comments/<uuid:id>` | Owner | `CommentUpdateSchema` | 200 comment | 400, 403, 404 | 12.3, 12.7 |
| 26 | DELETE | `/api/comments/<uuid:id>` | Owner | none | 200 `{comment_id}` | 403, 404 | 12.4, 12.7 |
| 27 | GET | `/api/notifications` | JWT | `NotificationQuerySchema` (`page`, `per_page`) | 200 `{items,page,per_page,total,unread_count}` | 400 | 13.4-13.8 |
| 28 | PATCH | `/api/notifications/<uuid:id>/read` | Recipient | none | 200 notification | 403, 404 | 13.9-13.11 |
| 29 | GET | `/api/boards/<uuid:id>/analytics` | Admin | none | 200 analytics | 403, 404 | 14 |
| 30 | GET | `/api/boards/<uuid:id>/invite-links` | Admin | none | 200 `{member: {role, token}, guest: {role, token}}`, missing tokens created lazily | 403, 404 | 37.3, 37.4, 37.5, 37.8 |
| 31 | POST | `/api/boards/<uuid:id>/invite-links/<role>/regenerate` | Admin | path `role` must be `member` or `guest` (`InviteRoleSchema`) | 200 `{role, token}` (not 201, per R4.3) | 400 (bad role), 403, 404 | 37.5 to 37.8 |
| 32 | GET | `/api/invites/<token>` | Token (JWT) | token format check | 200 `{board_id, board_name, role, current_role}` | 401, 404 | 37.9, 37.10, 37.23 |
| 33 | POST | `/api/invites/<token>/accept` | Token (JWT) | token format check | 200 `{board_id, role}` (not 201, per R4.3) | 401, 404 | 37.11 to 37.13, 37.21, 37.23 |

**V6 change, rows 6 to 29 that gain behavior without a new row.** Row 6 (POST `/api/boards`) also creates both Invite_Tokens in the same transaction (A14). Rows 14 to 17, 18 to 21, 23, 25, 26 return 403 to a guest (matrix in A4-V6). Row 18 rejects a `status` field with 400 and always creates `NOT_STARTED` (A13). Row 19 accepts `status`. Row 11 (add member by email) is unchanged and creates the role `member` (Requirement 37.22).

Error status mapping follows Requirement 4.6 exactly. Routes with a `<uuid:...>` converter return 404 for a malformed id because the URL rule does not match.

JSON shapes (fields only):

| Resource | Fields |
|---|---|
| user | `user_id`, `name`, `email`, `created_at` |
| board | `board_id`, `name`, `my_role`, `created_at`, `updated_at` |
| board detail | board + `columns: [{column_id, name, order, cards: [card]}]` |
| member | `user_id`, `name`, `email`, `role` |
| column | `column_id`, `board_id`, `name`, `order` |
| card | `card_id`, `board_id`, `column_id`, `title`, `description`, `due_date`, `labels`, `assignee: {user_id, name} or null`, `status` (V6), `completed_at` (V6, UTC string or null), `order`, `created_at`, `updated_at` |
| invite links (V6) | `{ member: {role: "member", token}, guest: {role: "guest", token} }`; regenerate returns `{role, token}`; invite info returns `{board_id, board_name, role, current_role}`; accept returns `{board_id, role}` |
| card search result | card + `board_name`, `column_name` |
| comment | `comment_id`, `card_id`, `content`, `author: {user_id, name}`, `created_at`, `updated_at` |
| notification | `notification_id`, `type`, `message`, `card_id`, `board_id`, `is_read`, `created_at` |
| analytics | `cards_per_column: [{column_id, name, count}]`, `completed_this_week`, `member_activity: [{user_id, name, assigned_cards, comments}]` |

### A12. Security summary (Requirement 28)

Passwords only as salted adaptive hashes; secrets only from environment; all queries parameterized through SQLAlchemy with LIKE escaping; server-side membership and role checks in `permissions.py` on every endpoint; CORS restricted to configured origins; log filter for secrets; frontend never uses `dangerouslySetInnerHTML`. The non-httpOnly cookies are a deliberate trade-off (D9): any XSS can read both the access token and the 7-day refresh token, which raises the impact compared with a single short token. Mitigations: short access token expiry (3600 s), refresh token expiry (604800 s), React output escaping, no `dangerouslySetInnerHTML` (documented in the README).

#### A12-V6. Security additions (Requirements 28.12 to 28.15, 37)

- **Token entropy and exposure.** Invite_Tokens come from `secrets.token_urlsafe(32)`: 32 random bytes, 43 characters from `A-Z a-z 0-9 _ -`. Tokens are returned only to a Board_Admin (GET invite-links, regenerate) and echoed nowhere else. **V11 change:** the same two endpoints also serve a Board_Manager (R28.12, R37.3 to R37.6); a `member`, a `guest`, and a non-participant still get 403. GET `/api/invites/<token>` returns the board id, name, and the role of the token to any authenticated user who already knows the token, and never returns the other role's token.
- **No token in logs.** `redact_invite_tokens(text)` replaces every match of `/api/invites/[A-Za-z0-9_-]{20,}` and `/invite/[A-Za-z0-9_-]{20,}` with the same prefix plus `<redacted>`. The logging filter applies it to the formatted message of every record (root and `werkzeug` loggers, which print the request line), so a 400, 401, 403, 404, or 500 caused by an invite request leaves no token behind. Services never put a token into an exception message. The platform's own request logs on Vercel are outside the application and cannot be filtered (Open issue 22).
- **Token lookup and timing.** The format check (`^[A-Za-z0-9_-]{43,128}$`) runs before any query, so malformed tokens cost no database access and give the same 404 as unknown tokens. Lookup is an indexed equality on 256-bit random values, so a timing attack is infeasible and no constant-time comparison is added. No rate limit is designed (Open issue 26).
- **Open redirect.** The server never redirects from user input. The frontend validates `next` with `safeNext` (B4), so only `/invite/<1 to 128 URL-safe characters>` is accepted (Requirements 19.11, 28.15).
- **Server-side role checks.** Every write endpoint checks the role through `permissions.py` (Requirement 28.14). Frontend hiding of controls is a convenience only.
- **Passwords.** `current_password` is verified with `check_password_hash` before any write and is never logged or returned.
- **No new environment variable** and no CORS change. Invite endpoints are ordinary JWT-protected `/api/*` routes.

### A13. Card status (Requirements 2.16, 11.2, 11.4, 11.17 to 11.24, 14.2, 25.7)

> **V11 change.** `CARD_STATUSES` gains `"URGENT"` (order: `NOT_STARTED`, `IN_PROGRESS`, `URGENT`, `DONE`). `apply_status_change` is unchanged in code: its last branch (`return new_status, old_completed_at`) already covers every move among the three non-completed values, so `URGENT` needs no new branch. See A16 and Property 61.

Constants and pure rule (`cards/service/status.py`, no database import):

```python
CARD_STATUSES = ("NOT_STARTED", "IN_PROGRESS", "DONE")      # exact, case-sensitive
def apply_status_change(old_status: str, old_completed_at, new_status: str | None, now) -> tuple[str, datetime | None]:
    if new_status is None or new_status == old_status:      # not supplied, or unchanged (incl. DONE -> DONE)
        return old_status, old_completed_at
    if new_status == "DONE":                                 # any other value -> DONE
        return "DONE", now
    if old_status == "DONE":                                 # DONE -> any other value
        return new_status, None
    return new_status, old_completed_at                      # NOT_STARTED <-> IN_PROGRESS (completed_at is None here)
```

- **Create.** `CardCreateSchema` does not declare `status` or `completed_at`, and uses `unknown = RAISE`, so a body with `status` returns 400 naming `status` and creates no Card (Requirement 11.17). The service always stores `status = "NOT_STARTED"` and `completed_at = None`.
- **PATCH `/api/cards/<id>`.** `CardUpdateSchema` adds `status = fields.String(validate=validate.OneOf(CARD_STATUSES), allow_none=False)`. `OneOf` is exact, so `done`, `""`, `null`, and unknown values give 400 (Requirement 11.4). `completed_at` is not declared, so a client can never set it. The service calls `apply_status_change(card.status, card.completed_at, supplied_status, utcnow())` once, inside the same transaction and the same single UPDATE as the other supplied fields (Requirement 11.18). The notification rule of A7 is unchanged.
- **Position.** `CardPositionSchema` and `position_service` never read or write `status` or `completed_at`, including a move into a Column named `Done` (Requirement 11.21). The Column named `Done` stays a plain Column.
- **Serialization.** `CardSchema`, `CardSearchSchema`, and the board detail Cards all include `status` and `completed_at` (UTC string ending in `Z`, or null), in every response that returns a Card (Requirement 11.20). Cards created before V6 read as `NOT_STARTED` and `null` through the column default (Requirement 11.24).
- **Invariant used by tests.** After any sequence of PATCH calls, `completed_at is not None` iff `status == "DONE"`, apart from rows changed by the optional manual backfill, which sets both (Property 44).

### A14. Board invitation links and guest accept (Requirements 37, 2.15, 2.17, 8.10, 9.13)

**Storage.** `boards.member_invite_token` and `boards.guest_invite_token`, both `varchar(128)`, nullable, each with a named unique constraint (`uq_boards_member_invite_token`, `uq_boards_guest_invite_token`). PostgreSQL unique constraints allow many NULLs, which gives "unique ignoring NULL" without a partial index. Tokens of soft-deleted Boards stay in the columns and stay unique, but the lookup filters `is_deleted = false`, so they answer 404.

**Generation (`invite_service.py`).**

```python
def new_invite_token() -> str:            # secrets.token_urlsafe(32), 43 chars
def generate_unique_token(session) -> str: # retries up to 3 times if either token column already holds the value (practically never)
```

- **Creation with the Board.** `boards/service.create_board` sets both tokens and inserts the admin membership in one transaction. A failure rolls back all of them (Requirement 8.10).
- **Lazy creation.** GET invite-links for a Board whose tokens are NULL runs `UPDATE boards SET member_invite_token = COALESCE(member_invite_token, :t1), guest_invite_token = COALESCE(guest_invite_token, :t2) WHERE board_id = :id` and re-reads the row, so two concurrent admin requests end with one stored pair and both receive it.
- **Regenerate.** After `require_board_admin`, `InviteRoleSchema` validates the path `role` (`member` or `guest`, else 400, the Board is still checked first for 404 and 403). The service stores a new token in that column only. The old token is invalid at once (the next lookup misses it), the other role's token and all memberships are unchanged, and the response is `{role, token}` with status 200.

**Lookup.** `find_board_by_token(token)` returns `(board, token_role)` or raises `NotFound` for a malformed, unknown, replaced, or soft-deleted-Board token: one query on `member_invite_token = :t OR guest_invite_token = :t` with `is_deleted = false`, and the role is whichever column matched.

**Accept decision (pure, `accept.py`).**

```python
def resolve_accept(existing_role: str | None, token_role: str) -> tuple[str, str]:
    """-> (resulting_role, action) with action in {"create", "upgrade", "none"}"""
    if existing_role is None:                               # no active membership (a soft-deleted row counts as none)
        return token_role, "create"
    if existing_role == "guest" and token_role == "member":
        return "member", "upgrade"
    return existing_role, "none"                            # admin keeps admin; member keeps member (no downgrade); guest + guest stays
```

**Accept transaction (`POST /api/invites/<token>/accept`).** JWT check first (401), then `find_board_by_token` (404), then:

1. Read the caller's active membership for the Board with `SELECT ... FOR UPDATE`.
2. `role, action = resolve_accept(existing.role if existing else None, token_role)`.
3. `create`: insert a new Board_Membership with the token role. A soft-deleted row of the same pair is left untouched and a new row is inserted, which the partial unique index allows (Requirement 37.13). `upgrade`: `UPDATE board_memberships SET role = 'member' WHERE board_membership_id = :id AND role = 'guest'` (conditional, so it cannot lower a role). `none`: no write.
4. Commit and return `{board_id, role}` with status 200 in every case. No Notification is created and the token is not consumed (Requirement 37.21).

**Race.** Two simultaneous accepts of the same pair both try to insert. The partial unique index `uq_board_memberships_board_user_active` makes one fail with an `IntegrityError` (pgcode 23505). The accept service catches it locally, rolls back, re-reads the membership, runs `resolve_accept` again, and returns 200 with the existing role, so the global 409 mapping is never reached by accept and repeated accepts are idempotent.

**Error mapping for the invite endpoints.**

| Case | Status |
|---|---|
| Missing, malformed, expired, or wrong-type JWT | 401 (checked first, Requirement 37.23) |
| Token malformed, unknown, replaced, or Board soft deleted | 404, no Board data, no membership created |
| Regenerate or invite-links by `member`, `guest`, or non-participant | 403 |
| Regenerate with `role` other than `member` or `guest` | 400, tokens unchanged |
| Board missing, soft deleted, or `<id>` not a UUID | 404 |
| Accept, any role combination (including no change) | 200 |

**Module boundaries.** Everything above sits in `boards/service/` and `boards/routes/`. `invite_routes.py` registers `/boards/<uuid:id>/invite-links`, `/boards/<uuid:id>/invite-links/<role>/regenerate`, `/invites/<token>` and `/invites/<token>/accept` on the boards blueprint (the application mounts it under `/api`). `permissions.py` provides the membership helpers and `users` is not touched.

## Part B: Frontend

### B1. File tree (`web/`, App Router, no `src/`)

```
web/
|-- proxy.ts                       route guard (see B4). V6 change: the repo uses the Next.js file name `proxy.ts`; every "middleware.ts" in this document means this file, logic unchanged
|-- next.config.ts                 V6: headers() sets Referrer-Policy no-referrer and Cache-Control no-store for /invite/:path*
|-- app/
|   |-- layout.tsx                 Server: reads both cookies, renders AuthProvider, Toaster, Header, Footer (one each per page)
|   |-- globals.css                Tailwind entry (@source lines for components/ and hooks/)
|   |-- (boards)/page.tsx          "/"  Dashboard (Server Component)
|   |-- (boards)/boards/[id]/page.tsx   Board Detail (Server Component)
|   |-- (cards)/my-tasks/page.tsx  My Tasks (Server Component fetching, client list)
|   |-- (users)/profile/page.tsx   Profile (Client form inside a thin server page)
|   |-- (auth)/login/page.tsx
|   |-- (auth)/register/page.tsx
|   |-- welcome/page.tsx           V6: public Server Component, no API call
|   `-- invite/[token]/page.tsx    V6: Server fetch of GET /api/invites/<token>, renders InviteJoinCard
|-- components/
|   |-- Header.tsx  Footer.tsx  NotificationBell.tsx
|   |-- shared/   BaseButton.tsx  BaseBadge.tsx  BaseModal.tsx  ConfirmDialog.tsx  ErrorPanel.tsx  StatusBadge.tsx (V6)
|   |-- auth/     LoginForm.tsx  RegisterForm.tsx  AuthProvider.tsx
|   |-- boards/   BoardList.tsx  CreateBoardModal.tsx  BoardView.tsx  KanbanColumn.tsx  ColumnHeader.tsx
|   |             AddColumnForm.tsx  CardSearchInput.tsx  MemberPanel.tsx  AnalyticsView.tsx  BoardAccessMessage.tsx
|   |             V6: MemberList.tsx  AddMemberForm.tsx  InviteLinksPanel.tsx  InviteLinkRow.tsx  InviteJoinCard.tsx
|   |             BoardRoleContext.tsx (provides my_role and canEdit to the board tree)
|   |-- cards/    CardItem.tsx  AddCardForm.tsx  CardDetailModal.tsx  MyTasksList.tsx  (V6: CardDetailForm.tsx  StatusSelect.tsx)
|   |-- comments/ CommentList.tsx  CommentItem.tsx  CommentForm.tsx
|   |-- notifications/ NotificationList.tsx
|   |-- welcome/  WelcomeContent.tsx (Server)  WelcomeActions.tsx (Client)            V6
|   `-- users/    ProfileForm.tsx  UserMenu.tsx  (V6: ChangePasswordForm.tsx  ReadOnlyEmail.tsx)
|-- hooks/   useDragAndDrop.ts  useNotifications.ts  useErrorHandler.ts  useDebouncedValue.ts  useAuth.ts
|-- lib/     apiClient.ts  refreshSession.ts  errors.ts  toast.ts  authCookie.ts  authContext.ts  serverAuth.ts
|            order.ts  validation.ts  types.ts  format.ts
|            V6: status.ts  roles.ts  nextParam.ts  decideRoute.ts  inviteRoles.ts  (all pure; authCookie.ts gains welcome cookie helpers)
|-- __tests__/ (Jest or Vitest + React Testing Library)
|-- e2e/       (Playwright specs, playwright.config.ts at web/; V6: e2e/support/credentials.ts, e2e/support/welcome.ts)
|-- scripts/   V6: scanCredentials.ts (pure scanner used by a unit test over web/e2e/)
|-- .env.example   NEXT_PUBLIC_API_BASE_URL, API_BASE_URL
|-- .env.test.example   V6: E2E_BASE_URL, E2E_USER_EMAIL, E2E_USER_PASSWORD (placeholders; the real web/.env.test is git-ignored)
`-- package.json   tailwind, react-hot-toast, test scripts
```

Directories under `components/` follow API resources (auth, boards, cards, comments, notifications, users) per Requirement 15.4. Column and analytics UI sit in `components/boards/` because there is no separate resource directory for them in the requirement (see Open issues). Each file defines exactly one component or module.

> **V9 change, file tree.** The tree line `components/Header.tsx  Footer.tsx  NotificationBell.tsx` stays valid. V9 rewrites `Footer.tsx` (the V5 file was one centered line of muted text "Kano Task Management") and adds `components/shared/KanoMark.tsx`, `components/shared/icons/GithubIcon.tsx`, `components/shared/icons/LinkedinIcon.tsx`, and `lib/footerContent.ts`. See B15.

### B2. Pages: Server versus Client split

| Route | Component type | Data | Notes |
|---|---|---|---|
| `/register` | Server page, `RegisterForm` Client | POST `/api/auth/register` | Controlled inputs, client validation (`lib/validation.ts`), 409 shows email error, success redirects to `/login` with toast |
| `/login` | Server page, `LoginForm` Client | POST `/api/auth/login` | On 200 calls `AuthContext.login({ access_token, refresh_token, expires_in, refresh_expires_in, user })`, router push `/`; 401 shows one generic message and clears password |
| `/` | Server | GET `/api/boards` with the access cookie token | Renders `BoardList` (role `BaseBadge`), `CreateBoardModal` (Client) opened from `BaseButton`; empty state; load error shows `ErrorPanel` with retry (`router.refresh()`) |
| `/boards/[id]` | Server fetch, `BoardView` Client | GET `/api/boards/<id>` | 403 or 404 renders `BoardAccessMessage` with link to `/`; otherwise `BoardView` owns columns state, drag and drop, search |
| `/my-tasks` | Server fetch, `MyTasksList` Client | GET `/api/cards?assignee=me` | Groups by `board_name`; empty and error states; Server error also fires toast through a small client effect |
| `/profile` | `ProfileForm` Client | PATCH `/api/users/me` | **V6 change:** name pre-filled from `AuthContext`, email shown as read-only text, optional change-password section (B11). V5 had an email input and no password field |
| `/welcome` | Server page, `WelcomeContent` Server, `WelcomeActions` Client | none | V6, public. 1 to 5 sentences plus the eight listed capabilities, "Log in" and "Create account" `BaseButton`s that set the Welcome_Cookie and navigate |
| `/invite/[token]` | Server page, `InviteJoinCard` Client | GET `/api/invites/<token>`, then POST `/api/invites/<token>/accept` | V6, protected by `proxy.ts`. Never renders for an anonymous visitor. 404 shows a not-found message with a link to `/`; 401 calls `redirect("/login?expired=1")` |

**V8 change, `/welcome` row.** The V6 row text "1 to 5 sentences plus the eight listed capabilities, Log in and Create account buttons" is superseded by B13: hero, decorative preview, four feature cards, bottom call to action, with the copy of Requirement 38 criteria 16 and 17. The page is still public and still a Server Component without an API call.

**V6 change, other pages.** `/` shows the role badge `admin`, `member`, or `guest` per Board (`ROLE_VARIANT` in `lib/roles.ts`). `/boards/[id]` provides `my_role` through `BoardRoleContext` and gates every edit control (B6). `/my-tasks` shows a `StatusBadge` per task (B7). `/login` and `/register` read `next` through `safeNext` (B4).

Unauthenticated access to protected pages is blocked in `middleware.ts` before rendering. A 401 inside a Server Component (the middleware has already refreshed an expired access token, so this means the API rejected the token) calls `redirect("/login?expired=1")`.

### B3. Shared components (`components/shared/`)

| Component | Props | Behavior |
|---|---|---|
| `BaseButton` | `variant?: "primary" or "secondary" or "destructive"` (default `primary`), `disabled`, `type`, `onClick`, native button props | Distinct Tailwind class set per variant; when disabled sets `disabled` and `aria-disabled`, and `onClick` is not invoked; min size 44 x 44 px |
| `BaseBadge` | `variant: "gray" or "blue" or "green" or "red" or "yellow"`, `children` | One class map per variant, so every page renders the same colors |
| `BaseModal` | `open`, `onClose`, `title`, `children` | Portal; renders nothing when closed; Escape and backdrop click call `onClose`; content clicks stop propagation; focuses first focusable (else container) on open; traps Tab; restores previous focus on close; `role="dialog"`, `aria-modal`; mobile: `max-h-[100dvh] overflow-y-auto`, width inside viewport |
| `ConfirmDialog` | `open`, `message`, `onConfirm`, `onCancel`, `busy` | `BaseModal` wrapper used for delete confirmations |
| `ErrorPanel` | `message`, `onRetry?` | Error text with a `BaseButton` retry |
| `StatusBadge` (V6) | `status: CardStatus` | Renders `BaseBadge` with `STATUS_LABEL[status]` and `STATUS_VARIANT[status]` from `lib/status.ts`; the only place a status becomes text, so board, modal, and My Tasks always agree |

**V8 change, Header.** The brand link (logo mark and wordmark) no longer has the fixed target `/`. Its `href` is `logoTarget(isVisitorAuthenticated(auth))` (B12). The Header links "Log in" and "Register" for anonymous visitors stay plain `Link`s with the V5 classes (see Open issue 34). **V8 refinement:** this is now the rule (Requirement 38.2): the two Header actions are anchor elements, never `BaseButton`. The logo link and every authentication-dependent part of the Header (the Log in and Register links, "My Tasks", `NotificationBell`, `UserMenu`) read one shared check, `isVisitorAuthenticated(status)` (B12), so they cannot disagree.

**V9 change, Footer and Header mark.** The shared `Footer` is no longer the V5 plain text line. Its V9 design is B15. The Header brand link keeps its V8 behavior and markup, except that the inline "K" `span` is replaced by `<KanoMark />` (B15), so the Header and Footer badges cannot drift apart. The Header link text and accessible name stay exactly "Kano".

Every button in pages and feature components uses `BaseButton` (Requirement 18.6). `Header` contains the app link, `NotificationBell`, `UserMenu` (profile link, logout) and links to `/my-tasks`; it shows only login and register links for anonymous visitors.

### B4. Auth, cookie, and route guard

- Two cookies, both path `/`, `SameSite=Lax`, not httpOnly, `Secure` on HTTPS:

  | Cookie | Holds | Lifetime (`Max-Age`) | Source of the lifetime |
  |---|---|---|---|
  | `kano_access` | access token | 3600 s | `expires_in` from the login or refresh response |
  | `kano_refresh` | refresh token | 604800 s by default | `refresh_expires_in` from the login response (no constant) |

  `lib/authCookie.ts` exposes `setAccessCookie(token, expiresIn)`, `setRefreshCookie(token, refreshExpiresIn)`, `getAccessToken()`, `getRefreshToken()`, `clearAuthCookies()` (clears both), the constants `ACCESS_COOKIE` and `REFRESH_COOKIE`, and the pure functions `decodeJwtExp(token): number | null` and `guardDecision(...)`. Both lifetimes come from the API responses (`expires_in`, `refresh_expires_in`), so there is no lifetime constant and changing `JWT_REFRESH_TOKEN_EXPIRES` needs no frontend change. `AuthProvider.login(r)` calls `setAccessCookie(r.access_token, r.expires_in)` and `setRefreshCookie(r.refresh_token, r.refresh_expires_in)`. The cookie max-age is a browser convenience only. The API remains the authority on token validity.
- `AuthProvider` receives `initialAccessToken` and `initialRefreshToken` from the root layout (Server reads both cookies). On mount, if either cookie exists it calls GET `/api/users/me` through `apiRequest`. When only the refresh token exists, `apiRequest` refreshes first (see B5). Success sets the user and both tokens. A 401 that survives the refresh flow clears both cookies and all auth state and redirects to `/login`. A network error or 5xx keeps both cookies, leaves the user unset, and calls `useErrorHandler`. It exposes `login({ access_token, refresh_token, expires_in, refresh_expires_in, user })`, `logout()` (clears both cookies and state, then `router.push("/login")`, no API call), `updateUser(user)` (replaces only the user object), `setAccessToken(token)` (used after a refresh), and `status`. It registers its session callbacks with `lib/refreshSession.ts` (see B5).
- `middleware.ts` (matcher excludes `_next`, static files, `favicon.ico`) reads both cookies and computes `guardDecision({ pathname, accessExp, refreshExp, now })` (pure, in `lib/authCookie.ts`). A token is "valid" when its cookie is present and `exp > now` (the signature is verified by the API, not the middleware). The result is one of:

  | Situation | Decision |
  |---|---|
  | Protected path, access token valid | `allow` |
  | Protected path, access token missing or expired, refresh token valid | `refresh` |
  | Protected path, no valid access token and no valid refresh token | `redirect-login` |
  | `/login` or `/register`, access token valid or refresh token valid | `redirect-home` |
  | `/login` or `/register`, otherwise | `allow` |

  On `refresh` the middleware sends `POST ${API_BASE_URL}/api/auth/refresh` with `Authorization: Bearer <refresh>`. On 200 it forwards the new access token to the same request by calling `request.cookies.set("kano_access", token)` and `NextResponse.next({ request: { headers: request.headers } })`, so Server Components in this request read the new value, and it also sets `kano_access` on the response (`Max-Age` = `expires_in`) so the browser stores it. Server Components cannot set cookies, which is why this step lives in the middleware. On 401 it redirects to `/login` and deletes both cookies. On a network error or 5xx it treats the refresh as failed and redirects to `/login?expired=1` (see Open issues). A request to `/login?expired=1` is always allowed and deletes both cookies, which prevents a redirect loop when the API rejected a token that still looks valid.
- Server Components get the access token through `lib/serverAuth.ts`: `getServerToken()` using `cookies()` from `next/headers` and pass it to `apiRequest(..., { token })` (Requirement 17.10). Server-side `apiRequest` never refreshes, never writes or deletes a cookie, and throws `ApiError(401, ...)` on a 401 (Requirement 16.18); the page then calls `redirect("/login?expired=1")`. Only the middleware renews the access token for server rendering.

```mermaid
sequenceDiagram
    participant U as User
    participant LF as LoginForm (client)
    participant API as Flask API
    participant AC as AuthContext + cookies
    participant MW as middleware.ts
    participant SC as Server Component
    U->>LF: submit valid email and password
    LF->>API: POST /api/auth/login
    API-->>LF: 200 { data: { access_token, refresh_token, token_type, expires_in: 3600, refresh_expires_in: 604800, user } }
    LF->>AC: login(...): memory + kano_access (Max-Age expires_in) + kano_refresh (Max-Age refresh_expires_in)
    LF->>U: router.push("/")
    U->>MW: GET /
    MW->>MW: access cookie present and exp in future
    MW->>SC: allow
    SC->>SC: getServerToken() from kano_access
    SC->>API: GET /api/boards (Bearer access token)
    API-->>SC: 200 boards
    SC-->>U: rendered Dashboard
    Note over SC,API: on 401 redirect("/login?expired=1"), middleware deletes both cookies
```

Server-side refresh in the middleware (access cookie expired or missing, refresh cookie valid):

```mermaid
sequenceDiagram
    participant U as Browser
    participant MW as middleware.ts
    participant API as Flask API
    participant SC as Server Component
    U->>MW: GET /boards/123 (cookies: kano_refresh only)
    MW->>MW: guardDecision gives refresh
    MW->>API: POST /api/auth/refresh (Bearer refresh token)
    alt 200
        API-->>MW: { data: { access_token, token_type, expires_in: 3600 } }
        MW->>MW: forward new kano_access on the request, set it on the response
        MW->>SC: continue
        SC->>API: GET /api/boards/123 (Bearer new access token)
        API-->>SC: 200
        SC-->>U: page + Set-Cookie kano_access (Max-Age expires_in of the refresh response)
    else 401
        API-->>MW: 401
        MW-->>U: redirect /login + delete kano_access and kano_refresh
    end
```

#### B4-V6. Route guard with welcome page, invite links, and safe `next` (Requirements 17.7 to 17.13, 19.3, 19.8, 19.11, 19.12, 37.18 to 37.20, 38)

**V6 change.** `guardDecision` (V5, five rows in the table above) is superseded by `decideRoute` in `lib/decideRoute.ts`. The V5 table stays valid for the paths it covers: the new function adds the `/` first visit, `/welcome`, and `/invite/<token>`. The file that calls it is `web/proxy.ts`.

```ts
// lib/decideRoute.ts  (pure, no I/O, no Date.now)
export type AuthState = "authenticated" | "refreshable" | "unauthenticated";
export type PathClass = "root" | "welcome" | "login" | "register" | "invite" | "protected";
export type RouteDecision =
  | { kind: "continue"; setWelcomeCookie?: boolean }
  | { kind: "refresh-then-continue" }
  | { kind: "redirect"; to: string; setWelcomeCookie?: boolean };
export const INVITE_PATH_RE = /^\/invite\/[A-Za-z0-9_-]{1,128}$/;
export function classifyPath(pathname: string): PathClass;   // "/" root, "/welcome", "/login", "/register", INVITE_PATH_RE -> invite, everything else protected
export function decideRoute(i: { pathname: string; auth: AuthState; welcomeSeen: boolean }): RouteDecision;
```

`auth` is computed as in V5: `authenticated` = access cookie present and `exp` in the future, `refreshable` = access missing or expired and refresh cookie valid, `unauthenticated` = neither. `/login?expired=1` forces `unauthenticated` and deletes both auth cookies (V5 loop guard, unchanged). The table is the complete decision (Requirements 17.7 to 17.13, 38.5 to 38.12):

| Path class | authenticated | refreshable | unauthenticated |
|---|---|---|---|
| `root` (`/`) | continue (no welcome redirect, 38.12) | refresh-then-continue | redirect `/login` if `welcomeSeen`, else redirect `/welcome` (38.5, 38.6) |
| `welcome` | redirect `/` (17.9, 38.8) | redirect `/` (the root then refreshes) | continue, no cookie write (38.9) |
| `login`, `register` | redirect `/` | redirect `/` | continue, with `setWelcomeCookie: true` when `!welcomeSeen` (38.9, 38.10) |
| `invite` (`/invite/<token>`) | continue | refresh-then-continue (17.13) | redirect `/login?next=<encodeURIComponent(pathname)>`, never `/welcome` (17.8, 37.20, 38.11) |
| `protected` (all else, including a malformed `/invite/...`) | continue | refresh-then-continue | redirect `/login` (38.7) |

`proxy.ts` performs the decision: on `refresh-then-continue` it runs the V5 refresh (POST `/api/auth/refresh`, set `kano_access` on the request and the response). If the refresh returns 401, it deletes both auth cookies and then evaluates `decideRoute` again with `auth: "unauthenticated"` and returns that redirect, so an invite path keeps its `next` and `/` goes to `/welcome` or `/login` by the cookie (Requirement 17.8). A network error or 5xx still redirects to `/login?expired=1` (V5, Open issue 15, which drops `next`). When `setWelcomeCookie` is true, `proxy.ts` sets `kano_welcome_seen=1; Max-Age=31536000; Path=/; SameSite=Lax; Secure on HTTPS`, not httpOnly. Logout calls `clearAuthCookies()`, which never touches `kano_welcome_seen`, so the next `/` goes to `/login` (Requirement 38.13).

```mermaid
sequenceDiagram
    participant V as Anonymous visitor
    participant P as proxy.ts (decideRoute)
    participant L as LoginForm
    participant A as Flask API
    participant I as /invite/[token] page
    V->>P: GET /invite/T
    P->>P: decideRoute: invite + unauthenticated
    P-->>V: redirect /login?next=%2Finvite%2FT
    V->>L: submit credentials (safeNext(next) = "/invite/T")
    L->>A: POST /api/auth/login
    A-->>L: 200 tokens
    L->>V: router.push("/invite/T") (cookies set)
    V->>P: GET /invite/T
    P->>P: decideRoute: invite + authenticated, continue
    P->>I: render
    I->>A: GET /api/invites/T (server token)
    A-->>I: 200 {board_id, board_name, role, current_role}
    I-->>V: InviteJoinCard (Join button)
    V->>A: POST /api/invites/T/accept (from the client)
    A-->>V: 200 {board_id, role}, then redirect /boards/<board_id>
```

First visit and welcome cookie:

```mermaid
sequenceDiagram
    participant V as New visitor (no cookies)
    participant P as proxy.ts
    participant W as /welcome
    V->>P: GET /
    P-->>V: redirect /welcome (unauthenticated, welcomeSeen false)
    V->>W: render (public, no API call)
    V->>P: click "Log in" (WelcomeActions sets kano_welcome_seen, navigates)
    P-->>V: GET /login continue (cookie also set by the proxy if it was absent)
    V->>P: later GET / (unauthenticated, welcomeSeen true)
    P-->>V: redirect /login
```

**V8 change (Requirement 17.14).** The table above is unchanged in V8. The Header logo (B12) is a plain link and does not call `decideRoute`: an anonymous click goes to `/welcome`, which the table serves without a redirect (`welcome` row, unauthenticated); an authenticated click goes to `/`, which the table continues (`root` row, authenticated). The first-visit redirect of `/` is not involved, so the logo never reaches `/login`.

**Safe `next` (`lib/nextParam.ts`, pure).**

```ts
const NEXT_RE = /^\/invite\/[A-Za-z0-9_-]{1,128}$/;
export function safeNext(raw: unknown): string | null   // typeof raw === "string" && NEXT_RE.test(raw) ? raw : null
export function withNext(href: "/login" | "/register", next: string | null): string  // next ? `${href}?next=${encodeURIComponent(next)}` : href
```

`raw` is the already-decoded value from `searchParams`. It is tested once, as is: a value that still contains `%`, `\`, `/` after the first segment, a scheme, a host, a query, or a fragment fails the regex, so absolute URLs (`https://evil.test`), protocol-relative URLs (`//evil.test`), and other app paths (`/boards/1`) all return `null` and the form redirects to `/`. `LoginForm` redirects with `router.push(safeNext(next) ?? "/")`, `RegisterForm` redirects to `withNext("/login", safeNext(next))` after the 201, and the two forms link to each other with `withNext` (Requirements 19.3, 19.8, 19.12). `proxy.ts` builds `next` only from a pathname that already matched `INVITE_PATH_RE`.

### B5. API client and errors (Requirement 16)

```ts
// lib/errors.ts
export class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } }

// lib/apiClient.ts
export async function apiRequest<T>(path: string, opts?: { method?: string; body?: unknown;
  token?: string | null; signal?: AbortSignal; query?: Record<string, string> }): Promise<T>
```

Behavior:

1. Base URL: `typeof window === "undefined" ? process.env.API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL`. `NEXT_PUBLIC_API_BASE_URL` is referenced literally so Next.js can inline it. Missing or empty gives `ApiError(0, "API base URL is not configured (<VAR>)")` without any request (Requirements 15.7, 16.4).
2. Token: `opts.token` when given, otherwise `getAccessToken()` on the client. Adds `Authorization: Bearer <access token>` only when a token exists; always `Content-Type: application/json` for bodies. On the client, when no access token exists but a refresh token does, the request first awaits `refreshAccessToken()` (below).
3. 10-second timeout through `AbortController`; network error or timeout gives `ApiError(0, "Could not reach the server")`.
4. 2xx: parse JSON and return `body.data as T`.
5. Non-2xx with a body that has a string `error`: `ApiError(response.status, body.error)`. Otherwise `ApiError(response.status, "Unexpected server response")`.
6. Refresh and retry (browser runtime only, Requirements 16.14 to 16.17). When a request that carried an access token gets 401, the path is not `/api/auth/login`, `/api/auth/register`, or `/api/auth/refresh`, a refresh token exists, and the request has not been retried, `apiRequest` awaits `refreshAccessToken()` and repeats the original request once with the new access token. A 401 on the retry, or a failed refresh, calls `sessionExpired()` and throws `ApiError(401, ...)`. Server-side calls (`typeof window === "undefined"`, normally with `opts.token` from `getServerToken()`) never refresh and never write cookies: the 401 handling branch is guarded by `typeof window !== "undefined"`, and on the server a 401 throws `ApiError(401, ...)` directly (Requirement 16.18). Token renewal for server rendering belongs to the middleware (B4).

`lib/refreshSession.ts` (client only) keeps the single-flight state:

```ts
let inFlight: Promise<string> | null = null;           // shared by all concurrent 401s
export function registerSessionHooks(h: { onRefreshed(access: string): void; onExpired(): void }): void
export function refreshAccessToken(): Promise<string> {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => { inFlight = null; });
  }
  return inFlight;
}
async function doRefresh(): Promise<string> {
  // POST /api/auth/refresh with Authorization: Bearer <getRefreshToken()>, built with fetch (not apiRequest, so no recursion)
  // 200 -> setAccessCookie(access_token, expires_in); hooks.onRefreshed(access_token); return access_token
  // 401 or no refresh token -> sessionExpired(); throw ApiError(401, "Session expired")
  // network error or 5xx -> throw ApiError(0 or status, ...) without clearing cookies
}
export function sessionExpired(): void   // clearAuthCookies(); hooks.onExpired() (AuthContext clears state, router.push("/login"))
```

A refresh that fails with a network error or 5xx keeps the cookies and surfaces that error through `useErrorHandler`. Only a 401 from the refresh endpoint ends the session.

```mermaid
sequenceDiagram
    participant C1 as Request A
    participant C2 as Request B
    participant AC as apiClient
    participant RS as refreshSession
    participant API as Flask API
    Note over C1,API: browser runtime only (Client Components). A Server Component never refreshes: a 401 throws ApiError(401) and the page redirects to /login
    C1->>AC: apiRequest(/api/boards)
    C2->>AC: apiRequest(/api/cards?assignee=me)
    AC->>API: GET (Bearer expired access token) x2
    API-->>AC: 401 x2
    AC->>RS: refreshAccessToken() from A and from B
    RS->>API: POST /api/auth/refresh (Bearer refresh token), one call only
    alt 200
        API-->>RS: access_token, expires_in 3600
        RS->>RS: set kano_access cookie, onRefreshed(access)
        RS-->>AC: new access token (same promise for A and B)
        AC->>API: retry A and B once with new token
        API-->>AC: 200 x2
    else 401
        API-->>RS: 401
        RS->>RS: clearAuthCookies(), onExpired()
        RS-->>AC: reject
        AC-->>C1: ApiError(401), redirect to /login
        AC-->>C2: ApiError(401)
    end
```

`lib/toast.ts`: `showSuccess(msg)`, `showError(msg)`, `showLoading(msg)`, each requiring a 1 to 200 character message, calling `toast.success`, `toast.error`, `toast.loading`.

`hooks/useErrorHandler.ts` returns `handleError(err: unknown)`: for `ApiError` with status 400, 401, 403, 404, 409, 500 it shows one error toast with a status-specific message from a constant map; any other status or non-ApiError shows a generic message. For 401 it also calls `clearAuthCookies()` (both cookies), `AuthContext.logout()`-style state clearing of the user, access token, and refresh token, and `router.push("/login")`. A 401 reaching the handler has already survived the refresh flow in `apiRequest`.

### B6. Board Detail, drag and drop, search, members, analytics

`BoardView` (Client) holds `columns` state (columns sorted by `order`, cards sorted by `order`), `searchResults`, and modal state. It composes `CardSearchInput`, `KanbanColumn` (renders `ColumnHeader`, `CardItem`, `AddCardForm`), `AddColumnForm`, `CardDetailModal`, and, only when `my_role === "admin"`, `MemberPanel` and an analytics link to `AnalyticsView` (Requirements 21.12, 21.13).

Mutations call `apiRequest` and update state only after success (Requirements 21.2 to 21.8). Failures go to `handleError` and leave state unchanged.

Search: `CardSearchInput` keeps raw text; `useDebouncedValue(text, 300)` yields the debounced value. An effect sends `GET /api/cards?q=<v>&board_id=<id>` when the debounced value is non-empty, cancels the previous request with `AbortController`, and ignores stale responses. Clearing the input restores the full board without a request. An empty result shows a no-results message.

`lib/order.ts` (pure):

```ts
export function computeDropOrder(targetCards: {card_id: string; order: number}[], dropIndex: number): number
// targetCards excludes the dragged card and is sorted ascending.
// empty -> 1.0 ; dropIndex <= 0 -> first.order / 2 ; dropIndex >= length -> last.order + 1 ;
// else (cards[dropIndex-1].order + cards[dropIndex].order) / 2
export function isValidOrder(x: number): boolean   // Number.isFinite(x) && x > 0
export function moveCardInState(cols, cardId, toColumnId, order): Cols    // pure optimistic update
export function restoreCardInState(cols, snapshot): Cols                   // pure revert
export function computeDropIndex(cardMidYs: number[], pointY: number): number
// cardMidYs = vertical midpoints of the target column's cards (excluding the dragged card), top to bottom.
// result = number of midpoints that are < pointY, so 0 = start, cardMidYs.length = end.
export const LONG_PRESS_MS = 300; export const MOVE_TOLERANCE_PX = 10;
export type TouchGesture = { phase: "idle" | "pressing" | "dragging" | "cancelled"; startX: number; startY: number; startedAt: number };
export function touchGestureStep(g: TouchGesture, ev: TouchEv): TouchGesture
// TouchEv = start(x,y,t) | move(x,y,t) | timer(t) | scroll | end | cancel. Pure state machine:
// idle --start--> pressing; pressing --timer(t) with t - startedAt >= 300--> dragging;
// pressing --move farther than 10 px, scroll, end, cancel--> cancelled (no drag, no request);
// dragging --move--> dragging; dragging --end--> idle (drop evaluated by the hook); dragging --cancel--> cancelled.
```

`hooks/useDragAndDrop.ts` API: `{ onDragStart, onDragOver, onDrop, onTouchStart, pendingIds, touchDrag }`. It serves two input paths that share one drop routine `commitDrop(cardId, columnId, index)`.

- **Mouse (Requirement 22.1).** The native HTML5 API is used (`draggable`, `dataTransfer`). On drop: compute the order; if the drop is outside any column, or leaves the card at its current column and index, do nothing and send nothing; if `!isValidOrder(order)` do nothing and call `handleError`; if the card id is in `pendingIds`, ignore. Otherwise snapshot `{column_id, order}`, apply `moveCardInState` immediately (well under 100 ms), add to `pendingIds`, and send `PATCH /api/cards/<id>/position`. On error restore with `restoreCardInState` and call `handleError` once.
- **Touch (Requirements 22.12 to 22.17).** `CardItem` forwards `onTouchStart` from the hook. The hook runs `touchGestureStep`:
  1. On `touchstart` it records the point and starts a 300 ms timer (`LONG_PRESS_MS`). It also marks the input as touch, so a native `dragstart` that a mobile browser may fire on long-press for a `draggable` element is cancelled (`preventDefault`) and the touch path stays the only one active.
  2. If `touchmove` goes more than 10 px away, the page fires `scroll`, or `touchend` / `touchcancel` arrives before the timer fires, the timer is cleared and nothing else happens: no drag, no request, scrolling continues as normal (Requirement 22.14).
  3. When the timer fires the card enters the dragging phase (`touchDrag` shows a lifted style, optional `navigator.vibrate(10)`), and the hook registers `touchmove` and `touchend` listeners on `document` with `{ passive: false }`. From then on `touchmove` calls `preventDefault()`, which stops scrolling for the rest of that touch (Requirement 22.13). Because the finger has not moved before the timer fired, no scroll gesture has started yet, so `preventDefault` is honored.
  4. On each `touchmove` (throttled with `requestAnimationFrame`) the hook calls `document.elementFromPoint(x, y)`, finds the closest ancestor with `data-column-id`, highlights it, and computes `index = computeDropIndex(midYs, y)` from the `getBoundingClientRect()` of that column's cards.
  5. On `touchend`, if the last target is a column, it calls `commitDrop(cardId, columnId, index)` and the rules of the mouse path apply unchanged: same order computation (`computeDropOrder`), same optimistic update, same revert and one toast on failure, same ignore rules for pending cards (Requirement 22.15). If the touch ends outside any column, on the card's own position, or as `touchcancel`, nothing changes and no request is sent (Requirement 22.16).
  6. Listeners and the timer are removed on every exit path and on unmount.

CSS and scrolling (Requirement 22.17): the page and the Kanban container keep the browser default `touch-action: auto`, and `CardItem` must not set `touch-action: none` (it would block panning when the user only wants to scroll). Cards use `select-none [-webkit-touch-callout:none]` so the long-press does not open the text selection or callout menu, and `onContextMenu` calls `preventDefault` during a touch drag. The only scroll blocking is the `preventDefault` on `touchmove` after the long-press, so scrolling works whenever no drag is active. Edge auto-scroll of the board container while dragging near the screen edge is not designed (see Open issues).

```mermaid
sequenceDiagram
    participant U as User
    participant KC as KanbanColumn
    participant H as useDragAndDrop
    participant S as React state (columns)
    participant API as Flask API
    participant EH as useErrorHandler
    alt mouse input
        U->>KC: dragStart(card), drop(column, index)
        KC->>H: onDrop(cardId, columnId, index)
    else touch input
        U->>KC: touchstart on card, hold 300 ms without moving 10 px
        KC->>H: onTouchStart, timer fires, drag active, touchmove preventDefault
        U->>KC: touchmove, touchend at a point
        H->>H: elementFromPoint(x, y) gives column, computeDropIndex gives index
        Note over H: touch moved over 10 px, scrolled, ended, or cancelled before 300 ms, or ended outside a column: no drag, no request
    end
    H->>H: order = computeDropOrder(targetCards, index)
    alt outside column, same position, pending, or invalid order
        H-->>U: no state change, no request (invalid order: toast)
    else valid
        H->>H: snapshot = {column_id, order} of the card
        H->>S: moveCardInState (optimistic)
        H->>API: PATCH /api/cards/id/position {column_id, order}
        alt 200
            API-->>H: updated card
            H->>S: replace card with server values
        else error or network failure
            API-->>H: error
            H->>S: restoreCardInState(snapshot)
            H->>EH: handleError(err) (one toast)
        end
        H->>H: remove card from pendingIds
    end
```

Analytics view: `AnalyticsView` fetches `GET /api/boards/<id>/analytics` when opened and shows cards per column, completed this week, and per-member assigned cards and comments. Errors show an inline message and a toast.

#### B6-V6. Role gating, guests, and the new-card flow (Requirements 21.12, 21.13, 21.17 to 21.23, 22.18, 22.19, 27.8, 37.15 to 37.17)

> **V11 change.** The `canEdit`, `isAdmin`, `isGuest` helpers and the gating table below are superseded by `can(role, action)` and the V11 gating table in B16. Column controls now need `manage_columns` (admin or manager), so the role `member` loses them (R10.11). The V6 text stays as history.

**Role derivation (`lib/roles.ts`, pure).** `canEdit(role) = role === "admin" || role === "member"`, `isAdmin(role) = role === "admin"`, `isGuest(role) = role === "guest"`, and `ROLE_VARIANT` maps a role to a `BaseBadge` variant. `BoardView` reads `my_role` from the board response and provides `{ role, canEdit, isAdmin }` through `BoardRoleContext`, so `KanbanColumn`, `ColumnHeader`, `CardItem`, `AddColumnForm`, `AddCardForm`, `CardSearchInput`, and `CardDetailModal` read the role from one source instead of receiving a prop per control. The server stays the authority (Requirement 28.14); the gating only removes controls that would get 403.

| Element | admin | member | guest |
|---|---|---|---|
| Header of the board | role badge | role badge | "Guest" `BaseBadge` (read-only indicator, 21.20) |
| `AddColumnForm`, `AddCardForm`, column rename and delete | shown | shown | not rendered |
| Card drag (mouse and touch) | enabled | enabled | disabled (`draggable` attribute absent, touch handler absent) |
| Card search input | shown | shown | shown (guests may search boards where they hold a membership) |
| `CardDetailModal` | editable | editable | read-only (B7-V6) |
| `MemberPanel`, `InviteLinksPanel`, analytics link | shown | hidden | hidden |

**`useDragAndDrop({ enabled })`.** The hook takes `enabled = canEdit`. When `enabled` is false it returns the same shape with every handler `undefined` and `touchDrag = null`, and its internal `commitDrop` returns early, so even a stray event from a browser extension or a test starts no drag, leaves the state unchanged, and sends no request (Requirement 22.18). When enabled it behaves exactly as in V5. A successful drop sends only `column_id` and `order` and never changes the card's `status` in local state (Requirement 22.19, 21.23); `moveCardInState` copies every other field of the card unchanged (Property 56).

**New-card flow (Requirement 21.17 to 21.19).** The quick-add form still asks only for the title. `AddCardForm` returns the created Card to `BoardView`, which appends it to its column and opens `CardDetailModal` with `isNew = true`.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Submitting: submit valid title (1 to 200)
    Submitting --> Idle: request fails (no card, no modal, useErrorHandler toast)
    Submitting --> ModalOpenNew: 201 (card appended to the column, modal opens for it)
    ModalOpenNew --> Saving: Save with at least one changed field
    ModalOpenNew --> Idle: Save with no change, or Close (title-only card stays, status NOT_STARTED)
    Saving --> Idle: PATCH 200 (card updated, success toast, modal closes)
    Saving --> ModalOpenNew: PATCH error (values kept, toast)
```

**Member panel and invitation links (admin only).** `MemberPanel` composes `MemberList` (each membership with a `BaseBadge` for `admin`, `member`, or `guest`, and the remove control for every non-admin row, guests included), `AddMemberForm` (email, unchanged), and `InviteLinksPanel`. `InviteLinksPanel` calls GET `/api/boards/<id>/invite-links` when it mounts (this also creates missing tokens) and renders two `InviteLinkRow`s: "Member link: can edit" and "Guest link: view only". Each row shows the full URL `window.location.origin + "/invite/" + token` in a read-only, selectable field (`select-all break-all`), a copy `BaseButton`, and a regenerate `BaseButton`. Copy calls `navigator.clipboard.writeText` inside `try/catch`: success shows a success toast, failure shows an error toast and leaves the URL visible (Requirement 37.15). Regenerate opens `ConfirmDialog` ("the old link stops working"); on confirm it sends POST `.../regenerate`, replaces the row's token and shows a success toast only after a 200; on an error the old link stays and `handleError` runs (Requirement 37.16). Regenerating does not remove members who joined with the old link (Open issue 21).

**Invite page (`/invite/[token]`, Requirement 37.18, 37.19).** The Server page rejects a token that fails `INVITE_PATH_RE`'s token part with the not-found message, otherwise fetches GET `/api/invites/<token>` with the server token. `InviteJoinCard` (Client) shows the board name and "Member: can edit" or "Guest: view only". `acceptOutcome(currentRole, tokenRole)` in `lib/inviteRoles.ts` is the TypeScript twin of `resolve_accept`. If the outcome action is `none` and `current_role` is set, the card shows the current role and an open-board link and no Join button (this also covers a guest holding the guest token and every admin or member). Otherwise (no membership, or a guest with the member token) it shows Join: the button is disabled while POST accept runs, and on 200 the page redirects to `/boards/<board_id>` and shows a success toast. A 404 from either call shows the not-found message with a link to `/` and no Join button. The page header adds `Referrer-Policy: no-referrer` and `Cache-Control: no-store` through `next.config.ts` (Open issue 22).

### B7. Card detail modal and comments

`CardDetailModal` (Client) renders inside `BaseModal`, shows title, description, due date, labels, assignee (a select of board members from `MemberPanel` data or GET members), and composes `CommentList` plus `CommentForm`. It sends PATCH with only changed fields, keeps entered values on error, validates the title (1 to 200) before sending, and uses `ConfirmDialog` for card deletion. `CommentList` loads `GET /api/cards/<id>/comments` on open, shows loading, empty, and error states, and renders `CommentItem`. Edit and delete controls appear only when `comment.author.user_id === user.user_id`, including for the Board_Admin (Requirement 23.14). Comment changes update list state only after a successful response.

#### B7-V6. Status control, guest read-only view, and status badges (Requirements 21.22, 23.17 to 23.22, 25.2, 25.7)

> **V11 change.** The three-value `lib/status.ts` below is superseded by B17 (four values, `STATUS_STYLE` with complete class strings, `Urgent` in red). The V6 text stays as history.

**`lib/status.ts` (pure).**

```ts
export const CARD_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];
export const STATUS_LABEL: Record<CardStatus, string> = { NOT_STARTED: "Not started", IN_PROGRESS: "In progress", DONE: "Done" };
export const STATUS_VARIANT: Record<CardStatus, "gray" | "blue" | "green"> = { NOT_STARTED: "gray", IN_PROGRESS: "blue", DONE: "green" };
export function isCardStatus(x: unknown): x is CardStatus;
```

`improvements.md` wrote the options in capitals; requirements V6 (21.22, 23.17, 25.2) fix the displayed labels as "Not started", "In progress", and "Done", and the stored values are the exact uppercase strings. The design follows the requirements.

**`CardDetailModal`.** The shell keeps the save logic and composes `CardDetailForm` (title, description, due date, labels, assignee, `StatusSelect`) and `CommentList`. `StatusSelect` is a native select with exactly the three options, preselected with the card's current status. `diffCardFields(original, form)` now includes `status`, so changing only the status sends PATCH `/api/cards/<id>` with only `{ status }` (Requirement 23.18). On 200 the modal calls `onCardUpdated(card)` with the returned card, so the board's `CardItem` badge (`status`, `completed_at`) updates without a reload, and shows a success toast. On error the modal stays open, keeps the entered values, keeps the previously saved status on the board, and calls `handleError` (Requirement 23.19). The assignee options are `members.filter(m => m.role !== "guest")` from GET `/api/boards/<id>/members` (Requirement 23.20). For a newly created card (`isNew`) the modal shows the entered title and a single Save button that sends the same PATCH; Save with an empty diff closes the modal without a request.

**Guest view.** When `canEdit` is false, `CardDetailForm` renders every field `disabled`, `StatusSelect` disabled, and hides the Save button, the Delete button, the comment form, and the edit and delete controls of every Comment (`CommentList` gets `readOnly`). The Comments are still loaded with GET `/api/cards/<id>/comments` (Requirement 12.10). Ownership controls from V5 (author only, Board_Admin excluded) apply to admin and member authors only.

**Badges.** `CardItem` renders `<StatusBadge status={card.status} />` next to the labels. `MyTasksList` renders it after the Column name and keeps Cards with `DONE` in the list, marked "Done", with no status filter (Requirement 25.7). Moving a card by drag never changes the badge (Requirement 21.23).

### B8. Notifications UI

`useNotifications()` returns `{ items, unreadCount, markRead }`. While authenticated it requests `GET /api/notifications?page=1&per_page=20` immediately and every 30 s using `setInterval`, clears the interval on unmount or logout, keeps the previous state silently on a poll error, and `markRead(id)` sends `PATCH /api/notifications/<id>/read`, then marks the item read and sets `unreadCount = max(0, unreadCount - 1)`; on error the item stays unread and `handleError` fires. `NotificationBell` shows `formatBadge(unreadCount)` (`"99+"` above 99, nothing at 0) and toggles `NotificationList` (newest first, unread styled differently, empty state).

### B9. Responsive strategy (Requirement 27)

Mobile-first Tailwind; the minimum design width is 375 px.

| Concern | Rule |
|---|---|
| Page overflow | Layout uses `min-w-0`, `flex-wrap`, and `max-w-full`; only the Kanban container uses `overflow-x-auto` |
| Kanban | Container `flex gap-4 overflow-x-auto`; column `w-72 min-w-[240px] shrink-0` so columns stay at least 240 px below 768 px |
| Modal | `max-h-[100dvh] overflow-y-auto w-[calc(100vw-1rem)] max-w-lg`; close control `sticky top-0` |
| Tap targets | Shared `min-h-[44px] min-w-[44px]` on `BaseButton`, links in `Header`, inputs `min-h-[44px]` |
| Touch drag (Requirement 27.8) | Cards drag by 300 ms long-press (B6). Page, Kanban container, and Cards keep default `touch-action` so panning works; `select-none` and `-webkit-touch-callout: none` on Cards; scroll is blocked only by `preventDefault` on `touchmove` while a touch drag is active |
| Overlap | Stack form controls with `flex-col gap-2` below `md`; no absolute positioning for controls |
| Below 375 px | Page can scroll horizontally; content is not truncated |
| Tailwind scan | v4: `@source "../components"; @source "../hooks";` in `globals.css`. v3: `content` array lists `./app`, `./components`, `./hooks` |

**V6 change, responsive notes (Requirement 27.9).** `/welcome` and `/invite/[token]` use a single column `mx-auto w-full max-w-xl px-4`, `min-w-0` on text, and `flex flex-col gap-2 sm:flex-row` for the button row, so there is no horizontal overflow between 375 px and 1920 px and no two controls overlap. The Join, Log in, and Create account buttons are `BaseButton`s with the 44 px minimum. The invite link rows in `InviteLinksPanel` stack the URL field, the copy button, and the regenerate button vertically below `md`, the URL uses `break-all`, and the "Guest" badge wraps with the board title (`flex-wrap`). `ConfirmDialog` for regenerate follows the BaseModal mobile rules. Guests keep the same Kanban container scrolling, with no drag handlers and no `touch-action` rule (Requirement 22.17).

### B10. Typed API models (`lib/types.ts`)

```ts
export type Role = "admin" | "member" | "guest";            // V6: guest added
export type CardStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";   // V6 (values and labels in lib/status.ts)
export interface User { user_id: string; name: string; email: string; created_at: string }
export interface LoginResult { access_token: string; refresh_token: string; token_type: "Bearer"; expires_in: number; refresh_expires_in: number; user: User }
export interface RefreshResult { access_token: string; token_type: "Bearer"; expires_in: number }
export interface AuthState { user: User | null; accessToken: string | null; refreshToken: string | null;
  status: "loading" | "authenticated" | "anonymous" }
export interface AuthContextValue extends AuthState {
  login(r: LoginResult): void; logout(): void; updateUser(u: User): void; setAccessToken(t: string): void }
export interface Card { card_id: string; board_id: string; column_id: string; title: string;
  description: string | null; due_date: string | null; labels: string[];
  assignee: { user_id: string; name: string } | null; status: CardStatus; completed_at: string | null;
  order: number; created_at: string; updated_at: string }
export interface Column { column_id: string; board_id: string; name: string; order: number; cards: Card[] }
export interface BoardSummary { board_id: string; name: string; my_role: Role; created_at: string }
export interface BoardDetail extends BoardSummary { columns: Column[] }
export interface Member { user_id: string; name: string; email: string; role: Role }
export interface CardSearchResult extends Card { board_name: string; column_name: string }
export interface Comment { comment_id: string; card_id: string; content: string;
  author: { user_id: string; name: string }; created_at: string; updated_at: string }
export interface AppNotification { notification_id: string; type: "assignment" | "comment"; message: string;
  card_id: string; board_id: string; is_read: boolean; created_at: string }
export interface NotificationPage { items: AppNotification[]; page: number; per_page: number; total: number; unread_count: number }
export interface Analytics { cards_per_column: { column_id: string; name: string; count: number }[];
  completed_this_week: number; member_activity: { user_id: string; name: string; assigned_cards: number; comments: number }[] }
```

**V6 additions to `lib/types.ts`.**

```ts
export interface InviteLink { role: "member" | "guest"; token: string }
export interface InviteLinks { member: InviteLink; guest: InviteLink }
export interface InviteInfo { board_id: string; board_name: string; role: "member" | "guest"; current_role: Role | null }
export interface AcceptResult { board_id: string; role: Role }
export interface ProfileUpdate { name?: string; password?: string; current_password?: string }   // never `email`
```

### B11. Profile page (Requirements 7, 26)

`ProfileForm` (Client) keeps a controlled `name` input pre-filled from `AuthContext`, renders `ReadOnlyEmail` (the email as text in a `<dd>`, no input element, so no editable email control exists), and composes `ChangePasswordForm` with two masked inputs (current password with `autoComplete="current-password"`, new password with `autoComplete="new-password"`), never pre-populated. Validation lives in `lib/validation.ts` and mirrors the server (Property 29):

```ts
validateName(s)                 // trimmed length 1 to 100
validateNewPassword(s)          // length 8 to 128
validateCurrentPassword(s)      // non-empty
validatePasswordSection(cur, next) // both empty: ok (section unused); exactly one filled: error on the empty one; both filled: validate each
```

Submit builds the body `{ name }` plus `{ password, current_password }` only when both password inputs are filled and valid, and never contains `email`. The button is disabled until the request finishes. On 200 the form calls `updateUser(returned user)` (tokens and cookies untouched), shows a success toast, and, when a password was sent, clears both password inputs. On status 400 with a message that names `current_password` (`errorNamesField(err, "current_password")`), the form shows the field error on the current-password input, keeps the entered name, and leaves the AuthContext user unchanged (no toast). Any other error goes to `useErrorHandler` and the entered values stay (Requirements 26.2 to 26.8). A password change does not log the user out and does not invalidate tokens.

### B12. V8: Header logo link (Requirements 17.14, 18.14, 18.15, 27.10)

**V8 change.** In V5 and V6 the brand link of the Header had the fixed target `/`, so an anonymous click reached `proxy.ts`, which redirected to `/login` (Welcome_Cookie present) or `/welcome` (absent). V8 replaces the fixed target. The V5 text of B3 and the file tree stay as history.

**Pure functions (`lib/logoTarget.ts`, no I/O, no `document`).**

```ts
export type LogoTarget = "/welcome" | "/";
export type AuthStatus = "loading" | "authenticated" | "anonymous";   // same union as AuthState.status in lib/types.ts
// R18.15 (V8 refinement): authenticated ONLY while the AuthContext status is "authenticated" (a User is held).
// No cookie and no token is read. "loading", "anonymous" (failed restore, logout) are unauthenticated.
export function isVisitorAuthenticated(status: AuthStatus): boolean {
  return status === "authenticated";
}
// R18.14: never "/login", independent of the Welcome_Cookie
export function logoTarget(isAuthenticated: boolean): LogoTarget {
  return isAuthenticated ? "/" : "/welcome";
}
```

> **Superseded (first V8 text, kept as history).** The first V8 design computed `isVisitorAuthenticated({ user, accessToken, refreshToken })` as "a User is held, or an access or refresh token is present", so the logo could point to `/` during session restoration while the navigation still showed the anonymous links, and a stale cookie also gave `/` (old Open issue 33). The refined Requirement 18.15 replaces this with the single status-only check above.

**Header change (`components/Header.tsx`, Client Component, one component, well under 300 lines).**

| Aspect | V8 design |
|---|---|
| Source of state (**V8 refinement**) | `const { status } = useAuth(); const isAuth = isVisitorAuthenticated(status);` then `href = logoTarget(isAuth)`. This one `isAuth` value is the only authentication input of the Header: the logo target and the "My Tasks" link, `NotificationBell`, `UserMenu`, "Log in", and "Register" all use it, so they cannot disagree (R18.15). The Header reads no cookie, no token, and no `user` object. The server render and the first client render both start with `status` `loading` (the `AuthProvider` initial state), so both give `/welcome` and there is no hydration mismatch. |
| Recomputed after state changes | The Header re-renders on every `status` change. `logout()` and `sessionExpired()` set `status` to `anonymous`, so the target becomes `/welcome` and the navigation switches to Log in and Register. A successful session restoration or `login()` sets `status` to `authenticated`, so the target becomes `/` and the user controls appear (R18.15). |
| Restore-time behavior | While a cookie exists and session restoration runs (`status` `loading`), the logo targets `/welcome` and the navigation shows the anonymous links. A click in that window requests `/welcome`; `proxy.ts` sees a valid access or refresh cookie (`decideRoute` `welcome` row, authenticated or refreshable) and redirects to `/`, so the visitor still reaches the Dashboard (R17.9, R17.14). After the restoration succeeds the target is `/` directly. |
| Restore failure with 5xx or network error | `AuthProvider` keeps both cookies, leaves the User unset, and sets `status` to `anonymous` (B4, R17.5), never leaving it at `loading`. The Header therefore shows `/welcome` and the anonymous links, plus the `useErrorHandler` toast. A logo click requests `/welcome`, and `proxy.ts` redirects it to `/` while the cookies are still valid, where the Server Component fetch runs again. A 401 that survives the refresh flow clears both cookies, and the logo then reaches `/welcome` without a redirect. |
| Link markup | One `Link` containing the mark and the wordmark. The existing classes stay (44 px minimum target, `rounded-md`, `text-base font-semibold text-ink`). The mark `span` gets `aria-hidden="true"` so the accessible name of the link is exactly "Kano". |
| Side effects | None. The link sets and deletes no cookie and sends no request. `Link` prefetch is allowed: a prefetch of `/welcome` for an anonymous visitor is a public page, and a prefetch of `/` for an authenticated User is the Dashboard. |
| Navigation links | The "My Tasks" link, `NotificationBell`, `UserMenu`, "Log in", and "Register" now use the same `isVisitorAuthenticated(status)` value as the logo (the V6 condition `status === "authenticated"` is exactly that check). "Log in" and "Register" are anchor elements (`Link`), not `BaseButton` (R38.2). Open issue 33 is resolved by this. |
| Layout | `layout.tsx` still renders exactly one `Header` and one `Footer` around `children` (R18.13). No page renders its own Header or Footer. |

**Relation to `proxy.ts` and `decideRoute` (unchanged).** The logo link needs no new routing rule, as shown by this table (rows copied from the B4-V6 decision table):

| Click | Request | `decideRoute` outcome | Result |
|---|---|---|---|
| Anonymous, any page, Welcome_Cookie present or absent | `/welcome` | `welcome` + unauthenticated: continue, no cookie write | Welcome_Page |
| Authenticated (valid access cookie) | `/` | `root` + authenticated: continue | Dashboard |
| Only a refresh cookie, valid | `/` | `root` + refreshable: refresh then continue | Dashboard |
| Any visitor while `status` is not `authenticated` (restore in progress, failed restore, stale cookies, logout) | `/welcome` | `welcome`: continue when unauthenticated, redirect to `/` when a valid access or refresh cookie exists | Welcome_Page, or the Dashboard after the redirect |
| Stale cookies (V8 refinement: no longer reach `/` through the logo) | `/welcome` | unauthenticated: continue | Welcome_Page (resolves Open issue 33) |

```mermaid
flowchart LR
    S["AuthContext status (loading, authenticated, anonymous)"] --> F["isVisitorAuthenticated(status): status is authenticated"]
    F -->|true| L1["logoTarget gives /"]
    F -->|false| L2["logoTarget gives /welcome"]
    L1 --> P["proxy.ts decideRoute: root + authenticated, continue"]
    L2 --> W["proxy.ts decideRoute: welcome + unauthenticated, continue; with a valid cookie during restore: redirect to /"]
    F --> N["Header navigation: same value"]
    LO["logout() or sessionExpired()"] --> S
```

### B13. V8: Welcome page structure, copy, and visual rules (Requirements 38.1, 38.2, 38.10, 38.15 to 38.21, 27.10)

**V8 change.** Supersedes the V6 `WelcomeContent` description (B2 row, B7-V6 responsive note). `/welcome` stays public, a Server Component, with no API call (R38.1). No backend file is involved.

**Files (one component per file, each far below 300 lines; the new and rewritten files are all under `web/`).**

| File | Type | Content |
|---|---|---|
| `app/welcome/page.tsx` | Server | Exports `metadata` (title "Welcome to Kano", description `WELCOME_COPY.metaDescription`) and renders `WelcomeContent` inside `<main>`. Renders no Header or Footer (the layout does, R18.13). |
| `components/welcome/WelcomeContent.tsx` | Server | Rewritten. Composes, in this order, `WelcomeHero`, `BoardPreview`, `FeaturesSection`, `WelcomeCta` (R38.15 parts b to e). |
| `components/welcome/WelcomeHero.tsx` | Server | `<section aria-labelledby="welcome-hero-title">`: eyebrow, the only `h1`, subheadline, `<WelcomeActions placement="hero" />`. |
| `components/welcome/BoardPreview.tsx` | Server | Decorative preview (below). Uses `PreviewColumn.tsx` and `PreviewCard.tsx`. |
| `components/welcome/PreviewColumn.tsx`, `PreviewCard.tsx` | Server | One component each. |
| `components/welcome/FeaturesSection.tsx`, `FeatureCard.tsx` | Server | `<section aria-labelledby="welcome-features-title">` with an `h2`, one sentence, and four `FeatureCard`s. |
| `components/welcome/WelcomeCta.tsx` | Server | `<section aria-labelledby="welcome-cta-title">` with an `h2`, one sentence, and `<WelcomeActions placement="cta" />`. |
| `components/welcome/WelcomeActions.tsx` | **Client** | The only Client Component of the page. Prop `placement: "hero" or "cta"`. Hero: one primary `BaseButton` "Get started". CTA: primary "Create account" and secondary "Log in". Each `onClick` calls `setWelcomeSeenCookie()` (from `lib/authCookie.ts`, V6 helper) and then `router.push(target)`. **V8 refinement (R38.2):** these three section actions are `BaseButton`s. The Header "Log in" and "Register" are anchor links (`Link`) in `Header.tsx` and are not part of this component. |
| `lib/welcomeContent.ts` | pure | `WELCOME_COPY` (all page texts and link targets), `FEATURES` (icon name, title, description), `PREVIEW_SAMPLE` (all preview texts), `FORBIDDEN_CLAIMS` is not here (see next row). |
| `lib/forbiddenClaims.ts` | pure | `FORBIDDEN_CLAIMS` list of Requirement 38 criterion 19 and `findForbiddenClaims(text): string[]` (Property 60). Matching (V8 refinement, R38.19): the text and each entry are lowercased, every entry except "free" is a plain substring match, and "free" is a whole-word match (`/(^|[^\p{L}\p{N}_])free($|[^\p{L}\p{N}_])/iu`). Substring matching has false positives by design: "operating", "integrating", and "generating" contain "rating", and a number such as "14.9" contains "4.9"; the copy must avoid such words, and a hit is reported, not filtered. Kept outside `components/welcome/` so a source scan of the welcome files does not match the list itself. |

**Sections, copy, and targets (exactly Requirement 38 criteria 16 and 17; `WELCOME_COPY` is the single source).**

| Part | Element | Text | Target / style |
|---|---|---|---|
| (a) Header (shared, `Header.tsx`) | link | "Log in" | `/login`, non-primary classes (V5, unchanged) |
| (a) Header | link | "Register" | `/register`, primary classes (V5, unchanged) |
| (b) Hero | eyebrow badge | "Kanban boards for teams" | `bg-primary-100 text-primary-700 rounded-full text-xs font-medium h-5 px-2.5` |
| (b) Hero | `h1` | "Organize work smoothly, from idea to done" | `text-xl md:text-2xl font-semibold text-ink` (H1 role below 768 px, Display role from 768 px) |
| (b) Hero | subheadline | "Plan work on boards and columns, move cards by drag and drop, and keep your team aligned with comments, notifications, and invitation links." | `text-base text-ink-muted max-w-prose` |
| (b) Hero | button | "Get started" | `/register`, `BaseButton` primary |
| (c) Preview | decorative | sample data only (B13 preview) | none |
| (d) Features | `h2` and sentence | "Everything your team needs to execute" / "Kano keeps boards simple so your team can focus on what to do next." | |
| (d) Features | card 1 | "Drag and drop on mouse and touch" / "Move cards between columns with a mouse or by touch, and Kano keeps the order you chose." | icon `Move` |
| (d) Features | card 2 | "Stay organized at a glance" / "Add labels, due dates, and a status (Not started, In progress, or Done) to every card." | icon `Tag` |
| (d) Features | card 3 | "Collaborate with your team" / "Comment on cards, get notifications about assignments and comments, and invite members or read-only guests with a link." | icon `Users` |
| (d) Features | card 4 | "Find and focus" / "Search the cards of a board, see the cards assigned to you in My Tasks, and let board admins view analytics." | icon `Search` |
| (e) Bottom CTA | `h2` and sentence | "Ready to bring calm to your project planning?" / "Create an account to start your first board, or log in to pick up where you left off." | panel `bg-sunken` |
| (e) Bottom CTA | button | "Create account" | `/register`, primary |
| (e) Bottom CTA | button | "Log in" | `/login`, secondary |
| (f) Footer | shared `Footer.tsx` | unchanged | |

Icons come from `lucide-react` (already a dependency, as used by `BoardView`), `size-5` inside a `size-10 rounded-md bg-primary-50 text-primary-600` square, `aria-hidden="true"`. The four icon names are checked at implementation time.

**Welcome_Cookie (R38.10).** The five actions all set the cookie. The two Header links reach `/login` or `/register`, where `proxy.ts` already sets the cookie when it is absent (`decideRoute` `setWelcomeCookie`, B4-V6), so the Header needs no click handler. The three section buttons set it in `WelcomeActions` before navigating (V6 behavior kept). The logo link does not set it (R18.14).

**Decorative board preview (R38.18).**
- Outer wrapper `div` with `overflow-x-auto` and `tabIndex={-1}` (**V8 refinement:** the horizontal scroller for narrow screens lies outside the hidden subtree and is not a tab stop), then the container `div aria-hidden="true"` that holds all preview markup. The preview content has no focusable element: inside the container only `div`, `span`, and `p` elements, with no `a`, `button`, `input`, `select`, `textarea`, `summary`, `tabindex`, `onClick`, or `draggable`. The `tabindex="-1"` sits on the scroller, which is outside the container, so the "no `[tabindex]` inside the container" test still holds (Open issue 35 resolved).
- Three Columns "To do", "In progress", "Done" (`bg-sunken rounded-lg p-2`, `w-72 shrink-0` below 768 px, `md:w-auto` in a three-column grid from 768 px). Each Column has two or three sample Cards (`bg-surface border border-line rounded-md p-3`) with a title, one or two label chips from the fixed pairs (`bg-label-green-bg text-label-green-fg` and so on), avatar initials circles (`rounded-full`, label token pairs), and a status `BaseBadge`-style chip with the text "Not started", "In progress", or "Done" only (the chip is markup in the preview, not the `StatusBadge` component, to keep the subtree free of logic).
- One Card in the middle Column is shown as being dragged (`rotate-2 border-primary-200 shadow-overlay`; **V8 refinement:** this is the only element of the page that may carry the design-system overlay shadow, R38.20; the first V8 text said "no shadow", superseded) next to a dashed placeholder (`border-2 border-dashed border-primary-200 bg-primary-50 rounded-md`).
- Sample texts are generic task titles ("Draft the project brief", "Design the login page", "Set up the database", and similar) kept in `PREVIEW_SAMPLE`. No ticket ids, counts of people, metrics, or claims. Tailwind classes in these files are written as complete static strings (a lookup object from sample color name to full class string), never built with template strings, so the Tailwind v4 scanner finds them.

**Design-system and Tailwind approach (read-only use of `guidelines/design-system.md` and the existing `web/app/globals.css`).**
- No new token, no `globals.css` change, no `tailwind.config`. The `@theme` block of `globals.css` already resets default palettes and defines `primary-*`, `canvas`, `surface`, `sunken`, `line`, `ink*`, the eight label pairs, `rounded-sm|md|lg|full`, and the type scale, and `@source "../components"` already scans the new component files. `app/welcome/page.tsx` sits in `app/`, which Tailwind v4 scans by default.
- Only tokens and the documented recipes are used (design-system section 0 rule 2). Fonts are Inter weights 400, 500, 600 only (`font-medium`, `font-semibold`, never bold). Surfaces are flat: 1 px `border-line`, no gradient, no blur, and no `shadow-*` except `shadow-overlay` on the one dragged preview Card (R38.20). Everything else on the page is flat. Page background is `canvas` (from `html`), cards `surface`, bottom panel `sunken`. Spacing uses the 4, 8, 12, 16, 24, 32, 48 px steps (`gap-2|3|4`, `p-6`, `py-12`).
- One primary button per region: the Header "Register", the hero "Get started", and the bottom "Create account" are in three separate regions.
- Contrast uses only documented pairs (white on `primary-500` at 4.58:1, `primary-700` on `primary-100`, `ink` and `ink-muted` on `canvas`, `surface`, `sunken`).

**Layout by width (R38.21, R27.1, R27.2, R27.10).**

| Part | Below 768 px | From 768 px |
|---|---|---|
| Hero | single column, centered text, `px-4 py-12`, button `w-full min-h-[44px]` | `max-w-3xl`, centered, button `md:w-auto` |
| Preview | scroller `overflow-x-auto`, three Columns `w-72` (288 px, at least 240 px) side by side inside it, so the page has no horizontal scroll | `md:grid md:grid-cols-3 gap-4`, no scrolling |
| Features | `grid-cols-1 gap-4` | `md:grid-cols-2 gap-4` |
| Bottom CTA | `flex flex-col gap-2`, buttons `w-full min-h-[44px]` | `md:flex-row md:justify-center`, buttons `md:w-auto` |
| Header links and logo | 44 px targets (already in `Header.tsx`) | same |

Root containers use `min-w-0` and `max-w-full`. The only horizontally scrolling element is the preview scroller.

```mermaid
flowchart TB
    H["Header (layout.tsx)"] --> M["main: app/welcome/page.tsx"]
    M --> A["WelcomeHero: eyebrow, h1, subheadline, WelcomeActions hero (client)"]
    A --> B["BoardPreview (aria-hidden, decorative)"]
    B --> C["FeaturesSection: 4 FeatureCards"]
    C --> D["WelcomeCta: WelcomeActions cta (client)"]
    D --> F["Footer (layout.tsx)"]
```

### B14. V8: Board toolbar and the single separator line (Requirements 21.24 to 21.28, 27.10)

**V8 change.** In V6, `BoardView.tsx` rendered the toolbar inline (a `div` with `mb-6`) directly above the Kanban row, with no line between them. `BoardView.tsx` is already near the 300-line limit (Requirement 30.6), so V8 extracts the toolbar.

| File | Change |
|---|---|
| `components/boards/BoardToolbar.tsx` | New Client Component (one component). Props: `boardName`, `role`, `boardId`, `onSearchResults`, `onSearchClear`, `onOpenMembers`, `onOpenAnalytics`. Contains the back link "Boards", the `h1` title, the role `BaseBadge` ("Guest" for a guest), `CardSearchInput`, and, only for the admin, the Members and Analytics `BaseButton`s. Root element: `<div data-testid="board-toolbar" className="flex flex-wrap items-center justify-between gap-3 pb-4 min-w-0">` with the same inner markup as V6. No `border-*` class on it. |
| `components/boards/BoardView.tsx` | Replaces the inline toolbar with `<BoardToolbar ... />`, then renders exactly one `<hr data-testid="board-separator" className="m-0 h-px w-full border-0 bg-line" />`, then `<div data-testid="board-content" className="pt-6 min-w-0">` that holds the search results list or the Kanban row (V6 markup, with its `mb-6` and any border removed). The separator is rendered once, unconditionally inside `BoardView`, so it appears for every role and in the search-results state too. If `BoardView.tsx` still exceeds 300 lines, the search-results `ul` moves to `SearchResultList.tsx`. |

**Why one `hr`.** `hr` has the implicit role `separator` with horizontal orientation (R21.25), is block level so it always starts a new line below the last wrapped toolbar line (R21.26), and `h-px bg-line` (token `line`, `#E1E4EA`) draws exactly 1 px with Tailwind preflight's `border-width` removed by `border-0`. It sits inside the `px-4 sm:px-6` page padding wrapper, so it spans the full toolbar width. `BoardToolbar` and `board-content` carry no `border-t` or `border-b` class, so a second line cannot appear (R21.28). The Kanban row keeps its V6 `overflow-x-auto`, so the page itself does not scroll horizontally (R21.26).

```
BoardRoleProvider
  div.px-4.sm:px-6.py-6.min-w-0
    BoardToolbar      (title, role badge, search, Members and Analytics for admin)   pb-4
    hr#separator      1 px, bg-line, full width
    div.board-content (search results OR Kanban row, AddColumnForm at the end)        pt-6
```

**Role and state coverage (R21.27).** `BoardToolbar` and the `hr` render for admin, member, and guest. In the 403 and 404 states the board page renders `BoardAccessMessage` instead of `BoardView`, so no toolbar, no separator, and no Column exist. The add-column control stays at the end of the Kanban row inside the Kanban columns area, outside `BoardToolbar` (V8 refinement, R21.24: `BoardToolbar` has no add-column prop and renders no add-column form; Open issue 36 resolved). The `Header`'s own `border-b` belongs to the shared Header, not to the board toolbar.

### B15. V9: Footer (Requirements 18.13, 18.16 to 18.21, 27.11, 27.12, 38.19)

**V9 change.** Supersedes the V5 footer (one centered `text-xs` line "Kano Task Management", `border-t border-line`, no links). The V5 text stays as history. `layout.tsx` still renders exactly one `Header` and one `Footer` around `children` (R18.13), so the Welcome_Page, the invite page, and every other page get the new Footer without a page change. No backend file is involved.

**Icon source check (recorded result).** Installed `lucide-react` is 1.75.0 (`web/package.json` `^1.75.0`, `node_modules` version 1.75.0). `dist/lucide-react.d.ts` has no `Github` or `Linkedin` export, and `dist/esm/icons/` has no GitHub or LinkedIn file (only generic `git-*` icons such as `git-branch`). Brand icons are therefore not available from lucide, and the design uses two inline SVG components. No new dependency is added (an icon package would break the YAGNI rule for two icons).

**Files (one component or module per file, each far below 300 lines).**

| File | Type | Content |
|---|---|---|
| `components/Footer.tsx` | Server (no `"use client"`, no hooks, no handlers) | Rewritten. Renders the footer landmark, the brand group, and the link group below. Uses plain `<a>` elements for the external links (not `next/link`, which is for in-app navigation). Uses no Next.js API, so it does not depend on the framework changes that `web/AGENTS.md` warns about. |
| `components/shared/KanoMark.tsx` | Server-compatible (no hooks), also imported by the client `Header` | The "K" badge: `<span aria-hidden="true" className="inline-flex items-center justify-center size-6 rounded-md bg-primary-500 text-white text-xs font-semibold">K</span>`. The classes are the ones the Header already has, so the look does not change. Chosen over two local copies because the same six-class badge would otherwise exist twice and could drift. |
| `components/shared/icons/GithubIcon.tsx`, `LinkedinIcon.tsx` | Server-compatible | Each returns `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className="size-5">` with one `<path>`. The path data is taken from the Simple Icons set (CC0) at implementation time and checked there. The icon inherits `currentColor`, so the hover color of the link changes it (design system section 5). |
| `lib/footerContent.ts` | pure | `FOOTER_CONTENT`: `wordmark` "Kano", `portfolioPrefix` "Portfolio project built in 2026 by " and `author` "JC" (both fixed strings, no `new Date()`, R18.17), and `links`: `{ id: "github", href: "https://github.com", label: "Kano on GitHub" }` and `{ id: "linkedin", href: "https://www.linkedin.com", label: "Kano on LinkedIn" }`. It holds no Tailwind class, because `lib/` is not scanned by Tailwind. The forbidden-claims scan (below) reads this object. |

**Markup and classes (complete static strings, design-system tokens only).**

```tsx
// components/Footer.tsx
const LINK_CLASS =
  "inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

<footer className="bg-surface border-t border-line px-4 py-3 min-w-0">
  <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <KanoMark />
      <span className="text-sm font-semibold text-ink">Kano</span>
      <span aria-hidden="true" className="text-ink-subtle">·</span>
      <p className="text-sm text-ink-muted min-w-0">
        Portfolio project built in 2026 by <span className="font-medium text-ink">JC</span>
      </p>
    </div>
    <div className="ml-auto flex items-center gap-1">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="Kano on GitHub" className={LINK_CLASS}><GithubIcon /></a>
      <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Kano on LinkedIn" className={LINK_CLASS}><LinkedinIcon /></a>
    </div>
  </div>
</footer>
```

(The literals above are shown in place for reading. The implementation reads the strings from `FOOTER_CONTENT` and maps `links` to the two anchors.)

| Element | Classes and reason |
|---|---|
| Landmark | `bg-surface border-t border-line px-4 py-3 min-w-0`. The surface and 1 px `line` border match the Header (`bg-surface border-b border-line px-4`), a raised flat surface per design system section 2.6 (R18.21). `<footer>` placed directly in `body` by `layout.tsx` has the `contentinfo` role. |
| Container | `max-w-7xl mx-auto`, the same width container as the Header (R18.16). |
| Brand mark | `KanoMark`: `size-6 rounded-md bg-primary-500 text-white text-xs font-semibold`, white on `primary-500` is a documented pair (4.58:1). |
| Wordmark | `text-sm font-semibold text-ink` (weight 600, R18.17). Plain `span`, not a link. |
| Separator dot | `text-ink-subtle`, `aria-hidden="true"`. Decorative, so the contrast rule for essential text does not apply (design system section 6). |
| Portfolio text | `text-sm text-ink-muted`, "JC" in its own `span` with `font-medium text-ink` (weight 500, allowed set 400, 500, 600). `ink-muted` on `surface` is a documented pair. |
| Link | `size-11` is 44 px by 44 px at every width (R18.19, R27.12; 44 px is the design-system touch size, the `lg` button height, and it is the tap-target exception to the 4 px spacing scale step at every viewport width). `rounded-md` is the default radius. `text-ink-muted` becomes `text-ink` and the background becomes `sunken` on hover, with `transition-colors duration-150` (R18.20, design system recipe for ghost controls). The focus indicator is the 2 px focus-visible outline of the design system, recipe `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` (the product uses outlines, not Tailwind `ring`; V9 refinement: the first V9 text called it a "focus ring", superseded; Open issue 40 resolved). |
| Icon | `size-5` (20 px, design system section 5 for icon buttons), `aria-hidden="true"`, `focusable="false"`. The link has no text content, so its accessible name is the `aria-label` (R18.19). |

No `shadow-*`, gradient, blur, arbitrary value, hex code, or default palette class is used (R18.21, design system sections 0 and 8). No `font-bold`. `size-11` is not in the spacing scale of design system section 2.3 but equals the 44 px height of the `lg` button, which section 2.3 allows ("unless matching an existing element height"). R18.19 states this explicitly: 44 px is the tap-target exception to the 4 px scale step at every viewport width.

**Layout by width (R18.16, R27.1, R27.2, R27.11, R27.12).**

| Width | Behavior |
|---|---|
| 768 px and above | One row: the brand group on the left, the link group on the right (`justify-between`, and `ml-auto` keeps it right). All content fits (about 350 px of brand group and 92 px of links). |
| 375 px to 767 px | The footer may wrap onto two lines (R27.11 as refined; the first V9 text implied wrapping was required). The outer container is `flex-wrap`. The brand group is about 350 px wide in one line, which is wider than the 343 px available, so the link group wraps to a second line and stays right-aligned through `ml-auto`. The brand group has its own `flex-wrap` and `min-w-0`, so on the narrowest screens its portfolio text wraps below the wordmark instead of overflowing. This is the "two lines without overlap" case of R27.11. |
| Below 375 px | Page may scroll horizontally (R27.7). The same wrapping applies. |

The Footer adds no `overflow` rule. All items use `min-w-0` or `shrink` defaults, so `document.documentElement.scrollWidth` does not exceed the viewport (R27.1). Link boxes (44 px) never overlap the text because they are separate flex items with `gap` (R27.2). On a very tall wrapped state the footer grows in height; there is no fixed height.

**Contrast.** `ink-muted` on `surface` and on `sunken` (hover state shows `ink`), `ink` on `surface` and `sunken`, and white on `primary-500` are documented pairs of the design system, all at least 4.5:1 (lowest 4.58:1). No new token pair is introduced (design system section 6).

**Security and privacy (R18.18, R18.21).** The two anchors have `target="_blank"` and `rel="noopener noreferrer"`: `noopener` gives the opened page no `window.opener`, `noreferrer` sends no Referer, which also keeps an invite path out of the Referer header if a visitor on `/invite/<token>` clicks a footer link (this complements Open issue 22). The Footer loads no script or tracking pixel, sets and reads no cookie, calls no API, and reads no environment variable. It is a Server Component, so it adds no client JavaScript. The two URLs are placeholders (Open issue 41).

**Interaction with other tests and specs.** (1) The Header link named exactly "Kano" remains the only link with that exact name: the brand group is text, and the footer links are named "Kano on GitHub" and "Kano on LinkedIn". Testing Library matches a string `name` exactly, so `getByRole("link", { name: "Kano" })` still finds one element. Playwright matches `name` as a case-insensitive substring unless `exact: true` is set, so Playwright logo locators must stay scoped to the `banner` landmark (as in the V8 scenarios) or use `exact: true` (see Open issue 42). (2) The Welcome_Page forbidden-claims rule (R38.19) covers the shared Footer, because the Footer is rendered on that page. The V9 test scans `FOOTER_CONTENT` and the rendered footer text and attributes with `findForbiddenClaims` (Testing Strategy V9). The footer strings were checked by hand against the list: "Portfolio project built in 2026 by JC", "Kano", "Kano on GitHub", and "Kano on LinkedIn" contain none of the forbidden strings ("Kano on" is not "KAN-", and no listed substring such as "rating" or "4.9" occurs).

```mermaid
flowchart LR
    L["layout.tsx (Server)"] --> F["Footer (Server)"]
    F --> B["Brand group: KanoMark, wordmark, dot, portfolio text (no link)"]
    F --> G["Link group: two external anchors"]
    G --> I1["GithubIcon (inline SVG)"]
    G --> I2["LinkedinIcon (inline SVG)"]
    C["lib/footerContent.ts"] -.text, URLs, labels.-> F
    K["shared/KanoMark.tsx"] --> B
    K --> H["Header (Client)"]
```

## V11 Design: Backend (A15 to A21)

> These sections are new in V11 and sit after Part B so the V5 to V10 numbering stays stable. Backend sections are A15 to A21, frontend sections are B16 to B21 (below). Modules named here are planned; no source file is created by this document.

### A15. Four roles, rank rules, and the endpoint-by-role matrix (Requirements 9, 10, 37, 43)

**`permissions.py` (pure part, no database access).**

```python
ROLE_RANK  = {"guest": 0, "member": 1, "manager": 2, "admin": 3}          # single source (R43.1)
LEVEL_RANK = {"reader": 0, "writer": 1, "manager": 2, "admin": 3}
def role_allows(role, level) -> bool:        # unchanged formula; None -> False
    return role is not None and ROLE_RANK[role] >= LEVEL_RANK[level]

ASSIGNABLE_ROLES = ("guest", "member", "manager")                         # never "admin" (R43.8)
def decide_role_change(caller, target, new_role, target_is_owner) -> str:  # "ok" | "forbidden" | "bad_request"
    if new_role not in ASSIGNABLE_ROLES:               return "bad_request"
    if not role_allows(caller, "manager"):             return "forbidden"
    if target_is_owner:                                return "bad_request" if caller == "admin" else "forbidden"
    if ROLE_RANK[caller] <= ROLE_RANK[target]:         return "forbidden"  # R43.6
    if ROLE_RANK[new_role] >= ROLE_RANK[caller]:       return "forbidden"  # R43.7
    return "ok"
def decide_member_removal(caller, target, target_is_owner) -> str:         # "ok" | "forbidden" | "bad_request"
    if not role_allows(caller, "manager"):             return "forbidden"
    if target_is_owner:                                return "bad_request" if caller == "admin" else "forbidden"
    return "ok" if ROLE_RANK[caller] > ROLE_RANK[target] else "forbidden"  # R9.6, R43.6
```

The `target_is_owner` check sits before the rank rule on purpose (Open issue 47): an admin who targets himself gets 400 (R9.7, R43.8), a manager who targets the admin gets 403 (R43.6). Setting a role equal to the current role is allowed when the other rules pass and changes nothing (Open issue 59).

**Helpers (replace the V6 list; each still does one joined query and returns the membership).**

| V11 helper | Level | Used by |
|---|---|---|
| `require_board_reader(board_id, user_id)` | reader | board detail, members list, card detail, comments list, search with `board_id`, GET `/api/cards/<id>` |
| `require_board_writer(board_id, user_id)` | writer (`admin`, `manager`, `member`) | unchanged from V6 for card, comment, checklist, link writes |
| **`require_board_manager(board_id, user_id)`** | manager (`admin`, `manager`) | create column, add member, member role change, member removal, invite-links and regenerate |
| `require_board_admin(board_id, user_id)` | admin | Board PATCH and DELETE, analytics |
| `get_column_for_writer` | writer | create card in a Column |
| **`get_column_for_manager(column_id, user_id)`** | manager | column rename, delete, board column reorder uses `require_board_manager` |
| `get_card_for_reader` / `get_card_for_writer(card_id, user_id, lock=False)` | reader / writer | `lock=True` runs `SELECT ... FOR UPDATE` on the Card row (cap checks, A17) |
| **`get_checklist_item_for_writer(item_id, user_id)`**, **`get_card_link_for_writer(link_id, user_id)`** | writer | PATCH and DELETE of items and links; the join goes item to card to board to membership |
| `assert_assignee_is_writer(board_id, assignee_id)` | writer | unchanged: `admin`, `manager`, and `member` pass because their rank is at least 1; a `guest` gives 400 |

`permissions.py` now also imports `ChecklistItem` and `CardLink` from `cards/schema` (models only, no service import, rule 2 of the module graph).

**Endpoint-by-role matrix (V11; replaces the V6 matrix).** `ok` allowed, `403` forbidden. "Rank rule" means A15 `decide_*`.

| Endpoint group | admin | manager | member | guest | non-participant |
|---|---|---|---|---|---|
| GET board, members, card detail, comments, search | ok | ok | ok | ok | 403 |
| PATCH or DELETE Board; GET analytics | ok | 403 | 403 | 403 | 403 |
| POST members (by email) | ok | ok | 403 | 403 | 403 |
| DELETE member; PATCH member role | ok, rank rule | ok, rank rule | 403 | 403 | 403 |
| GET invite-links; POST regenerate | ok | ok | 403 | 403 | 403 |
| POST column; PATCH, DELETE column; PATCH reorder | ok | ok | **403** | 403 | 403 |
| Card create, update, delete, position; status | ok | ok | ok | 403 | 403 |
| Checklist and link POST, PATCH, DELETE | ok | ok | ok | 403 | 403 |
| Comment POST | ok | ok | ok | 403 | 403 |
| Comment PATCH, DELETE | author | author | author | 403 | 403 |
| GET `/api/notifications/overdue`, GET invite info, accept | any user | any user | any user | any user | any user |

**Role effects elsewhere.** Analytics member activity filters `role in ("admin", "manager", "member")` (R14.10). The accept decision `resolve_accept` is unchanged and already covers `manager`: any existing role other than a guest holding the member token stays (Property 50 gains `manager` in its role set). `GET /api/boards/<id>` returns `my_role` with any of the four values (R43.12).

### A16. Card status with four values (Requirements 2.16, 11.4, 11.19, 39.1 to 39.4, 44.1)

- `CARD_STATUSES = ("NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE")`. `CardUpdateSchema.status` keeps `validate.OneOf(CARD_STATUSES)` (exact, case-sensitive). `CardCreateSchema` still rejects `status` with 400.
- The check constraint is `ck_cards_status`: `status IN ('NOT_STARTED','IN_PROGRESS','URGENT','DONE')`. It replaces the V6 constraint by a hand-edited migration (V11 migration table below).
- `apply_status_change` is unchanged (A13 note). Transitions among `NOT_STARTED`, `IN_PROGRESS`, `URGENT` leave `completed_at` untouched; only entering or leaving `DONE` changes it (Property 61).
- Analytics and overdue treat only `DONE` as completed. Existing rows keep their values; the migration changes no row (R39.4).
- Labels stay a `text[]` of strings; colors are computed on the client (B17), so there is no schema, API, or migration change for label colors (R39.12).

### A17. Checklist and workspace links inside the `cards` package (Requirements 41, 42, 44.6)

**File split plan (each file at most 300 lines; `cards/__init__.py` keeps `routes`, `service`, and `schema` importable).**

| Package | Modules |
|---|---|
| `cards/schema/` | `card_model.py` (Card), `checklist_model.py` (ChecklistItem), `link_model.py` (CardLink), `card_schemas.py`, `checklist_schemas.py`, `link_schemas.py`, `url_rules.py` (pure `validate_link_url`, `default_label`) |
| `cards/service/` | `card_service.py`, `position_service.py`, `search_service.py`, `status.py`, `checklist_service.py`, `link_service.py`, `counts.py` (A18) |
| `cards/routes/` | `card_routes.py`, `search_routes.py`, `checklist_routes.py`, `link_routes.py`; the blueprint registers all four |

No ninth Blueprint_Package is added. The `boards` and `columns` services read `ChecklistItem` and `CardLink` from `cards/schema` for the cascades, the same way they read `Card` (decision D4).

**Checklist service (`checklist_service.py`).**

- `add_item(user, card_id, text)`: `get_card_for_writer(card_id, user.user_id, lock=True)`, count non-deleted items, `BadRequest("checklist: limit of 50 items reached")` when the count is already 50, insert with `order = next_last_order(max(order))` (1.0 when none), `is_done = False`. Locking the Card row serializes two concurrent adds so the cap cannot be exceeded (Open issue 54). Returns 201.
- `update_item(user, item_id, fields)`: `get_checklist_item_for_writer`, update only the supplied fields (`text`, `is_done`, `order`), 200 with the item.
- `delete_item(user, item_id)`: soft delete, 200 `{ "checklist_item_id": "<id>" }`. A soft-deleted item does not count toward the cap.
- Progress is never stored. No Notification, no change to `status` or `completed_at` (R41.10).

**Link service (`link_service.py`).** Same pattern: `add_link` (cap 10, row lock, `created_by = user.user_id`, `label = default_label(url)` when omitted), `update_link` (re-validates a supplied `url` and `label`), `delete_link` (soft delete, 200 `{ "card_link_id": "<id>" }`). No Notification and no outbound request to the stored URL (R42.9).

**Pure URL rule (`url_rules.py`).**

```python
MAX_URL = 2048
def validate_link_url(raw: str) -> str:                 # returns the trimmed URL or raises ValueError
    url = raw.strip()
    if not url or len(url) > MAX_URL: raise ValueError
    if any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in url): raise ValueError
    parts = urlsplit(url)                                # ValueError from urlsplit is also a rejection
    if parts.scheme.lower() not in ("http", "https") or not parts.hostname: raise ValueError
    return url
def default_label(url: str) -> str:                      # hostname, lower case, cut to 100 characters
    return urlsplit(url).hostname[:100]
```

The accepted set is exactly: trimmed, 1 to 2048 characters, no whitespace or control characters, scheme `http` or `https` in any letter case, non-empty hostname. `javascript:`, `data:`, `file:`, `//host/path`, `host/path`, and `http:///x` are rejected (Property 68). `label` must have 1 to 100 characters after trimming (R42.5); the hostname default is cut to 100 characters because a hostname can be longer (Open issue 48).

**Schemas.** `ChecklistCreateSchema` (`text` stripped, 1 to 200, not blank), `ChecklistUpdateSchema` (`text`, `is_done` with `fields.Boolean(truthy={True}, falsy={False})` so only JSON booleans pass, `order` float greater than 0 and finite; `@validates_schema` rejects an empty body), `ChecklistItemSchema`, `CardLinkCreateSchema` (`url` validated by `validate_link_url`, optional `label`), `CardLinkUpdateSchema` (at least one field), `CardLinkSchema`, `CardDetailSchema` (A18). All use `unknown = RAISE`.

**Soft-delete cascades (extends A5).** One `deleted_at` per transaction as before:

| Deleted | Also soft deleted (V11 additions in bold) |
|---|---|
| Board | Memberships, Columns, Cards, Comments, **Checklist_Items, Card_Links** of the Board |
| Column | Cards of the Column, their Comments, **Checklist_Items, and Card_Links** |
| Card | Comments of the Card, **Checklist_Items, and Card_Links** |

Each bulk `UPDATE` uses the same parent-id subquery pattern as the Comment cascade and `is_deleted = false` in its WHERE. A failure rolls back the whole transaction (R2.13). Later GET requests for the Card return 404, because the Card itself is soft deleted.

### A18. Board payload counts and GET `/api/cards/<id>` (Requirements 41.9, 42.9, 44.4, 44.5, 29.2)

**Combined count query (`cards/service/counts.py`).**

```python
ck = (select(ChecklistItem.card_id, func.count().label("total"),
             func.count().filter(ChecklistItem.is_done.is_(True)).label("done"))
      .where(ChecklistItem.is_deleted.is_(False)).group_by(ChecklistItem.card_id).subquery())
lk = (select(CardLink.card_id, func.count().label("n"))
      .where(CardLink.is_deleted.is_(False)).group_by(CardLink.card_id).subquery())
select(Card.card_id, func.coalesce(ck.c.done, 0), func.coalesce(ck.c.total, 0), func.coalesce(lk.c.n, 0))
  .outerjoin(ck, ck.c.card_id == Card.card_id).outerjoin(lk, lk.c.card_id == Card.card_id)
  .where(Card.board_id == board_id, Card.is_deleted.is_(False))
```

Each subquery is grouped by `card_id`, so the left joins add no rows. `GET /api/boards/<id>` runs: (1) user lookup, (2) Board with membership, (3) Columns, (4) Cards, (5) counts. The counts are merged into each Card in Python by `card_id`. The total is 5 for any number of Cards (Property 71). Folding the counts into query 4 would give 4 and leave headroom; it is not chosen because it mixes ORM entity loading with aggregate subqueries (Open issue 57).

`counts_for_card(card_id)` runs the same query restricted to one Card and is used by the update and position responses; the create response uses `0, 0, 0` without a query. Search and My Tasks Cards carry no counts (Open issue 58).

**GET `/api/cards/<id>` (new, R41.9).** `get_card_for_reader`, then two queries (items ordered by `order`, `created_at`; links ordered by `created_at`). Response: the card fields of A11, `checklist` (`checklist_item_id`, `text`, `is_done`, `order`), `checklist_done`, `checklist_total`, `links` (`card_link_id`, `url`, `label`, `created_by`, `created_at`), and `link_count`. A guest gets 200; a non-participant gets 403; a missing or soft-deleted Card gets 404.

### A19. Overdue notification (Requirements 40, 13.4, 24)

**Placement.** `notifications/routes/overdue_routes.py` registers `GET /api/notifications/overdue` on the notifications blueprint; `notifications/service/` becomes a package with `notification_service.py` (V5 logic) and `overdue_service.py`. The route does not clash with `/api/notifications/<uuid:id>/read`.

**Pure function.**

```python
def days_overdue(due: date, today_utc: date) -> int:      # >= 1 for an overdue card
    return (today_utc - due).days
```

**Query (`overdue_service.list_overdue(user_id, today_utc)`).** `today_utc = datetime.now(timezone.utc).date()` is computed once in the route and passed in.

```python
base = (select(Card.card_id, Card.title, Card.due_date, Card.status, Column.name, Board.board_id, Board.name)
  .join(Column, Column.column_id == Card.column_id).join(Board, Board.board_id == Card.board_id)
  .join(BoardMembership, and_(BoardMembership.board_id == Card.board_id, BoardMembership.user_id == user_id,
                              BoardMembership.is_deleted.is_(False)))
  .where(Card.is_deleted.is_(False), Column.is_deleted.is_(False), Board.is_deleted.is_(False),
         Card.due_date.is_not(None), Card.due_date < today_utc, Card.status != "DONE",
         or_(and_(Card.assignee_id == user_id, BoardMembership.role.in_(("admin", "manager", "member"))),
             and_(Card.assignee_id.is_(None),   BoardMembership.role.in_(("admin", "manager"))))))
items = base.order_by(Card.due_date.asc(), Card.created_at.asc(), Card.card_id.asc()).limit(100)
total = select(func.count()).select_from(base.subquery())
```

- A Card due today is not overdue (`<`). `URGENT` is not done (`!= "DONE"`). A guest-only user gets an empty list and `total = 0` through the role filter (R40.3). An unassigned Card goes to the admin and every manager of the Board, never to a member or guest. An assigned Card goes only to its assignee.
- The response is `{ "data": { "items": [...], "total": N } }` with `card_id`, `title`, `due_date`, `status`, `column_name`, `board_id`, `board_name`, `days_overdue`. At most 100 items, `total` counts all matches (R40.5).
- No Notification row is written, `GET /api/notifications` and its `unread_count` are untouched, and there is no scheduled job (R40.6). Requests without a valid access token get 401 (R40.9).
- **Index.** `ix_cards_due_date` on `cards.due_date` (R40.7, R44.3). It is a plain index; the join to memberships bounds the rows, and a partial index on open cards is an optional later tuning (Open issue 64). Performance: 100 consecutive requests over 20 Boards and 2,000 Cards, p95 under 500 ms, same method as Requirement 29 (R40.8).

### A20. Members, role change, and invitations for managers (Requirements 9, 37, 43)

**Module placement (all in the `boards` package).** `boards/service/role_service.py` (new) holds `change_role`; `member_service.py` gets the updated removal rules; `boards/routes/member_routes.py` gets `PATCH /api/boards/<uuid:id>/members/<uuid:user_id>`; `MemberRoleSchema` (`role` required, string) goes into `boards/schema/member_schemas.py`.

**`PATCH /api/boards/<id>/members/<user_id>` (R43.5 to R43.11).** Order: the route validates the body (400 for a missing `role` or a non-string; `admin` and any other value are rejected by `decide_role_change` as `bad_request`, so every invalid value gives 400), then the service runs `require_board_manager` (404 for a missing Board, 403 for no membership or a `member` or `guest`), loads the target membership `FOR UPDATE` (404 when none), calls `decide_role_change(caller_role, target_role, new_role, target_is_owner)` where `target_is_owner = board.created_by == target.user_id`, maps `forbidden` to 403 and `bad_request` to 400, then updates the role, and when the new role is `guest`, sets `assignee_id = NULL` on every non-deleted Card of the Board assigned to that user in the same transaction (R43.10). No Notification is created (R43.11). Response 200: `user_id`, name, email, role. Because body validation runs first, an invalid body gives 400 even for a caller who would get 403 (Open issue 59).

**DELETE member (R9.6, R9.7).** `require_board_manager`, target lookup (404), `decide_member_removal`, then the V5 soft delete plus the assignee clearing of R9.11.

**Add member (R9.1).** `require_board_manager`; the new membership always has the role `member`, so a manager cannot add a higher role.

**Invite links.** `invite_service` and `invite_routes` switch their guard from `require_board_admin` to `require_board_manager`. Regenerate by a manager replaces one token exactly as for the admin. Accept is unchanged.

**Check order summary.** 401 token, 404 Board, 403 level, 400 owner rule (admin only), 403 rank rule, then the write.

### A21. V11 endpoint rows, shapes, and the other amended rows

Rows 34 to 42 extend the A11 table (legend: `Manager` = admin or manager; `Participant` = any role; `Member` = writer level, which now includes `manager`). Amended earlier rows are listed below the table.

| # | Method | Path | Auth / role | Request schema | Success | Error statuses | Requirement |
|---|---|---|---|---|---|---|---|
| 34 | GET | `/api/cards/<uuid:id>` | Participant | none | 200 card, `checklist`, `links`, counts | 403, 404 | 41.9, 42.9 |
| 35 | POST | `/api/cards/<uuid:id>/checklist` | Member | `ChecklistCreateSchema` | 201 item | 400 (incl. 51st item), 403, 404 | 41.2, 41.5, 41.6 |
| 36 | PATCH | `/api/checklist/<uuid:id>` | Member | `ChecklistUpdateSchema` | 200 item | 400, 403, 404 | 41.3, 41.6 |
| 37 | DELETE | `/api/checklist/<uuid:id>` | Member | none | 200 `{checklist_item_id}` | 403, 404 | 41.4 |
| 38 | POST | `/api/cards/<uuid:id>/links` | Member | `CardLinkCreateSchema` | 201 link | 400 (incl. 11th link, bad URL), 403, 404 | 42.2, 42.6, 42.7 |
| 39 | PATCH | `/api/links/<uuid:id>` | Member | `CardLinkUpdateSchema` | 200 link | 400, 403, 404 | 42.3, 42.6 |
| 40 | DELETE | `/api/links/<uuid:id>` | Member | none | 200 `{card_link_id}` | 403, 404 | 42.4 |
| 41 | GET | `/api/notifications/overdue` | JWT | none | 200 `{items, total}` | 401 | 40 |
| 42 | PATCH | `/api/boards/<uuid:id>/members/<uuid:user_id>` | Manager, rank rule | `MemberRoleSchema` | 200 member | 400, 403, 404 | 43.5 to 43.11 |

Amended rows: rows 11 and 13 (add and remove member) are `Manager` with the rank rule; rows 14 to 17 (columns) are `Manager`; rows 30 and 31 (invite links) are `Manager`; rows 8, 18, 19, 21 return the three counts in the Card JSON (board detail, create, update, position responses); the legend row `Member` of V6 now includes `manager`. The card JSON gains `checklist_done`, `checklist_total`, `link_count` (board detail and the three Card writes only, R44.5). POST and DELETE status codes follow R4.3: rows 35 and 38 return 201, rows 37 and 40 return 200 with an object.

## V12 Design: Backend (A22)

> This section is new in V12 and sits after A21 so the V11 numbering stays stable.

### A22. Board member and card counts (`boards/service/counts.py`, Requirements 47, 48.1)

> **V12 refinement (read first).** The bullets below the code block are the first V12 text and stay as history. Subsection "A22-R. Refined backend design" at the end of A22 replaces them where they differ: the module is `board_counts.py` (not `counts.py`), the schema change is a new `BoardSummarySchema` (not new fields on `BoardSchema` with `Meta.exclude`), POST uses literal counts, and the OpenAPI change adds a `BoardSummary` schema.

**V12 change.** GET, POST, and PATCH `/api/boards` now return `member_count` and `card_count` on every Board_Summary (R47.1); GET `/api/boards/<id>` is unchanged (R47.7, superseded nothing because `BoardDetailSchema` never gained the fields).

```python
# app/blueprints/boards/service/counts.py
"""Member and card counts for the board list, create, and update responses (R47)."""
from sqlalchemy import func, select
from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card
from app.extensions import db
from app.soft_delete import active

def counts_for_boards(board_ids):
    """`{board_id: (member_count, card_count)}` for the given Board ids, 0 for ids with none."""
    if not board_ids:
        return {}
    member_rows = db.session.execute(
        select(BoardMembership.board_id, func.count())
        .where(BoardMembership.board_id.in_(board_ids), active(BoardMembership))
        .group_by(BoardMembership.board_id)
    ).all()
    card_rows = db.session.execute(
        select(Card.board_id, func.count())
        .where(Card.board_id.in_(board_ids), active(Card))
        .group_by(Card.board_id)
    ).all()
    members = dict(member_rows)
    cards = dict(card_rows)
    return {bid: (members.get(bid, 0), cards.get(bid, 0)) for bid in board_ids}

def counts_for_board(board_id):
    """`(member_count, card_count)` of one Board (0, 0 when none)."""
    return counts_for_boards([board_id])[board_id]
```

- **`list_boards` (GET `/api/boards`, query budget R47.4).** Query 1 is the JWT user lookup (callback). Query 2 is the existing `Board` join `BoardMembership` select. Queries 3 and 4 are `counts_for_boards`'s two grouped queries over the returned Board ids (not one query per Board), so the total is 4 for 1 Board and 4 for 20 Boards — constant and within the budget R47.4 sets. `serialize_board` gains a `counts` parameter; `board_schema.dump` sets `board.member_count, board.card_count = counts` before dumping (same pattern as A18's `apply_counts` for Cards).
- **`create_board` (POST `/api/boards`).** No query is added: the creator's own membership makes `member_count = 1` and a fresh Board has `card_count = 0`, both literals (R47.5), not a call to `counts_for_board` (which would spend two queries establishing what is already known at creation time).
- **`update_board` (PATCH `/api/boards/<id>`).** After the name update and commit, one call to `counts_for_board(board_id)` (two queries, scoped to a single Board) supplies the current counts (R47.6). The endpoint's existing query budget (R44.4 applies only to GET `/api/boards/<id>`, R44.7) is not constrained by Requirement 44, so the two extra queries are acceptable; no new Correctness Property budget is written for PATCH because R47 states no PATCH query cap.
- **`BoardSchema` (`board_schemas.py`).** Gains `member_count = fields.Integer()` and `card_count = fields.Integer()`. `BoardDetailSchema(BoardSchema)` inherits the Meta/fields mechanism of Marshmallow but the service never sets `board.member_count` or `board.card_count` on a board object passed to `board_detail_schema.dump(...)`, so the two fields serialize as `None` unless excluded — to avoid emitting `member_count: null` on the detail response (which would violate R47.7's "no `member_count` and no `card_count`"), `BoardDetailSchema` declares `member_count = None` and `card_count = None` as `fields.Integer(dump_only=True, load_only=False)` is not suitable; instead `BoardDetailSchema` lists `class Meta: exclude = ("member_count", "card_count")` **(V12 change; this is the only way `BoardDetailSchema` differs from inheriting `BoardSchema` unchanged, and a backend test asserts the two keys are absent from the detail response, R48.1)**.
- **No migration.** No table, column, constraint, or index is added (R47.8); `counts_for_boards` reuses the existing FK indexes on `board_memberships.board_id` and `cards.board_id`.
- **`openapi.yaml` (R47.9).** The `Board` schema (used by `BoardEnvelope` for POST and PATCH, and by the GET `/api/boards` array response) gains:
  ```yaml
  member_count: { type: integer, minimum: 0, description: Count of non-deleted Board_Memberships of any role (V12) }
  card_count: { type: integer, minimum: 0, description: Count of non-deleted Cards regardless of Column, assignee, or status (V12) }
  ```
  `BoardDetail` (an `allOf` over `Board`) gets a sibling note that it does **not** carry these two fields (R47.7), documented as `BoardDetail` overriding `Board` with `not: { required: [member_count, card_count] }` is unnecessary complexity for OpenAPI 3.0; instead the design keeps `BoardDetail`'s `allOf` as-is and adds a prose `description` on the `BoardDetail` schema stating the exclusion, because `BoardDetailSchema`'s `Meta.exclude` already enforces it at runtime and OpenAPI is documentation, not a runtime contract here.

#### A22-R. Refined backend design (V12 refinement, checked against the code)

Code read: `app/blueprints/boards/service/board_service.py` (103 lines), `app/blueprints/boards/schema/board_schemas.py` (40 lines), `app/blueprints/boards/schema/__init__.py`, `app/blueprints/boards/routes/board_routes.py`, `app/blueprints/cards/service/counts.py`, `app/soft_delete.py`, `app/openapi.yaml`, `app/tests/conftest.py` (`query_counter`), `app/tests/test_board_detail.py`.

**Facts that change the first text.**
- `board_service.py` already imports `counts_for_board` from `app.blueprints.cards.service.counts` (per-card counts for GET detail). A second function with the same name from a boards `counts.py` would shadow it in the same module. The new module is therefore `app/blueprints/boards/service/board_counts.py`, and its functions are `board_counts(board_ids)` and `board_counts_one(board_id)`.
- `serialize_board` is called only by `create_board`, `list_boards`, and `update_board`; `get_board_detail` uses `board_detail_schema` directly. So the counts belong to the schema of `serialize_board` only.
- `BoardDetailSchema(BoardSchema)` inherits every declared field. Adding the counts to `BoardSchema` would need `Meta.exclude` in the detail schema. A separate subclass is simpler and leaves the detail schema untouched.

**Module `board_counts.py` (new, about 40 lines).**

```python
"""Member and card counts of Boards for the list, create, and update responses (R47, design A22-R)."""
from sqlalchemy import func, select
from app.blueprints.boards.schema import BoardMembership
from app.blueprints.cards.schema import Card
from app.extensions import db
from app.soft_delete import active

def _grouped(model, board_ids):
    rows = db.session.execute(
        select(model.board_id, func.count())
        .where(model.board_id.in_(board_ids), active(model))
        .group_by(model.board_id)
    ).all()
    return dict(rows)

def board_counts(board_ids):
    """`{board_id: (member_count, card_count)}`; two grouped queries for any number of ids, none for []."""
    if not board_ids:
        return {}
    members, cards = _grouped(BoardMembership, board_ids), _grouped(Card, board_ids)
    return {bid: (members.get(bid, 0), cards.get(bid, 0)) for bid in board_ids}

def board_counts_one(board_id):
    return board_counts([board_id])[board_id]
```

`BoardMembership` rows of every role count (R47.2); soft-deleted memberships and Cards are excluded by `active` (R47.3). A Card of a soft-deleted Column is already soft deleted by the cascade (A5, A17), so no Column join is needed. `boards/service` importing `cards/schema` follows D3 and D4 (models only from another package's `schema`).

**Schema (`board_schemas.py`, +8 lines).**

```python
class BoardSummarySchema(BoardSchema):
    """Board_Summary of GET, POST, and PATCH /api/boards (R47.1): BoardSchema plus the two counts."""
    member_count = fields.Integer()
    card_count = fields.Integer()
```

`BoardSchema` and `BoardDetailSchema` are unchanged, so GET `/api/boards/<id>` keeps exactly its current keys (R47.7) with no `Meta.exclude`. `schema/__init__.py` exports `BoardSummarySchema`.

**Service (`board_service.py`, about +10 lines, stays far below 300).**
- `board_schema = BoardSummarySchema()`; `serialize_board(board, role, counts)` sets `board.my_role = role` and `board.member_count, board.card_count = counts` before dumping.
- `create_board`: `serialize_board(board, ADMIN, (1, 0))`. The creator's membership is the only one and a new Board has no Card, inside the same transaction, so literals are exact and cost no query (R47.5).
- `list_boards`: after the existing select, `counts = board_counts([b.board_id for b, _ in rows])` and `serialize_board(board, role, counts[board.board_id])`.
- `update_board`: after `commit`, `serialize_board(board, membership.role, board_counts_one(board_id))` (R47.6). The commit expires `board`, so dumping reloads it with one primary-key select; PATCH has no stated budget (Open issue 69).

**Query budget of GET `/api/boards` (R47.4).** 1 the JWT user lookup, 2 the Board and role select, 3 the membership counts, 4 the card counts. Total 4 for 1 Board and for 20 Boards. A User with 0 Boards runs 2 queries (the helper returns early); R47.4 compares 1 and 20 Boards only, so this is allowed and the test compares 1 against several Boards.

**OpenAPI (`openapi.yaml`, R47.9).** A new component `BoardSummary` (`allOf: [Board, {member_count: integer >= 0, card_count: integer >= 0, both required}]`) with descriptions from R47.2 and R47.3. The GET `/api/boards` array items (now `$ref: BoardSummary`, line 238 today) and `BoardEnvelope.data` (line 1614, used by POST line 215 and PATCH line 297) point to `BoardSummary`. `Board` and `BoardDetail` (`allOf: [Board, ...]`) stay unchanged, so the documented detail shape has no counts, matching the runtime.

**No migration (R47.8).** No model, column, constraint, or index change. `board_memberships.board_id` and `cards.board_id` are already indexed (Requirement 29 criterion 3, Data Models).

**Routes.** `board_routes.py` is unchanged; it already passes the service result to `ok(...)`.

## V11 Design: Frontend (B16 to B21)

### B16. Roles, `can(role, action)`, and the member panel (Requirements 21.12, 21.13, 37.17, 43.13 to 43.15)

**`lib/roles.ts` (pure).**

```ts
export type Role = "admin" | "manager" | "member" | "guest";
export const ROLE_RANK: Record<Role, number> = { guest: 0, member: 1, manager: 2, admin: 3 };
export type Action = "view_board" | "edit_cards" | "manage_columns" | "manage_members" | "view_invite_links"
  | "change_roles" | "grant_manager" | "edit_board" | "delete_board" | "view_analytics";
const MIN_RANK: Record<Action, number> = { view_board: 0, edit_cards: 1, manage_columns: 2, manage_members: 2,
  view_invite_links: 2, change_roles: 2, grant_manager: 3, edit_board: 3, delete_board: 3, view_analytics: 3 };
export function can(role: Role | null, action: Action): boolean { return role !== null && ROLE_RANK[role] >= MIN_RANK[action]; }
export function assignableRoles(role: Role | null): Role[] {           // admin: guest, member, manager; manager: guest, member; others: none
  return role === "admin" ? ["guest", "member", "manager"] : role === "manager" ? ["guest", "member"] : []; }
export function canActOnMember(role: Role | null, targetRole: Role): boolean {   // dropdown and remove control
  return role !== null && can(role, "change_roles") && ROLE_RANK[role] > ROLE_RANK[targetRole]; }
export const ROLE_VARIANT: Record<Role, "yellow" | "blue" | "green" | "gray"> =
  { admin: "yellow", manager: "blue", member: "green", guest: "gray" };
```

(The four variants are pairwise distinct, R43.15.) `can` mirrors the requirement-43 permission rule and is used only to show, hide, or disable controls; the server decides (R43.13, R28.14). It replaces `canEdit`, `isAdmin`, and `isGuest` (B6-V6 note). `BoardRoleContext` now provides `{ role, can }`.

**Gating (V11; replaces the V6 table).**

| Element | Needs | admin | manager | member | guest |
|---|---|---|---|---|---|
| Add column, rename, delete, reorder | `manage_columns` | shown | shown | hidden | hidden |
| Add card, drag, status, assignee, checklist, links, comments form | `edit_cards` | shown | shown | shown | hidden or read-only |
| Member panel (list, add by email, remove, role dropdown) | `manage_members` | shown | shown | hidden | hidden |
| Invite links panel | `view_invite_links` | shown | shown | hidden | hidden |
| Analytics link | `view_analytics` | shown | hidden | hidden | hidden |
| Rename and delete Board controls (if present) | `edit_board` | shown | hidden | hidden | hidden |

`useDragAndDrop({ enabled: can(role, "edit_cards") })`. The role dropdown in `MemberList` lists `assignableRoles(myRole)` and is rendered only when `canActOnMember(myRole, row.role)`; the remove control follows the same condition. Changing a role sends PATCH `/api/boards/<id>/members/<user_id>`, updates the row only after 200 (revert on error with `useErrorHandler`), and, when the new role is `guest`, the board state clears the user's assignments locally. `BaseBadge` shows each role with its distinct variant (R43.15). The member panel adds `RoleSelect.tsx` (one component).

### B17. Status and label color maps (Requirements 39.5 to 39.11, 23.17, 21.22, 25.2)

**`lib/status.ts` (pure; supersedes the V6 version).**

```ts
export const CARD_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];
export const STATUS_STYLE: Record<CardStatus, { label: string; variant: "gray" | "blue" | "red" | "green"; className: string }> = {
  NOT_STARTED: { label: "Not started", variant: "gray",  className: "bg-sunken text-ink-muted" },
  IN_PROGRESS: { label: "In progress", variant: "blue",  className: "bg-primary-100 text-primary-700" },
  URGENT:      { label: "Urgent",      variant: "red",   className: "bg-danger-soft text-danger-ink" },
  DONE:        { label: "Done",        variant: "green", className: "bg-success-soft text-success-ink" },
};
export const STATUS_LABEL = (s: CardStatus) => STATUS_STYLE[s].label;
```

Every class string is written out in full, never built from a template. The exact token names (`bg-success-soft`, `text-success-ink`, and so on) are checked against `globals.css` and `guidelines/design-system.md` at implementation time; where a pair is missing, the design system gets it first (R39.10). `StatusBadge` renders `BaseBadge` with `STATUS_STYLE[status].variant` (keeps R18.4), and a test asserts that `className` and the `BaseBadge` variant classes agree. `className` is also used by non-badge elements (the status select dot, the Card face chip in the compact meta row). `StatusSelect` offers the four options in the order of `CARD_STATUSES`. The board Card, `CardDetailModal`, and My Tasks row all render `StatusBadge`, so the three places agree (R39.6, Property 62).

**`lib/labelColor.ts` (pure).**

```ts
export const LABEL_KEYS = ["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink"] as const;
export type LabelKey = (typeof LABEL_KEYS)[number];
export function normalizeLabel(text: string): string { return text.trim().normalize("NFC").toLowerCase(); }
export function labelColor(text: string): LabelKey {                       // FNV-1a 32 bit, no Math.random, no Date
  let h = 0x811c9dc5; for (const ch of normalizeLabel(text)) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return LABEL_KEYS[h % LABEL_KEYS.length]; }
export const LABEL_CLASS: Record<LabelKey, string> = {
  gray: "bg-label-gray-bg text-label-gray-fg", blue: "bg-label-blue-bg text-label-blue-fg", /* ...one full string per key... */ };
```

The result depends only on the normalized text, so it is the same on every Board and device and the same for texts that differ only in case or surrounding whitespace (R39.8). Each `LABEL_CLASS` value is a complete static string of two token classes whose contrast is at least 4.5:1 (documented pairs of the design system). The eight pair names above follow the `label-*-bg|fg` tokens already in `globals.css` (B13); keys that the design system lacks are added there first (Open issue 46). `globals.css` gains `@source "../lib";` so the Tailwind scanner sees `lib/status.ts` and `lib/labelColor.ts` (D23, Open issue 45). Label chips on the Card face and in the modal render `<span className={`${CHIP_BASE} ${LABEL_CLASS[labelColor(text)]}`}>` where `CHIP_BASE` is a static string.

### B18. Card face, checklist and links sections, `CardDetailModal` (Requirements 41.12 to 41.17, 42.11 to 42.16, 23, 40.14)

**Card face (`CardItem.tsx`, meta row, in this order).** Labels with `labelColor`; `StatusBadge`; overdue chip; link-count chip; and below the row the checklist progress. The row is `flex flex-wrap gap-1`.

- **Overdue chip:** shown iff `isOverdue(card.due_date, card.status, todayUtc())` with the classes `bg-danger-soft text-danger-ink`, text "Overdue", no request (R40.14). `lib/overdue.ts` (pure): `todayUtc(now = new Date()) = now.toISOString().slice(0, 10)`, `isOverdue(due, status, today) = due !== null && due < today && status !== "DONE"` (string comparison of ISO dates is exact), `formatOverdue(n) = n === 1 ? "1 day overdue" : `${n} days overdue``.
- **Link chip:** icon plus `link_count`, rendered iff `link_count > 0` (R42.15).
- **Checklist progress:** rendered iff `checklist_total > 0`: text `${done}/${total}` and a bar: track `h-1 rounded-full bg-sunken`, fill `h-1 rounded-full bg-primary-500` with `style={{ width: `${pct}%` }}` where `pct = Math.round(done / total * 100)` (a computed width cannot be a static class; the colors are static strings). `lib/progress.ts` holds `progressPercent(done, total)` (0 for total 0).
- A guest sees the same face, read-only.

**`CardDetailModal` composition (V11).** The shell and `CardDetailForm` stay as in B7-V6. New children, one component per file: `ChecklistSection.tsx` (with `ChecklistItemRow.tsx`, `AddChecklistForm.tsx`) and `LinksSection.tsx` (with `LinkRow.tsx`, `LinkForm.tsx`). On open the modal sends `GET /api/cards/<id>` (A18), which supplies the items and links; the status select shows the four options.

- **Checklist:** checkbox, text (inline edit on Enter or blur), delete control; add form with the field-level error for empty, whitespace-only, or over 200 characters (no request); at 50 items the add form is disabled and shows "Limit of 50 items reached". Toggle: `hooks/useChecklist.ts` applies `is_done` to local state at once (within 100 ms), sends PATCH `/api/checklist/<id>`, and on failure restores the value and calls `handleError` once (R41.14). Add, edit, delete failures leave the list unchanged, keep the entered text, and call `handleError` (R41.15). After every successful change the modal calls `onCountsChanged(cardId, { checklist_done, checklist_total, link_count })` so the Card face updates without a reload (R41.17).
- **Links:** list of label, hostname, provider icon, and an open anchor `<a href={url} target="_blank" rel="noopener noreferrer">` (label rendered as text, never `dangerouslySetInnerHTML`); add form (URL, optional label) and edit and delete controls for writers. `validateLinkUrl` in `lib/validation.ts` mirrors `validate_link_url` (trim, at most 2048, no whitespace, `http` or `https`, hostname) and blocks the request with a field error (R42.13). `lib/linkProvider.ts`: `providerKey(hostname)` returns `"gdrive" | "onedrive" | "dropbox" | "notion" | "generic"` by exact host or subdomain suffix (`drive.google.com`, `docs.google.com`, `onedrive.live.com`, `1drv.ms`, `dropbox.com`, `notion.so`, `notion.site`); the icon is a generic lucide icon per key (no brand marks, because lucide has none, see B15). Failures keep the list and the entered values and call `handleError` (R42.16). The hostname is shown next to every label so a misleading label is visible (Open issue 55).
- **Guest:** both sections render read-only (no add form, no edit, no delete, checkboxes disabled), R41.12, R42.11.

### B19. Overdue UI (Requirements 40.10 to 40.15, 24)

- `hooks/useOverdue.ts` returns `{ items, total, refresh }`. It calls `refresh()` once on mount when the AuthContext status is `authenticated` and again each time the notification list opens. There is no timer. A failed request keeps the previous items and shows no toast (R40.15). The call is made through `apiRequest` with the access token.
- `NotificationBell` still shows `formatBadge(unreadCount)` from the stored notifications only; overdue items never change the count (R40.12). `NotificationList` renders an "Overdue" group above the stored items: each row has a red `BaseBadge` "Overdue", the text from `formatOverdue(days_overdue)`, the card title, and the board name; selecting a row navigates to `/boards/<board_id>` and closes the list (R40.11). The empty-state message appears only when both the stored list and the overdue list are empty (R40.13).
- "Page load" means the first mount of the Header in a browser session or a full reload; client-side navigation does not remount the Header, so the list refreshes when it is opened (Open issue 50). The Card-face chip uses the client's UTC date; the list uses the server's UTC date, so they can differ for a few seconds around midnight UTC (Open issue 51).

### B20. Types (`lib/types.ts` additions) and welcome copy

```ts
export type Role = "admin" | "manager" | "member" | "guest";                          // V11: manager added
export type CardStatus = "NOT_STARTED" | "IN_PROGRESS" | "URGENT" | "DONE";           // V11: URGENT added
export interface BoardCard extends Card { checklist_done: number; checklist_total: number; link_count: number }
export interface ChecklistItem { checklist_item_id: string; card_id: string; text: string; is_done: boolean; order: number }
export interface CardLink { card_link_id: string; card_id: string; url: string; label: string; created_by: string; created_at: string }
export interface CardDetail extends BoardCard { checklist: ChecklistItem[]; links: CardLink[] }
export interface OverdueItem { card_id: string; title: string; due_date: string; status: CardStatus; column_name: string;
  board_id: string; board_name: string; days_overdue: number }
export interface OverdueResult { items: OverdueItem[]; total: number }
export interface MemberRoleUpdate { role: "guest" | "member" | "manager" }
```

`Column.cards` becomes `BoardCard[]`; search and My Tasks results stay `Card` (no counts). `Member.role` uses the four-value `Role`.

**Welcome page copy (R38.17 to R38.19).** The feature card text in B13 "Add labels, due dates, and a status (Not started, In progress, or Done) to every card." becomes "Add labels, due dates, and a status (Not started, In progress, Urgent, or Done) to every card." (`WELCOME_COPY` and `FEATURES`). The preview sample statuses may include one "Urgent" chip. `FORBIDDEN_CLAIMS` in `lib/forbiddenClaims.ts` must not contain "checklist" (it is now a real feature) and keeps "subtask" and every other entry. Property 60 is unchanged otherwise.

### B21. Files added or changed in the V11 frontend (B1 tree note)

New: `lib/labelColor.ts`, `lib/overdue.ts`, `lib/progress.ts`, `lib/linkProvider.ts`, `hooks/useChecklist.ts`, `hooks/useOverdue.ts`, `components/cards/ChecklistSection.tsx`, `ChecklistItemRow.tsx`, `AddChecklistForm.tsx`, `LinksSection.tsx`, `LinkRow.tsx`, `LinkForm.tsx`, `components/boards/RoleSelect.tsx`, `components/notifications/OverdueItemRow.tsx`. Changed: `lib/roles.ts`, `lib/status.ts`, `lib/types.ts`, `lib/validation.ts` (`validateLinkUrl`, `validateChecklistText`), `components/boards/BoardView.tsx`, `KanbanColumn.tsx`, `ColumnHeader.tsx`, `AddColumnForm.tsx`, `MemberPanel.tsx`, `MemberList.tsx`, `InviteLinksPanel.tsx` (gating by `can`), `components/cards/CardItem.tsx`, `CardDetailModal.tsx`, `StatusSelect.tsx`, `components/shared/StatusBadge.tsx`, `NotificationBell.tsx`, `NotificationList.tsx`, `app/globals.css` (`@source "../lib";`). `CardItem.tsx` and `BoardView.tsx` are already near 300 lines, so the meta row moves to `CardMetaRow.tsx` (one component) and any search-result list stays in `SearchResultList.tsx` (V8 plan). No page, route, or `proxy.ts` change.

## V12 Design: Frontend (B22 to B25)

> These sections are new in V12 and sit after B21 so the V11 numbering stays stable.

### B22. Board rename and delete controls (Requirements 45, 48.6)

> **V12 refinement.** Where this section and B27 differ, B27 wins: the displayed name lives in `BoardToolbar` (not in `BoardView`), `DeleteBoardControl` calls `router.push("/")` itself, both success paths record a Board_Patch (B26), and the ConfirmDialog ignores Escape and backdrop while the request runs.

**New files (D25), one component or hook per file, none over 300 lines.**

- **`components/boards/RenameBoardModal.tsx`** (new, one component). Props: `open`, `boardId`, `currentName`, `onClose`, `onRenamed(newName: string)`. Internals mirror `CreateBoardModal.tsx` closely: a `BaseModal` with one text input pre-filled with `currentName`, `validateBoardName` from `lib/validation.ts` (reused unchanged, R45.5 uses the same 1-to-100-trimmed rule as board creation), a submit `BaseButton`. On submit: if the trimmed name equals `currentName.trim()`, close with no request (R45.7); otherwise `apiRequest<BoardSummary>(PATCH /api/boards/${boardId}, { body: { name } })`, and on success call `onRenamed(data.name)`, `showSuccess("Board renamed.")`, and close; on failure keep the modal open with the entered text and call `handleError` (R45.8), matching `CreateBoardModal`'s existing error handling shape.
- **`components/boards/DeleteBoardControl.tsx`** (new, one component). Props: `boardId`, `boardName`, `onDeleted()`. Renders a `BaseButton` ("Delete board") that opens a `ConfirmDialog` (reused unchanged from `components/shared/ConfirmDialog.tsx`, already used for "destructive actions such as deleting boards" per its own doc comment) with `message` naming the Board and stating Columns, Cards, and Comments are deleted with it (R45.9). Cancel closes with no request (R45.10). Confirm sets `busy` (disables the dialog's own buttons through `ConfirmDialog`'s existing `busy` prop, R45.11), sends `DELETE /api/boards/${boardId}`, and on 200 calls `onDeleted()` and `showSuccess("Board deleted.")`; on failure clears `busy`, keeps the `ConfirmDialog` open (R45.13), and calls `handleError`.
- **`BoardToolbar.tsx` (changed).** Adds two props, `onBoardRenamed: (name: string) => void` and `boardId` is already a prop. Computes `showRename = can(role, "edit_board")` and `showDelete = can(role, "delete_board")` (R45.1 to R45.3, reusing the existing `can` helper and action names, no new `Action` value added to `lib/roles.ts`). Renders a "Rename" `BaseButton` (opens `RenameBoardModal`, local `renameOpen` state) and `DeleteBoardControl` next to the existing Members/Analytics buttons, visible only for the roles that satisfy `edit_board`/`delete_board` (currently only `admin`, matching the V11 `MIN_RANK` table — R45.3 is therefore already satisfied by the existing rank table and needs no change to `lib/roles.ts`). On `RenameBoardModal`'s `onRenamed`, `BoardToolbar` calls the new `onBoardRenamed` prop so `BoardView` can update the displayed name without a page reload (R45.6).
- **`BoardView.tsx` (changed, stays at or below 291 + a few lines).** Adds a `boardName` local state initialized from `board.name`, passed to `BoardToolbar` as `boardName={boardName}` instead of `board.name` directly, and an `onBoardRenamed={setBoardName}` handler passed to `BoardToolbar`. On successful delete (`DeleteBoardControl`'s `onDeleted`), calls `router.push("/")` (Next.js client-side navigation to the Dashboard, which is `force-dynamic`, D27). These are the only two `BoardView.tsx` changes; the rename/delete UI itself lives in the two new files (D25), keeping the net line growth of `BoardView.tsx` under ten lines.
- **Display-only gating (R45.14).** As with every other `can(...)` check in the codebase (B16), hiding the two controls for non-admins is cosmetic; the existing PATCH/DELETE `/api/boards/<id>` endpoints already return 403 to a non-admin (A9's `require_board_admin`), so no backend change accompanies this section.

### B23. My Tasks deep link (Requirements 46, 48.6)

> **V12 refinement.** Where this section and B27 differ, B27 wins: the hook returns `{ onModalClose }` instead of `void` (the first text named a `clearDeepLinkParam` callback but gave a `void` signature), the parsing and matching move to the pure module `lib/deepLink.ts`, the URL is rebuilt with `URLSearchParams` so other query parameters and the hash survive, and the dependency array is complete with a ref guard instead of an omitted dependency.

- **`MyTasksList.tsx` (changed).** The per-task `<Link href={`/boards/${card.board_id}`}>` around `card.title` (current behavior) becomes `<Link href={`/boards/${card.board_id}?card=${card.card_id}`}>` **(V12 change: supersedes the plain per-task board link; the group-level "Open board" link right above it, `href={`/boards/${group.board_id}`}`, is unchanged, R46.2)**. No new file is needed for this one-line target change; it stays inside `MyTasksList.tsx` because it is a single JSX attribute, not new logic, so it does not count against the "separate files" rule of R48.6, which names the rename form, delete flow, and deep-link *handling* (the board-side modal-opening logic), not the one-line link on the My Tasks side.
- **`hooks/useCardDeepLink.ts`** (new, one hook, D25). Pure-ish hook, not a pure function, because it manages one-shot modal-open state and a `window.history.replaceState` side effect:
  ```ts
  export function useCardDeepLink(
    initialCardId: string | null,
    columns: Column[],
    openCard: (card: BoardCard) => void
  ): void {
    const openedRef = useRef(false);
    useEffect(() => {
      if (openedRef.current || !initialCardId) return;
      openedRef.current = true; // at most once per page load (R46.8)
      const found = columns.flatMap((c) => c.cards).find((c) => c.card_id === initialCardId);
      if (found) openCard(found); // not as a new card; same path as a click (R46.3)
      // an unknown id (R46.4): no modal, no error, no toast — simply do nothing further
    }, [initialCardId]); // columns and openCard intentionally excluded: a later column refresh must not re-trigger
  }
  ```
  `BoardView` calls `useCardDeepLink(initialCardId, columns, (card) => { setSelectedCard(toBoardCard(card)); setSelectedCardIsNew(false); })` once, passing the same `setSelectedCard`/`setSelectedCardIsNew` path a click already uses (R46.3). Because `columns` is read once from the ref-guarded effect's closure at the first run only (the dependency array omits `columns`), a card that arrives only after the members fetch or a later re-render is still matched against the `columns` prop as it was on mount; this is acceptable because `columns` comes from the initial `board.columns` server payload and does not change shape before the effect runs (React runs effects after the first paint of the same render that already has `columns` populated).
- **Closing the modal removes the parameter (R46.7, D26).** `BoardView`'s existing `onClose` handler for `CardDetailModal` (`() => { setSelectedCard(null); setSelectedCardIsNew(false); }`) gains one line: if the card being closed is the one the deep link opened (tracked by a `deepLinkCardIdRef` inside `useCardDeepLink`, exposed as a returned `clearDeepLinkParam()` callback), call `window.history.replaceState(null, "", window.location.pathname)` to strip the `card` parameter, matching the documented "Native History API" `replaceState` example of stripping/changing a query parameter without a new history entry and without a Next.js request (D26). A card closed that was opened by a click (not the deep link) does not touch the URL, because it never had a `card` parameter to remove.
- **Malformed, soft-deleted, or cross-board id (R46.4), empty or repeated values (R46.5).** `useCardDeepLink`'s `.find(...)` naturally returns `undefined` for any id absent from the board's own non-deleted Cards (a soft-deleted or cross-board Card is already excluded from `board.columns` by the existing `active(Card)` filter in `get_board_detail`, A9), so no extra backend check is needed; the hook simply does nothing when `found` is `undefined`. Parsing an empty or repeated `card` value into "the first non-empty value, or null" happens one layer up, in B24 below, not inside this hook, keeping the hook's input a single resolved `string | null`.
- **403/404 board (R46.6).** Unaffected: the board page already renders `BoardAccessMessage` before `BoardView` (and therefore before `useCardDeepLink`) mounts at all when the GET `/api/boards/<id>` request throws a 403/404 `ApiError` (existing `web/app/(boards)/boards/[id]/page.tsx` catch block), so the `card` parameter is already ignored in that path with no code change.

### B24. Reading `searchParams` in the board page (Requirement 46 criterion 9, D26)

**V12 change** to `web/app/(boards)/boards/[id]/page.tsx` (supersedes nothing structural; the file had no `searchParams` prop before V12).

```tsx
export default async function BoardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ card?: string | string[] }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawCard = resolvedSearchParams.card;
  const cardParam = Array.isArray(rawCard) ? rawCard[0] : rawCard; // first value wins (R46.5)
  const initialCardId = cardParam && cardParam.length > 0 ? cardParam : null; // empty counts as absent (R46.5)
  // ...unchanged token/apiRequest/error-handling logic...
  return <BoardView board={board} initialCardId={initialCardId} />;
}
```

This follows the documented `page.md` `searchParams` convention read in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` ("A promise that resolves to an object containing the search parameters of the current URL"; `{ [key: string]: string | string[] | undefined }`), confirming R46.9's requirement to consult that file before specifying the API. `BoardView` gains one new prop, `initialCardId: string | null`, consumed only by `useCardDeepLink` (B23). `decideRoute` (R17.12) and the `next` rule (R19.11) are untouched: an unauthenticated request for `/boards/<id>?card=<card_id>` still 401s at `getServerToken`/`apiRequest`, triggers the existing `redirect("/login?expired=1")` branch, and the query string is not part of that redirect target, so it is dropped exactly as R46.10 requires **(V12 change note: this is the same pre-existing redirect branch, not a new one; nothing in `proxy.ts` or `decideRoute.ts` changes)**.

### B25. Board_Summary counts, types, and Board card text (Requirements 47.10 to 47.13, 48.2, 48.6)

- **`lib/types.ts` (changed).** `BoardSummary` gains two required fields:
  ```ts
  export interface BoardSummary {
    board_id: string;
    name: string;
    my_role: Role;
    created_at: string;
    updated_at?: string;
    member_count: number; // V12
    card_count: number;   // V12
  }
  ```
  `BoardDetail extends BoardSummary` would now inherit the two fields even though the backend never sends them on the detail response (R47.7); the design accepts this one documented divergence between the TypeScript shape and the wire shape **(V12 change; open issue, see Open issue 68)** rather than breaking the existing `BoardDetail extends BoardSummary` inheritance that the rest of the codebase (`BoardView`, `BoardAccessMessage`, every board test) relies on for the shared fields `board_id`, `name`, `my_role`.
- **Board card text (`BoardList.tsx`, changed).** A new pure function in `lib/format.ts`, `formatCount(n: number, noun: string): string`, returns `` `${n} ${noun}${n === 1 ? "" : "s"}` `` (R47.11's rule: singular only for exactly 1; 0 and every value above 1 use the plural). `BoardList.tsx`'s `<li>` gains a line below the existing name/badge row: `<p className="text-xs text-ink-muted mt-1">{formatCount(board.member_count, "member")} · {formatCount(board.card_count, "card")}</p>`. The Board card stays exactly one `<Link>` wrapping the whole card (R47.13; unchanged from the existing structure, which already wraps name and badge in one anchor).
- **Create flow (R47.12).** `CreateBoardModal.tsx`'s existing `onCreated(board)` callback already receives the full POST response and prepends it to `BoardList`'s local `boards` state with no new list request; because `create_board` now always returns `member_count: 1, card_count: 0` (A22), this flow needs no code change beyond the type update above — the new Board immediately shows "1 member · 0 cards".
- **No client-side counting (R47.13).** No component sums `columns[].cards.length` or `members.length` for display; the Dashboard only ever reads `board.member_count`/`board.card_count` off the `BoardSummary` the server already sent.
- **`openapi.yaml` / `BoardSummary` cross-reference.** See A22's `openapi.yaml` paragraph; the TypeScript `BoardSummary` interface above matches the `Board` schema's new `member_count`/`card_count` properties field-for-field. **V12 refinement:** it matches the new OpenAPI `BoardSummary` component of A22-R, not `Board`.
- **V12 refinement (types).** `BoardDetail` stops extending `BoardSummary`. A new `BoardBase` holds `board_id`, `name`, `my_role`, `created_at`, `updated_at?`; `BoardSummary extends BoardBase` adds the two counts and `BoardDetail extends BoardBase` adds `columns`. `grep` over `web/` finds `BoardDetail` only in the board page, `BoardView`, and tests, and no place passes a `BoardDetail` where a `BoardSummary` is expected, so the change compiles without other edits and the type matches the wire shape (R47.7). This resolves Open issue 68.
- **V12 refinement (Board card markup).** The counts line is `<p className="mt-1 text-xs text-ink-muted">` inside the existing single `<Link>`, with the two texts as two `<span>` elements separated by an `aria-hidden` dot, so tests can find "1 member" and "0 cards" as separate texts. `formatCount` handles only non-negative integers; the server guarantees that (A22-R).

### B26. Dashboard freshness after rename and delete (Requirements 45.12, 20.10; D27 refinement)

Docs read: `01-app/04-glossary.md` (Client Cache: pages are not cached by default but are reused during back and forward navigation), `01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md` (`dynamic` default 0 s; does not change back/forward caching), `01-app/03-api-reference/04-functions/use-router.md` (`push`, `refresh`, `bfcacheId`), `01-app/01-getting-started/04-linking-and-navigating.md` (client-side transitions, Native History API). `next.config.ts` does not enable `cacheComponents` or `staleTimes`.

**`lib/boardPatches.ts` (pure, new).**

```ts
export interface BoardPatches { renamed: Record<string, { name: string; updated_at: string }>; deleted: string[] }
export const EMPTY_PATCHES: BoardPatches = { renamed: {}, deleted: [] };
export const BOARD_PATCHES_KEY = "kano_board_patches";
export function parsePatches(raw: string | null): BoardPatches          // invalid or missing JSON -> EMPTY_PATCHES
export function withRename(p: BoardPatches, id: string, name: string, updatedAt: string): BoardPatches
export function withDelete(p: BoardPatches, id: string): BoardPatches   // also drops a rename of that id
export function applyBoardPatches(boards: BoardSummary[], p: BoardPatches): BoardSummary[]
// keeps the order; removes ids in p.deleted; for a renamed id sets name and updated_at only when
// the listed updated_at is missing or older than the patch's (ISO strings from the server, compared as Date)
```

**`hooks/useBoardPatches.ts` (new, one hook).** `useBoardPatches(): BoardPatches` reads `sessionStorage[BOARD_PATCHES_KEY]` through `useSyncExternalStore` (subscribe to `storage` events and to an in-tab event the writers dispatch; server snapshot `null`, so hydration renders the server list and the client re-renders with the patches). Two writer functions in the same file, `recordRename(id, name, updatedAt)` and `recordDelete(id)`, read, update with `withRename`/`withDelete`, write back, and dispatch the in-tab event. A `sessionStorage` failure (private mode, quota) is caught and ignored: the Dashboard then falls back to the server list, which is fresh on every push navigation.

**`BoardList.tsx` (changed).** `const patches = useBoardPatches(); const shown = applyBoardPatches(boards, patches);` and the list, the empty state, and the counts render from `shown`. `CreateBoardModal`'s `onCreated` still prepends to `boards` (R47.12). The data in the patches is what the server returned to the PATCH request or the id that DELETE removed, so no count or name is computed in the browser (R47.13).

**Flows.** Rename then the toolbar "Boards" link (`<Link href="/">`, push): the server renders `/` with the new name; the patch is a no-op. Delete: `router.push("/")` renders `/` fresh; the deleted Board is absent; the patch is a no-op. Either flow then the browser back button to an older Dashboard entry: the cached payload still has the old data and `applyBoardPatches` corrects it before paint after hydration. The patches live for the browser tab session (`sessionStorage`) and are small (one entry per renamed or deleted Board).

### B27. Refined frontend wiring (V12 refinement of B22 to B24, checked against the code)

Code read: `web/components/boards/BoardView.tsx` (291 lines), `BoardToolbar.tsx` (80), `BoardList.tsx` (87), `CreateBoardModal.tsx` (98), `components/shared/ConfirmDialog.tsx`, `components/shared/BaseModal.tsx`, `components/cards/MyTasksList.tsx`, `components/cards/CardDetailModal.tsx`, `web/app/(boards)/page.tsx`, `web/app/(boards)/boards/[id]/page.tsx`, `lib/roles.ts`, `lib/types.ts`, `lib/validation.ts`, `lib/format.ts`, `lib/toast.ts`, `web/__tests__/dashboard.test.tsx`, `boardRoles.test.tsx`, `myTasksAndProfile.test.tsx`, `web/e2e/kanban.spec.ts`, `web/e2e/support/credentials.ts`.

**Facts from the code.**
- `lib/roles.ts` already has `edit_board: 3` and `delete_board: 3`, so only the admin sees the controls (R45.1 to R45.3) with no change to `roles.ts`.
- `ConfirmDialog` already has a `busy` prop that disables both buttons, but its `BaseModal` calls `onCancel` on Escape and on a backdrop click whatever `busy` is.
- `CardDetailModal` sends `GET /api/cards/<id>` on every open (V11, A18, line 81), for a click and for a deep link alike.
- `BoardView` repeats `setSelectedCard(toBoardCard(card)); setSelectedCardIsNew(false);` in two places (search results, Kanban columns).

**`BoardToolbar.tsx` (changed, about 80 to 115 lines).** Gains state `displayName` (initialized from `boardName`) and `renameOpen`. Renders, when `can(role, "edit_board")`, a secondary `BaseButton` "Rename board" (lucide `Pencil`) that opens `RenameBoardModal`, and, when `can(role, "delete_board")`, `DeleteBoardControl`. The `h1` shows `displayName`. `onRenamed(board)` sets `displayName = board.name` and calls `recordRename(board.board_id, board.name, board.updated_at)` (B26). No new prop is needed: `boardId`, `boardName`, and `role` are already props.

**`RenameBoardModal.tsx` (new, about 100 lines).** As B22, with: input id `rename-board-input`, label "Board name"; the field is re-filled with `currentName` each time the modal opens; validation with `validateBoardName` (same 1 to 100 trimmed rule as creation, R45.5); `trim() === currentName.trim()` closes with no request (R45.7); success calls `onRenamed(updated)` with the `BoardSummary` of the PATCH response, `showSuccess("Board renamed.")`, and closes (R45.6); failure keeps the modal open with the text and calls `handleError` (R45.8). Submit and Cancel are disabled while `busy`.

**`DeleteBoardControl.tsx` (new, about 70 lines).** A destructive `BaseButton` "Delete board" (lucide `Trash2`) opens `ConfirmDialog` with title "Delete board", message `Delete "<name>"? Its columns, cards, and comments are deleted with it.` (R45.9), confirm label "Delete board". `onCancel` closes only when not `busy` (so Escape and backdrop are ignored during the request, R45.11). Confirm: `busy = true`, `DELETE /api/boards/<id>`; on 200 `recordDelete(boardId)`, `showSuccess("Board deleted.")`, `router.push("/")` (R45.11); on failure `busy = false`, dialog stays open, `handleError(err)` (R45.13). `useRouter` comes from `next/navigation`.

**`lib/deepLink.ts` (pure, new).**

```ts
export function resolveCardParam(raw: string | string[] | undefined): string | null  // first value, "" -> null (R46.5)
export function findCardById(columns: Column[], id: string | null): BoardCard | null  // only cards in the payload (R46.4)
export function stripCardParam(href: string): string                                  // path + other params + hash, without `card`
```

`resolveCardParam` takes the first element of an array and then treats `""` as absent, so `?card=&card=c1` gives `null` (the first value is empty). `stripCardParam` uses `new URL(href)` and `URLSearchParams.delete("card")`, and returns `pathname + (search ? "?" + search : "") + hash`.

**`hooks/useCardDeepLink.ts` (new, about 40 lines; replaces the B23 code block).**

```ts
export function useCardDeepLink(initialCardId: string | null, columns: Column[], open: (card: BoardCard) => void) {
  const handled = useRef(false);            // at most once per page load (R46.8), also under React StrictMode
  const openedId = useRef<string | null>(null);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const card = findCardById(columns, initialCardId);
    if (card) { openedId.current = card.card_id; open(card); }       // as a click: isNew false (R46.3)
  }, [initialCardId, columns, open]);
  const onModalClose = useCallback((closedId: string) => {
    if (openedId.current !== closedId) return;                        // a click-opened card leaves the URL alone
    openedId.current = null;
    window.history.replaceState(window.history.state, "", stripCardParam(window.location.href)); // R46.7
  }, []);
  return { onModalClose };
}
```

The guard ref makes a full dependency array safe: later changes of `columns` (drag, add) never reopen. `replaceState` keeps `window.history.state` because the App Router stores its own entry state there; the Native History API section of `linking-and-navigating.md` shows `replaceState(null, '', newPath)` and says Next.js integrates these calls into the router, so either form updates `useSearchParams` readers without a request. Passing the current state is the safer choice and is checked by the Playwright deep-link scenario (back button after closing still works).

**`BoardView.tsx` (changed, line budget at most 298).** One new prop `initialCardId?: string | null` (default `null`, so the existing tests that render `<BoardView board={...} />` keep compiling). One `const openCard = useCallback((card: Card | BoardCard) => { setSelectedCard(toBoardCard(card)); setSelectedCardIsNew(false); }, []);` replaces the two repeated blocks (net about -4 lines). `const { onModalClose } = useCardDeepLink(initialCardId ?? null, columns, openCard);` and the modal's `onClose` adds `onModalClose(selectedCard.card_id)`. The rename and delete wiring of B22 is not added to `BoardView` (it lives in `BoardToolbar`). The `scripts/check_file_size.py` check (R30.6, `repo-rules.test.ts`) enforces the limit.

**Board page (`app/(boards)/boards/[id]/page.tsx`).** As B24, using `resolveCardParam((await searchParams).card)`; `searchParams` typed `Promise<{ [key: string]: string | string[] | undefined }>` as in `page.md`. The page is already `force-dynamic`. A 403 or 404 renders `BoardAccessMessage` before `BoardView` exists (R46.6); a 401 still calls `redirect("/login?expired=1")` (R46.10).

**`MyTasksList.tsx`.** As B23: title `href` becomes `` `/boards/${card.board_id}?card=${encodeURIComponent(card.card_id)}` ``; the "Open board" link is unchanged (R46.1, R46.2). `card_id` is a UUID, so encoding changes nothing for real data and only guards against unexpected input.

**Deep link request count.** The deep link adds no request of its own: the Card comes from the board payload (`findCardById`). Opening the modal then runs the same `GET /api/cards/<id>` that a click runs (V11 A18), because R46.3 requires the modal to behave as for a click. Closing sends nothing, and the modal never reopens from the parameter. Open issue 72 records the reading of R46.8.

**Files (V12, B1 tree note).** New: `components/boards/RenameBoardModal.tsx`, `components/boards/DeleteBoardControl.tsx`, `hooks/useCardDeepLink.ts`, `hooks/useBoardPatches.ts`, `lib/deepLink.ts`, `lib/boardPatches.ts`. Changed: `components/boards/BoardToolbar.tsx`, `BoardView.tsx`, `BoardList.tsx`, `components/cards/MyTasksList.tsx`, `app/(boards)/boards/[id]/page.tsx`, `lib/types.ts`, `lib/format.ts` (`formatCount`). Unchanged: `app/(boards)/page.tsx`, `proxy.ts`, `lib/decideRoute.ts`, `lib/roles.ts`, `ConfirmDialog.tsx`, `CreateBoardModal.tsx`. Each new file holds one component, one hook (with its two small writer functions for `useBoardPatches`), or pure functions.

## Data Models

### Conventions

- Primary key of each table is `<singular_name>_id`, type PostgreSQL `UUID`, generated by the application with `uuid.uuid4` (Requirement 2.3). Tables are plural (as listed in Requirement 1.9), so `users.user_id`, `board_memberships.board_membership_id`.
- Every model uses `SoftDeleteMixin`: `created_at`, `updated_at` (set on insert and on every update), `deleted_at` (nullable), `is_deleted` (default false). All timestamps are `timestamptz` in UTC.
- Foreign keys are named `fk_<child_table>_<parent_table>`. Each child/parent pair occurs once, so names are unique.
- Unique constraints are partial indexes `WHERE is_deleted = false`, so soft-deleted rows do not block new rows (Requirement 2.12).
- The SQL column named `order` is a reserved word. SQLAlchemy quotes it automatically; the Python attribute is also `order`.
- Relationships are declared with `lazy="raise"`; services load related rows through explicit queries.

### Mixin and Card model

```python
# app/soft_delete.py
class SoftDeleteMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())

# app/blueprints/cards/schema.py
class Card(SoftDeleteMixin, db.Model):
    __tablename__ = "cards"
    card_id     = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    board_id    = db.Column(db.Uuid, db.ForeignKey("boards.board_id", name="fk_cards_boards"), nullable=False)
    column_id   = db.Column(db.Uuid, db.ForeignKey("columns.column_id", name="fk_cards_columns"), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date    = db.Column(db.Date, nullable=True)
    labels      = db.Column(postgresql.ARRAY(db.String(30)), nullable=False, default=list, server_default="{}")
    assignee_id = db.Column(db.Uuid, db.ForeignKey("users.user_id", name="fk_cards_users"), nullable=True)
    order       = db.Column(db.Float, nullable=False)
    # V6 change:
    status       = db.Column(db.String(20), nullable=False, default="NOT_STARTED", server_default="NOT_STARTED")
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    __table_args__ = (
        db.CheckConstraint("char_length(description) <= 5000", name="ck_cards_description_len"),
        db.CheckConstraint('"order" > 0', name="ck_cards_order_positive"),
        db.CheckConstraint("status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')", name="ck_cards_status"),   # V6
        db.Index("ix_cards_column_id_order", "column_id", "order"),
        db.Index("ix_cards_board_id", "board_id"),
        db.Index("ix_cards_assignee_id", "assignee_id"),
    )
```

### Other models (columns and constraints)

| Model / table | Columns | Constraints and indexes |
|---|---|---|
| `User` / `users` | `user_id` UUID PK, `name` varchar(100) not null, `email` varchar(254) not null (always stored lowercase: normalized by `normalize_email` in the Marshmallow `pre_load` of every email-carrying schema), `password_hash` varchar(255) not null, mixin | check `ck_users_email_lowercase` (`email = lower(email)`); partial unique index `uq_users_email_active` on `email` where `is_deleted = false` (the column is already normalized, so no `lower(email)` expression index is needed) |
| `Board` / `boards` | `board_id` UUID PK, `name` varchar(100) not null, `created_by` UUID not null, **V6:** `member_invite_token` varchar(128) null, `guest_invite_token` varchar(128) null, mixin | FK `fk_boards_users` (created_by to users.user_id); index `ix_boards_created_by`; **V6:** unique constraints `uq_boards_member_invite_token` and `uq_boards_guest_invite_token` (many NULLs allowed, so Boards that existed before V6 stay valid until their tokens are created lazily) |
| `BoardMembership` / `board_memberships` | `board_membership_id` UUID PK, `board_id`, `user_id`, `role` varchar(10) not null, mixin | FKs `fk_board_memberships_boards`, `fk_board_memberships_users`; check `ck_board_memberships_role` (**V6 change:** `admin`, `member`, or `guest`; V5 allowed only `admin` and `member`; the partial unique index below is unchanged for all three roles); partial unique index `uq_board_memberships_board_user_active` on (`board_id`, `user_id`) where `is_deleted = false`; indexes `ix_board_memberships_user_id`, `ix_board_memberships_board_id` |
| `Column` / `columns` | `column_id` UUID PK, `board_id`, `name` varchar(100) not null, `order` float not null, mixin | FK `fk_columns_boards`; check `order > 0`; index `ix_columns_board_id_order` on (`board_id`, `order`) |
| `Card` / `cards` | see model above | FKs `fk_cards_boards`, `fk_cards_columns`, `fk_cards_users` |
| `Comment` / `comments` | `comment_id` UUID PK, `card_id`, `author_id`, `content` text not null (1 to 2000 enforced by schema and `ck_comments_content_len`), mixin | FKs `fk_comments_cards`, `fk_comments_users`; index `ix_comments_card_id_created_at` |
| `Notification` / `notifications` | `notification_id` UUID PK, `recipient_id`, `card_id`, `board_id`, `type` varchar(10) not null, `message` varchar(255) not null, `is_read` boolean not null default false, mixin | FKs `fk_notifications_users`, `fk_notifications_cards`, `fk_notifications_boards`; check `ck_notifications_type` (`assignment` or `comment`); indexes `ix_notifications_recipient_created` on (`recipient_id`, `created_at` desc), `ix_notifications_recipient_unread` on `recipient_id` where `is_read = false` |

Indexes required by Requirement 29.3 are present: membership `user_id` and `board_id`, column `board_id`, card `column_id` and assignee, comment `card_id`, notification recipient, and the `order` columns inside composite indexes. All composite and filter indexes also include rows where `is_deleted = true`, which is acceptable at the expected data volume.

### ER diagram

> **V11 change.** The diagram and the statement "7 tables" below describe V6 to V10. V11 has 9 tables; the V11 ER diagram is in "V11 data models and migration" after the Marshmallow schema list.

```mermaid
erDiagram
    users ||--o{ board_memberships : "fk_board_memberships_users"
    boards ||--o{ board_memberships : "fk_board_memberships_boards"
    users ||--o{ boards : "fk_boards_users (created_by)"
    boards ||--o{ columns : "fk_columns_boards"
    boards ||--o{ cards : "fk_cards_boards"
    columns ||--o{ cards : "fk_cards_columns"
    users ||--o{ cards : "fk_cards_users (assignee_id)"
    cards ||--o{ comments : "fk_comments_cards"
    users ||--o{ comments : "fk_comments_users (author_id)"
    users ||--o{ notifications : "fk_notifications_users (recipient_id)"
    cards ||--o{ notifications : "fk_notifications_cards"
    boards ||--o{ notifications : "fk_notifications_boards"
    users {
        uuid user_id PK
        string name
        string email
        string password_hash
    }
    boards {
        uuid board_id PK
        string name
        uuid created_by FK
        string member_invite_token "V6, nullable, unique"
        string guest_invite_token "V6, nullable, unique"
    }
    board_memberships {
        uuid board_membership_id PK
        uuid board_id FK
        uuid user_id FK
        string role "admin, member, or guest (V6)"
    }
    columns {
        uuid column_id PK
        uuid board_id FK
        string name
        float order
    }
    cards {
        uuid card_id PK
        uuid board_id FK
        uuid column_id FK
        string title
        float order
        uuid assignee_id FK
        string status "V6, NOT_STARTED default"
        datetime completed_at "V6, nullable"
    }
    comments {
        uuid comment_id PK
        uuid card_id FK
        uuid author_id FK
        text content
    }
    notifications {
        uuid notification_id PK
        uuid recipient_id FK
        uuid card_id FK
        uuid board_id FK
        string type
        boolean is_read
    }
```

Every table also carries `created_at`, `updated_at`, `deleted_at`, and `is_deleted` (omitted from the diagram for space). **V6 change:** the diagram still shows 7 tables and no relationship was added; only columns changed.

### V6 schema changes and migration (Requirements 2.15 to 2.17, 3.8 to 3.10; design only, no script is committed)

| Table | Change | Notes for the manual Migration_Step |
|---|---|---|
| `boards` | add `member_invite_token`, `guest_invite_token` (varchar(128), nullable) and their two unique constraints | Autogenerate emits these. Existing rows keep NULL and get tokens lazily (A14) |
| `cards` | add `status` varchar(20) not null with `server_default 'NOT_STARTED'`, add `completed_at` timestamptz null, add check `ck_cards_status` | The server default lets `ADD COLUMN ... NOT NULL` succeed on existing rows. **Alembic autogenerate does not detect check constraints**, so the user adds `op.create_check_constraint("ck_cards_status", "cards", "status IN ('NOT_STARTED','IN_PROGRESS','DONE')")` by hand |
| `board_memberships` | replace `ck_board_memberships_role` with a check that allows `admin`, `member`, `guest` | Also not detected by autogenerate: the user adds `op.drop_constraint("ck_board_memberships_role", "board_memberships")` then `op.create_check_constraint(...)` by hand, and does the reverse in `downgrade()` |

The user then runs `flask db upgrade` on the development database and on the test database. The 7-table check (Requirement 1.9, 3.5) is asserted by a backend test that lists the tables. The optional backfill below is run by the user only if cards sitting in a Column named `Done` should count as completed; it is not an automated task:

```sql
UPDATE cards c SET status = 'DONE', completed_at = c.updated_at
FROM columns col
WHERE col.column_id = c.column_id AND lower(col.name) = 'done'
  AND c.is_deleted = false AND col.is_deleted = false;
```

### Marshmallow schema list (Requirement 4.9)

| Package | Schemas |
|---|---|
| auth | `RegisterSchema`, `LoginSchema` |
| users | `UserSchema` (output), `UserUpdateSchema` (V6: `name`, `password`, `current_password`; `email` always rejected) |
| boards | `BoardCreateSchema`, `BoardUpdateSchema`, `BoardSchema`, `BoardDetailSchema`, `MemberAddSchema`, `MemberSchema`; **V6:** `InviteLinksSchema`, `InviteRoleSchema` (path role `member` or `guest`), `InviteTokenSchema` (format `^[A-Za-z0-9_-]{43,128}$`), `InviteInfoSchema`, `AcceptResultSchema` |
| columns | `ColumnCreateSchema`, `ColumnUpdateSchema`, `ColumnReorderSchema`, `ColumnSchema` |
| cards | `CardCreateSchema` (V6: `status` rejected), `CardUpdateSchema` (V6: `status` exact enum), `CardPositionSchema`, `CardQuerySchema`, `CardSchema` and `CardSearchSchema` (V6: add `status`, `completed_at`) |
| comments | `CommentCreateSchema`, `CommentUpdateSchema`, `CommentSchema` |
| notifications | `NotificationQuerySchema`, `NotificationSchema`, `NotificationPageSchema` |
| analytics | `AnalyticsSchema` |

Name fields strip whitespace and reject blank values. All input schemas set `unknown = RAISE`.

### V11 data models and migration (Requirements 2.2, 2.15, 2.16, 3.5, 3.11, 39, 41, 42, 44)

**Changed constraints (V11 text supersedes the V6 text of the Card model and of `board_memberships`; the earlier text stays).**

- `cards.status`: `ck_cards_status` is now `status IN ('NOT_STARTED', 'IN_PROGRESS', 'URGENT', 'DONE')`. New index `ix_cards_due_date` on `due_date`.
- `board_memberships.role`: `ck_board_memberships_role` is now `role IN ('admin', 'manager', 'member', 'guest')`. The partial unique index `uq_board_memberships_board_user_active` is unchanged.

**New models (both in `cards/schema/`, both with `SoftDeleteMixin`).**

```python
class ChecklistItem(SoftDeleteMixin, db.Model):
    __tablename__ = "checklist_items"
    checklist_item_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    card_id = db.Column(db.Uuid, db.ForeignKey("cards.card_id", name="fk_checklist_items_cards"), nullable=False)
    text    = db.Column(db.String(200), nullable=False)
    is_done = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    order   = db.Column(db.Float, nullable=False)
    __table_args__ = (
        db.CheckConstraint("char_length(text) BETWEEN 1 AND 200", name="ck_checklist_items_text_len"),
        db.CheckConstraint('"order" > 0', name="ck_checklist_items_order_positive"),
        db.Index("ix_checklist_items_card_id_order", "card_id", "order"),     # also serves the card_id filter (R44.3)
    )

class CardLink(SoftDeleteMixin, db.Model):
    __tablename__ = "card_links"
    card_link_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    card_id    = db.Column(db.Uuid, db.ForeignKey("cards.card_id", name="fk_card_links_cards"), nullable=False)
    created_by = db.Column(db.Uuid, db.ForeignKey("users.user_id", name="fk_card_links_users"), nullable=False)
    url   = db.Column(db.String(2048), nullable=False)
    label = db.Column(db.String(100), nullable=False)
    __table_args__ = (
        db.CheckConstraint("char_length(url) BETWEEN 1 AND 2048", name="ck_card_links_url_len"),
        db.CheckConstraint("char_length(label) BETWEEN 1 AND 100", name="ck_card_links_label_len"),
        db.Index("ix_card_links_card_id", "card_id"),
    )
```

Both foreign keys have no `ON DELETE CASCADE`; the cascade is the service-level soft delete of A17. The scheme rule for `url` is enforced by `validate_link_url`, not by a database constraint. The SQL column `order` is quoted automatically, as for Cards and Columns.

**V11 ER diagram (9 tables; the V6 diagram above is superseded).**

```mermaid
erDiagram
    users ||--o{ board_memberships : "fk_board_memberships_users"
    boards ||--o{ board_memberships : "fk_board_memberships_boards"
    users ||--o{ boards : "fk_boards_users"
    boards ||--o{ columns : "fk_columns_boards"
    boards ||--o{ cards : "fk_cards_boards"
    columns ||--o{ cards : "fk_cards_columns"
    users ||--o{ cards : "fk_cards_users (assignee_id)"
    cards ||--o{ comments : "fk_comments_cards"
    users ||--o{ comments : "fk_comments_users"
    users ||--o{ notifications : "fk_notifications_users"
    cards ||--o{ notifications : "fk_notifications_cards"
    boards ||--o{ notifications : "fk_notifications_boards"
    cards ||--o{ checklist_items : "fk_checklist_items_cards"
    cards ||--o{ card_links : "fk_card_links_cards"
    users ||--o{ card_links : "fk_card_links_users (created_by)"
    board_memberships { uuid board_membership_id PK
        string role "admin, manager, member, guest" }
    cards { uuid card_id PK
        string status "NOT_STARTED, IN_PROGRESS, URGENT, DONE"
        date due_date "indexed (V11)" }
    checklist_items { uuid checklist_item_id PK
        uuid card_id FK
        string text
        boolean is_done
        float order }
    card_links { uuid card_link_id PK
        uuid card_id FK
        uuid created_by FK
        string url
        string label }
```

Columns not shown are unchanged from the V6 diagram; every table also carries the four soft-delete columns.

**V11 migration table (design only; the user runs `flask db migrate` and `flask db upgrade` from `app/` on the development and test databases; no script is committed).** One Migration_Step (R44.1, R3.11):

| Change | Autogenerate detects it? | What the user does |
|---|---|---|
| Replace `ck_cards_status` (adds `URGENT`) | No (check constraints on existing tables are not compared) | Hand-edit: `op.drop_constraint("ck_cards_status", "cards")` then `op.create_check_constraint("ck_cards_status", "cards", "status IN ('NOT_STARTED','IN_PROGRESS','URGENT','DONE')")`; reverse in `downgrade()` (a downgrade fails if an `URGENT` row exists, so the user first sets those rows to another value) |
| Replace `ck_board_memberships_role` (adds `manager`) | No | Hand-edit the same way with `'admin','manager','member','guest'` |
| Index `ix_cards_due_date` | Yes | Review only |
| Tables `checklist_items`, `card_links` with their indexes, FKs, and check constraints | Yes (check constraints defined in the new tables are created with them) | Review that the named FKs and the indexes appear |

No existing row changes. A backend test lists the tables through `information_schema` and expects exactly the 9 names, and another test inserts `status = 'URGENT'` and `role = 'manager'` (both must succeed) and `status = 'urgent'` and `role = 'owner'` (both must fail) (Testing Strategy V11). Until the step is run, every V11 task that uses the new values, the index, or the tables is blocked (R3.11). Production is not deployed, so its first `flask db upgrade` applies the full history (D1).

**Marshmallow additions.** cards: `ChecklistCreateSchema`, `ChecklistUpdateSchema`, `ChecklistItemSchema`, `CardLinkCreateSchema`, `CardLinkUpdateSchema`, `CardLinkSchema`, `CardDetailSchema`; `CardSchema` gains the three count fields for board detail, create, update, and position (R44.5); `CardCreateSchema` and `CardUpdateSchema` use the four-value `CARD_STATUSES`. boards: `MemberRoleSchema`. notifications: `OverdueItemSchema`, `OverdueResultSchema`. The glossary term `Role_Rank` maps to `ROLE_RANK` in `permissions.py`.

**Statements that say 7 tables or three roles are superseded (V11 change).** Module-graph rule 5 ("all 7 tables"), the test-database safety check ("the expected 7 tables"), the V6 schema test ("the 7 tables listed from `information_schema`"), the V6 ER diagram, and the A14 row "7 tables" now mean 9 tables. The matrix in A4-V6, the `Role` type of B10 (`admin | member | guest`), the Property 55 role set, and the A8 member-activity filter (`admin`, `member`) now include `manager`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Redundancy review.** The prework produced about 40 candidate properties. Redundancy was removed as follows:

- Envelope shape (4.1, 4.2, 4.5, 4.8) and status mapping (4.6, 4.7) are separate because one checks body shape and the other the status line.
- Role checks for boards, members, columns, cards, comments, analytics (8.6, 8.7, 9.9, 9.10, 9.12, 10.7, 11.15, 12.8, 14.7, 28.10, 28.11) are merged into one permission-matrix property.
- Name, title, content, and password boundary checks (6.1, 6.3, 8.8, 10.6, 11.4, 12.5, 4.10) are merged into one server-validation property. Client-side validators (19.2, 19.7, 20.3, 21.3, 21.7, 23.3, 23.9, 26.3) are merged into one mirror property.
- Soft-delete exclusion (2.8, 12.2, 14.6, 13.5) is one property. Cascades (2.7, 2.9 to 2.11) are one property and atomicity (2.13, 8.10) is a second because it needs fault injection.
- Password exposure (6.8, 7.1, 28.1) is one property.
- Search semantics (11.11 to 11.13, 28.4) is one property.
- Ordering formulas (10.1, 11.1, 22.2 to 22.5) are split into server allocation and client drop computation because they live in different languages.
- Comment owner-only on the server (12.7) and the control visibility on the client (23.11, 23.14) stay separate.

### Property 1: Envelope shape

*For any* request to any endpoint (valid or invalid, authenticated or not), the response body is a JSON object with exactly one top-level key, either `data` or `error`; the key is `data` iff the status is 2xx; an `error` value is a non-empty string of at most 500 characters; and a 500 response contains no stack trace, SQL text, or database details.

**Validates: Requirements 4.1, 4.2, 4.5, 4.8, 4.11, 5.4**

### Property 2: Status code by outcome

*For any* request, the status is 201 for a successful creating POST (register, boards, members, columns, cards, comments), 200 for every other success (including every DELETE, whose body `data` is a JSON object), and for a failure it is the code mapped by failure type: validation 400, JWT 401, permission 403, missing, soft-deleted, or malformed-UUID path id 404, unsupported method 405, unique conflict 409, unexpected 500.

**Validates: Requirements 4.3, 4.4, 4.6, 4.7, 4.12, 4.13, 4.14, 4.18**

### Property 3: Serialization format

*For any* UUID and any timestamp serialized by any response schema, the UUID is a lowercase hyphenated string of 36 characters and the timestamp is an ISO 8601 UTC string ending in `Z` or `+00:00`.

**Validates: Requirements 4.15**

### Property 4: CORS origin filtering

*For any* request origin, the response carries the allow-origin header iff the origin is in the configured allowed list.

**Validates: Requirements 4.16, 4.17**

### Property 5: Configuration fails fast

*For any* non-empty subset of the required environment variables (`DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES`, `CORS_ORIGINS`) that is missing or empty, `Config.from_env()` raises an error whose message names each missing variable and contains none of the provided variable values.

**Validates: Requirements 1.13, 28.6**

### Property 6: Soft-deleted rows never appear

*For any* set of Boards, Columns, Cards, Comments, Memberships, Users, and Notifications with arbitrary `is_deleted` flags, every list, detail, search, count, analytics, and notification query returns only rows (and counts only rows) where `is_deleted` is false, and a request for a soft-deleted resource returns 404.

**Validates: Requirements 2.8, 8.9, 12.2, 12.9, 13.5, 14.6**

### Property 7: Soft delete is a cascade that preserves data

*For any* Board, Column, or Card tree, deleting the parent sets `is_deleted = true` and the same `deleted_at` on the parent and all descendants named in the cascade table (Board: memberships, columns, cards, comments; Column: cards and their comments; Card: comments), leaves every other column value and every unrelated row unchanged, and a soft-deleted row is never physically removed.

**Validates: Requirements 2.7, 2.9, 2.10, 2.11, 8.5, 10.3, 11.6**

### Property 8: Cascade atomicity

*For any* cascading delete or Board creation in which a database step fails part-way, every affected row is unchanged afterward and the response is 500 in the envelope.

**Validates: Requirements 2.13, 8.10**

### Property 9: Uniqueness ignores soft-deleted rows

*For any* sequence of create and soft-delete operations on Users and Board_Memberships, creating a User with an email or a membership for a (board, user) pair succeeds iff no non-deleted row with that key exists (the User key is the lowercased email, so emails differing only in letter case collide), and a duplicate returns 409 and changes nothing; and *for any* email string used in register or PATCH `/api/users/me`, the stored email equals the trimmed, lowercased input, and an add-member request finds the User whatever the letter case of the request email.

**Validates: Requirements 2.12, 6.1, 6.2, 7.2, 7.4, 9.1, 9.4**

*V6 change:* the PATCH `/api/users/me` clause of this property is superseded. The email can no longer be changed after registration (Property 54), so uniqueness is only exercised by registration and by add-member matching.

### Property 10: Password handling

*For any* valid registration, the stored `password_hash` differs from the submitted password and verifies against it, and *for any* response from any endpoint no field named `password` or `password_hash` appears at any depth.

**Validates: Requirements 6.1, 6.8, 7.1, 28.1**

### Property 11: Register then login round trip

*For any* valid name, email, and password, registering and then logging in with the same credentials (any letter case in the email) returns 200 with an access token and a refresh token whose `sub` equals the user's `user_id`, with `expires_in` equal to the configured access lifetime and `refresh_expires_in` equal to the configured refresh lifetime; and *for any* login with an unknown email, a wrong password, or a soft-deleted user's email, the response is 401 with an identical message and no token. Token types and lifetimes are covered by Properties 36 and 37.

**Validates: Requirements 6.4, 6.5, 6.6**

### Property 12: Server input validation

*For any* string value of any validated field (names 1 to 100, board and column names non-blank, card title 1 to 200, description at most 5000, labels at most 10 items of 1 to 30 characters, comment content 1 to 2000 with a non-whitespace character, password 8 to 128, email at most 254 and well formed, due date ISO 8601), the request is accepted iff the value lies inside the rule, and a rejected request returns 400 naming each invalid field and leaves stored data unchanged.

**Validates: Requirements 4.9, 4.10, 6.3, 7.5, 8.8, 9.2, 10.6, 11.4, 12.5**

### Property 13: Role and membership enforcement

*For any* user, Board, and endpoint that requires membership or a role, the outcome matches the permission matrix: a non-member receives 403, a member who is not the admin receives 403 on admin-only endpoints (Board update and delete, member add and remove, analytics), a removed member receives 403, an authorized caller succeeds, and *for any* 403 response all data is unchanged and the response body contains no data of the target resource.

**Validates: Requirements 8.6, 8.7, 9.9, 9.10, 9.12, 10.7, 11.15, 12.8, 14.7, 28.10, 28.11**

*V6 change:* "member" in this property means a Board_Member with role `admin` or `member`. The `guest` row of the matrix is Property 47.

### Property 14: Board creation makes the creator admin

*For any* authenticated user and valid Board name, creating the Board makes the creator the only member with role `admin`, and the Board appears in that user's `GET /api/boards` with `my_role = "admin"`, ordered by `created_at` descending, while a user with no membership never sees it.

**Validates: Requirements 8.1, 8.2**

### Property 15: Server order allocation

*For any* Board with Columns (or Column with Cards) and any sequence of creations, each new item receives an Order_Value strictly greater than every non-deleted sibling's value, the first item receives 1.0, and `GET /api/boards/<id>` lists Columns and each Column's Cards in non-decreasing Order_Value.

**Validates: Requirements 8.3, 10.1, 11.1, 21.1**

### Property 16: Position and reorder persistence

*For any* Card in a Board, any Column of the same Board, and any finite order greater than 0, PATCH position stores that Column and order, and a subsequent GET of the Board shows the Card in that Column at the sorted position; *for any* Column of another Board, a soft-deleted Column, a non-UUID `column_id`, or an order that is not greater than 0, the request returns 400 and the Card is unchanged. The same holds for Column reorder.

**Validates: Requirements 10.4, 10.5, 10.8, 11.7, 11.8, 11.9, 22.11**

### Property 17: Partial update

*For any* Card (or User) and any subset of updatable fields supplied in a PATCH, exactly the supplied fields change, all other fields keep their previous values, and `updated_at` does not decrease.

**Validates: Requirements 7.2, 11.3**

*V6 change:* the updatable User fields are now `name` and `password` only (the email is excluded, Property 54), and the updatable Card fields now include `status`; a status change also moves `completed_at` by the rule of Property 44, which is the only allowed change to a field that was not supplied.

### Property 18: Assignee must be a member and removal clears assignment

*For any* Card and any assignee, creating or updating a Card with an assignee who is not a non-deleted member of the Card's Board returns 400 and changes nothing; and removing a member sets the assignee to empty on every non-deleted Card of that Board assigned to them, in the same transaction.

**Validates: Requirements 11.5, 9.11**

### Property 19: Search and My Tasks semantics

*For any* set of Cards across Boards and any query text (including `%`, `_`, `\`, `'`, `;`, `--`), `GET /api/cards?q=<text>` returns exactly the non-deleted Cards of Boards where the caller is a member whose title or description contains the text case-insensitively, `board_id` restricts the result to that Board (403 for a non-member), and `GET /api/cards?assignee=me` returns exactly the caller's non-deleted assigned Cards on non-deleted Boards.

**Validates: Requirements 11.10, 11.11, 11.12, 11.13, 28.4**

### Property 20: Comment ownership

*For any* Comment and any user, PATCH and DELETE succeed iff the user is the Comment's author (so a Board_Admin who is not the author receives 403), and a failed attempt leaves the Comment unchanged.

**Validates: Requirements 12.3, 12.4, 12.7**

### Property 21: Notification recipients

*For any* author, assignee (possibly none), and admin, `comment_recipients(author, assignee, admin)` contains no duplicates, never contains the author, contains the assignee iff the assignee exists and differs from the author, and contains the admin iff the admin differs from the author; and *for any* Card create or update, an `assignment` notification is created iff the new assignee differs from the current user and from the previous assignee.

**Validates: Requirements 13.1, 13.2, 13.3**

### Property 22: Notification pagination

*For any* user with N non-deleted notifications and any valid `page` and `per_page` (at most 100), the response contains `min(per_page, max(0, N - (page - 1) * per_page))` items newest first, `total = N`, and `unread_count` equal to the number of unread notifications, even for a page beyond the last; *for any* `page` or `per_page` that is not an integer from 1 to 2147483647 or a `per_page` above 100, the response is 400 with no notifications; and *for any* user, only that user's notifications are returned.

**Validates: Requirements 13.5, 13.6, 13.7, 13.8**

### Property 23: Mark-read idempotence

*For any* notification, applying the read operation once or repeatedly by its recipient yields 200 with `is_read = true`, and applying it by any other user yields 403 with `is_read` unchanged.

**Validates: Requirements 13.9, 13.10**

### Property 24: Analytics equals a naive model

*For any* Board with Columns, Cards, Comments, and Members (including soft-deleted rows, columns without Cards, and no Column named Done), the analytics response equals a plain in-memory computation: per-column counts (0 for empty), completed cards in a Column named `Done` (case-insensitive) with `updated_at` between Monday 00:00 UTC of the current week and now, and per-member assigned Card and Comment counts. `start_of_week_utc(t)` is a Monday at 00:00:00 UTC, is at most `t`, and is less than 7 days before `t`.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.6**

*V6 change:* the "completed" clause (Column named `Done` and `updated_at`) is superseded by Property 46 (`status = DONE` and `completed_at`). The cards-per-column, week-boundary, and soft-delete clauses stay as written.

### Property 25: Constant query count for board detail

*For any* Board with a fixed number of Columns and any number of Cards from 0 to 500, `GET /api/boards/<id>` executes the same number of SQL statements, at most 5.

**Validates: Requirements 29.2**

*V11 change:* the board plan has 5 queries (A9 note), and the Cards carry checklist and link counts. The extended property is Property 71. The bound "at most 5" is unchanged.

### Property 26: API client behavior

*For any* path and payload, `apiRequest` returns the `data` field of a 2xx envelope; sends `Authorization: Bearer <access token>` iff an access token is available; and *for any* non-2xx status with an `error` string it throws `ApiError(statusCode, error)`, while *for any* non-2xx response with a body that is not an envelope it throws `ApiError(statusCode, "Unexpected server response")`.

**Validates: Requirements 16.1, 16.5, 16.6, 16.7**

### Property 27: Error handler mapping

*For any* `ApiError` with status in {400, 401, 403, 404, 409, 500}, `handleError` shows exactly one error toast and the six messages are pairwise distinct; *for any* other status or any non-ApiError value it shows exactly one generic toast.

**Validates: Requirements 16.11, 16.12**

### Property 28: Route guard decision

*For any* path, access token state (absent, expired, valid), refresh token state (absent, expired, valid), and current time, `guardDecision` returns `allow` for a protected path with a valid access token, `refresh` for a protected path with no valid access token and a valid refresh token, `redirect-login` for a protected path with neither, `redirect-home` for `/login` or `/register` when either token is valid, and `allow` for `/login` or `/register` otherwise.

**Validates: Requirements 17.7, 17.8, 17.9**

*V6 change:* `guardDecision` is replaced by `decideRoute`, which also takes the Welcome_Cookie and covers `/`, `/welcome`, and `/invite/<token>`. The five V5 rows above remain true for `/login`, `/register`, and ordinary protected paths. The full V6 property is Property 53.

### Property 29: Client validators mirror server rules

*For any* string, the client validators for name, email, password, board name, column name, card title, comment text, and profile fields accept it iff the corresponding server rule in Property 12 accepts it, and a rejected form sends no request.

**Validates: Requirements 19.2, 19.7, 20.3, 21.3, 21.7, 23.3, 23.9, 26.3**

*V6 change:* the profile validators are now `validateName`, `validateNewPassword` (8 to 128), `validateCurrentPassword` (non-empty), and `validatePasswordSection`, and the email validator is no longer used by the profile page. They are part of this property.

### Property 30: Client drop order computation

*For any* target column's cards (distinct positive orders, sorted ascending, excluding the dragged card) and any drop index, `computeDropOrder` returns 1.0 for an empty column, half of the first order for index 0, last order plus 1 for the end, and the midpoint of the two neighbors otherwise; the result is finite and positive, and inserting the dragged card with that order yields a sorted list in which the card sits at the drop index.

**Validates: Requirements 22.2, 22.3, 22.4, 22.5, 22.9**

### Property 31: Optimistic move and revert

*For any* board state, card, target column, and valid order, `moveCardInState` places the card in the target column with the new order immediately, and a failed request followed by `restoreCardInState` returns a state equal to the original (original column and original order, same sorted position); *for any* drop outside a column or at the card's own position, the state is unchanged and no request is sent.

**Validates: Requirements 22.6, 22.7, 22.8**

### Property 32: Notification badge and unread count

*For any* unread count n, `formatBadge(n)` is empty for 0, the decimal string for 1 to 99, and `"99+"` for 100 or more; and *for any* unread count and successful read of an unread notification, the new count is `max(0, n - 1)`, while a failed read leaves the count unchanged.

**Validates: Requirements 24.2, 24.3, 24.6, 24.7**

### Property 33: Search debounce

*For any* sequence of keystrokes with fake timers where each gap is under 300 ms, at most one search request is sent, after 300 ms since the last keystroke and carrying the final text; clearing the input sends no request.

**Validates: Requirements 21.9, 21.10**

### Property 34: Owned-comment controls and My Tasks grouping

*For any* list of Comments and current user, edit and delete controls are rendered exactly for Comments whose author is the current user (including when the current user is the Board_Admin); and *for any* list of Cards, `groupByBoard` produces one group per distinct `board_id`, each Card appears in exactly one group, and no Card is lost.

**Validates: Requirements 23.11, 23.14, 25.1**

### Property 35: Changed-fields diff

*For any* original card and edited form values, `diffCardFields` returns exactly the fields whose values differ, and an unchanged form produces an empty diff.

**Validates: Requirements 23.2**

*V6 change:* `diffCardFields` also compares `status`, so a form whose only change is the status produces exactly `{ status }` (Requirement 23.18).

### Property 36: Token types and lifetimes

*For any* registered user and any configured positive lifetimes `A` (access) and `R` (refresh), login returns an access token with `type = "access"` and `exp - iat = A`, and a refresh token with `type = "refresh"` and `exp - iat = R`, both with `sub` equal to the user's `user_id`; with the default configuration `A = 3600` and `R = 604800`, and the login response has `expires_in = A` and `refresh_expires_in = R`.

**Validates: Requirements 6.4, 6.5**

### Property 37: Token type enforcement

*For any* protected endpoint other than `POST /api/auth/refresh` and any valid refresh token, the response is 401 and nothing changes; and *for any* valid access token sent to `POST /api/auth/refresh`, and *for any* missing, malformed, wrongly signed, or expired token sent there, the response is 401 and no token is issued.

**Validates: Requirements 6.11, 6.12, 6.14, 4.6**

### Property 38: Refresh yields a working access token

*For any* registered user holding a valid refresh token, `POST /api/auth/refresh` returns 200 with an access token with `type = "access"`, the same `sub`, `expires_in = 3600` in the default configuration, and no refresh token; the new access token is accepted by `GET /api/users/me` and returns that user's profile; and *for any* refresh token whose subject is a soft-deleted or nonexistent user, the response is 401.

**Validates: Requirements 6.10, 6.13**

### Property 39: Failed refresh clears the session, shared refresh runs once

*For any* number `n >= 1` of concurrent protected requests made in the browser runtime that all receive 401, the apiClient sends exactly one `POST /api/auth/refresh`; when it returns 200 each original request is retried exactly once with the new access token and the access cookie is updated; when it returns 401 both cookies and the AuthContext state are cleared, the user is redirected to `/login`, and each original request rejects with `ApiError(401, ...)`; and *for any* 401 from `/api/auth/login`, `/api/auth/register`, or `/api/auth/refresh`, no refresh is attempted.

**Validates: Requirements 16.14, 16.15, 16.16, 16.17, 17.4**

### Property 40: Server-side apiClient never renews

*For any* path and any 401 response received while the apiClient runs in a Server Component (no `window`), with or without a refresh cookie present, the apiClient sends no `POST /api/auth/refresh`, writes and deletes no cookie, and throws `ApiError` with `statusCode` 401; and *for any* login response with arbitrary positive `expires_in` and `refresh_expires_in`, the access cookie `Max-Age` equals `expires_in` and the refresh cookie `Max-Age` equals `refresh_expires_in`.

**Validates: Requirements 16.18, 17.2**

### Property 41: Touch drop index from the touch point

*For any* list of card vertical midpoints sorted ascending (the target Column's Cards without the dragged Card) and any touch y coordinate, `computeDropIndex` returns the number of midpoints smaller than y, which lies between 0 and the list length, and feeding that index to `computeDropOrder` gives the same result as a mouse drop at that index (1.0 for an empty Column, half the first order at index 0, last order plus 1 at the end, the midpoint of the two neighbors otherwise).

**Validates: Requirements 22.2, 22.3, 22.4, 22.5, 22.15**

### Property 42: Touch gesture state machine

*For any* sequence of touch events (start, move, timer, scroll, end, cancel) with timestamps and coordinates, `touchGestureStep` reaches the dragging phase iff a timer event arrives at least 300 ms after the start with no move farther than 10 px from the start point, no scroll, no end, and no cancel in between; *for any* sequence that leaves the pressing phase another way, the final phase is cancelled and the hook sends no position request; and *for any* dragging sequence that ends outside a Column, on the Card's own position, or with a cancel, no request is sent and the Card state equals the initial state.

**Validates: Requirements 22.12, 22.13, 22.14, 22.16**

### Property 43: Deleted or unknown token subject yields 401

*For any* protected endpoint (including GET and PATCH `/api/users/me`) and any valid access token whose subject belongs to a soft-deleted or nonexistent user, the response is 401 and no data changes; and *for any* valid access token of a non-deleted user, the same request is not rejected for that reason.

**Validates: Requirements 6.9, 7.6**

### Property 44: Status and completed_at transition rule

*For any* initial status, any sequence of PATCH operations that supply or omit `status`, and any increasing sequence of timestamps, `apply_status_change` sets `completed_at` to the current time when the status changes to `DONE` from another value, sets it to null when the status changes from `DONE` to another value, and leaves it unchanged when the status is unchanged (including `DONE` to `DONE`) or not supplied; after every step `completed_at` is not null iff the status is `DONE`; and a card that was never changed keeps `NOT_STARTED` and null.

**Validates: Requirements 11.18, 11.19, 11.24**

### Property 45: Status validation and position independence

*For any* string, null, or case variant supplied as `status` in PATCH `/api/cards/<id>`, the request is accepted iff the value is exactly `NOT_STARTED`, `IN_PROGRESS`, or `DONE`, and a rejected request returns 400 and leaves the Card unchanged; *for any* POST `/api/columns/<id>/cards` body that contains a `status` field the response is 400 and no Card is created, and a created Card has `NOT_STARTED` and null `completed_at`; and *for any* position request, including a move into a Column named `Done` (any letter case), the Card's `status` and `completed_at` are unchanged.

**Validates: Requirements 11.4, 11.17, 11.21**

### Property 46: Analytics equals a naive model (V6 definition)

*For any* Board with Columns, Cards (any status, any `completed_at`, any Column name including `Done`), Comments, and Memberships of all three roles with arbitrary soft-delete flags, the analytics response equals a plain in-memory computation: per-Column counts of non-deleted Cards, `completed_this_week` equal to the number of non-deleted Cards with `status = DONE` and `completed_at` from `start_of_week_utc(now)` (inclusive) to `now` (inclusive) whatever their Column, and member activity listing exactly the active memberships with role `admin` or `member` with their assigned Card and Comment counts; a `DONE` Card at Monday 00:00:00 UTC is counted, one second earlier is not, and a Card in a Column named `Done` with another status is not counted.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.6, 14.10**

### Property 47: Guest never writes (role by endpoint matrix)

*For any* role in {admin, member, guest, none} and any endpoint of the matrix in A4-V6, the outcome equals the matrix cell: a guest receives 403 on every write endpoint (Board update and delete, member add and remove, Column and Card writes, Comment writes, analytics, invite-links, regenerate) and the stored data is unchanged, a guest succeeds on the read endpoints (Board detail, members, comments, search), and `role_allows(role, level)` is true iff the rank of the role is at least the rank of the level.

**Validates: Requirements 8.11, 8.12, 9.13, 9.14, 10.10, 11.23, 12.10, 12.11, 14.10, 28.14, 37.14**

*V11 change:* the roles are now {admin, manager, member, guest, none} and the matrix is the V11 matrix of A15 (Property 73). The guest rows are unchanged.

### Property 48: Assignee must be admin or member, guests are never notified

*For any* Board whose memberships have arbitrary roles and any user as assignee in a Card create or update, the request is accepted iff the user has an active membership with role `admin` or `member`, a rejected request returns 400 and leaves the Card unchanged, and no Notification row exists for any user whose only active membership on the Board has the role `guest`; accepting an invitation creates no Notification.

**Validates: Requirements 11.5, 11.22, 13.12**

### Property 49: Invite tokens are well formed, unique, and regeneration invalidates

*For any* set of created Boards, every Invite_Token matches `^[A-Za-z0-9_-]{43,128}$` and no token value occurs twice across all Boards and both roles; *for any* sequence of regenerate calls, a token is valid (GET `/api/invites/<token>` returns 200 with that role) iff it is the current token of its column, the replaced token returns 404, the token of the other role and all memberships are unchanged, and a token of a soft-deleted Board returns 404; and *for any* string that does not match the format, lookup returns 404.

**Validates: Requirements 37.2, 37.3, 37.6, 37.9, 37.10, 37.21**

### Property 50: Accept decision never lowers a role

*For any* existing role in {none, guest, member, admin} and token role in {member, guest}, `resolve_accept` returns the token role with action `create` iff the existing role is none, returns `member` with action `upgrade` iff the existing role is guest and the token role is member, and otherwise returns the existing role with action `none`; the resulting rank is never lower than the existing rank, and an admin always stays admin.

**Validates: Requirements 37.11, 37.12**

### Property 51: Accept is idempotent and keeps one active membership

*For any* user, Board, token role, and repeated or concurrent accept calls, every call returns 200 with the role from `resolve_accept`, the user ends with exactly one active membership on the Board, an existing soft-deleted membership row of the pair is left unchanged while a new active row is created, and no accept consumes a token.

**Validates: Requirements 37.11, 37.12, 37.13, 37.21, 2.12**

### Property 52: Safe `next` parameter

*For any* string, `safeNext` returns the string iff it equals `/invite/` followed by 1 to 128 characters from `A-Z`, `a-z`, `0-9`, `_`, `-`, and returns null for every other value, including absolute URLs, protocol-relative URLs, strings with backslashes, extra slashes, query strings, fragments, percent sequences, whitespace, and paths outside `/invite/`; and the redirect target after login is `safeNext(next) ?? "/"`, so it is always `/` or an invite path of the same origin.

**Validates: Requirements 19.8, 19.11, 28.15**

### Property 53: Route decision with welcome cookie and invite paths

*For any* pathname (`/`, `/welcome`, `/login`, `/register`, `/invite/<token>`, a malformed invite path, other protected path), authentication state (authenticated, refreshable, unauthenticated), and Welcome_Cookie flag, `decideRoute` returns exactly the outcome of the table in B4-V6: `/` redirects an unauthenticated visitor to `/welcome` iff the cookie is absent and to `/login` otherwise, and continues for an authenticated user whatever the cookie; `/welcome` redirects authenticated and refreshable users to `/` and is public otherwise; `/login` and `/register` are public and request the cookie only when absent; `/invite/<token>` redirects an unauthenticated visitor to `/login?next=<encoded path>` with or without the cookie and never to `/welcome`, and continues or refreshes for authenticated and refreshable users; any other protected path redirects an unauthenticated visitor to `/login`.

**Validates: Requirements 17.7, 17.8, 17.9, 17.12, 17.13, 37.20, 38.5, 38.6, 38.7, 38.8, 38.9, 38.10, 38.11, 38.12**

### Property 54: Profile update never changes the email and needs the current password

*For any* User and any PATCH `/api/users/me` body: a body with an `email` key (any value) returns 400 naming `email` and changes nothing; a body with `password` succeeds iff `current_password` matches the stored password and the new password has 8 to 128 characters; a wrong or missing `current_password` returns 400 (never 403) naming `current_password` and leaves the name unchanged even when the body also contains a valid name; after a successful change the old password no longer logs in and the new one does; the stored email always equals the registered lowercase email; and no response or log record contains a password, `current_password`, or hash.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.8, 2.12**

### Property 55: Guest UI has no edit controls and starts no drag

*For any* board (any Columns and Cards) rendered with role `guest`, the output contains none of: add column, add card, column rename or delete, card delete, member panel, analytics link, invite links, comment form, status or assignee inputs enabled; every card has no `draggable` attribute and `useDragAndDrop({ enabled: false })` starts no drag, leaves the state unchanged, and sends no position request for any mouse or touch event sequence; and *for any* role in {admin, member} these controls are present.

**Validates: Requirements 21.20, 22.18, 23.21, 27.8, 37.17**

### Property 56: Status labels, badges, and moves

*For any* `CardStatus`, `STATUS_LABEL` returns "Not started", "In progress", or "Done" and the three labels and the three variants are pairwise distinct, so board, modal, and My Tasks show the same text; and *for any* board state, Card, target Column, and valid order, `moveCardInState` returns a state in which the moved Card's `status`, `completed_at`, and every field other than `column_id` and `order` equal the original.

**Validates: Requirements 21.22, 21.23, 22.19, 23.17, 25.2, 25.7**

### Property 57: Invite tokens never reach the logs

*For any* log message containing a request path of the form `/api/invites/<token>` or `/invite/<token>` with any token of 20 or more URL-safe characters, `redact_invite_tokens(message)` returns a string that does not contain the token and keeps the rest of the message; and *for any* string without such a path the output equals the input.

**Validates: Requirements 28.13**

### Property 58: E2E sources contain no literal credentials

*For any* generated Playwright source text, `findCredentialLiterals` reports a finding iff the text contains an e-mail address string literal or a string literal passed to a password or email input fill, and reports none for sources that read credentials only through `requireCredentials()` and values derived from it; and the real files under `web/e2e/` produce no findings.

**Validates: Requirements 33.10, 33.12**

### Property 59: Logo target depends only on authentication

*For any* AuthContext status in {`loading`, `authenticated`, `anonymous`}, `isVisitorAuthenticated(status)` is true iff the status is `authenticated`, so it is false during session restoration, after a failed restoration (including a 5xx or network failure that keeps the cookies), and after a logout; `logoTarget(isVisitorAuthenticated(status))` is `/` when it is true and `/welcome` otherwise; the result is always one of these two values and is never `/login`; the Header navigation uses the same `isVisitorAuthenticated(status)` value, so the logo target is `/` iff the user controls are shown; and *for any* sequence of statuses (restore, login, logout, session expiry), the target after each step equals the function applied to the status after that step alone, with no input for cookies, tokens, the Welcome_Cookie, or the current path.

*V8 change (refinement):* the first V8 form of this property quantified over a user value and access and refresh tokens (true when a User or any non-empty token is present). That form is superseded by Requirement 18.15 as refined; it let the logo and the navigation disagree during restoration.

**Validates: Requirements 18.14, 18.15, 17.14**

### Property 60: Forbidden-claims scan

*For any* text built from words that contain none of the forbidden strings, and any one forbidden string of Requirement 38 criterion 19 other than "free" inserted at any position in any letter case, `findForbiddenClaims` reports that string even when it sits inside a longer word (case-insensitive substring match, so "operating", "integrating", and "generating" report "rating"); *for any* text that contains the word "free" only inside a longer word (for example "freedom"), it does not report "free", and it reports "free" when it stands as a whole word (also next to punctuation, in any letter case); *for any* text without a forbidden string it returns an empty list; and the whole Welcome_Page text (`WELCOME_COPY`, `FEATURES`, `PREVIEW_SAMPLE`, every `aria-label`, `alt`, and `title`, and the page description) returns an empty list.

**Validates: Requirements 38.18, 38.19**

### V11 Correctness Properties (61 to 75)

**Prework summary (V11).** Criteria that vary with input and test our own logic became properties: the four-value status machine (R11.19, R39.1 to R39.3), the status and label maps (R39.5 to R39.11), the overdue selection and its formatting (R40.2 to R40.5, R40.11, R40.14), the checklist and link rules (R41.2 to R41.6, R41.10, R41.16, R42.5 to R42.7), cascades (R2.9 to R2.11), the combined counts and query budget (R44.4, R44.5), the rank rules and the permission table (R43.3 to R43.10, R43.13, R43.14). Reflection: "completed only when DONE" (R39.3) is merged into Property 61 and Property 46; "analytics unchanged by URGENT" is part of 61; the checklist cap and the link cap share one shape but different code, so they stay separate properties (66, 68). Classified as example, integration, or smoke tests instead: R39.4 (migration leaves rows unchanged), R40.7 and R44.3 (indexes exist), R40.8 (performance), R40.10 (fetch on load and on open, never on a timer), R44.1 and R44.2 (manual migration, 9 tables), R41.1 and R42.1 (model definitions), R43.4 (no endpoint), R44.6 (file size and package count), R36.15 (README).

#### Amendments to earlier properties (V11 change notes)

| Property | V11 change |
|---|---|
| 13, 47 | The role set is {admin, manager, member, guest, none}; the matrix is the one of A15. The `member` row loses the Column endpoints (R10.11), the manager row gains Column, member, and invite-link endpoints |
| 17 | Updatable Card fields stay as in V6; `status` may be `URGENT` |
| 18, 48 | The assignee is accepted iff the active role is `admin`, `manager`, or `member` |
| 24, 46 | Member activity lists roles `admin`, `manager`, `member`; `URGENT` Cards are not completed |
| 25 | Superseded by Property 71 (5 queries, counts) |
| 44, 45 | The status set has four values; `URGENT` is exercised in generators; behavior of the rule is Property 61 |
| 50 | The existing-role set is {none, guest, member, manager, admin}; a manager who accepts any token keeps `manager` |
| 55 | Guest UI is unchanged; a `member` view additionally hides the column controls, the member panel, and the invite links (Property 74) |
| 56 | The status set has four values; labels "Not started", "In progress", "Urgent", "Done" pairwise distinct (Property 62) |
| 60 | The forbidden list has no "checklist"; the copy mentions Urgent |

### Property 61: Four-value status state machine

*For any* initial status in {NOT_STARTED, IN_PROGRESS, URGENT, DONE}, any sequence of PATCH operations that supply or omit `status` (values from the four, and invalid values), and any increasing timestamps, `apply_status_change` sets `completed_at` to the current time exactly when the status changes to `DONE` from another value, sets it to null exactly when the status changes from `DONE` to another value, and leaves it unchanged for every change among `NOT_STARTED`, `IN_PROGRESS`, and `URGENT`, for `DONE` to `DONE`, and for an omitted status; after every step `completed_at` is not null iff the status is `DONE`; an invalid value (any string outside the four, any case variant, null) returns 400 and changes nothing; and `completed_this_week` never counts a Card whose status is not `DONE`.

**Validates: Requirements 11.4, 11.19, 14.2, 39.1, 39.2, 39.3**

### Property 62: Status style map

*For any* `CardStatus`, `STATUS_STYLE` returns a non-empty label and a non-empty complete class string, the four labels are exactly "Not started", "In progress", "Urgent", "Done", the four class strings and the four variants are pairwise distinct, the `URGENT` entry uses the danger tokens and the `DONE` entry the success tokens, and *for any* Card the board face, the CardDetailModal, and the My Tasks row render the badge from the same entry.

**Validates: Requirements 21.22, 23.17, 25.2, 39.5, 39.6**

### Property 63: Label color

*For any* string `t`, `labelColor(t)` is one of the eight palette keys; `labelColor(t)` equals `labelColor` of the same string on every call; `labelColor(t)` equals `labelColor(" " + t.toUpperCase() + "\t")` whenever the trimmed and lowercased forms are equal; and *for every* palette key `LABEL_CLASS[key]` is a non-empty string made only of design-system token classes with no template placeholder.

**Validates: Requirements 39.7, 39.8, 39.9, 39.11**

### Property 64: Overdue selection equals a naive model

*For any* set of Boards, memberships (any role, with soft-deleted rows), Columns, and Cards (any due date, any status, any assignee, soft-deleted rows), any current user, and any UTC date `today`, the overdue response contains exactly the Cards that are non-deleted, on a non-deleted Board and Column, with `due_date < today` and `status != DONE`, and that either are assigned to the user who holds the role `admin`, `manager`, or `member`, or are unassigned on a Board where the user is `admin` or `manager`; `days_overdue = (today - due_date).days >= 1`; the items are ordered by due date ascending and capped at 100; `total` equals the number of all matching Cards; a user who holds only `guest` roles gets an empty list and `total = 0`; and the stored Notifications and the unread count are the same before and after the call.

**Validates: Requirements 40.2, 40.3, 40.4, 40.5, 40.6**

### Property 65: Overdue chip and text

*For any* due date string (or null), status, and `today`, `isOverdue(due, status, today)` is true iff `due` is not null, `due < today`, and `status != DONE`; `formatOverdue(n)` is "1 day overdue" for `n = 1` and `n + " days overdue"` otherwise; and *for any* notification state, the unread count shown by the bell equals the count of stored unread notifications whatever the number of overdue items.

**Validates: Requirements 40.11, 40.12, 40.14**

### Property 66: Checklist rules

*For any* Card and any sequence of add, toggle, edit, and delete operations by a writer, the 51st non-deleted item is rejected with 400 and creates nothing, a soft-deleted item does not count toward the cap, each new item gets an `order` greater than every non-deleted sibling (1.0 for the first), invalid text (empty, whitespace only, over 200 characters) is rejected with 400 and leaves the item unchanged, `checklist_total` equals the number of non-deleted items and `checklist_done` the number with `is_done` true (computed, never stored), and no operation changes the Card's `status`, `completed_at`, or creates a Notification; and *for any* `done` and `total` with `total > 0`, `progressPercent` is `round(done / total * 100)` and the progress text is `done/total`, while `total = 0` shows no indicator.

**Validates: Requirements 41.2, 41.3, 41.5, 41.6, 41.10, 41.16**

### Property 67: Optimistic checklist toggle

*For any* checklist state, item, and request outcome, the toggled `is_done` value is visible in local state before the request resolves; a failed request restores the previous value and shows one error toast; a successful request keeps the value and updates the Card-face counts without a reload.

**Validates: Requirements 41.14, 41.17**

### Property 68: Link URL validation and cap

*For any* string `s`, `validate_link_url(s)` accepts it iff after trimming it has 1 to 2048 characters, contains no whitespace or control character, has the scheme `http` or `https` in any letter case, and has a non-empty hostname; the client mirror `validateLinkUrl` returns the same decision; `javascript:`, `data:`, `file:`, scheme-less, and `//host` values are rejected with 400; *for any* Card, the 11th non-deleted link is rejected with 400, a soft-deleted link does not count, an omitted label becomes the hostname cut to 100 characters, and a supplied label outside 1 to 100 characters after trimming is rejected.

**Validates: Requirements 42.2, 42.5, 42.6, 42.7, 42.13**

### Property 69: Provider icon key

*For any* hostname, `providerKey` returns one of `gdrive`, `onedrive`, `dropbox`, `notion`, `generic`; a listed host or any subdomain of it returns its key in any letter case; every other hostname returns `generic`; and *for any* link list, every rendered anchor has `target="_blank"`, a `rel` containing `noopener` and `noreferrer`, and the stored URL as `href`.

**Validates: Requirements 42.12, 42.14**

### Property 70: Soft-delete cascade covers checklist and links

*For any* Board, Column, or Card tree whose Cards have Checklist_Items and Card_Links (some already soft deleted), deleting the Board, Column, or Card sets `is_deleted = true` and the same `deleted_at` on every non-deleted item and link below it, leaves rows that were deleted earlier and unrelated rows unchanged, and a failure part-way leaves every row unchanged; later GET requests for a deleted Card return 404.

**Validates: Requirements 2.9, 2.10, 2.11, 2.13**

### Property 71: Board payload counts and constant query count

*For any* Board with any number of Cards from 0 to 500, any numbers of checklist items (done and not done) and links per Card, and any soft-deleted items and links, `GET /api/boards/<id>` executes the same number of SQL statements, at most 5, and every Card has `checklist_done`, `checklist_total`, and `link_count` equal to a naive in-memory count over non-deleted rows (0 when none); the create, update, and position responses carry the same three values for their Card.

**Validates: Requirements 29.2, 44.4, 44.5, 41.10, 42.15**

### Property 72: Role-change and removal decisions

*For any* caller role, target role, new role (including `admin` and invalid values), and owner flag, `decide_role_change` returns `ok` iff the caller is `admin` or `manager`, the new role is in {guest, member, manager}, the target is not the owner, the rank of the caller is above the rank of the target, and the rank of the caller is above the rank of the new role; it returns `bad_request` for a new role outside {guest, member, manager} and for an admin who targets the owner; and `forbidden` otherwise (so a manager cannot change or remove a manager or the admin, and only the admin can grant `manager`); `decide_member_removal` returns `ok` iff the caller is `admin` or `manager`, the target is not the owner, and the caller rank is above the target rank; and *for any* successful change to `guest`, every non-deleted Card of the Board assigned to that user has an empty assignee afterward, no Notification is created, and the user keeps exactly one active membership.

**Validates: Requirements 9.6, 9.7, 43.5, 43.6, 43.7, 43.8, 43.10, 43.11**

### Property 73: V11 permission matrix

*For any* role in {admin, manager, member, guest, none} and any endpoint of the V11 matrix in A15, the outcome equals the matrix cell: a `member` receives 403 on the four Column endpoints and succeeds on Card, checklist, link, and comment writes; a `manager` succeeds on Column, member-add, role-change (within the rank rule), member-removal, invite-links, and regenerate endpoints and receives 403 on Board update and delete and on analytics; the admin succeeds on every endpoint; a `guest` receives 403 on every write and succeeds on reads including GET `/api/cards/<id>`; a non-participant receives 403 on checklist, link, and card-detail endpoints; every 403 leaves the data unchanged; and `role_allows(role, level)` is true iff `ROLE_RANK[role] >= LEVEL_RANK[level]`.

**Validates: Requirements 9.9, 10.7, 10.10, 10.11, 37.5, 41.7, 42.8, 43.2, 43.3, 43.9**

### Property 74: Frontend `can` and role controls

*For any* role and action, `can(role, action)` equals the permission rule of Requirement 43 criterion 3 (the Board_Admin allows every action; the Board_Manager allows every action except `grant_manager`, `edit_board`, `delete_board`, and `view_analytics`; the `member` allows only `view_board` and `edit_cards`; the `guest` only `view_board`; null nothing); `assignableRoles` is {guest, member, manager} for the admin, {guest, member} for a manager, and empty otherwise; the role dropdown and remove control are shown for a membership iff `canActOnMember`; and *for any* board rendered as `member`, no column control, member panel, invite link, or analytics link appears, while as `manager` the column controls, member panel, and both invite links appear and the analytics link does not.

**Validates: Requirements 21.12, 21.13, 37.17, 43.13, 43.14, 43.15**

### Property 75: Manager accept and invite links

*For any* existing role in {none, guest, member, manager, admin} and token role in {member, guest}, `resolve_accept` returns `create` iff the existing role is none, `upgrade` to `member` iff the existing role is guest and the token role is member, and otherwise keeps the existing role (so a manager and an admin never lose rank); and *for any* Board, GET invite-links and regenerate succeed for the admin and every manager, return 403 for a `member`, a `guest`, and a non-participant, and never disclose a token in a 403 body.

**Validates: Requirements 37.3, 37.5, 37.6, 37.12, 28.12**

### V12 Correctness Properties (76 to 80)

**Prework summary (V12).** Criteria that vary with input and test our own logic became properties: the count computation and query budget (R47.2 to R47.4), the create and update count values (R47.5, R47.6), the exclusion of counts from the detail response (R47.7), the deep-link resolution and the "at most once" rule (R46.3 to R46.5, R46.8), the singular/plural count formatting (R47.11). Classified as example tests instead: the rename form's field-level validation reuses `validateBoardName`, already covered by Property 29 (client validators mirror server rules) and by `CreateBoardModal`'s existing unit tests, so no new property restates it; the delete-flow button states (R45.10, R45.11, R45.13) are UI sequencing, covered by example-based Vitest tests (Testing Strategy); the history-API `card` parameter removal (R46.7) is an integration behavior against the browser History API, not a pure function over a wide input space, so it is an example test, not a property; R46.2, R46.6, R46.9, R46.10, R48.6, R48.7 are structural/example/smoke (link target text, access-message branch, documentation-reading step, unchanged `decideRoute`, line counts, deployment order).

### Property 76: Board counts equal a naive model

*For any* Board with any number of non-deleted and soft-deleted Board_Memberships of any role (including `guest`) and any number of non-deleted and soft-deleted Cards, `counts_for_boards` (and `counts_for_board`) returns `member_count` equal to a naive in-memory count of non-deleted Board_Memberships of that Board of any role and `card_count` equal to a naive in-memory count of non-deleted Cards of that Board regardless of Column, assignee, or status; Board_Memberships and Cards of a different Board are never counted.

**Validates: Requirements 47.2, 47.3**

### Property 77: Board list query count is constant

*For any* authenticated User with from 0 to 20 Boards, each with any number of Board_Memberships and Cards, `GET /api/boards` executes the same number of SQL statements, at most 4 including the JWT user-lookup query, independent of the number of Boards returned or the number of Memberships or Cards per Board.

**Validates: Requirements 47.4**

### Property 78: Create and update carry the right counts

*For any* User who creates a Board, the POST `/api/boards` response has `member_count` exactly 1 and `card_count` exactly 0; and *for any* Board with any number of Board_Memberships and Cards, a Board_Admin's PATCH `/api/boards/<id>` response has `member_count` and `card_count` equal to the Board's current naive counts (Property 76) measured after the rename commits.

**Validates: Requirements 47.5, 47.6**

### Property 79: Board detail never carries the counts

*For any* Board with any number of Board_Memberships and Cards, the response of GET `/api/boards/<id>` contains neither a `member_count` key nor a `card_count` key, while the response of GET `/api/boards`, POST `/api/boards`, and PATCH `/api/boards/<id>` for the same Board always contain both.

**Validates: Requirements 47.7**

### Property 80: Deep-link resolution and the open-once rule

*For any* list of Cards on a Board and any `card` parameter value, the board page opens the CardDetailModal for the Card whose `card_id` equals the parameter iff such a non-deleted Card exists on that Board, and opens no modal otherwise (a malformed value, a soft-deleted Card, or a Card of another Board all resolve to "no modal", with no error and no toast); *for any* sequence of opening and closing that modal within one page load, the deep link contributes at most one open, so closing it never reopens it and never sends a `GET /api/cards/<id>` request; and *for any* `card` parameter that is empty or supplied more than once, the empty value is treated as absent and the first of repeated values is used.

**Validates: Requirements 46.3, 46.4, 46.5, 46.8**

#### V12 refinement: Properties 81 to 83 and amendments

**Prework (V12 refinement).** The design refinement (A22-R, B26, B27) moved three pieces of logic into pure functions whose behavior varies with input: the deep-link parsing and URL rebuild (`lib/deepLink.ts`, R46.1, R46.5, R46.7), the Board_Patch merge (`lib/boardPatches.ts`, R45.12, R20.10), and `formatCount` (R47.11). Each is cheap to run 100 times and has a large input space (strings, arrays, URLs, lists of Boards), so each becomes a property. Reflection: Property 80 already covers "which Card opens"; Property 81 covers only the pure parsing and URL rule, so they do not overlap. The R47.11 text rule was named in the first V12 Testing Strategy as "through `formatCount`'s own small property" without a number; Property 83 gives it one. Still example tests: R45.1 to R45.11 and R45.13 (UI sequencing), R46.2 and R46.6 (fixed link and fixed branch), R46.9 and R46.10 (documentation step, unchanged `decideRoute`), R47.8, R47.9 (no migration, OpenAPI text), R47.10 (type), R47.12, R47.13 (create flow, no client counting), R48 (suite rules).

| Property | V12 change |
|---|---|
| 34 | Unchanged. The My Tasks link target is an example test (Testing Strategy V12), not part of `groupByBoard` |
| 74 | Unchanged; the V12 rename and delete gating reuses `edit_board` and `delete_board`, already in the property |
| 79 | The detail response keeps the keys of `BoardDetailSchema`, which is unchanged; the list, create, and update responses use `BoardSummarySchema` (A22-R). The statement of Property 79 holds as written |
| 80 | "Never sends a `GET /api/cards/<id>` request" means the deep link itself sends none (resolution uses the board payload, closing sends none, there is no reopen). The modal's own detail load runs once per open as for a click (B27, Open issue 72) |

### Property 81: Deep-link parameter parsing and URL rebuild

*For any* value of the `card` search parameter (absent, a string including the empty string, or an array of strings), `resolveCardParam` returns `null` when the value is absent, empty, or an array whose first element is empty, and otherwise returns the first value unchanged; *for any* `/my-tasks` Card with any `board_id` and `card_id`, the title link target is `/boards/<board_id>?card=<encoded card_id>` and `resolveCardParam` of the parsed `card` value returns the original `card_id` (round trip); and *for any* absolute URL with any other query parameters and any hash, `stripCardParam` returns the same path, the same other parameters in the same order, and the same hash, with no `card` parameter, and applying it twice equals applying it once.

**Validates: Requirements 46.1, 46.5, 46.7**

### Property 82: Board patches merge

*For any* list of Board_Summaries and any sequence of rename and delete patches, `applyBoardPatches` returns the input list in the same order minus every Board whose id was deleted; a renamed Board shows the patched name iff its listed `updated_at` is missing or older than the patch's `updated_at`, and keeps every other field (including `member_count` and `card_count`) unchanged; applying the patches twice equals applying them once; a list that already reflects every patch is returned unchanged; and `parsePatches` of `JSON.stringify(p)` equals `p` while `parsePatches` of any invalid string returns the empty patches.

**Validates: Requirements 45.12, 20.10, 47.13**

### Property 83: Count text

*For any* non-negative integer `n` and noun in {"member", "card"}, `formatCount(n, noun)` equals `n + " " + noun` when `n` is exactly 1 and `n + " " + noun + "s"` otherwise; and *for any* Board_Summary, the rendered Board card contains `formatCount(member_count, "member")` and `formatCount(card_count, "card")` inside its single link to `/boards/<board_id>`.

**Validates: Requirements 47.11, 47.13, 20.9**

## Error Handling

| Situation | Behavior | Requirement |
|---|---|---|
| **V6** PATCH `/api/users/me` with `email`, with `password` but wrong or missing `current_password`, or with an empty body | 400 naming the field, User unchanged (never 403, name not saved) | 7.3 to 7.5 |
| **V6** Guest sends any write request | 403 generic message, data unchanged | 8.12, 37.14 |
| **V6** Card create body contains `status`, or PATCH `status` is not an exact enum value | 400 naming `status`, Card unchanged | 11.4, 11.17 |
| **V6** Assignee is a guest, removed member, or non-participant | 400, Card unchanged | 11.5, 11.22 |
| **V6** Invite token malformed, unknown, replaced, or Board soft deleted | 404, no membership, no Board data | 37.10 |
| **V6** Invite request without a valid access token | 401 (before the token lookup) | 37.23 |
| **V6** Regenerate with a role other than `member` or `guest` | 400, tokens unchanged | 37.7 |
| **V6** Concurrent accept hits the partial unique index | rollback, re-read, 200 with the existing role (no 409) | 37.11 to 37.13 |
| **V6** Invite page cannot copy to the clipboard | error toast, URL stays visible as selectable text | 37.15 |
| **V6** Regenerate request fails | old link stays displayed, `useErrorHandler` toast | 37.16 |
| **V6** Invite page: token 404 | not-found message with link to `/`, no Join button | 37.19 |
| **V6** Card creation fails | no card, no modal, toast | 21.19 |
| **V6** Profile 400 naming `current_password` | field error on the current-password input, user unchanged | 26.4 |
| **V6** Refresh at the proxy fails for an invite path | 401: cookies deleted, redirect to `/login?next=...`; network error or 5xx: `/login?expired=1` without `next` | 17.8 |
| Invalid body or query | 400, message names each invalid field, no write | 4.9, 4.10 |
| Missing, malformed, expired JWT; deleted or unknown token user | 401 envelope | 4.13, 6.9 |
| Role or membership failure | 403, no resource data in body | 4.14, 28.11 |
| Missing, soft-deleted, or non-UUID resource id | 404 | 4.12, 8.9 |
| Unknown path or method | 404 or 405, envelope | 4.18 |
| Unique violation | 409; FK or NOT NULL violation 400; no DB details | 2.14, 4.7 |
| Database unreachable or schema not applied | 500 generic; exception logged; process keeps serving | 3.6, 3.7, 34.10 |
| Unhandled exception | rollback, log, 500 generic | 4.11 |
| Cascade or create failure mid-transaction | rollback everything, 500 | 2.13, 8.10 |
| Missing env variable at startup | process fails naming the variable | 1.13, 28.6 |
| Frontend network error or timeout over 10 s | `ApiError(0, ...)`; toast through `useErrorHandler` | 16.8 |
| Frontend 401 on a protected request in the browser | one shared refresh, retry once; if refresh or retry returns 401, clear both cookies and state, redirect `/login` | 16.13 to 16.17 |
| Frontend 401 in a Server Component | no refresh, no cookie write; `ApiError(401)` is thrown and the page calls `redirect("/login?expired=1")` | 16.18 |
| Access token of a soft-deleted or nonexistent user, on any protected endpoint including `/api/users/me` | 401 envelope from the user lookup callback | 6.9, 7.6 |
| Touch drag interrupted (moved over 10 px, scrolled, or ended before 300 ms; ended outside a Column; `touchcancel`) | no drag, no state change, no request | 22.14, 22.16 |
| Refresh endpoint 401 (wrong type, expired, deleted user) | 401 envelope, no token issued | 6.11 to 6.14 |
| Middleware refresh fails | 401: delete both cookies, redirect `/login`; network error or 5xx: redirect `/login?expired=1` | 17.7, 17.8 |
| Failed optimistic move | restore original state, one toast | 22.7 |
| Polling failure | keep previous state, no toast | 24.9 |
| Server Component load failure (not 401) | `ErrorPanel` with retry | 20.8, 25.5 |
| Board 403 or 404 | access-denied or not-found message with link to `/` | 21.15 |

#### V11 error handling rows

| Situation | Behavior | Requirement |
|---|---|---|
| Card PATCH `status` is not one of the four exact values (`urgent`, `""`, null, unknown) | 400 naming `status`, Card unchanged | 11.4, 39.1 |
| A `member` sends a Column write | 403, Column unchanged | 10.11 |
| Role change: `role` missing or not `guest`, `member`, `manager` (including `admin`) | 400, membership unchanged | 43.8 |
| Role change names the Board_Admin: caller is the admin / caller is a manager | 400 / 403 (owner check before the rank rule, Open issue 47) | 9.7, 43.6, 43.8 |
| Caller rank not above the target rank, or new role not below the caller rank | 403, membership unchanged | 43.6, 43.7 |
| Role change or removal target has no active membership | 404 | 43.9 |
| 51st checklist item, 11th link | 400, nothing created | 41.5, 42.7 |
| Checklist `text` empty, blank, over 200; `is_done` not a boolean; `order` not a float above 0; empty PATCH body | 400, item unchanged | 41.6 |
| Link `url` fails the scheme, hostname, whitespace, or length rule; `label` outside 1 to 100 | 400, data unchanged | 42.6 |
| Guest or non-participant on checklist, link, or card-detail endpoints | 403; guest GET card detail is 200 | 41.7, 42.8 |
| Checklist item, link, or Card missing or soft deleted | 404 | 41.8, 42.8 |
| Two concurrent adds at the cap | the Card row lock serializes them; the second gets 400 | 41.5, 42.7 |
| Overdue request with a bad token | 401 | 40.9 |
| Overdue request fails in the browser | keep previous items, no toast | 40.15 |
| Checklist toggle fails | restore the value within 100 ms, one toast | 41.14 |
| Checklist or link add, edit, delete fails | list unchanged, entered values kept, toast | 41.15, 42.16 |
| Link form URL invalid | field error, no request | 42.13 |
| Role change request fails in the member panel | row keeps its old role, toast | 43.14 |
| Schema applied before the V11 migration (`URGENT`, `manager`, new tables) | the generic 500 handler answers with no database details | 3.6, 44.1 |

#### V12 error handling rows

| Situation | Behavior | Requirement |
|---|---|---|
| Rename form: name empty after trim, or over 100 characters | field-level error, no PATCH request, `RenameBoardModal` stays open with the entered text | 45.5 |
| Rename form: trimmed name equals the current name | `RenameBoardModal` closes, no PATCH request | 45.7 |
| PATCH `/api/boards/<id>` (rename) fails | `RenameBoardModal` stays open with the entered text, displayed Board name unchanged, `useErrorHandler` toast | 45.8 |
| Delete confirmed, DELETE `/api/boards/<id>` fails | stay on the board page, Board displayed unchanged, `ConfirmDialog` stays open with its buttons re-enabled, `useErrorHandler` toast | 45.13 |
| Delete cancelled | `ConfirmDialog` closes, no DELETE request | 45.10 |
| A non-admin role (`manager`, `member`, `guest`) views the board toolbar | rename and delete controls absent (display rule only; the API still returns 403 to a direct request) | 45.3, 45.14 |
| `card` query parameter matches no non-deleted Card of the Board (malformed, soft-deleted, or another Board's Card) | board renders normally, no CardDetailModal opens, no error message, no toast | 46.4 |
| `card` query parameter is empty or appears more than once | empty value treated as absent; first of repeated values used | 46.5 |
| GET `/api/boards/<id>` returns 403 or 404 while a `card` parameter is present | existing access-denied or not-found state (R21.15) renders; the `card` parameter is ignored | 46.6 |
| Unauthenticated request for `/boards/<id>?card=<card_id>` | existing `redirect("/login?expired=1")` branch fires; `next` is not set from the `card` parameter | 46.10 |
| Modal opened by the deep link is closed | `card` parameter removed via `window.history.replaceState` (no new history entry, no reload, no new GET request); board state otherwise unchanged | 46.7 |
| **V12 refinement** Escape or backdrop click while the DELETE request runs | ignored; `ConfirmDialog` stays open with disabled buttons until the response | 45.11 |
| **V12 refinement** Rename or delete succeeds but `sessionStorage` is unavailable or full | error caught and ignored; the push navigation to `/` still shows fresh server data; only a later back navigation to an older cached Dashboard entry may show the old list until reload (Open issue 73) | 45.12 |
| **V12 refinement** `kano_board_patches` holds invalid JSON | `parsePatches` returns the empty patches; the Dashboard shows the server list | 45.12 |
| **V12 refinement** Deep link closed after the user already changed other query parameters | `stripCardParam` removes only `card` and keeps the other parameters and the hash | 46.7 |
| **V12 refinement** Deep-link Card is deleted from the open modal | existing delete flow closes the modal; `onModalClose` removes `card`; the Card is gone from the board state | 46.7, 23 |
| **V12 refinement** GET `/api/boards` count query fails | existing 500 handler (A2) with no database details; the Dashboard shows `ErrorPanel` with retry (B2) | 4.11, 20.8 |
| **V12 refinement** Board deleted in another tab while it is listed | GET `/api/boards` omits it on the next server render; a click on a stale card leads to the existing 404 state (R21.15) | 21.15 |

## Testing Strategy

### Approach

Both unit tests and property-based tests are used. Property tests cover universal properties from the Correctness Properties section. Unit and example tests cover specific examples, edge cases, integration points, and smoke checks. Property-based testing applies here because the feature contains pure logic (ordering, validation, recipients, pagination, week boundary, reducers, guards) and service-level behavior over a large input space. It does not apply to Tailwind layout (Requirement 27), deployment (34), repository hygiene (35), and documentation (36); those use example tests, Playwright viewport checks, and checklists.

Libraries: **Hypothesis** for Python and **fast-check** for TypeScript. Property-based testing is not implemented from scratch. Every property test:

- runs at least 100 iterations (`@settings(max_examples=100, deadline=None)`; `fc.assert(..., { numRuns: 100 })`),
- implements exactly one Correctness Property,
- carries a tag comment: `# Feature: kano, Property <n>: <property text>`.

### Backend (pytest, run from `app/`)

| Layer | Content |
|---|---|
| Config | `pytest.ini` (markers `perf`, `unit`, `e2e`), `tests/conftest.py` |
| Unit, no DB | `ordering.py`, `start_of_week_utc`, `comment_recipients`, Marshmallow schema boundaries (Board and Column names of 0, 1, 100, 101; Card title 200, 201; password 7, 8), config validation (both JWT expiry variables), serializers; mostly property tests (1 to 5, 12, 21, 24 partial) |
| Auth tokens | login returns access (`type=access`, 3600 s) and refresh (`type=refresh`, 604800 s) tokens with `sub = user_id`, plus `expires_in = 3600` and `refresh_expires_in = 604800` in the response data; GET and PATCH `/api/users/me` and one more protected endpoint return 401 for an access token of a soft-deleted user (Property 43); refresh returns 200 and the new token works on `GET /api/users/me`; 401 for an expired, missing, or access-type token on refresh, for a refresh token of a soft-deleted user, and for a refresh token on `GET /api/users/me` and every other protected endpoint (parametrized); tokens are created with short test lifetimes or a patched clock instead of waiting (Properties 36 to 38 and 43, requirement 31.11) |
| Soft-deleted user fixtures | No endpoint deletes a User (Requirement 7.7), so a `make_deleted_user(email)` fixture inserts a `User` row with `is_deleted = true` and `deleted_at` set directly through the test session. Requirements 6.6, 6.9, 6.13, and 31.11 and Properties 9, 11, 38, and 43 use it. It also seeds soft-deleted rows for the uniqueness test (Property 9) |
| Service and e2e, DB | Flask test client against the separate PostgreSQL test database; covers all 8 packages with at least one success and one error path each; asserts envelope shape and status on every request; properties 6 to 25 where DB-backed |
| Comments | tests for 201 success, 400 missing content, 400 empty content, 401 unauthenticated, 403 non-owner including the Board_Admin |
| Role enforcement | parametrized matrix of non-member, member, admin over Board, Column, Card, Comment, member, update, delete, analytics endpoints |
| Cascades | soft delete Board, Column, Card sets flags on children and later GETs return 404 |
| Performance | marker `perf`: seeds 20 Columns and 500 Cards, 100 consecutive `GET /api/boards/<id>` calls, p95 under 500 ms, query count via SQLAlchemy `before_cursor_execute` listener; same for search and `assignee=me` over 2000 Cards; a failure prints the measured p95 in ms |

Test database safety (Requirement 31.10):

- `conftest.py` reads `TEST_DATABASE_URL`, refuses to run if it equals `DATABASE_URL` or its database name does not end with `_test`, and connects once at session start.
- If it cannot connect, or the expected 7 tables are missing, `pytest.exit("Test database <name> unavailable or schema not applied")` stops the run. The schema in the test database comes from the manual `flask db upgrade` run against it, not from `db.create_all()`.
- Isolation (Requirement 31.7): after each test an autouse fixture runs `TRUNCATE ... RESTART IDENTITY CASCADE` on the 7 tables, so tests are order independent and re-runnable. Fixtures create their own users, boards, and tokens through factory functions.
- Hypothesis database-backed tests use a function-scoped fixture reset inside the test body (`@given` plus manual truncate) because function-scoped fixtures are not reset between examples.

### Frontend unit tests (`npm test`, run once, no watch)

Runner: Vitest with jsdom and React Testing Library (`vitest --run` for `npm test`; the config can be Jest if the scaffold prefers it). Network is mocked with `vi.fn()` on `fetch`; no Kano_API is needed (Requirement 32.9).

| Subject | Tests |
|---|---|
| `BaseButton` | each variant has a distinct class, click fires `onClick` once, disabled ignores clicks and sets `aria-disabled` |
| `BaseModal` | absent when closed, present when open, Escape closes, backdrop closes, content click does not close, focus moves inside, focus returns |
| `RegisterForm` | empty name, malformed email, 7-character password each show a field error and send no request; 8-character password submits |
| `LoginForm` | empty email and empty password blocked; valid form submits |
| `CommentList` | controls visible only for owned comments |
| `NotificationBell` | shows 1 and 99, hides at 0 (plus Property 32) |
| `apiClient` | Authorization header present or omitted; returns `data`; ApiError for 400, 401 (no refresh token), 403, 404, 409, 500 (Property 26) |
| `apiClient` refresh | 401 triggers one refresh and one retry with the new token; concurrent 401s share one refresh; refresh 401 clears both cookies and state and redirects; a 401 from login does not refresh (Property 39, requirement 32.12) |
| `useDragAndDrop` (mouse) | failing request restores card and calls handler once; card moves before the request resolves (Properties 30, 31) |
| `useDragAndDrop` (touch, Requirement 32.13) | RTL `fireEvent.touchStart` / `touchMove` / `touchEnd` / `touchCancel` with `vi.useFakeTimers()` and `document.elementFromPoint` mocked to return a Column element: 300 ms hold without movement starts a drag and `touchmove` is default-prevented; move over 10 px, end, or cancel before 300 ms starts no drag and sends no request; touch end over a Column moves the card before the mocked request resolves; a rejected request restores the card and shows one toast; touch end outside a Column, on the own position, or `touchcancel` sends nothing (Properties 41, 42) |
| `apiClient` server runtime (Requirement 32.14) | with `window` undefined: a 401 throws `ApiError(401)`, no refresh request, no cookie write (Property 40) |
| `AuthProvider.login` (Requirement 32.14) | cookie `Max-Age` values come from `expires_in` and `refresh_expires_in`, tested with values other than 3600 and 604800 (Property 40) |
| Pure libs | `order.ts`, `authCookie.ts` (`guardDecision`, cookie constants), `validation.ts`, `format.ts`, `diffCardFields`, `groupByBoard` via fast-check (Properties 27 to 35) |

### Playwright E2E (`npx playwright test`, run from `web/`)

- `playwright.config.ts` reads `E2E_BASE_URL`. If it is missing or not an absolute http(s) URL, the config throws before any test starts and the message names `E2E_BASE_URL` (Requirement 33.2). `use.baseURL = E2E_BASE_URL`, `expect.timeout = 10_000`, `timeout = 60_000`, `retries = 2` at most, `reporter = [["html", { open: "never", outputFolder: "playwright-report" }]]`.
- No `waitForTimeout` anywhere; only auto-waiting locators and web-first assertions (`expect(locator).toBeVisible()`, `toHaveURL`).
- Auth specs (4 scenarios): valid login redirects to `/`; invalid credentials show the error and stay on `/login`; unauthenticated visit to `/` redirects to `/login`; logout redirects to `/login` and a following visit to `/` redirects again.
- Kanban journey (serial, one test with 8 `test.step` blocks): 1 register a unique user (`e2e+<timestamp>@example.com`), 2 login, 3 create Board, 4 add 2 Columns, 5 create Card in the first, 6 drag it to the second (`locator.dragTo`, which dispatches HTML5 drag events in Chromium), 7 reload and confirm the Card is in the second Column, 8 add a Comment then edit it and confirm the new text. `test.describe.configure({ mode: "serial" })` skips remaining steps after a failure.
- The HTML report from a passing run is committed (`web/playwright-report/`) and viewed with `npx playwright show-report`.
- Playwright covers the mouse drag only. A long-press touch drag cannot be simulated reliably in Playwright, so the touch drag is verified manually in browser DevTools device mode at 375 px (Requirements 27.8, 34.8) and by the React Testing Library tests above.
- Mobile viewport checks (375 px) use a Playwright project with `devices["iPhone SE"]`-like viewport and assert no horizontal overflow outside the Kanban container.

### Testing Strategy: V6 additions (Requirements 31.12 to 31.17, 32.15 to 32.19, 33.3, 33.4, 33.10 to 33.14, 35.1, 35.2)

The V5 strategy above stays in force. V6 adds the following. Property tests use Hypothesis (Python) and fast-check (TypeScript), at least 100 iterations, one test per property, tagged `Feature: kano, Property <n>: <text>`. Tests that need the new columns are blocked until the V6 manual Migration_Step is done on the test database.

**Backend (pytest).**

| Area | Tests | Properties |
|---|---|---|
| Users (31.12) | PATCH name boundaries 0, 1, 100, 101; password boundaries 7, 8, 128, 129 with correct `current_password`, then login with the new password; 400 naming `current_password` for a wrong or missing value with the name unchanged; 400 for any body with `email` (any value, including the current email); responses and captured logs contain no password or hash | 54, 17 |
| Cards (31.13) | default `NOT_STARTED`; 400 for `status` on create; 400 for `done`, `""`, null, unknown on PATCH; `completed_at` rules incl. `DONE` to `DONE`; `status` and `completed_at` in board detail, search, and My Tasks; position change (including into a Column named `Done`) leaves both unchanged; `apply_status_change` as a pure property and a stateful Hypothesis test over PATCH sequences | 44, 45 |
| Analytics (31.14) | boundary Monday 00:00:00 UTC counted and one second earlier not; `DONE` in a Column not named `Done` counted; Column named `Done` with other status not counted; soft-deleted `DONE` not counted; guests excluded from member activity; compared with a naive model | 46 |
| Guest role (31.15) | parametrized endpoint by role matrix from A4-V6 (every write endpoint of Requirement 37.14 gives 403 for a guest with the data unchanged, every guest read endpoint gives 200); guest assignee gives 400; analytics and invite-links give 403 for a guest; no notification for a guest; `role_allows` as a pure property | 47, 48 |
| Invitations (31.16) | tokens created with the Board and lazily for NULL Boards; token format and uniqueness; invite-links and regenerate for the admin, 403 for member, guest, non-participant; regenerate invalidates the old token (404) and leaves the other role's token; accept creates `member` and `guest` memberships; guest upgraded by the member token; no downgrade; repeated accept idempotent; accept after a soft-deleted membership creates a new active row; 404 for an unknown token and for a soft-deleted Board; 401 without a token; a concurrent-accept test (two threads) ends with one active row; no new table (the 7 tables listed from `information_schema`); log capture contains no token (`redact_invite_tokens`) | 49, 50, 51, 57 |
| Schema (2.15 to 2.17) | check constraints `ck_cards_status` and the three-role `ck_board_memberships_role` reject bad values; unique token constraints allow many NULLs | integration examples |
| Property tests (31.17) | `completed_at` state machine over generated status sequences, `resolve_accept` over all role pairs, `role_allows` | 44, 50, 47 |

**Frontend unit tests (Vitest and React Testing Library, network mocked).**

| Area | Tests | Properties |
|---|---|---|
| Profile (32.15) | email is read-only text with no email input; name 0 and 101 characters show an error without a request; password section with one input filled shows an error without a request; new password of 7 characters errors and 8 characters is sent with `current_password`; a 400 naming `current_password` shows the error on that input; the request body never contains `email` | 29 |
| CardDetailModal (32.16) | status control with the three options and current status preselected; a status-only change sends PATCH with only `status`; the board card and My Tasks row show the new badge; a failing PATCH keeps the modal open and the previous status; the guest view is read-only with no save, delete, or comment form | 56, 55 |
| New-card flow (32.17) | modal opens after 201; no modal after a failure; closing keeps the title-only card | state-diagram examples |
| Invitation UI (32.18) | `MemberPanel` shows both links with copy buttons only for the admin; regenerate asks for confirmation and replaces the link only after 200; the invite page shows board name and role and joins through POST accept; 404 shows the not-found message without Join; the guest board view hides every control of Requirement 21.20 and starts no drag; copy failure shows the error toast and keeps the URL | 55 |
| Route and `next` (32.19) | `decideRoute` over every combination of path class, auth state, and cookie flag (fast-check over generated tokens for invite paths); `safeNext` over generated strings (valid invite paths accepted; absolute and protocol-relative URLs, backslashes, extra slashes, other paths rejected) | 52, 53 |
| Pure libs | `status.ts` labels, `roles.ts`, `inviteRoles.acceptOutcome` parity with `resolve_accept` over all pairs, `moveCardInState` preserves status | 50, 56 |
| Credentials scan (33.12) | `findCredentialLiterals` over generated sources, plus a test that scans every file in `web/e2e/` and fails on a finding (same style as the `waitForTimeout` check) | 58 |

**Playwright (V6 changes to the V5 plan above).**

- **Credentials and loading order (Requirements 33.10, 33.11).** `playwright.config.ts` loads `web/.env.test` with dotenv before reading any variable: `loadEnv({ path: path.resolve(__dirname, ".env.test"), override: false })`. dotenv never overwrites a variable that already exists in the process environment, so a value set in the shell or CI wins over the file. After loading, the config validates `E2E_BASE_URL` (absolute http or https URL) and throws an error naming the variable before any test starts (Requirement 33.2, unchanged). `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are read only through `e2e/support/credentials.ts`: `requireCredentials()` throws `Missing required environment variable: <NAME>` (never the value) when one is missing or empty, so the test that needs it fails at once with that message. The helper also builds the wrong password at run time (`password + "-wrong-" + Date.now()`) and the unique registration email by plus-addressing the local part of `E2E_USER_EMAIL` with a run stamp, so no e-mail or password literal appears in `web/e2e/`.
- **Files.** `web/.env.test.example` is committed with placeholders for `E2E_BASE_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`. `web/.env.test` is git-ignored. `.gitignore` keeps ignoring `.env*` and adds the exception `!.env.test.example` after it (and `!.env.example`); a check runs `git check-ignore web/.env.test` (must be ignored) and `git check-ignore web/.env.test.example` (must not be). (V7 change: this check is not automated in task 33.1. It was run once by hand, and the repository hygiene script of task 23.7 automates it later. `web/.gitignore` gets the same `!.env.test.example` exception.) This `.gitignore` edit is an implementation change for the tasks step. The login-based tests need an account for `E2E_USER_EMAIL` that already exists on the target database, which the user creates manually before the run (Requirement 33.14).
- **Welcome cookie helper.** `e2e/support/welcome.ts` exports `setWelcomeSeen(context, baseURL)` that adds the `kano_welcome_seen=1` cookie, used by every scenario that visits `/` while unauthenticated (Requirement 33.3).
- **New scenarios.** (1) Welcome: a fresh context visits `/` and lands on `/welcome`, sees the "Log in" and "Create account" buttons, "Log in" leads to `/login` and `context.cookies()` contains `kano_welcome_seen`, "Create account" leads to `/register`, and a second visit to `/` lands on `/login` (Requirement 33.13). (2) Status: open a card, choose "In progress", save, see the badge on the board; set "Done" and see "Done" in `/my-tasks`. (3) New card: add a card by title, the modal opens with the title, fill the description, Save. (4) Invite join: the pre-existing user creates a Board and reads the member and guest links in the member panel; a second browser context registers a generated user and opens the member link, joins, and sees edit controls; a third context joins through the guest link and sees the "Guest" badge and no add-column control. (5) Profile: `/profile` shows the email as text equal to `E2E_USER_EMAIL` and has no email input. The V5 auth scenarios call `setWelcomeSeen` first and use the helper credentials.
- **Unchanged.** Auto-waiting only, no `waitForTimeout`, 10 s assertion timeout, 60 s test timeout, at most 2 retries, HTML report, serial Kanban journey (its step 1 now registers a generated email with the password from `E2E_USER_PASSWORD`).

### Testing Strategy: V8 additions (Requirements 32.20 to 32.22, 33.13, 33.15, 33.16)

The V5 and V6 strategy stays in force. V8 is frontend only, so there are no pytest changes and no dependency on a migration. Property tests use fast-check, at least 100 runs, one test per property, tagged `Feature: kano, Property <n>: <text>`. Network is mocked in unit tests (R32.9). Credentials in `web/e2e/` come only from `requireCredentials()` (Property 58 still applies to the new specs).

**Unit tests (Vitest and React Testing Library).**

| Area | Tests | Properties |
|---|---|---|
| `logoTarget` (32.20) | fast-check over each AuthContext status (`loading`, `authenticated`, `anonymous`) and over random status sequences for `isVisitorAuthenticated(status)` and `logoTarget`; true only for `authenticated`; target never `/login`; the function takes no cookie, token, or user input (V8 refinement; the first V8 test generated user and token values, superseded) | 59 |
| Header logo (32.20) | Render `Header` inside a test `AuthContext` provider. Assert: anonymous gives `href="/welcome"` with the cookie `kano_welcome_seen` present and absent; anonymous on the `/login` and `/register` pages (mocked `usePathname`) gives `/welcome`; status `authenticated` gives `/`; **V8 refinement (R32.20):** a visitor with only a refresh cookie gets `/welcome` while the status is `loading` or `anonymous` (including a 5xx restore failure that keeps the cookies) and `/` once the restoration succeeds (the test advances the mocked `GET /api/users/me` from pending to 200); in every status the logo target and the navigation (Log in and Register anchors versus My Tasks, bell, and user menu) match the same authentication state; after calling `logout()` the same rendered link changes to `/welcome`; the link is found with `getByRole("link", { name: "Kano" })` (Testing Library matches the string exactly; scope to `getByRole("banner")` when the Footer is rendered too) and its `href` is never `/login`; a click calls no `fetch` and no write to `document.cookie` (spy on the cookie setter). (Supersedes the first V8 case "refresh token only gives `/`".) | 59 |
| One Header and one Footer (32.20) | Render `RootLayout` around stub children for the welcome, login, register, dashboard, board, My Tasks, and profile stand-ins and assert one `banner` and one `contentinfo` role each. A static test reads `app/**/page.tsx` and `components/**` and fails if a file other than `layout.tsx` renders `<Header` or `<Footer`. |  |
| Welcome_Page (32.21) | Render `WelcomeContent` (and the Header from the layout shell). Assert: the sections appear in the order hero, preview, features, bottom CTA (`compareDocumentPosition`); Header "Log in" is an anchor (`a[href="/login"]`) and "Register" an anchor (`a[href="/register"]`), neither rendered through `BaseButton` (V8 refinement, R38.2: the test checks they are `a` elements and have no `BaseButton` marker class or `button` role), while "Get started", the bottom "Create account", and the bottom "Log in" are `BaseButton`s; hero has the eyebrow, one `h1`, the subheadline, and the "Get started" button to `/register` (click calls `router.push("/register")` and sets the cookie); four feature cards with the exact titles and descriptions of R38.17; bottom "Create account" to `/register` and "Log in" to `/login`; `BoardPreview` content container has `aria-hidden="true"` and `container.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")` is empty; the horizontal scroller is the parent of that container (not inside it) and has `tabindex="-1"`; exactly one element of the preview carries `shadow-overlay` (the dragged Card) and no other element of the page has a `shadow-*` class; `fetch` is never called; no `blockquote`, `q`, `cite`, star character, or element with `role="img"` and a rating label. | 60 |
| Forbidden claims (32.21, R38.19) | `findForbiddenClaims` over `WELCOME_COPY`, `FEATURES`, `PREVIEW_SAMPLE`, the page `metadata.description`, and over the DOM: all text nodes plus every `aria-label`, `alt`, and `title` attribute, case-insensitive substring matching for every entry except "free", which is a whole-word match (R38.19). A fixed example test shows the false positives of the rule ("operating", "integrating", and "generating" report "rating"; "freedom" does not report "free"). A source-text test also scans `components/welcome/**`, `app/welcome/page.tsx`, and `lib/welcomeContent.ts` for the strings. The forbidden list itself lives in `lib/forbiddenClaims.ts`, outside the scanned files. | 60 |
| Board separator (32.22) | Render `BoardView` with a `BoardDetail` fixture for roles `admin`, `member`, and `guest` (`apiRequest` mocked). Assert: `getAllByRole("separator")` has length 1; it follows `[data-testid="board-toolbar"]` and precedes `[data-testid="board-content"]` in document order and also with the search-results state shown; the toolbar, the content wrapper, and their parents inside `BoardView` have no class that starts with `border-t` or `border-b` and the toolbar has no `border` class; the separator class list has `h-px` and `bg-line`. The add-column form (V8 refinement, R21.24) is not a descendant of `[data-testid="board-toolbar"]` and is the last item of the Kanban row inside `[data-testid="board-content"]` for admin and member, and absent for guest. Render `BoardAccessMessage` (the 403 and 404 states) and assert zero separators. jsdom has no layout, so overlap and thickness are checked in Playwright. | |

**Playwright (additions to the V6 scenarios; every scenario that is unauthenticated and visits `/` keeps using `setWelcomeSeen`, except the welcome scenario).**

- **Welcome scenario (R33.13, amended).** Fresh context, no cookies. `goto("/")` ends on `/welcome`. Section-scoped locators: Header `page.getByRole("banner")` with links "Log in" and "Register"; hero `page.getByRole("region", { name: "Organize work smoothly, from idea to done" })` with the button "Get started"; bottom `page.getByRole("region", { name: "Ready to bring calm to your project planning?" })` with the buttons "Create account" and "Log in". Click the Header "Log in": URL `/login` and `context.cookies()` contains `kano_welcome_seen`. Then `goto("/")` ends on `/login`. In a second step, `goto("/welcome")` (always served to an anonymous visitor) and click the bottom "Create account": URL `/register`. The scoping avoids the ambiguity of two "Log in" controls.
- **Logo scenarios (R33.15).** (1) Anonymous: `goto("/login")` (the proxy sets the cookie), click `page.getByRole("banner").getByRole("link", { name: "Kano", exact: true })` (V9 refinement: `exact: true` added, because the footer links "Kano on GitHub" and "Kano on LinkedIn" contain "Kano"; the banner scope already excludes them), `expect(page).toHaveURL(/\/welcome$/)`. (2) The same on `/register`. (3) Logged in with `requireCredentials()`: create a Board through the UI (unique name), open it, click the logo, `expect(page).toHaveURL(/\/$/)`, and assert the URL contains neither `/welcome` nor `/login` and the Dashboard heading is visible.
- **Layout scenarios (R33.16).** Run at `{ width: 375, height: 812 }` and `{ width: 1920, height: 1080 }` through `page.setViewportSize`. Welcome: `document.documentElement.scrollWidth <= clientWidth` (read with `page.evaluate`, polled with `expect.poll`), and at 375 px `boundingBox()` width and height at least 44 for the logo link, "Log in", "Register", hero "Get started", bottom "Create account", and bottom "Log in". Board page (logged-in user with a Board and two Columns): exactly one visible `getByRole("separator")`; a helper `expectNoOverlap(locators)` checks pairwise that the bounding boxes of the toolbar controls (back link, title, search input, Members, Analytics) do not intersect; the separator box top is at least the largest bottom of the toolbar controls and at most the top of the first Column; the separator height is 1 px (`boundingBox().height` equals 1 within 0.5); and the page `scrollWidth` does not exceed the viewport (the Kanban container may scroll). The guest view is covered by the unit tests, because it needs a second account.
- **Unchanged.** Auto-waiting only, no `waitForTimeout`, 10 s assertions, 60 s tests, at most 2 retries, HTML report, serial Kanban journey, and the credentials scan (Property 58) over the new spec files. A V8 run must still end with all tests passed (R33.8).

**Not property-tested (examples only).** The look of the Welcome_Page and the toolbar (design-system conformance), icon names, and Tailwind classes. These use the example and Playwright checks above and a manual review at 375 px and 1920 px (task 33.3 style checklist).

### Testing Strategy: V9 additions (Requirements 32.23, 33.17, 18.16 to 18.21, 27.11, 27.12)

The V5, V6, and V8 strategy stays in force. V9 is frontend only (no pytest change, no migration dependency). Network is mocked in unit tests (R32.9). The Footer is a Server Component with no hooks, so RTL renders it directly with `render(<Footer />)`.

**Correctness Properties: none added.** The footer has fixed text, two fixed links, and fixed classes. Its behavior does not vary with input, so a universally quantified property would only restate a constant (PBT does not apply to this UI rendering). The existing Property 60 is not changed: its corpus (`WELCOME_COPY`, `FEATURES`, `PREVIEW_SAMPLE`, page description) does not include `FOOTER_CONTENT`, and R38.19 for the footer is covered by the example test below. If a property is wanted later it would be numbered 61.

**Unit tests (Vitest and React Testing Library), file `web/__tests__/Footer.test.tsx` (R32.23).**

| Area | Assertions |
|---|---|
| Brand and text | The text "K" (brand mark), the text "Kano" (wordmark), and the paragraph whose `textContent` is "Portfolio project built in 2026 by JC" are rendered; "JC" is found by `getByText("JC")` as its own element (`span`) with `font-medium` and `text-ink`; the brand mark and the dot are `aria-hidden`. |
| Links | Queries are scoped with `within(screen.getByRole("contentinfo"))` (or use exact name matching, because "Kano on GitHub" and "Kano on LinkedIn" contain "Kano"). `getAllByRole("link")` inside the footer has length 2. The link named exactly "Kano on GitHub" has `href` `https://github.com`; the link named exactly "Kano on LinkedIn" has `href` `https://www.linkedin.com`; each has `target="_blank"` and a `rel` that contains `noopener` and `noreferrer` (split on spaces). |
| Decorative icons | Each link contains one `svg` with `aria-hidden="true"` and `focusable="false"`; the link has no text content other than the `aria-label`. |
| Hover and focus classes | Each link `className` contains `hover:text-ink`, `hover:bg-sunken`, `transition-colors`, `duration-150`, `focus-visible:outline-2`, and `focus-visible:outline-primary-500`, and has `size-11` (44 px) and `text-ink-muted`. (jsdom has no `:hover` or layout, so computed color and size are checked in Playwright.) |
| Brand group not a link | `getByText("Kano")` inside the footer is not inside an `a` element, and the footer has no link whose name is exactly "Kano". A page-level check renders the Header (with a test AuthContext) and the Footer and asserts `getAllByRole("link", { name: "Kano" })` has length 1 and its `href` is the V8 logo target. |
| No raw values | No element of the footer subtree has a class that starts with `shadow-`, `bg-[`, `text-[`, `p-[`, or `bg-gradient`, or equals `font-bold` (R18.21). |
| No side effects | `fetch` is not called, and `document.cookie` setter spy is not called, when the footer renders and when each link is hovered and focused with `userEvent` (R18.21). |
| Forbidden claims (R38.19) | `findForbiddenClaims` over `FOOTER_CONTENT` (all strings), the footer `textContent`, and every `aria-label`, `alt`, and `title` in the footer returns an empty list. |
| One Footer per page (R18.13) | Re-use the V8 layout stand-in harness (`RootLayout` around stub children for the dashboard, board, My Tasks, profile, login, register, and invite pages) and add a stand-in for the Welcome_Page that renders `WelcomeContent`: exactly one `contentinfo` role on each page, and on the Welcome_Page the footer follows the bottom call-to-action section in document order. The static source test of V8 (no page renders `<Footer` itself) also covers the new files. |
| Mark parity | `KanoMark` renders the same class list in the Header and in the Footer (both render the shared component), and `Header` has no remaining inline "K" `span`. |

**Playwright, footer scenario (R33.17), file `web/e2e/footer.spec.ts`.** Runs at `{ width: 375, height: 812 }` and `{ width: 1920, height: 1080 }` through `page.setViewportSize`, on `/welcome` (fresh context, anonymous) and on the Dashboard (logged in with `requireCredentials()`, no literal e-mail or password in the file, Property 58 still applies).

- Locators are scoped to the `contentinfo` role and use exact names (R33.17): `const footer = page.getByRole("contentinfo")`; `footer.getByRole("link", { name: "Kano on GitHub", exact: true })` and the LinkedIn equivalent (the `exact: true` option is required because Playwright matches names as substrings by default, and "Kano on GitHub" contains "Kano"). The logo scenarios of V8 (R33.15) use `page.getByRole("banner").getByRole("link", { name: "Kano", exact: true })`.
- Assertions (web-first, auto-waiting): `expect(footer).toContainText("Portfolio project built in 2026 by JC")`; the footer shows the brand text "Kano"; both links `toBeVisible()`; `toHaveAttribute("href", "https://github.com")` and `("href", "https://www.linkedin.com")`; `toHaveAttribute("target", "_blank")`; `toHaveAttribute("rel", /noopener/)` and `/noreferrer/`.
- No horizontal scroll: `await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)` at both widths.
- Tap target at 375 px: `boundingBox()` width and height of each link is at least 44. Overlap: the two link boxes do not intersect each other or the brand text box (`expectNoOverlap`, the V8 helper). The footer box lies inside the viewport width.
- Hover (desktop width only): `link.hover()`, then the computed `background-color` of the link differs from its value before the hover and the computed `color` changes. The test compares before and after values and does not hard-code a color.
- The suite never clicks a footer link and never navigates to an external site, uses no `waitForTimeout`, and keeps the 10 s assertion and 60 s test timeouts and the retry limit.

**Not tested automatically.** The exact look (icon shape, spacing rhythm) is checked by a manual review at 375 px and 1920 px in the 33.3 style checklist. The real GitHub and LinkedIn URLs are not checked, because they are placeholders (Open issue 41).

### Testing Strategy: V11 additions (Requirements 31.17 to 31.25, 32.24 to 32.30)

V5 to V9 strategy stays. Property tests use Hypothesis and fast-check, at least 100 iterations, one test per property, tagged `Feature: kano, Property <n>: <text>`. DB-backed tests are blocked until the V11 manual Migration_Step has run on the test database (R3.11). The test-database check now expects the 9 tables.

**Backend (pytest).**

| Area | Tests | Properties |
|---|---|---|
| Status (31.13 extended) | `URGENT` accepted on PATCH; `urgent`, `""`, null, unknown give 400; stateful Hypothesis test over four-value sequences; `completed_this_week` ignores `URGENT` | 61 |
| Schema | `information_schema` lists exactly the 9 tables; inserting `status = 'URGENT'` and `role = 'manager'` works, `'urgent'` and `'owner'` fail; `ix_cards_due_date`, `ix_checklist_items_card_id_order`, `ix_card_links_card_id` exist (smoke) | examples |
| Links URL (31.18) | Hypothesis over generated strings and generated scheme prefixes: accepted iff the rule; `javascript:`, `data:`, `file:`, scheme-less rejected with 400 through the endpoint | 68 |
| Caps (31.19) | 50th item accepted, 51st 400; 10th link accepted, 11th 400; a soft-deleted item or link does not count; a two-thread add at 49 items ends with 50 items | 66, 68 |
| Guest and non-participant (31.20) | 403 on checklist and link writes, on PATCH members, and for a non-participant also on GET card detail; guest GET card detail 200 | 73 |
| Cascades (31.21) | delete Card, Column, Board: items and links get `is_deleted` and the same `deleted_at`; earlier-deleted rows keep their own `deleted_at`; GET deleted Card 404; injected failure rolls back | 70 |
| Query budget (31.22) | `before_cursor_execute` counter on GET board for 10 and 500 Cards with items and links: equal and at most 5; counts correct and exclude soft-deleted rows; create, update, position carry the counts | 71 |
| Ranks (31.23) | Hypothesis over caller, target, new role, owner flag against `decide_role_change` and `decide_member_removal`; endpoint tests: manager cannot change or remove a manager or the admin, only the admin grants `manager`, admin self-target gives 400, manager on admin gives 403; change to `guest` clears assignments, creates no notification | 72 |
| Columns by role (31.24) | `member` gets 403 on the four Column endpoints and keeps Card, checklist, link, comment access; manager and admin succeed | 73 |
| Overdue (31.25) | due yesterday not `DONE` returned with `days_overdue = 1`; due today not returned; `DONE` not returned; `URGENT` past due returned; other assignee not returned; unassigned returned to admin and manager only; soft-deleted Card, Column, Board not returned; 100-item cap with full `total`; no Notification row created; p95 under 500 ms over 20 Boards and 2,000 Cards (marker `perf`) | 64 |
| Invites (31.16 extended) | manager reads and regenerates links; `member`, `guest`, non-participant get 403; accept keeps `manager` | 75 |
| Analytics (31.14 extended) | manager listed in member activity; manager gets 403 on analytics | 46 |

**Frontend (Vitest and React Testing Library, network mocked).**

| Area | Tests | Properties |
|---|---|---|
| `labelColor` (32.24) | fast-check: palette membership, determinism, case and whitespace invariance, complete class string per key | 63 |
| Status map (32.25) | four distinct labels, classes, variants; `BaseBadge` parity; the board Card and My Tasks row show the same badge | 62 |
| `can` and dropdown (32.26) | table test over every role and action against the R43 rule; `assignableRoles`; dropdown shown only through `canActOnMember`; role change updates the row after 200 and reverts on error | 74 |
| Checklist (32.27) | `3/5` and 60 percent; no indicator at 0; optimistic toggle within 100 ms and restore with one toast; guest read-only; add control disabled at 50 | 66, 67 |
| Links (32.28) | form rejects empty, `javascript:alert(1)`, `data:`, `file:`, and over 2048 characters without a request; anchors carry `target` and `rel`; chip hidden at 0; `providerKey` generic fallback; guest sees the list only | 68, 69 |
| Overdue UI (32.29) | chip iff `isOverdue`; "1 day overdue" and "N days overdue"; request on mount and on list open, never on a timer (fake timers, no call after 10 minutes); overdue items not in the bell count; empty state only when both lists are empty | 65 |
| Roles and welcome (32.30) | `member` view hides columns, member panel, invite links, analytics; manager view shows columns, panel, both links, no analytics; welcome copy passes `findForbiddenClaims` after the "Urgent" change | 74, 60 |

**Playwright (additions; credentials only through `requireCredentials()`).** (1) The pre-existing user (the Board creator, so `admin`) adds a checklist item and a link in a card, sees `1/1` progress and the link chip on the Card face, and sets the status to "Urgent" and sees the red badge. (2) A past due date shows the "Overdue" chip and, after opening the bell, the overdue row. (3) The Board creator joins a second generated account through the member link, which sees no column controls; the creator promotes it to manager through the dropdown (reload shows the column controls). Touch and the visual look of the chips stay in the manual 33.3 checklist. The existing Kanban journey is unaffected because its user created the Board.

### Testing Strategy: V12 additions (Requirements 48.1 to 48.4)

**Run-first step (R48.4, applies before any of the tables below).** Before writing or changing a single V12 test, the project runs `npm test` and `npx playwright test` from `web/` against the pre-V12 code and records every failing test, including failures not caused by V12 (R48.4). Those failures are fixed (not deleted, R48.5) as part of the same implementation pass that adds the V12 tests below; the exact list of pre-existing failures is a runtime result of that first run, not predicted in this design (as the requirement states) — the Traceability row for Requirement 48 names the general categories expected from the rest of this document's own text (the My Tasks link-target test and the Board card layout snapshot, both of which this revision's B23/B25 changes intentionally break and must update, R48.5).

**Backend (pytest, additions).**

| Area | Tests | Properties |
|---|---|---|
| Board counts (48.1) | exact `member_count`/`card_count` on GET, POST, PATCH `/api/boards`; a Board_Guest counts as a member; a soft-deleted Board_Membership and a soft-deleted Card are excluded; Cards and Board_Memberships of another Board are excluded; a Board with no Cards has `card_count` 0; `before_cursor_execute` counter asserts GET `/api/boards` is at most 4 and equal for 1 Board and for several Boards (reusing the `query_counter` fixture already used by `test_board_detail.py`); GET `/api/boards/<id>` response has neither key (`assert "member_count" not in data`) | 76, 77, 78, 79 |

**Frontend (Vitest and React Testing Library, network mocked).**

| Area | Tests | Properties |
|---|---|---|
| Rename and delete gating (48.2) | controls rendered for `admin`, absent for `manager`, `member`, `guest` (table test over the four roles, reusing the `boardRoles.test.tsx` pattern) | 74 (reused) |
| Rename form (48.2) | field-level error with no request for empty, whitespace-only, and 101-character names; sends PATCH with the trimmed name for a valid, different name; a failing PATCH keeps the modal open and the previous displayed name | none (example) |
| Delete flow (48.2) | cancel sends no request; confirm sends DELETE and navigates to `/`; a failing DELETE keeps the page and shows an error toast, dialog re-enabled | none (example) |
| My Tasks link target (48.2) | the task title's `href` is `/boards/<board_id>?card=<card_id>`; the "Open board" link's `href` has no query string | none (example, supersedes the pre-V12 assertion that the title link equals the plain board URL) |
| Deep link (48.2) | a known `card` value opens the CardDetailModal on first render; an unknown value opens none; two `card` values use the first; closing removes the parameter from the mocked `window.location`/`history`; the modal does not reopen after being closed once | 80 |
| Board card counts (48.2) | `formatCount` singular/plural fast-check property (0, 1, 2, and arbitrary non-negative integers); `BoardList` renders "1 member"/"0 members"/"2 members" and the matching card text | 76 to 78 (through `formatCount`'s own small property); **V12 refinement:** Property 83 |

**Playwright (additions; credentials only through `requireCredentials()`, each scenario creates its own uniquely named Board, R48.3).** (1) Rename a Board through the toolbar control and find the new name on the board page and back on the Dashboard. (2) Delete a Board through the `ConfirmDialog`, land on `/`, and confirm the Board is absent from the Dashboard. (3) From `/my-tasks`, click a task title and land on `/boards/<board_id>?card=<card_id>` with the CardDetailModal already open for that Card. (4) Create a Board and see "1 member", "0 cards" on its Dashboard card; add one Card and see "1 card" after returning to `/`. Deployment ordering (R48.7): where the E2E_Suite runs against a deployed frontend, the Kano_API carrying the V12 counts is deployed before scenario 4 runs.

#### Testing Strategy: V12 refinement (checked against `web/__tests__`, `web/e2e`, `app/tests`)

**Order of work (R48.4, R48.5).**
1. From `web/`, run `npm test` (this is `vitest --run`, `package.json`) and `npx playwright test` against the pre-V12 code, and from `app/`, run `pytest`. Record every failing test with its file and name in the implementation task notes. The list is a runtime result and is not predicted here.
2. Fix each recorded failure at its cause (code, test, fixture, or environment such as a missing `web/.env.test` value or an undeployed backend). Do not delete or skip a test to make a command pass.
3. Make the V12 code changes, update the tests that V12 breaks (list below), add the V12 tests, and run the three commands again until each ends with every test passed and exit code 0.

**Existing tests that V12 changes and must be updated, not deleted (R48.5).**
- `web/__tests__/dashboard.test.tsx`: the `BoardSummary` fixtures gain `member_count` and `card_count`; the `href` assertions (`/boards/b1` and so on, lines 47 to 51) stay valid because the Board card stays one link; add the counts text assertions; the `next/navigation` mock (`push`, `refresh`) stays.
- `web/__tests__/myTasksAndProfile.test.tsx`: any assertion that the task title links to the plain `/boards/<id>` changes to the Card_Deep_Link; the "Open board" assertion stays plain.
- `web/__tests__/boardRoles.test.tsx`, `boardFeatures.test.tsx`, `boardMutations.test.tsx`, `boardSeparator.test.tsx`, `boardShell.test.tsx`, `v11RoleGating.test.tsx`: they render `<BoardView board={...} />`; `initialCardId` is optional, so they keep working. Because `BoardToolbar` now renders `DeleteBoardControl`, which calls `useRouter`, each of these files that renders an admin board needs a `vi.mock("next/navigation", ...)` with `push` (the pattern of `dashboard.test.tsx`). The `BoardDetail` fixtures need no counts after the `BoardBase` split (B25 refinement).
- `app/tests/test_boards.py` and `test_boards_roles.py`: assertions of the exact key set of the list, create, or update response gain the two keys; monkeypatches of `board_service._new_membership` keep working because `create_board` adds no query.

**Backend (pytest, file `app/tests/test_board_counts.py`, new).** Examples: creator-only Board gives 1 and 0; adding a `member`, a `manager`, and a `guest` gives 4; soft-deleting one membership gives 3; two Cards in two Columns, one soft deleted, give 1; Cards and memberships of a second Board do not count; POST gives 1 and 0; PATCH gives the current counts; GET detail has neither key. Query budget with the existing `query_counter` fixture: GET `/api/boards` for 1 Board and for 5 Boards with different numbers of Cards: equal counts, at most 4. Hypothesis (Property 76 and 77, `max_examples=100`, database reset inside the test body as in the V5 rule): random memberships (all roles, some soft deleted) and Cards (some soft deleted) over 1 to 4 Boards compared against a naive Python count. Property 78 and 79 are example-based plus one Hypothesis test each over random seeds. Tag every property test `# Feature: kano, Property <n>: <text>`.

**Frontend (Vitest, new files).**

| File | Content | Properties |
|---|---|---|
| `__tests__/v12DeepLink.test.ts` | fast-check over `resolveCardParam` inputs (absent, `""`, strings, arrays with empty first element), the My Tasks target round trip, `stripCardParam` over generated URLs with extra params and hash (idempotent) | 81 |
| `__tests__/v12BoardPatches.test.ts` | fast-check over generated Board lists and patch sequences: deletion, rename by `updated_at`, idempotence, fixed point, `parsePatches` round trip and invalid JSON | 82 |
| `__tests__/v12Counts.test.tsx` | fast-check over `formatCount`; `BoardList` texts for 0, 1, 2; one link per Board card; a new Board from `CreateBoardModal` shows "1 member" and "0 cards" with one POST and no GET | 83 |
| `__tests__/v12RenameDelete.test.tsx` | gating table over four roles; rename validation (empty, spaces, 101 characters: no request); trimmed PATCH; same name: no request; failing PATCH keeps the modal and the old `h1`; delete cancel: no request; confirm: DELETE, disabled buttons, Escape ignored, `push("/")`, `sessionStorage` patch written; failing DELETE: dialog open, buttons enabled, one `handleError` call | 74 (reused), examples |
| `__tests__/v12BoardDeepLink.test.tsx` | `BoardView` with `initialCardId` of a known Card: modal open after the first render without interaction, title of that Card, `isNew` false; unknown id: no modal, no toast; close: `history.replaceState` called once with the URL without `card`; re-render with new `columns`: no reopen; guest: read-only modal; no `fetch` beyond the modal's own GET | 80 |

**Playwright (new file `web/e2e/v12Boards.spec.ts`, credentials only through `requireCredentials()`, unique Board names `V12 <scenario> <Date.now()>`).**
1. Rename: create a Board, open it, "Rename board", enter a new name, see it in the toolbar `h1`; click "Boards" and find the new name on `/`; then go back and forward with `page.goBack()`/`page.goForward()` and still see the new name.
2. Delete: create a Board, open it, "Delete board", confirm, expect `toHaveURL(/\/$/)`, the Board name absent; `page.goBack()` twice to the older Dashboard entry and the name is still absent.
3. My Tasks deep link: create a Board, a Column, and a Card, assign it to the current user, open `/my-tasks`, click the title, expect `toHaveURL(/\/boards\/[^?]+\?card=/)` and the CardDetailModal (role `dialog`) with that title; close it and expect the URL without `card` and the board still shown.
4. Counts: create a Board, see "1 member" and "0 cards" on its card; open it, add a Column and a Card, click "Boards", see "1 card".
No `waitForTimeout`; web-first assertions only. Each scenario deletes the Board it created at the end through the UI when the scenario itself is not the delete scenario, so the shared account does not fill up (no other Board is touched, R48.3).

**Ordering (R48.7).** Scenario 4 needs the V12 backend. Against a local stack it runs after the backend change is in place; against the deployed frontend it runs only after the V12 Kano_API is deployed (Part D V12 notes).

## Part D: Deployment, Guidelines, and Documentation Design

### D1. Deployment (Requirement 34)

```mermaid
flowchart LR
    GH["GitHub repo (monorepo)"] --> VA["Vercel project: kano-api (Root Directory = repo root, vercel.json)"]
    GH --> VW["Vercel project: kano-web (Root Directory = web/)"]
    VA --> DB[("Managed PostgreSQL (pooled URL, sslmode=require)")]
    VW -->|"NEXT_PUBLIC_API_BASE_URL / API_BASE_URL"| VA
```

**V13 note (supersedes the `vercel.json` below).** The root `vercel.json` was removed because it caused a static-only deployment (see D10 (V13 refinement)). The backend relies on Flask auto-detection of `app/wsgi.py` and a root `.python-version` (`3.12`). The V12 text and JSON below are kept as history.
**Backend project (Vercel).** (V12, superseded by V13) A root-level `vercel.json` routes every path to the WSGI entry:

```json
{
  "builds": [{ "src": "app/wsgi.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "app/wsgi.py" }]
}
```

`app/wsgi.py` exposes `app = create_app()`. A root `.vercelignore` excludes `web/`, `app/venv/`, and `.kiro/`. The project root is the repository root (not `app/`) so that the package `app` is importable. Dependencies come from `app/requirements.txt`.

**Frontend project (Vercel).** Root Directory `web/`, framework preset Next.js, build `npm run build`.

**Environment variables.**

| Project | Variable | Value |
|---|---|---|
| kano-api | `DATABASE_URL` | production PostgreSQL URL (pooled, `sslmode=require`) |
| kano-api | `JWT_SECRET_KEY` | long random secret |
| kano-api | `JWT_ACCESS_TOKEN_EXPIRES` | `3600` |
| kano-api | `JWT_REFRESH_TOKEN_EXPIRES` | `604800` |
| kano-api | `CORS_ORIGINS` | exact public URL of kano-web (no trailing slash) |
| kano-web | `NEXT_PUBLIC_API_BASE_URL` | public URL of kano-api |
| kano-web | `API_BASE_URL` | public URL of kano-api |

`app/.env.example` lists `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES=3600`, `JWT_REFRESH_TOKEN_EXPIRES=604800`, `CORS_ORIGINS`, `TEST_DATABASE_URL` with placeholders. `web/.env.example` lists exactly `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL`. `.gitignore` excludes every `.env*` except `.env.example`, `__pycache__/`, `.next/`, `node_modules/`, `app/venv/`. **V6 change:** the Playwright suite no longer reads `E2E_BASE_URL` from the shell only. It reads `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` from the git-ignored `web/.env.test` (shell values win), and `.gitignore` also excludes `.env.test` while keeping `.env.test.example` tracked (`web/.env.test.example` lists the three names with placeholders).

**V6 deployment notes (Requirements 34, 35).** No new backend or frontend environment variable is needed for V6 (`.env.example` files are unchanged). Nothing is deployed yet, so there is no production migration step for V6: the first production deployment runs `flask db upgrade` once on the full migration history, which already contains the V6 columns, and the optional backfill is not needed on an empty database. The deployment verification list gains: GET `/api/boards/<id>/invite-links` as the admin, GET and POST accept with a second account, and one card PATCH with `status`. `next.config.ts` sets `Referrer-Policy: no-referrer` and `Cache-Control: no-store` for `/invite/:path*` on the Vercel frontend. `web/.env.test` is never uploaded (git-ignored and not part of the Vercel build).

**MANUAL migration steps (user-owned).**

1. Local: from `app/` with the venv active, `flask db init`, `flask db migrate -m "initial schema"`, `flask db upgrade` against the local PostgreSQL database.
2. Test database: `flask db upgrade` with `DATABASE_URL` pointed at the `*_test` database.
3. Production: `flask db upgrade` with `DATABASE_URL` pointed at the production database, run from a local shell, before verification (Requirement 34.3). Until it runs, database endpoints return the generic 500 envelope (Requirement 34.10).

**Verification order.** After deployment: Postman `GET /api/health` (200), `POST /api/auth/register` (201), `POST /api/auth/login` (200 with `access_token` and `refresh_token`), then one request per Blueprint_Package; then browser walk-through at 1280 px and 375 px (the 375 px card drag is done by touch in browser DevTools device mode, because Playwright does not run it); then Playwright against the Vercel URL. A CORS failure marks the verification failed until `CORS_ORIGINS` is corrected and the API redeployed.

**Serverless risks (flagged).**

- Cold starts and pooling: each Vercel invocation may open new connections, so the engine uses `NullPool` when `VERCEL` is set, and `DATABASE_URL` must point at a provider-side pooler (for example a pooled connection string). Do not use a direct connection string with a pool in a serverless function.
- Python 3.14 and `psycopg2-binary`: the local venv is Python 3.14. A binary wheel for 3.14 may not exist for every platform, and the Vercel Python runtime may not offer 3.14. Verify before deployment; the fallback is to pin the runtime to a supported version (for example through `.python-version`) and, if no wheel exists, use `psycopg2` built from source or `psycopg[binary]` (this would need a requirements change, since psycopg2-binary was specified).
- `/api/health` within 500 ms (Requirement 5.1) can fail on a cold start. The route has no database access, so the delay is only runtime start-up.
- **Optional Railway alternative (Requirement 34.2):** start command `gunicorn "app.wsgi:app" --bind 0.0.0.0:$PORT --workers 2`, same four environment variables, a Railway PostgreSQL plugin for `DATABASE_URL`, and the generated Railway public URL used as the value of the frontend `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL`. Railway keeps a long-lived process, so the normal pool is used (`VERCEL` is not set).

### D2. Guidelines design (Requirement 30; files are NOT created by this design)

`guidelines/` at the repository root holds `frontend.md`, `backend.md`, `database.md`. No copy lives in `.kiro/steering/`. Each guideline is one entry in this fixed 3-part format:

```
### G-<area>-<nn>: <short title>
- Rule: one sentence.
- Rationale: 1 to 3 sentences.
- Kano Example: path to a concrete Kano file, component, or endpoint.
```

| File | Planned topics (no overlap between files) |
|---|---|
| `backend.md` | blueprint package layout and import rules (D3, D4), thin routes and service ownership, Response_Envelope and status mapping, Marshmallow validation at the boundary, permissions through `permissions.py`, 300-line split rule, PEP 8 naming, secrets and CORS from environment |
| `database.md` | `<table>_id` UUID keys, named `fk_<child>_<parent>` constraints, SoftDeleteMixin and active-only queries, partial unique indexes, FLOAT order columns, indexes, cascade transactions, migrations are manual |
| `frontend.md` | App Router Server versus Client split, one directory per API resource, one component per file, shared components and `BaseButton` only, `apiClient` only for HTTP, `useErrorHandler` for failures, Tailwind mobile-first and 44 px targets, no `dangerouslySetInnerHTML` |

How code generation references them: every implementation task in `tasks.md` names the guideline entries it must follow (for example "follow G-DB-03"), the implementer reads the three files before generating code, and a review pass checks the output against the entries. Violations found are recorded in the violation report (file, guideline id, fix). One before/after comparison document compares guideline-violation counts of the same output produced without and with the guidelines.

### D3. Documentation design (Requirement 36)

`README.md` at the root contains the sections Overview, AI Workflow Summary (seven subsections of at least three sentences each, one each for the project brief, Kiro specifications, Guidelines, review against the Guidelines, violations, Antigravity, and Claude Code tests and documentation, with links to `guidelines/`, the violation report, and the before/after comparison), Features, Technologies (the AI tools Kiro, Antigravity, and Claude Code are listed next to the other technologies), Local Run Steps (9 numbered steps in the required order, `flask db upgrade` marked manual), Test Steps, Screenshots, and a Security note on the non-httpOnly access and refresh cookies, the XSS exposure of both tokens (including the higher impact of the 7-day refresh token), the stateless refresh token limitation (no revocation on logout), and the mitigations (short access expiry, refresh expiry, React escaping, no `dangerouslySetInnerHTML`).

**V6 change to D3 (Requirement 36.13).** The README Features list gains card status, board invitation links with the guest role, and the welcome page. Test Steps document `web/.env.test` created from `web/.env.test.example` with `E2E_BASE_URL`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD`, and the need for a pre-existing account. Local Run Steps state that the V6 schema changes need `flask db migrate` and `flask db upgrade` as a manual Migration_Step, including the hand-added check constraints. The Security note adds the invite-token exposure (Open issue 22).

**V10 change to D3 (Requirement 36.10).** Screenshot images live in `docs/screenshots/`. The Screenshots section needs at least three captioned images of Kano_Web in use: currently the Welcome_Page (also the banner at the top of the README), the Dashboard, and Board Detail. Other subjects are optional. `scripts/check_readme_links.py` verifies that every relative link and image path in `README.md` resolves (Requirement 36.12).

## Traceability Matrix

Every requirement maps to at least one design element. Part references point to sections of this document.

| Req | Title | Backend route / module | Frontend page / component / module | Tests |
|---|---|---|---|---|
| 1 | Backend structure | `app/__init__.py`, `config.py`, `extensions.py`, `errors.py`, `permissions.py`, `wsgi.py`, `blueprints/*` (A1, Architecture) | none | smoke, Property 5 |
| 2 | Models and soft delete | all `schema.py`, `soft_delete.py`, lowercase email normalization (A3, A5, Data Models) | none | Properties 6 to 9 |
| 3 | Manual migrations | `Migrate` in factory, generic 500 handler (A1, A2, D1) | none | 500-handler examples |
| 4 | Envelope and errors | `errors.py`, endpoints 1 to 29 and 3a (A2, A11) | none | Properties 1 to 4, 37 |
| 5 | Health | `GET /api/health` in `health.py` | none | examples |
| 6 | Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` (A3) | none | Properties 10, 11, 12, 36, 37, 38, 43 |
| 7 | Users | `GET/PATCH /api/users/me`, no delete endpoint, seed-data fixture for soft-deleted users (A3, Testing Strategy) | none | Properties 9, 10, 17, 43 |
| 8 | Boards | `/api/boards`, `/api/boards/<id>` (A9) | none | Properties 8, 13, 14, 15 |
| 9 | Members | `/api/boards/<id>/members`, `/api/boards/<id>/members/<user_id>` | none | Properties 9, 13, 18 |
| 10 | Columns | `/api/boards/<id>/columns`, `/api/columns/<id>`, `/api/boards/<id>/columns/reorder` | none | Properties 15, 16 |
| 11 | Cards | `/api/columns/<id>/cards`, `/api/cards/<id>`, `/api/cards/<id>/position`, `GET /api/cards` (A10) | none | Properties 15 to 19 |
| 12 | Comments | `/api/cards/<id>/comments`, `/api/comments/<id>` | none | Property 20 |
| 13 | Notifications | `GET /api/notifications`, `PATCH /api/notifications/<id>/read` (A7) | none | Properties 21 to 23 |
| 14 | Analytics | `GET /api/boards/<id>/analytics` (A8) | none | Property 24 |
| 15 | Frontend structure | none | `web/` tree, `globals.css`, `.env.example`, `apiClient` env check (B1) | build smoke |
| 16 | API client and toasts | none | `lib/apiClient.ts`, `lib/refreshSession.ts`, `lib/errors.ts`, `lib/toast.ts`, `hooks/useErrorHandler.ts` (B5) | Properties 26, 27, 39, 40 |
| 17 | Auth state and cookies | none | `AuthProvider`, `hooks/useAuth.ts`, `lib/authCookie.ts`, `lib/refreshSession.ts`, `lib/serverAuth.ts`, `middleware.ts` (B4) | Properties 28, 39, 40 |
| 18 | Shared components | none | `BaseButton`, `BaseBadge`, `BaseModal`, `Header`, `Footer` (B3) | RTL examples |
| 19 | Register and Login pages | consumes endpoints 2, 3 | `/register`, `/login`, `RegisterForm`, `LoginForm` | Property 29, RTL |
| 20 | Dashboard | consumes endpoints 6, 7 | `/` page, `BoardList`, `CreateBoardModal` | Property 29, E2E |
| 21 | Board Detail | consumes endpoints 8, 11 to 17, 22, 29 | `/boards/[id]`, `BoardView`, `KanbanColumn`, `ColumnHeader`, `AddColumnForm`, `AddCardForm`, `CardSearchInput`, `MemberPanel`, `AnalyticsView`, `BoardAccessMessage`, `hooks/useDebouncedValue.ts` (B6) | Properties 29, 33 |
| 22 | Drag and drop | consumes endpoint 21 | `hooks/useDragAndDrop.ts` (mouse and touch paths), `lib/order.ts` (B6) | Properties 30, 31, 41, 42 |
| 23 | Card detail and comments | consumes endpoints 19, 20, 23 to 26 | `CardDetailModal`, `CommentList`, `CommentItem`, `CommentForm` (B7) | Properties 34, 35 |
| 24 | Notifications UI | consumes endpoints 27, 28 | `hooks/useNotifications.ts`, `NotificationBell`, `NotificationList`, `lib/format.ts` (B8) | Property 32 |
| 25 | My Tasks | consumes endpoint 22 | `/my-tasks`, `MyTasksList` | Property 34 |
| 26 | Profile | consumes endpoints 4, 5 | `/profile`, `ProfileForm` | Property 29 |
| 27 | Responsive layout | none | Tailwind strategy and touch drag row (B9), `BaseModal`, `KanbanColumn` | Playwright viewport checks, touch unit tests (Properties 41, 42), manual DevTools device mode |
| 28 | Security | `permissions.py`, `config.py`, log filter, LIKE escaping, token type enforcement (A3, A12) | access and refresh cookie options, no `dangerouslySetInnerHTML` | Properties 10, 13, 19, 37 |
| 29 | Performance | board query plan (A9), indexes (Data Models) | none | Property 25, perf tests |
| 30 | Maintainability and guidelines | split rule (Architecture) | one component per file | D2, lint script |
| 31 | Backend tests | `app/tests/` (auth token tests, criterion 31.11) | none | Testing Strategy, Properties 36 to 38 |
| 32 | Frontend unit tests | none | `web/__tests__/` (apiClient refresh tests, criterion 32.12; touch tests, 32.13; server-side apiClient and cookie lifetime tests, 32.14) | Testing Strategy, Properties 39, 40, 41, 42 |
| 33 | E2E tests | none | `web/e2e/`, `playwright.config.ts` | Testing Strategy |
| 34 | Deployment | `vercel.json`, `wsgi.py`, config incl. `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES` (D1) | Vercel project `web/` (D1) | verification checklist |
| 35 | Repository hygiene | `.gitignore`, `.env.example` | `web/.env.example` | checklist |
| 36 | Documentation | none | `README.md` incl. seven AI Workflow subsections (with Antigravity), both-token XSS note and stateless refresh limitation (D3, V6 note), at least three screenshots in `docs/screenshots/` (D3, V10 note) | checklist, `scripts/check_readme_links.py` |
| 37 | Board invitation links and guest role (V6) | endpoints 30 to 33, A4-V6, A12-V6, A14, `boards/service/invite_service.py`, `accept.py`, `invite_routes.py` | `/invite/[token]`, `InviteJoinCard`, `InviteLinksPanel`, `InviteLinkRow`, `MemberList`, `BoardRoleContext`, `lib/inviteRoles.ts`, `lib/nextParam.ts`, `next.config.ts` headers (B4-V6, B6-V6) | Properties 47, 49, 50, 51, 52, 55, 57 |
| 38 | Welcome page (V6) | none | `/welcome`, `WelcomeContent`, `WelcomeActions`, `lib/decideRoute.ts`, `proxy.ts`, welcome cookie helpers (B2, B4-V6) | Property 53, E2E welcome scenario |

#### V6 amendments to existing rows

| Req | V6 design coverage |
|---|---|
| 2 | Data Models (Card `status`, `completed_at`; Board tokens; three-role check), ER diagram, V6 migration table |
| 3 | V6 manual migration note (Overview), "V6 schema changes and migration", D1 notes |
| 7 | A3 (PATCH `/api/users/me`), endpoint row 5, B11, Properties 54 |
| 8, 9 | A4-V6 (guest read access, writes 403), A14 (tokens created with the Board), rows 8, 12, Property 47 |
| 10 | A4-V6 matrix (columns writer-only), Property 47 |
| 11 | A13 (status), A10 note, A4-V6 (`assert_assignee_is_writer`), Properties 44, 45, 48 |
| 12, 13 | A4-V6 (comment writer helpers, owner check), A7 note, Property 48 |
| 14 | A8 (V6 query), Property 46 |
| 17, 19 | B4-V6 (`decideRoute`, `safeNext`, `withNext`), Properties 52, 53 |
| 20 | B2 note (role badge incl. guest) |
| 21 | B6-V6 (role gating, new-card flow, status badge), Properties 55, 56 |
| 22 | B6-V6 (`useDragAndDrop({ enabled })`), Properties 55, 56 |
| 23 | B7-V6 (status control, guest read-only), Properties 35, 55, 56 |
| 25 | B7-V6 (`StatusBadge` in My Tasks, Done kept), Property 56 |
| 26 | B11 (read-only email, change-password section), Property 29 |
| 27 | B9 V6 responsive note (welcome, invite, guest badge) |
| 28 | A12-V6 (token entropy, redaction, open redirect, role checks), Properties 47, 52, 57 |
| 31, 32 | Testing Strategy: V6 additions (backend and frontend tables) |
| 33, 35 | Testing Strategy: V6 Playwright bullets, `.env.test` and `.gitignore` notes (D1), Property 58 |

#### V8 amendments to existing rows

| Req | V8 design coverage |
|---|---|
| 17 (criterion 14) | B12 (relation to `proxy.ts` and `decideRoute`, which are unchanged; restore-time `/welcome` then redirect to `/`; 5xx restore failure), B4-V6 V8 note, Property 59 |
| 18 (criteria 14, 15) | B12 (`logoTarget`, `isVisitorAuthenticated(status)` only, one shared check for logo and navigation, recompute on every status change), B3 V8 note, Property 59, unit tests (Header logo), Playwright logo scenarios |
| 21 (criteria 24 to 28) | B14 (`BoardToolbar` without the add-column control, one `hr` in `BoardView`, role and state coverage, responsive), unit tests (Board separator and add-column placement), Playwright layout scenarios; Open issue 36 (resolved) |
| 27 (criterion 10) | B13 layout table (44 px targets, no horizontal scroll), B14 (separator and toolbar widths), Playwright layout scenarios |
| 32 (criteria 20 to 22) | Testing Strategy: V8 additions (unit tests table), Properties 59 and 60 |
| 33 (criteria 13, 15, 16) | Testing Strategy: V8 additions (Playwright welcome, logo, and layout scenarios) |
| 36 (criterion 14) | D3: the README describes the Welcome_Page and board toolbar look in words only and neither this document nor the README names, links, or embeds the visual reference files |
| 38 (criteria 1, 2, 10, 15 to 21) | B13 (files, sections, copy, preview, design-system use, layout by width), B2 V8 note, B3 (Header anchors), D17, Property 60 (substring and whole-word "free" rule); Open issues 34, 35, 37, 38 (resolved) |
| 32 (criteria 20 to 22), refined | Unit tests table in Testing Strategy: V8 additions: status-only logo cases (R32.20), anchors versus `BaseButton`, scroller `tabindex="-1"`, single `shadow-overlay` (R32.21), add-column outside the toolbar (R32.22) |

#### V9 amendments to existing rows

| Req | V9 design coverage |
|---|---|
| 18 (criteria 16 to 21, refined wording) | B15 (Footer files, markup, classes, `FOOTER_CONTENT`, inline SVG icons, `KanoMark`, security): one row from 768 px upward, may wrap below (16), 2 px focus-visible outline (20), 44 px tap target at every width as the exception to the 4 px scale (19); D18, B3 V9 note; Testing Strategy V9 additions (RTL and Playwright); Open issues 39 to 44 (40, 42 locator part, 44 resolved) |
| 18 (criteria 13 to 15, unchanged) | B15 "Interaction with other tests" (one Footer per page including the Welcome_Page, one link named exactly "Kano") |
| 27 (criteria 11, 12, refined) | B15 layout by width (one row at 768 px and above, may wrap below with `flex-wrap`, `ml-auto`, `min-w-0`; `size-11` 44 px at every width), Playwright footer scenario (no horizontal scroll, 44 px boxes at 375 px) |
| 32 (criterion 23, refined) | Testing Strategy V9 additions, unit tests table (`web/__tests__/Footer.test.tsx`: focus-visible outline classes, links located in the `contentinfo` role or by exact name); no new Correctness Property |
| 33 (criterion 17, refined) | Testing Strategy V9 additions, Playwright footer scenario (`web/e2e/footer.spec.ts`: `contentinfo` scope, `exact: true`), V8 logo scenarios scoped to `banner` with `exact: true`, no click-through |
| 38 (criterion 19, applies to the shared Footer) | B15 (hand check of the footer strings), unit test with `findForbiddenClaims` over `FOOTER_CONTENT` and the rendered footer |

#### V11 additions to the Traceability Matrix (Requirements 39 to 44 and amended rows)

| Req | Title | Backend | Frontend | Tests |
|---|---|---|---|---|
| 39 | Urgent status and label colors | A16, `CARD_STATUSES`, `ck_cards_status`, A13 note | B17 (`lib/status.ts`, `lib/labelColor.ts`, `StatusBadge`, `@source "../lib"`) | Properties 61, 62, 63 |
| 40 | Overdue notification | A19 (`overdue_service.py`, `GET /api/notifications/overdue`, `ix_cards_due_date`) | B19 (`useOverdue`, `NotificationList`, Card chip, `lib/overdue.ts`) | Properties 64, 65, perf test |
| 41 | Card checklist | A17, A18, endpoints 34 to 37, `ChecklistItem` | B18 (`ChecklistSection`, `useChecklist`, progress on the Card face) | Properties 66, 67, 70, 71 |
| 42 | Workspace links | A17 (`url_rules.py`), A18, endpoints 34, 38 to 40, `CardLink` | B18 (`LinksSection`, `lib/linkProvider.ts`, `validateLinkUrl`, link chip) | Properties 68, 69, 70, 71 |
| 43 | Manager role | A15, A20 (`decide_role_change`, `decide_member_removal`, endpoint 42), `my_role` | B16 (`can`, `assignableRoles`, `RoleSelect`, gating) | Properties 72, 73, 74, 75 |
| 44 | V11 schema, migration, query budget | Data Models V11, A18 (`counts.py`), A17 file split | B21 | Properties 70, 71, schema smoke tests |

| Amended requirement | V11 design coverage |
|---|---|
| 1.4, 1.9, 2.2, 2.9 to 2.11, 3.5, 3.9, 3.11 | Data Models V11 (models, ER, migration), A17 cascades, Properties 70 |
| 2.15, 2.16, 11.2, 11.4, 11.19 | A15, A16, Data Models V11, Properties 61, 73 |
| 4.3 | A21 rows 35 and 38 (201), 37 and 40 (200 with object) |
| 9.1, 9.6, 9.9, 10 (all), 14.10 | A15 matrix, A20, Properties 72, 73 |
| 20.1, 21.2, 21.4, 21.5, 21.12, 21.13, 21.21, 21.22, 23.17, 23.20, 25.2 | B16, B17, B18, Properties 62, 74 |
| 28.12, 37.1, 37.3 to 37.6, 37.12, 37.14 to 37.17, 37.22 | A12-V6 note, A15, A20, Property 75 |
| 31.5, 31.13, 31.16, 31.18 to 31.25, 32.16, 32.18, 32.24 to 32.30 | Testing Strategy V11 additions |
| 36.15 | Part D V11 notes |
| 38.17 to 38.19 | B20 (welcome copy and forbidden list) |

#### V12 additions to the Traceability Matrix (Requirements 45 to 48 and appended criteria)

| Req | Title | Backend | Frontend | Tests |
|---|---|---|---|---|
| 45 | Board rename and delete | none (existing PATCH/DELETE `/api/boards/<id>`, A9) | B22 (`RenameBoardModal`, `DeleteBoardControl`, `BoardToolbar`, `BoardView` rename/delete wiring, `router.push("/")`) | Testing Strategy V12 additions (unit, Playwright 1 and 2) |
| 46 | My Tasks deep link | none | B23 (`useCardDeepLink`, `MyTasksList` link target), B24 (`searchParams`, board page) | Properties 80, Playwright 3 |
| 47 | Member and card counts | A22 (`counts.py`, `BoardSchema`, `openapi.yaml`) | B25 (`BoardSummary`, `formatCount`, `BoardList` card text) | Properties 76 to 79, Playwright 4 |
| 48 | V12 tests and size limits | A22 (backend count tests) | B22 to B25 (file split, D25); Testing Strategy V12 additions (run-first step, R48.4) | Properties 76 to 80, all V12 tests |

| Amended requirement | V12 design coverage |
|---|---|
| 8.13 | A22 (`BoardSchema` fields), B25 (`BoardSummary` type) |
| 20.9, 20.10 | B25 (create flow, no new list request), D27 (Dashboard freshness) |
| 21.29, 21.30 | B22 (toolbar controls), B23/B24 (deep-link open on first render) |
| 25.8 | B23 (My Tasks link target, supersedes the plain per-task link) |
| 31.26, 32.31, 33.18 | Testing Strategy V12 additions (backend, frontend, Playwright) |
| 44.7 | A22 (states the GET `/api/boards/<id>` budget is unaffected; R44.4 scope note) |

#### V12 refinement rows (design coverage after the code check)

| Req | V12 refined design coverage |
|---|---|
| 45.1 to 45.3, 45.14 | B27 `BoardToolbar` gating with the existing `edit_board` and `delete_board` (no `roles.ts` change), Property 74, `v12RenameDelete.test.tsx` |
| 45.4 to 45.8 | B22, B27 `RenameBoardModal`, Error Handling V12 rows, `v12RenameDelete.test.tsx`, Playwright 1 |
| 45.9 to 45.11, 45.13 | B27 `DeleteBoardControl` (busy guard on Escape and backdrop), Error Handling V12 refinement rows, Playwright 2 |
| 45.12 | D27 refinement, B26 (`applyBoardPatches`, `useBoardPatches`), Property 82, Playwright 1 and 2 (back and forward) |
| 46.1, 46.2 | B23, B27 `MyTasksList`, Property 81, Playwright 3 |
| 46.3, 46.4, 46.8 | B27 `useCardDeepLink`, `findCardById`, Property 80 (amended), `v12BoardDeepLink.test.tsx`, Open issue 72 |
| 46.5 | B27 `resolveCardParam`, Property 81 |
| 46.6, 46.10 | B23, B24 (existing 403/404 and 401 branches, `decideRoute` unchanged) |
| 46.7 | D26, B27 `stripCardParam` and `replaceState`, Property 81, Playwright 3 |
| 46.9 | D26, B24, B26, B27 (docs read: `page.md`, `use-search-params.md`, `04-linking-and-navigating.md`, `use-router.md`, `staleTimes.md`, `04-glossary.md`) |
| 47.1 to 47.6 | A22-R (`board_counts.py`, `BoardSummarySchema`, service changes), Properties 76 to 78, `test_board_counts.py` |
| 47.7 | A22-R (`BoardDetailSchema` unchanged), B25 refinement (`BoardBase`), Property 79 |
| 47.8, 47.9 | A22-R (no migration, OpenAPI `BoardSummary`) |
| 47.10 to 47.13 | B25 and its refinements, B26 (patches from server responses only), Property 83 |
| 48.1 to 48.5 | Testing Strategy V12 refinement (order of work, tests to update, new test files, Playwright file) |
| 48.6 | D25, B27 (file list, `BoardView` at most 298 lines) |
| 48.7 | Part D V12 notes (deployment order) |
| 8.13 | A22-R `BoardSummarySchema` |
| 20.9 | B25, Property 83 |
| 20.10 | B26, Property 82 |
| 21.29 | B27 `BoardToolbar` |
| 21.30 | B27 `useCardDeepLink` |
| 25.8 | B27 `MyTasksList`, Property 81 |
| 31.26 | Testing Strategy V12 refinement (backend) |
| 32.31 | Testing Strategy V12 refinement (frontend table, tests to update) |
| 33.18 | Testing Strategy V12 refinement (Playwright file) |
| 44.7 | A22-R query budget paragraph |

### Part D: V11 notes (Requirements 34, 35, 36.15)

- **Migration.** The V11 Migration_Step (hand-edited `ck_cards_status` and `ck_board_memberships_role`, the due-date index, two tables) runs on the development and test databases. Production is not deployed, so its first `flask db upgrade` applies the whole history. No new environment variable and no CORS change. The Vercel build for `web/` needs no setting; `@source "../lib"` is in `globals.css`.
- **Verification list** gains: GET `/api/notifications/overdue`, POST and PATCH of a checklist item and a link, GET `/api/cards/<id>`, and PATCH `/api/boards/<id>/members/<user_id>` with a second account.
- **README (R36.15).** Features list adds the Urgent status and label colors, overdue notifications, checklists, workspace links (URLs only), and the Manager role with its permissions; Local Run Steps state that V11 needs `flask db migrate` and `flask db upgrade`, with the two hand-edited check constraints; a sentence states that the role `member` no longer manages Columns. `scripts/check_readme_links.py` still applies.
- **Guidelines.** `guidelines/backend.md` and `database.md` entries that name "admin only" or "7 tables" are reviewed at implementation time; `guidelines/design-system.md` gets any missing label or status token pair first (R39.10).

### Part D: V12 notes (Requirements 34, 48.7)

- **Migration.** None. V12 needs no `flask db migrate`/`upgrade` step on any database (R47.8).
- **Deployment ordering (R48.7).** Where the E2E_Suite runs against a deployed frontend rather than a local dev server, the Kano_API carrying the V12 counts is deployed before the Dashboard-counts Playwright scenario (Testing Strategy V12 additions, scenario 4) runs against the deployed site, mirroring the existing deployment-order practice for prior versions' Playwright scenarios.
- **README.** Not required by R48; the V12 requirements add no README criterion, so no README change is designed here.
- **V12 refinement, deployment order.** Deploy the `kano-api` Vercel project first, check GET `/api/boards` on production returns `member_count` and `card_count` (one manual request with a test account), then deploy `kano-web`. A frontend deployed before the backend would render `undefined members`; the order prevents it, and the Playwright run against production starts only after both deployments are live.
- **V12 refinement, environment.** No new environment variable, no CORS change (the methods PATCH and DELETE on `/api/boards/<id>` are already allowed for the board page), and no `next.config.ts` change.
- **Verification list** gains: rename and delete a Board on production with a test account, open a Card from My Tasks, and check the Dashboard counts.

## Open issues

These are gaps or conflicts found while designing and revising. Items marked "assumption" were chosen by the assistant in V4 and can be overridden.

1. **404 before 403 discloses existence (Requirements 4.6, 8.6).** A missing Board gives 404 and an existing Board gives 403 to a non-member. Design follows the requirements. Alternative is returning 404 for non-members; not chosen.
2. **Glossary versus Requirement 13.** The Notification glossary says comment notifications also go to users who commented on the Card. Criteria 13.2 and 13.3 name only the assignee and the Board_Admin. Design follows the criteria.
3. **Completed this week uses `updated_at` (Requirement 14.2).** Any edit of a Card in `Done` moves it into the current week. There is no `completed_at` column. Design follows the requirement. **Resolved in V6:** `cards.status` and `cards.completed_at` replace the Column-name rule (A8, A13, D14). New consequence: see item 30.
4. **Resource directories (Requirement 15.4).** The list omits columns and analytics. Their components sit in `components/boards/`, which stretches "only files for that resource". Alternative: add `columns` and `analytics` directories.
5. **Touch drag verification (Requirements 22.12 to 22.17, 27.8, 33.4, 34.8). Resolved in V5 by adding touch support.** The hook now handles touch by a 300 ms long-press. Automated E2E covers the mouse drag through Playwright. The touch drag is verified manually in browser DevTools device mode and covered by React Testing Library unit tests (Requirement 32.13), because Playwright cannot simulate a long-press touch drag reliably. The mobile-viewport Playwright project therefore does not repeat the drag step.
6. **FLOAT precision.** Repeated midpoints eventually produce equal values. Requirement 22.9 rejects only non-positive values. Recommendation: also treat a computed order equal to a neighbor as invalid and show the generic error. Rebalancing is not designed.
7. **Extra shared modules.** The design adds `soft_delete.py`, `ordering.py`, and `health.py`, and extra columns `cards.board_id`, `notifications.board_id`. Requirement 1.5 lists only six shared modules and Requirement 2.2 lists no extra columns. These additions do not conflict but should be confirmed.
8. **Primary key naming versus plural tables (Requirement 2.3).** Tables are plural (Requirement 1.9) while keys are singular (`user_id`, `board_membership_id`). Design uses singular keys.
9. **Next.js file convention.** The user asked for `middleware.ts`. If the scaffolded Next.js version renames this convention to `proxy.ts`, use that name with identical logic. Check at scaffold time. **Resolved in V6:** the repository uses `web/proxy.ts`; this document keeps the old name in V5 text and the V6 notes say `proxy.ts`.
10. **Python 3.14 on Vercel and psycopg2-binary** (see D1 risks). Verify the runtime and wheel availability before relying on them.
11. **Health latency on cold start (Requirement 5.1).** The 500 ms limit may be missed on a Vercel cold start. Consider measuring on a warm instance.
12. **Test database schema.** Requirement 31.10 means the test database needs its own manual `flask db upgrade`; this is an extra manual step beyond Requirement 3.3, which only names the local database.
13. **Stateless refresh tokens cannot be revoked, and are not rotated (assumption, Requirement 6.15).** Logout only clears the cookies, so a copied refresh token stays valid for up to 7 days, and a refresh does not issue a new refresh token. Because there is no rotation, the middleware and the browser can refresh at the same time without invalidating each other. Alternative: store refresh token ids (`jti`) in a table or Redis, revoke on logout, and rotate on every refresh. That needs a new model and a requirements change.
14. **Refresh cookie lifetime (Requirement 17.2). Resolved in V5.** The login response now carries `refresh_expires_in`, and both cookie lifetimes come from response values (`expires_in`, `refresh_expires_in`). No frontend constant remains.
15. **Middleware refresh on network error or 5xx (assumption, Requirement 17.7).** The middleware treats an unreachable or failing API during refresh like a failed refresh and redirects to `/login?expired=1`, which also deletes both cookies, so a short outage logs the user out. Alternative: keep the cookies and show an error page. Not chosen to avoid a redirect loop between `/login` and `/`.
16. **Larger XSS impact (Requirement 28.8).** Both tokens sit in non-httpOnly cookies, and the refresh token lives 7 days, so an XSS exploit can steal a long-lived credential that cannot be revoked (item 13). The README documents this. Making the refresh cookie httpOnly would require a Next.js route handler that proxies login and refresh, which is a larger change not designed here.
17. **Wrong token type defaults to 422 in Flask-JWT-Extended.** The design maps it to 401 in the `invalid_token_loader`. A backend test asserts this for both directions because the mapping depends on the library's callback behavior.
18. **No edge auto-scroll during a touch drag (Requirements 22.13, 27.3).** While a touch drag is active, page scrolling is blocked, so a Card can only be dropped on a Column that is already visible. Reaching a Column off screen needs the board container to scroll when the finger nears its edge. This is not required and not designed. Workaround: scroll first, then drag. Alternative: add `requestAnimationFrame` edge scrolling to the hook.
19. **Soft-deleted users exist only as test seed data (Requirement 7.7).** No endpoint creates the state that Requirements 6.6, 6.9, 6.13, and 31.11 test. The behavior is therefore only reachable through direct database writes, which production code never does. Tests insert the rows directly (Testing Strategy, soft-deleted user fixtures).
20. **Browser-native drag on touch (Requirement 22.1 versus 22.12).** Some mobile browsers fire HTML5 `dragstart` on a long-press of a `draggable` element. The hook cancels the native event once the touch path is active (B6), but behavior differs between browsers, so it is verified manually in device mode and on a real phone before release.

### V6 open issues

21. **Regenerating an invite link does not remove existing members (Requirement 37.6).** A member or guest who joined through the old link keeps the membership. The admin removes unwanted people through the member panel. Alternative: a "revoke members who joined with this link" option, which needs a per-membership record of the joining token and is not designed.
22. **Invite tokens appear in URLs (Requirements 28.13, 37).** The token is in the browser address bar, in the Referer header of any outgoing request from the invite page, in browser history, and in the path of the API call GET `/api/invites/<token>`. Mitigations designed: `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on `/invite/:path*`, no third-party scripts on that page, log redaction in the application (A12-V6). Vercel's own request logs and any proxy log still record the path and cannot be redacted by the application. Alternative: send the token in a POST body, which would change Requirement 37's endpoint shapes.
23. **The welcome cookie is not httpOnly (Requirement 38.4).** The browser must set it from the Welcome_Page buttons and the proxy reads it. A visitor can forge or delete it, which only changes whether `/` shows `/welcome` or `/login` and exposes no data.
24. **Completed-at backfill and migration review (Requirements 3.8 to 3.10).** Cards sitting in a Column named `Done` before V6 are not counted as completed unless the user runs the optional backfill SQL. Also, Alembic autogenerate does not detect the new `ck_cards_status` check and the changed `ck_board_memberships_role` check, so the user must add them by hand to the generated migration. If this is forgotten, the application works but the database accepts invalid statuses and rejects the `guest` role only if the old role check is still there (an insert with `guest` fails with a 400 through the integrity handler). The V6 schema test catches both cases.
25. **Password verification on PATCH `/api/users/me` has no rate limit.** An attacker who already holds a valid access token can try passwords against `current_password`. The risk is limited (the token holder is already authenticated and the response is a plain 400), but no throttling is designed. Alternative: Flask-Limiter on this route, which adds a dependency not listed in Requirement 1.11.
26. **Invite tokens never expire and have no use limit (Requirement 37.21).** Anyone who obtains a link can join until the admin regenerates it. 256-bit tokens cannot be guessed, so enumeration is not a concern, and no rate limit on the invite endpoints is designed.
27. **A user who was a member, was removed, and rejoins as a guest cannot edit or delete their own old comments (Requirements 12.7, 12.11).** The writer check runs before the owner check. This follows the requirements.
28. **`decideRoute` replaces `guardDecision` (Requirement 17.12).** The V5 function and Property 28 are kept in the text as history. The implementation task should delete `guardDecision` and move its tests to `decideRoute`, so no second decision function exists.
29. **Directory per resource (Requirement 15.4).** The V6 components `WelcomeContent`, `WelcomeActions` sit in `components/welcome/` and the invitation components in `components/boards/`, because there is no `welcome` or `invites` API resource. This stretches "only files for that resource", as with columns and analytics (item 4).
30. **A card can be `DONE` while sitting in any Column, and a Card in the Column named `Done` can be `NOT_STARTED` (Requirements 11.21, 21.23).** The two concepts are independent by design, so the board can show a "Not started" badge in the `Done` Column. The UI does not warn about it.
31. **The `status` filter is absent (Requirement 25.7).** My Tasks keeps `DONE` cards in the list with a badge and offers no filter. Alternative: a "hide done" toggle, not required.
32. **Network error or 5xx during the proxy refresh drops `next` (Requirement 17.8).** The redirect goes to `/login?expired=1`, so an invitee whose refresh failed because of an outage must open the invite link again after logging in. Keeping `next` would risk a redirect loop and was not chosen (item 15).

### V8 open issues

33. **The logo link and the Header navigation use different authentication tests (Requirements 18.15, 18.5).** The logo uses "User held, or any token present" (`isVisitorAuthenticated`). The Header navigation (My Tasks, bell, user menu, Log in, Register) keeps `status === "authenticated"`. While the session is restored (`status` is `loading` with a cookie) the logo already points to `/` while the navigation shows the anonymous links. A stale cookie (present but expired, with no valid refresh cookie) also gives the target `/`, which `proxy.ts` then redirects to `/welcome` or `/login`, until the failed session restoration clears the cookies and the target flips to `/welcome`. Alternative: use `isVisitorAuthenticated` for the navigation too, or check the `exp` claim. Not chosen because R18.15 says "present".
    **Resolved in V8 refinement.** R18.15 now requires one shared check on the AuthContext `status` only, no cookie. The logo and the navigation use `isVisitorAuthenticated(status)` (B12, Property 59). During restoration the logo is `/welcome` and `proxy.ts` redirects to `/` when a valid cookie exists; the stale-cookie case no longer reaches `/` through the logo.
34. **Header links versus BaseButton (Requirement 38.2 versus 38.16, 32.21, 33.13).** R38.2 says all five actions are rendered through BaseButton, but R38.16, R32.21, and R33.13 call the two Header items links. The design keeps the Header "Log in" and "Register" as `Link` elements (as in V5) and uses `BaseButton` for the three section buttons. Recommendation: reword R38.2 to "the three section actions through BaseButton and the two Header actions as links".
    **Resolved in V8 refinement.** R38.2 was reworded as recommended. Header "Log in" and "Register" are anchor links, the three section actions are `BaseButton` (B3, B13).
35. **Preview scroller and keyboard focus (Requirements 38.18, 38.21).** The preview must scroll horizontally below 768 px. Some browsers make a scrollable element a keyboard tab stop. The scroller is therefore outside the `aria-hidden` container, so the container has no focusable element, but a keyboard user may still land on an unlabeled scroll region in those browsers. Alternative: allow `tabindex="-1"` on the scroller or drop the scrolling and shrink the Columns, which conflicts with the 240 px minimum.
    **Resolved in V8 refinement.** The scroller has `tabindex="-1"` and lies outside the `aria-hidden` container, which has no focusable element (B13).
36. **Add-column control placement (Requirement 21.24).** R21.24 lists the add-column control in the toolbar, but in the implemented board the add-column form is the last item of the Kanban row. The design keeps that placement (moving it is a behavior change that `improvements2` does not ask for). Recommendation: delete the words "and the add-column control where present" from R21.24.
    **Resolved in V8 refinement.** R21.24 now keeps the add-column control at the end of the Kanban row, outside the toolbar (B14).
37. **Shadow on the dragged preview card (Requirement 38.20 versus design system 4.6).** The design system gives a dragged card `shadow-overlay`, while R38.20 forbids a drop shadow on the Welcome_Page. The design omits the shadow on the preview card and uses `rotate-2 border-primary-200` only.
    **Resolved in V8 refinement.** R38.20 allows `shadow-overlay` on the one dragged preview Card only; everything else stays flat (B13).
38. **Forbidden string matching (Requirement 38.19).** The list says "compared case-insensitively" and marks only "free" as a whole word. Matching the other entries as substrings means that words such as "operating" or "integrating" (contain "rating") fail the scan, and "14.9" (contains "4.9") too. The design matches substrings except for "free", and the copy of R38.16 and R38.17 has no such word. Recommendation: state in R38.19 that all entries except "free" are substring matches.
    **Resolved in V8 refinement.** R38.19 states the rule. `findForbiddenClaims` implements it and Property 60 covers it, including the false-positive words (B13).

### V9 open issues

39. **`lucide-react` has no brand icons (Requirement 18.18, 18.19).** Checked on the installed version 1.75.0: no `Github` or `Linkedin` export in `dist/lucide-react.d.ts` and no matching file in `dist/esm/icons/`. The design uses two inline SVG components (B15). The brand marks are trademarks of their owners and the path data comes from the CC0 Simple Icons set. Alternative: generic lucide icons (for example a link or user icon), which would be less recognizable and was not chosen. The path data is picked at implementation time.
40. **"Focus ring" wording (Requirement 18.20, 32.23).** **Resolved in V9 refinement.** R18.20 and R32.23 now say "focus-visible outline (2 px outline)", which is what B15 and the Footer test use. The text below is kept as history. The requirements say the Footer shows "the design-system focus ring" and the test asserts "the `focus-visible` ring class". The design system defines the focus indicator as a 2 px outline (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`), and `globals.css` also sets a global `:focus-visible` outline. The design uses the outline classes and the test asserts them. Recommendation: reword R18.20 and R32.23 to "focus-visible outline".
41. **Placeholder URLs (Requirement 18.18).** `https://github.com` and `https://www.linkedin.com` point to the site home pages, not to the author's profiles. Replace both in `lib/footerContent.ts` and update R18.18, R32.23, and R33.17, which pin the literal values, when the real profile URLs are known. Until then the links are external and open in a new tab, and Playwright never clicks them.
42. **Hard-coded text "2026" and "JC" (Requirement 18.17).** **Resolved in V9 refinement for the locator part.** R32.23 and R33.17 now require footer link locators inside the `contentinfo` role or with exact names, and the logo scenarios scoped to `banner` or `exact: true` (Testing Strategy V9 and V8). The fixed-year note (the year does not update by itself) stays open by design. Both are fixed strings in `FOOTER_CONTENT` and are not computed, as required. The year will not update by itself. Playwright and Testing Library name matching: a Playwright locator for the Header logo by name "Kano" matches "Kano on GitHub" and "Kano on LinkedIn" as a substring unless it is scoped to the `banner` landmark or uses `exact: true` (Testing Library matches names exactly, so its logo tests stay valid). The V8 Playwright logo scenarios are already banner-scoped; new locators must use `exact: true`.
43. **External links versus same-origin links (Requirement 18.18).** The Footer links are the first external links in the product. They are plain `<a target="_blank">` with `rel="noopener noreferrer"`, not `next/link`, and are not prefetched. If a lint rule later requires `next/link` for all anchors, external URLs still need a plain anchor. No Content Security Policy or `connect-src` change is needed because the links only navigate.
44. **"Single row" versus wrapping (Requirements 18.16, 27.11).** **Resolved in V9 refinement.** R18.16 now says one row from 768 px upward and R27.11 says the footer may wrap below 768 px; R18.19 states the 44 px tap-target exception to the 4 px scale at every width. B15 follows both. The text below is kept as history. R18.16 requires a single row and R27.11 requires wrapping onto two lines when the groups do not fit. The design reconciles them with `flex-wrap`: one row from about 768 px, two lines below (the link group wraps under the brand group, right-aligned). R18.16 could say "a single row when both groups fit". Also, `size-11` (44 px) is not a step of design system section 2.3 and is allowed only as the height of the existing `lg` control; the design system could list it explicitly. The shared `KanoMark` extraction also touches `Header.tsx` (a markup-neutral change), which is a V9 implementation detail, not a requirement change.

### V11 open issues and inconsistencies between requirements V11 and this design

45. **Tailwind scan of `lib/` (R39.5, R39.9 versus R15.2, D18).** R39.5 puts the complete class strings in `lib/status.ts`, but the project scans only `app/`, `components/`, and `hooks/`, so the classes would never be generated. The design adds `@source "../lib";` to `globals.css` (a superset of R15.2, so R15.2 is not violated). Alternative: keep the class strings in `components/shared/` and have `lib/status.ts` hold only labels. Recommendation: keep the design; add "and `lib/`" to R15.2 at the next revision.
46. **Label palette tokens (R39.9, R39.10).** `globals.css` has eight label token pairs, but their exact names are not confirmed to equal `gray, blue, green, yellow, orange, red, purple, pink`. The implementation task checks `guidelines/design-system.md` first and adds missing pairs there. The same applies to the success and danger tokens used in `STATUS_STYLE`.
47. **Owner and rank rule order (R9.7, R43.6, R43.8).** R43.6 says 403 when the caller rank is not above the target rank, and R43.8 says 400 when the request names the Board_Admin. For an admin who targets himself both apply (equal rank), and for a manager who targets the admin they give 403 and 400. Design decision: the owner check runs first and gives 400 only to the admin (R9.7, R43.8), and 403 to a manager (R43.6, R31.23). Recommendation: reword R43.8 to "IF the Board_Admin targets himself or herself, 400".
48. **Default label length (R42.2 versus R42.1, R42.5).** A hostname can be longer than the 100-character label limit. The design cuts the default label to 100 characters. Recommendation: say so in R42.2.
49. **R11.15 versus GET `/api/cards/<id>` (R41.9).** R11.15 says a User who is not a Board_Member gets 403 on every Card endpoint that targets a single Card, which includes a guest (a guest is not a Board_Member), but R41.9 gives a guest 200 on the new GET. The design follows R41.9. Recommendation: change R11.15 to "Board_Participant" for GET and keep "Board_Member" for the writes.
50. **Overdue "on page load" (R40.10).** The Header does not remount on client-side navigation, so the overdue list refreshes on the first mount, a full reload, and each time the list opens, not on every route change. Alternative: also refresh on route change, which is not asked for.
51. **UTC date skew (R40.4, R40.14).** The Card-face chip uses the browser clock's UTC date, the list uses the server's. They can differ near midnight UTC or with a wrong clock. Accepted.
52. **Admin cannot be replaced (R43.4).** There is no ownership transfer and the admin cannot be removed or demoted, so a Board whose creator never returns has no admin. Accepted by requirement.
53. **Breaking change for `member` (R10.11).** Existing backend tests, frontend gating (`canEdit` for column controls), and any user who relies on `member` creating Columns must change; the Playwright journey is not affected because its user created the Board. The V6 helpers `get_column_for_writer` for column rename and delete must be replaced by `get_column_for_manager` in the same task.
54. **Cap races (R41.5, R42.7).** Two simultaneous adds could both see 49 items. The design locks the Card row (`SELECT ... FOR UPDATE`) in `add_item` and `add_link`. A database trigger is not used.
55. **Link display and phishing (R42.11).** The label is user text and can claim a different site than the URL. The UI shows the hostname beside every label. The URL may include userinfo or a private host; the server never requests it (R42.9), so there is no SSRF risk, but the rule accepts them.
56. **File sizes (R44.6, R30.6).** `CardItem.tsx`, `CardDetailModal.tsx`, `BoardView.tsx`, and `MemberPanel.tsx` are the files most likely to pass 300 lines; B21 plans `CardMetaRow.tsx`, the section components, and `RoleSelect.tsx`. The backend `cards` and `notifications` packages are split as in A17 and A19.
57. **Count query placement (R44.4).** The design uses a fifth, separate query, which uses the whole budget of 5. Folding the counts into the Cards query would leave one query of headroom but mixes aggregate subqueries into ORM loading. Revisit if another per-card count is added.
58. **No counts on search and My Tasks (R44.5).** Only board detail and the three Card writes carry the counts, as the requirement says; search and My Tasks rows show no progress or link chip.
59. **Role change details not stated in R43.** Setting a role equal to the current role returns 200 and changes nothing, and body validation (400) runs before the permission check (403), as everywhere else in the API. Recommendation: state both in R43.5.
60. **Welcome copy and forbidden list (R38.17 to R38.19).** The V8 copy "(Not started, In progress, or Done)" must change to include Urgent, and `lib/forbiddenClaims.ts` must not contain "checklist". No other copy changes. The footer is unaffected.
61. **Overdue ordering and cap (R40.5).** Ties on due date are ordered by `created_at` then `card_id` so the first 100 are stable. `total` can exceed 100, and the UI shows the first 100 only and no "more" control.
62. **Role badge variants (R43.15).** The design picks admin yellow, manager blue, member green, guest gray. Blue and green also appear for statuses, which is acceptable because they sit in different places, but the design system should confirm.
63. **Assignee role changes.** A role change from `member` to `manager` keeps assignments; only a change to `guest` clears them (R43.10). Removing a member clears them (R9.11). No other transition touches Cards.
64. **Overdue index selectivity (R40.7).** A plain index on `due_date` is weakly selective for old open cards. A partial index on open, non-deleted cards is a later option; the requirement asks only for an index on the column.
65. **Existing `7 tables` and `three roles` statements.** Several V5 and V6 passages (module-graph rule 5, test-database safety, A14 schema test, B10 `Role`, Property 55 and 56 sets) still say 7 tables or three roles. They are superseded by the V11 notes and not rewritten, as the V6 convention requires.
66. **Pre-existing unresolved items.** Open issues 6 to 8, 10 to 13, 15, 16, 18, 20 to 26, 29 to 32, 39, 41, and 43 are not affected by V11 except issue 22, whose invite-token exposure now also applies to managers.

### V12 open issues and inconsistencies between requirements V12 and this design

67. **`BoardDetailSchema` inherits two fields it must then exclude (R47.7 versus D24).** Because `BoardDetailSchema(BoardSchema)` inherits every field of `BoardSchema` by default in Marshmallow, the cleanest-looking approach (just add the two fields to `BoardSchema`) would leak `member_count: null` and `card_count: null` into the detail response unless `BoardDetailSchema` explicitly excludes them. The design adds `class Meta: exclude = ("member_count", "card_count")` to `BoardDetailSchema` (A22). Alternative: define the two count fields only on a separate `BoardSummarySchema` that does not sit in `BoardDetailSchema`'s inheritance chain, and have `board_schema` in `board_service.py` become `BoardSummarySchema()`; not chosen because it renames the schema used throughout `board_service.py` (`serialize_board`, `create_board`, `update_board`) and the existing `routes/board_routes.py` imports, a larger diff than one `Meta.exclude` line for the same outcome. A backend test (A22, Testing Strategy V12) asserts the exclusion holds.
68. **`BoardDetail extends BoardSummary` in TypeScript now implies fields the wire payload never sends (R47.7 versus B25).** `web/lib/types.ts`'s existing inheritance (`BoardDetail extends BoardSummary`) means `BoardDetail` now has `member_count`/`card_count` in its TypeScript shape even though the backend's `BoardDetailSchema` excludes them (issue 67). No code reads `boardDetail.member_count`, so this is a type-level inaccuracy, not a runtime bug. Alternative: change `BoardDetail` to extend a narrower `BoardIdentity` interface shared with `BoardSummary` instead of `BoardSummary` itself, which both `BoardSummary` and `BoardDetail` would extend; not chosen in this revision to avoid touching every file that currently relies on `BoardDetail` structurally satisfying `BoardSummary` (for example any future code passing a `BoardDetail` where a `BoardSummary` is expected). Recommendation: make this narrowing change at the next version that touches `lib/types.ts`'s Board interfaces.
69. **PATCH `/api/boards/<id>` gains two queries with no stated budget (R47.6 versus R44.4, R44.7).** R44.7 (new in V12) clarifies that the GET `/api/boards/<id>` budget does not apply to GET `/api/boards`, but it does not say anything about PATCH `/api/boards/<id>`, which now runs its existing update queries plus `counts_for_board`'s two grouped queries. The design accepts the additional cost (A22) because R47 states no PATCH query cap and PATCH is not a high-frequency request like GET. Recommendation: if a future revision adds a query budget for every Board endpoint, state PATCH's budget explicitly.
70. **`formatCount`'s rule duplicates `formatBadge`'s shape but is a new function (R47.11 versus existing `lib/format.ts`).** `lib/format.ts` already has one count-formatting function, `formatBadge` (notification counts, no noun, caps at "99+"). `formatCount` (B25) is deliberately a second, separate function because its rule differs (singular/plural with a noun, no cap at 99, always renders down to 0) and forcing one function to cover both shapes would add branching unrelated to either caller. Accepted as designed; not a conflict.

#### V12 refinement open issues

71. **Issues 67 and 68 resolved by the V12 refinement.** Issue 67: `BoardDetailSchema` is no longer touched; the counts live in the new `BoardSummarySchema` (A22-R), so no `Meta.exclude` is needed. Issue 68: `BoardDetail` and `BoardSummary` now both extend `BoardBase` (B25 refinement), so the TypeScript shape matches the wire shape.
72. **Reading of R46.8 "no GET `/api/cards/<id>` request".** `CardDetailModal` loads `GET /api/cards/<id>` on every open since V11 (R41.9, A18), and R46.3 requires the deep-link open to behave as a click. The design reads R46.8 as "the deep link sends no request of its own to find or reopen the Card"; the modal's own load still runs once. Recommendation: at the next requirements revision, reword R46.8 to "SHALL find the Card in the GET `/api/boards/<id>` response and SHALL send no request beyond the request the CardDetailModal sends for any opened Card". No requirement text is changed now.
73. **`sessionStorage` unavailable.** In a browser that blocks `sessionStorage`, Board_Patches cannot be stored. Push navigations still show fresh data; only a back navigation to an older Dashboard entry can show the old name or the deleted Board until a reload. Accepted; the case is rare and the data is not lost.
74. **Counts after a back navigation.** R45.12 covers rename and delete only. After adding Cards or members, a back navigation to an older Dashboard entry shows the cached counts; the toolbar "Boards" link (push) shows fresh counts. Playwright scenario 4 uses the link. Extending Board_Patches to counts would mean counting in the browser, which R47.13 forbids. Recommendation: none needed unless the user wants back-navigation freshness for counts.
75. **Pre-existing `BoardList` retry gap.** `BoardList` copies `initialBoards` into `useState` once. After an initial error, `router.refresh()` from `ErrorPanel` replaces `initialError` but not the `boards` state, so a successful retry can show "No boards yet" until the next navigation. Not caused by V12; if the run-first step (R48.4) or review confirms it, fix it in the same pass by resetting `boards` when `initialBoards` changes.
76. **Playwright cleanup uses the V12 delete feature.** Scenarios 1, 3, and 4 delete their own Board at the end through the UI. If the delete feature regresses, those scenarios fail in cleanup, not in their own step. Accepted, because it keeps the shared E2E account from filling up and touches only Boards the scenario created (R48.3).
77. **`useSearchParams` not used.** R46.9 asks to read the `useSearchParams` doc; it was read (`01-app/03-api-reference/04-functions/use-search-params.md`), and the design does not use the hook because the board page is a Server Component that receives `searchParams` as a prop and `BoardView` needs the value only once. Using the hook in `BoardView` would also be correct but would read a value the page already passes.
