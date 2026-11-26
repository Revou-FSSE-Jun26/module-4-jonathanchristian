# Frontend Guidelines (Next.js)

Purpose: rules for the Kano Next.js app so that generated UI code is consistent and testable.
Read this file before writing any code in `web/`. Scope: everything under `web/`.
Also consult `guidelines/backend.md` (API envelope, status codes, file-size limit) and `guidelines/database.md` (field meanings such as order values).
Every new entry must keep the Rule / Rationale / Kano Example structure.

### G-FE-01: web/ layout by API resource
- **Rule:** Build `web/` with the Next.js App Router, TypeScript, and Tailwind CSS, with no `src/` directory and one directory under `components/` per API resource (auth, boards, cards, comments, notifications, users) plus `components/shared/`, `hooks/`, and `lib/`.
- **Rationale:** Mirroring the API makes every component easy to locate.
- **Kano Example:** `web/components/comments/CommentList.tsx`, `web/hooks/useNotifications.ts`, `web/lib/apiClient.ts`.

### G-FE-02: Server versus Client Components
- **Rule:** Make pages that fetch data Server Components that pass the access cookie token to `apiRequest`, and put all state, effects, and event handlers in Client Components marked `'use client'`.
- **Rationale:** Server rendering avoids loading spinners for first paint, while interactivity needs the browser.
- **Kano Example:** `web/app/(boards)/boards/[id]/page.tsx` fetches `GET /api/boards/<id>` and renders the Client Component `BoardView`.

### G-FE-03: One component per file
- **Rule:** Define exactly one React component per file, named after the file in PascalCase.
- **Rationale:** Single-component files keep imports and tests predictable.
- **Kano Example:** `CardItem.tsx` exports only `CardItem`; `AddCardForm.tsx` exports only `AddCardForm`.

### G-FE-04: Shared components only
- **Rule:** Render every button with `BaseButton`, status labels with `BaseBadge`, and every dialog form inside `BaseModal`, all from `web/components/shared/`, and never use a raw `<button>` elsewhere; page forms and inline board forms are exempt from `BaseModal`.
- **Rationale:** Shared components give one look, one disabled behavior, and one place to fix bugs.
- **Kano Example:** `<BaseButton variant="destructive">` in `ConfirmDialog.tsx`; `CreateBoardModal.tsx` wraps its form in `BaseModal`; card status is always shown through `StatusBadge`, which renders `BaseBadge`.

### G-FE-05: Modal accessibility
- **Rule:** Keep `BaseModal` with `role="dialog"` and `aria-modal`, close on Escape and backdrop click but not on content click, move focus inside on open, trap Tab, and restore focus on close.
- **Rationale:** Keyboard and screen-reader users need predictable focus behavior.
- **Kano Example:** `web/components/shared/BaseModal.tsx` used by `CardDetailModal.tsx`.

### G-FE-06: All HTTP through apiClient
- **Rule:** Send every request to the API with `apiRequest` from `web/lib/apiClient.ts`, never with raw `fetch` in a component or hook, and return only the `data` field typed with the caller's generic.
- **Rationale:** One client applies the auth header, timeout, and error conversion consistently.
- **Kano Example:** `apiRequest<Card>("/api/cards/" + id, { method: "PATCH", body })` in `CardDetailModal.tsx`.

### G-FE-07: API base URL variables
- **Rule:** Read the base URL from `NEXT_PUBLIC_API_BASE_URL` in the browser and `API_BASE_URL` on the server, and throw `ApiError(0, ...)` naming the variable, without sending a request, when it is missing.
- **Rationale:** The two runtimes see different environment variables, and a clear failure beats a request to `undefined`.
- **Kano Example:** both variables are the only entries in `web/.env.example`.

### G-FE-08: Typed errors and user feedback
- **Rule:** Throw `ApiError(statusCode, message)` from `web/lib/errors.ts`, handle failures only with `handleError` from `hooks/useErrorHandler.ts`, and show messages only through `lib/toast.ts` (`showSuccess`, `showError`, `showLoading`).
- **Rationale:** One path yields one toast per failure with a message chosen per status.
- **Kano Example:** a rejected `PATCH /api/cards/<id>/position` calls `handleError(err)` once.

