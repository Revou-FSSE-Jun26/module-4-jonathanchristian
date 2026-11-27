# V12 baseline (V11 code state, before any V12 change)

Recorded by tasks 57.2 and 57.3. Nothing in the code or the tests was changed before these runs.

## `pytest`

- Command: `python -m pytest -q -p no:cacheprovider` from `app/` with the venv active
- Date: 2026-11-27
- Result: 1303 passed, 0 failed, 3 skipped (653 s)
- Failures: no failures

## `npm test`

- Command: `npm test` (`vitest --run`) from `web/`
- Date: 2026-11-27
- Result: 47 test files passed, 151 tests passed, 0 failed
- Failures: no failures

## `npx playwright test`

- Command: `npx playwright test` from `web/` (stack: `flask run` on port 5000, `npm run dev` on port 3000, `E2E_BASE_URL=http://localhost:3000`)
- Date: 2026-11-27
- Result: 16 passed, 8 failed (6.2 min); every failure failed all 3 attempts (2 retries), so none is flaky
- Cause class of all 8 failures: V11 leftover (the test no longer matches the V11 UI), except where noted

| # | File and test | First error line | Cause class | Fix (57.4) |
|---|---|---|---|---|
| 1 | `e2e/checklistLinksUrgent.spec.ts` › adds checklist item and link, sees 1/1 and link chip, sets Urgent status on board and My Tasks (desktop) | `strict mode violation: ...getByText('Urgent') resolved to 2 elements` (card title "Urgent task" and the badge) | V11 leftover | Fixed: test now matches the badge with `exact: true` (also the My Tasks check). Re-run: passes |
| 2 | `e2e/inviteJoin.spec.ts` › member sees no column controls, admin promotes to manager, ... guest is read-only (desktop) | `Test timeout of 60000ms exceeded` waiting for `getByLabel('Role for Invited Member')` (Members dialog still open with the list loaded before the member joined) | V11 leftover | Fixed: the test reloads the board before opening Members (the member list loads with the page), and matches the Guest badge with `exact: true`. Re-run: passes |
| 3 | `e2e/kanban.spec.ts` › Kanban full journey (8 steps) (desktop) | `strict mode violation: getByRole('button', { name: 'Save' }) resolved to 2 elements` ("Save changes" and "Save") | V11 leftover | Fixed: `getByRole("button", { name: "Save", exact: true })`. Re-run: passes |
| 4 | `e2e/layout.spec.ts` › board toolbar and single 1px separator have no overlap at 375x812 (desktop) | `Test timeout of 60000ms exceeded` waiting for `getByRole('button', { name: /^add$/i })` (the button is now "Add column") | V11 leftover | Fixed: the test clicks `/^add column$/i`. Re-run: passes |
| 5 | `e2e/layout.spec.ts` › same test at 1920x1080 (desktop) | same as 4 | V11 leftover | Same fix as 4. Re-run: passes |
| 6 | `e2e/overdue.spec.ts` › past due date shows Overdue chip ... (desktop) | `strict mode violation: ...getByText('Overdue') resolved to 2 elements` (chip and assignee "Overdue User") | V11 leftover | Fixed: `getByText("Overdue", { exact: true })`. Re-run: passes |
| 7 | `e2e/mobile.spec.ts` › Welcome, Register, and Login have no horizontal overflow and meet 44px tap targets (mobile) | `expect(getByRole('heading', { name: 'Welcome to Kano' })).toBeVisible() failed: element(s) not found` (the h1 is now "Organize work smoothly, from idea to done") | V11 leftover | Fixed in two parts: the test uses the current landing h1; the "Log in" and "Register" links of `RegisterForm.tsx` and `LoginForm.tsx` were under 44 px (app bug, G-FE-14), now `inline-flex min-h-[44px] min-w-[44px]`. Re-run: passes |
| 8 | `e2e/mobile.spec.ts` › Authenticated pages and invite page have no overflow and modals fit viewport (mobile) | `expect(page).toHaveURL(/\/login/) failed`: stayed on `/register`, "Name is required" shown | Environment (dev server race): the Name value typed before React hydrated /register was cleared, so the form was invalid. Fixed: the test waits for `networkidle` after `goto("/register")`. Re-run: passes |


## Notes from 57.4

- Found while re-running `npm test` after the fixes: `__tests__/AuthProvider.test.tsx` › AuthProvider › restores session on mount via GET /api/users/me failed once in 6 runs (`expect(element).toHaveTextContent()`; the baseline run of 57.2 was green). Cause class: flaky (the user text was asserted right after the status text, outside `waitFor`). Fixed: both assertions are in the same `waitFor`. Re-run: 4 of 4 runs green.
- Final state after the fixes: `npx playwright test` 24 passed, 0 failed; `npm test` 47 files and 151 tests passed. `pytest` was not affected (no `app/` file changed) and was not re-run.
- Changes made: `web/e2e/` (checklistLinksUrgent, inviteJoin, kanban, layout, mobile, overdue specs), `web/__tests__/AuthProvider.test.tsx`, `web/components/auth/LoginForm.tsx`, `web/components/auth/RegisterForm.tsx`. No test was deleted, skipped, or weakened.
- Nothing is left for tasks 62.1 to 62.3: none of the failures depended on the My Tasks link target or the Board card layout.

## After V12

Recorded by task 64.1 (`pytest -v` skipped as it was run earlier).

- `npm test` (`vitest --run` from `web/`): 52 test files passed, 168 tests passed, 0 failed
- `npm run build` (`next build --webpack` from `web/`): passed (TypeScript and production build clean, exit code 0)
- `scripts/check_file_size.py app web`: OK: no file over 300 lines in app, web
- `scripts/check_repo_hygiene.py`: OK (`.gitignore` and tracked env files, env examples, secrets, specs/guidelines, literal credentials in `web/e2e`)
- `scripts/check_readme_links.py`: OK: every relative link and image path in `README.md` resolves
- `npx playwright test` (from `web/`, `desktop` and `mobile` projects against local Flask port 5000 and Next.js port 3000): 28 passed, 0 failed, 0 retries (17.0 s) — recorded by task 64.3
