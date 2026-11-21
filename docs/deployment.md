# Kano Deployment Guide

This guide covers deploying the Kano monorepo as two separate Vercel projects (`kano-api` and `kano-web`), with an optional Railway deployment path for the Flask backend.

---

## 1. Vercel Architecture

| Project | Root Directory | Framework / Runtime | Build / Entry |
|---|---|---|---|
| `kano-api` | Repository root (`.`) | `@vercel/python` (via `vercel.json`) | `app/wsgi.py` |
| `kano-web` | `web/` | Next.js | `npm run build` |

> [!IMPORTANT]
> Disable **Vercel Deployment Protection** on both projects so `kano-api` and `kano-web` are reachable over HTTPS without a Vercel login. Otherwise browser requests and Playwright E2E checks will be blocked by Vercel's auth wall.

---

## 2. Environment Variables

Set these variables in the Vercel dashboard (or Railway) before verifying:

| Project | Variable | Value |
|---|---|---|
| `kano-api` | `DATABASE_URL` | Managed PostgreSQL pooled URL (`sslmode=require`) |
| `kano-api` | `JWT_SECRET_KEY` | Long random secret string |
| `kano-api` | `JWT_ACCESS_TOKEN_EXPIRES` | `3600` |
| `kano-api` | `JWT_REFRESH_TOKEN_EXPIRES` | `604800` |
| `kano-api` | `CORS_ORIGINS` | Exact public URL of `kano-web` (no trailing slash, e.g. `https://kano-web.vercel.app`) |
| `kano-web` | `NEXT_PUBLIC_API_BASE_URL` | Public URL of `kano-api` (no trailing slash) |
| `kano-web` | `API_BASE_URL` | Public URL of `kano-api` (no trailing slash) |

---

## 3. Manual Database Migration Steps

Database migrations are **manual** and must be run from a local shell before verifying the API. Until `flask db upgrade` runs, database-backed endpoints return the generic `500` error envelope.

1. Activate the backend virtual environment and point `DATABASE_URL` at the target database.
2. Run from `app/`:
   ```bash
   flask db upgrade
   ```

---

## 4. Verification Order

1. **Deploy both projects** and apply the production database schema (`flask db upgrade`).
2. **Set `CORS_ORIGINS`** on `kano-api` to the exact `kano-web` public URL (no trailing slash) and redeploy both projects.
3. **Postman API check** against `kano-api`:
   - `GET /api/health` (`200`, `{ "data": { "status": "ok" } }`)
   - `POST /api/auth/register` (`201`)
   - `POST /api/auth/login` (`200` with `access_token` and `refresh_token`)
   - One request for each of the eight endpoint groups (auth, boards, columns, cards, comments, notifications, analytics, users), verifying the `{ "data": ... }` envelope.
4. **Browser walk-through** at desktop (`1280 px`) and mobile (`375 px`):
   - Visit Dashboard, Board Detail, Card Detail Modal, My Tasks, Profile, Register, and Login with no console errors or failed network requests.
   - Verify touch drag-and-drop at `375 px` in browser DevTools device mode (300 ms long-press).
5. **Playwright E2E suite**:
   ```bash
   cd web
   E2E_BASE_URL=https://your-kano-web.vercel.app npx playwright install
   E2E_BASE_URL=https://your-kano-web.vercel.app npx playwright test
   npx playwright show-report
   ```

---

## 5. Serverless Risks (Vercel)

- **Connection pooling**: On Vercel (`VERCEL` env var set), `app/config.py` configures SQLAlchemy with `NullPool` so serverless invocations do not hold idle connections. Use a **pooled** `DATABASE_URL` from your PostgreSQL provider.
- **Cold starts & health check**: `/api/health` performs no database queries, but a Vercel cold start may exceed 500 ms on the first request after idle periods.
- **Python 3.14 & `psycopg2-binary`**: The local virtual environment uses Python 3.14. If Vercel does not offer Python 3.14 or lacks a `psycopg2-binary` wheel, pin a supported version in a root `.python-version` file (e.g. `3.12`) or switch to `psycopg[binary]`.

---

## 6. Optional Railway Alternative (Backend)

If you prefer a long-lived server process instead of Vercel serverless functions for the Flask backend:

- **Start command**:
  ```bash
  gunicorn "app.wsgi:app" --bind 0.0.0.0:$PORT --workers 2
  ```
- **Environment variables**: `DATABASE_URL` (from Railway PostgreSQL plugin), `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES=3600`, `JWT_REFRESH_TOKEN_EXPIRES=604800`, and `CORS_ORIGINS` (exact public URL of `kano-web`, no trailing slash).
- **Frontend configuration**: Set `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL` on `kano-web` to the generated Railway public URL.