### G-FE-09: Auth state and cookies
- **Rule:** Keep the user and both tokens in `AuthContext`, store them in two non-httpOnly cookies (`kano_access`, `kano_refresh`) with path `/`, `SameSite=Lax`, and `Secure` on HTTPS, taking lifetimes from `expires_in` and `refresh_expires_in` of the API response.
- **Rationale:** Server Components and middleware must read the tokens, and the API stays the authority on validity.
- **Kano Example:** `AuthProvider.login(r)` calls `setAccessCookie(r.access_token, r.expires_in)` and `setRefreshCookie(r.refresh_token, r.refresh_expires_in)`.

### G-FE-10: Token refresh
- **Rule:** Let `apiClient` refresh in the browser with one shared `POST /api/auth/refresh` and one retry after a 401, let only `proxy.ts` (the Next.js route guard, called `middleware.ts` in older Next versions) renew the token for server rendering, and never refresh or write cookies in server-side code.
- **Rationale:** A single-flight refresh avoids refresh races, and Server Components cannot set cookies.
- **Kano Example:** `web/lib/refreshSession.ts` `refreshAccessToken()`; a server 401 leads to `redirect("/login?expired=1")`.

### G-FE-11: Drag and drop hook
- **Rule:** Implement card dragging only in `hooks/useDragAndDrop.ts` for mouse (HTML5 drag events) and touch (300 ms long-press, 10 px tolerance), update state optimistically within 100 ms, and restore the original column and order and call `handleError` once on failure.
- **Rationale:** Both input paths share one drop routine, so ordering and rollback behave identically.
- **Kano Example:** `computeDropOrder` in `web/lib/order.ts` feeds `PATCH /api/cards/<id>/position`; touch scrolling is blocked only by `preventDefault` on `touchmove` during an active drag.

### G-FE-12: Notification polling
- **Rule:** Poll `GET /api/notifications?page=1&per_page=20` in `hooks/useNotifications.ts` on mount and every 30 seconds while authenticated, keep the previous state silently on error, and clear the timer on unmount and logout.
- **Rationale:** Leaked timers keep polling after logout and waste requests.
- **Kano Example:** `NotificationBell.tsx` shows `formatBadge(unreadCount)`, which gives `"99+"` above 99.

### G-FE-13: Search debounce
- **Rule:** Debounce search input by 300 ms with `hooks/useDebouncedValue.ts`, cancel the previous request with `AbortController`, and ignore stale responses.
- **Rationale:** Debouncing limits requests, and cancellation stops old results overwriting newer ones.
- **Kano Example:** `CardSearchInput.tsx` calls `GET /api/cards?q=<text>&board_id=<id>`.

### G-FE-14: Tailwind mobile-first
- **Rule:** Style mobile-first for a 375 px minimum width, give Kanban columns `min-w-[240px]`, give buttons and form controls at least 44 by 44 px, and allow horizontal scroll only inside the Kanban container.
- **Rationale:** Phone users must reach every control without page-level horizontal scrolling.
- **Kano Example:** `KanbanColumn.tsx` uses `w-72 min-w-[240px] shrink-0`; `BaseButton` uses `min-h-[44px] min-w-[44px]`.

### G-FE-15: Complete static class strings
- **Rule:** Write every Tailwind class as a complete static string, in lookup objects when a value picks the style (status, label color, role badge), never build class names with template strings or concatenation, and keep such objects only in folders the Tailwind scanner covers (`app/`, `components/`, `hooks/`, and `lib/` through `@source "../lib";` in `globals.css`).
- **Rationale:** Tailwind generates only the classes it finds as whole strings, so a built class name silently has no style.
- **Kano Example:** `STATUS_STYLE` in `web/lib/status.ts` and `LABEL_CLASS` in `web/lib/labelColor.ts`; the checklist bar width is the only computed style (`style={{ width }}`), its colors stay static classes.

### G-FE-16: Role gating with can(role, action)
- **Rule:** Decide every show, hide, or disable of a role-dependent control with `can(role, action)` and `assignableRoles` / `canActOnMember` from `web/lib/roles.ts` (the four roles guest, member, manager, admin and their ranks), read the role from `my_role` through `BoardRoleContext`, and never treat the frontend check as security.
- **Rationale:** One mirror of the permission table keeps the UI consistent with the server, which still returns 403 for every direct call.
- **Kano Example:** `can(role, "manage_columns")` hides add, rename, delete, and reorder of Columns from members and guests; `useDragAndDrop({ enabled: can(role, "edit_cards") })`; the role dropdown lists `assignableRoles(myRole)`.

### G-FE-17: Status and label color maps
- **Rule:** Take card status text, color, and the four allowed values only from `web/lib/status.ts` (`CARD_STATUSES`, `STATUS_STYLE`) and render them through `StatusBadge`, and take label chip colors only from the pure `labelColor(text)` in `web/lib/labelColor.ts`, which normalizes the text (trim, NFC, lower case) and hashes it to one of eight palette keys with no randomness or date input.
- **Rationale:** One map makes the board, the modal, and My Tasks agree, and a deterministic hash gives the same label the same color on every board and device without a schema change.
- **Kano Example:** `NOT_STARTED` gray, `IN_PROGRESS` blue, `URGENT` red, `DONE` green; `labelColor(" Design ")` equals `labelColor("design")`.

### G-FE-18: Card checklist and workspace links UI
- **Rule:** Apply a checklist toggle to local state at once and revert it with one `handleError` call on failure, report new counts to the board with `onCountsChanged` after every successful change, validate link URLs with `validateLinkUrl` (trimmed, `http` or `https`, hostname) before any request, and render every link as `<a href target="_blank" rel="noopener noreferrer">` showing its hostname, with the progress and link-count chips hidden at zero.
- **Rationale:** Immediate toggles feel responsive, counts on the card face must not need a reload, and external links must neither run script nor leak the opener.
- **Kano Example:** `useChecklist` in `web/hooks/useChecklist.ts`; `LinkRow.tsx`; `CardMetaRow.tsx` shows `3/5` only when `checklist_total > 0`.

### G-FE-19: Overdue notifications without polling
- **Rule:** Load overdue items with `hooks/useOverdue.ts` once when the authenticated Header mounts and again each time the notification list opens, never on a timer, keep the previous items silently on error, and keep overdue items out of the unread count.
- **Rationale:** Overdue items are computed on read, so refreshing on open is enough and polling would only add load.
- **Kano Example:** `NotificationList.tsx` shows an "Overdue" group above stored items; `isOverdue(due, status, todayUtc())` in `lib/overdue.ts` drives the card-face chip.

### G-FE-20: No raw HTML injection
- **Rule:** Never use `dangerouslySetInnerHTML` anywhere under `web/` and render user text only as React children.
- **Rationale:** Both tokens sit in readable cookies, so any XSS exposes them.
- **Kano Example:** `CommentItem.tsx` renders `{comment.content}` as plain text.

### G-FE-21: React Testing Library conventions
- **Rule:** Write unit tests with Vitest and React Testing Library that mock the network (`vi.fn()` on `fetch`), never call a real API, and assert behavior through roles and text.
- **Rationale:** Tests must run offline and in a single run with `vitest --run`.
- **Kano Example:** `web/__tests__/` tests of `RegisterForm` assert no request is sent for a 7-character password.

### G-FE-22: Playwright conventions
- **Rule:** Write Playwright tests against `E2E_BASE_URL` using auto-waiting locators (scope link locators to `banner` or `contentinfo`, or use `exact: true`) and web-first assertions, never `waitForTimeout`, and read the test account only from `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in `web/.env.test` through `requireCredentials()` (never a literal e-mail or password in `web/e2e/`), set the `kano_welcome_seen` cookie before visiting `/` as an anonymous user, and use a unique generated email per registration.
- **Rationale:** Fixed sleeps cause flaky tests, and unique users keep runs independent.
- **Kano Example:** `web/e2e/` Kanban journey uses `locator.dragTo` and `await expect(card).toBeVisible()`.

## Quick checklist
- [ ] Page that fetches is a Server Component; interactive parts are `'use client'`.
- [ ] One component per file; buttons are `BaseButton`; dialog forms are inside `BaseModal` (page forms and inline board forms are exempt).
- [ ] All requests use `apiRequest`; errors go through `useErrorHandler`.
- [ ] No cookie writes or refresh calls in server code.
- [ ] Tailwind classes work at 375 px; tap targets are at least 44 px; class names are complete static strings.
- [ ] Role-dependent controls use `can(role, action)`; status and label colors come from `STATUS_STYLE` and `labelColor`.
- [ ] No `dangerouslySetInnerHTML`.
- [ ] Tests mock the network; no `waitForTimeout`.
- [ ] Timers and listeners are cleaned up on unmount.
