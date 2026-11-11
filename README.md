# Adventuro

> From Coast to Camp, Peak to Palace.

Adventuro is a travel-experience and adventure-gear web app (prototype). Customers browse curated tours across six travel verticals (TideTrail, GoldenSaga, PeakPulse, EliteScape, UrbanEcho, Grand India Tour), book a tour (no payment: a booking is confirmed straight away), get a ticket with a PDF, and find the gear each trip needs through affiliate links. A separate admin app manages all content, bookings and users, and shows business metrics.

Product rules, scope and the shared API contracts live in [`CLAUDE.md`](CLAUDE.md). Design is in [`DESIGN.md`](DESIGN.md), and audience and brand in [`PRODUCT.md`](PRODUCT.md). [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md) records the security review.

## Repo layout

```
/
├── backend/            Express 5 + MongoDB (Mongoose) REST API, /api/v1   → Render
├── frontend/           Customer app, React + Vite + Tailwind v4           → Vercel
├── admin/              Admin app, React + Vite + Tailwind v4              → Vercel
├── e2e/                Cross-app Playwright suite (both apps + API together)
├── design/             theme.css (token source of truth), Tailwind token map
├── package.json        Root project for the cross-app suite only
├── playwright.config.js
├── render.yaml         Render Blueprint for the backend
└── CLAUDE.md, DESIGN.md, PRODUCT.md, SECURITY_REVIEW.md
```

The three apps are independent npm projects with no shared package. Each has its own `CLAUDE.md` with the details.

## Local setup

You need Node.js 24 and git. You also need accounts for MongoDB Atlas, a Google OAuth client (Web) and a Supabase project.

1. Clone the repo, then run `npm install` in `backend/`, `frontend/`, `admin/` and the repo root.
2. Copy each `.env.example` to `.env`: `backend/.env`, `frontend/.env`, `admin/.env`.
3. In `backend/.env`, fill in `MONGODB_URI`, `JWT_SECRET` (32+ random characters), `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS` (your Google email), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_BUCKET`.
4. Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` and `admin/.env` (the same client ID).
5. In the Google Cloud console, add `http://localhost:5173` and `http://localhost:5174` as authorised JavaScript origins of that client.
6. Seed the database: `cd backend && npm run seed`. Optionally add demo tours and gear with `npm run seed:demo`.
7. Start the API: `cd backend && npm run dev` (port 5000).
8. Start the apps: `cd frontend && npm run dev` (http://localhost:5173) and `cd admin && npm run dev` (http://localhost:5174).
9. Sign in with Google. The email listed in `ADMIN_EMAILS` gets into the admin app.

Both Vite dev servers proxy `/api` to `http://localhost:5000`, so the session cookie is first-party, as it is in production. Each app keeps its own session (`adv_session` for the customer app, `adv_admin_session` for admin), so signing in or out of one does not affect the other.

## Scripts

| Where | Script | What it does |
|---|---|---|
| backend | `dev` | API with `--watch` and `.env` |
| | `start` | API for production (env from the host) |
| | `test`, `test:watch`, `test:coverage` | Vitest + Supertest on an in-memory MongoDB |
| | `lint`, `format` | ESLint, Prettier |
| | `seed` | 6 verticals + starter taxonomies (idempotent) |
| | `seed:demo` | Demo tours, gear and tags (idempotent; refuses to run in production) |
| | `e2e:server` | E2E harness on port 5000 (see below) |
| frontend | `dev` (5173), `build`, `preview` (4173) | Vite |
| | `test`, `test:watch`, `test:coverage` | Vitest + Testing Library + MSW |
| | `lint`, `format` | ESLint (0 warnings), Prettier |
| | `e2e` | Playwright at 375px and 1440px against a production build |
| admin | `dev` (5174), `build`, `preview` (4174) | Vite |
| | `test`, `test:watch`, `test:coverage`, `lint`, `format` | same as frontend |
| | `e2e` | Playwright at 768px and 1440px against a production build |
| root | `e2e` | Cross-app suite: backend harness + both dev servers |

`npx knip` in any app reports unused files, exports and dependencies.

## Environment variables

**backend** (validated at startup by `src/config/env.js`; the app refuses to start on a bad value)

| Var | Required | Notes |
|---|---|---|
| `NODE_ENV` | | `development` (default) \| `test` \| `production` |
| `PORT` | | default `5000`; Render sets it |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | at least 32 characters |
| `JWT_EXPIRES_IN` | | default `7d` |
| `GOOGLE_CLIENT_ID` | yes | OAuth client ID (Web) |
| `ADMIN_EMAILS` | | comma-separated; these accounts are admins |
| `CORS_ORIGINS` | yes | comma-separated origins of the two apps |
| `SUPABASE_URL` | yes | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | backend only, never in a client |
| `SUPABASE_BUCKET` | yes | public image bucket |
| `TRUST_PROXY_HOPS` | | default `1`; set `2` in production (Vercel rewrite → Render) |
| `LOG_LEVEL` | | default `info` |

**frontend** and **admin** (compiled into the public bundle, so never secrets)

| Var | Notes |
|---|---|
| `VITE_API_BASE_URL` | default `/api/v1`; leave it |
| `VITE_GOOGLE_CLIENT_ID` | the same client ID as the backend |

## Testing

- **Unit and integration:** `npm test` in each app. The backend needs no database, because mongodb-memory-server starts one per test file.
- **E2E harness:** `cd backend && npm run e2e:server` starts the real API on port 5000 against an in-memory MongoDB, with seed + demo content, three users, bookings, affiliate clicks and newsletter subscribers. It writes ready-made session cookies to `e2e/.auth.json` (gitignored). Supabase is real (the dev bucket), so a suite deletes whatever it uploads. All data is lost when the harness stops.
- **App suites:** `npm run e2e` in `frontend/` or `admin/` starts the harness and a production preview itself, or reuses them if they are running.
- **Cross-app suite:** `npm run e2e` at the repo root starts the harness and both apps' dev servers (5173, 5174). An admin creates and publishes a GoldenSaga tour with packages and gear; a customer finds it, buys the gear and books it; the admin sees the booking on the dashboard and completes it; the ticket follows. The suite also checks that an unpublished tour 404s while its ticket still opens, that an affiliate click reaches "top gear", and that a theme preference follows the account across both apps.
- First run on a machine: `npx playwright install chromium`.
- Before any E2E run, stop a dev backend on port 5000. Playwright reuses whatever answers there, and the suite would then run against your dev database. The customer's booking limit is 10 an hour, so restart the harness between back-to-back full runs.

## Deploy

**Backend → Render**
1. In Render, choose New → Blueprint and pick this repo. `render.yaml` defines the `adventuro-backend` web service: Node 24, `rootDir: backend`, `npm ci --omit=dev`, `npm start`, health check `/api/v1/health`.
2. Enter the `sync: false` values when asked: `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, and `CORS_ORIGINS` (`https://<customer domain>,https://<admin domain>`). Render generates `JWT_SECRET`. `NODE_ENV=production` and `TRUST_PROXY_HOPS=2` are set in the file.
3. In MongoDB Atlas → Network Access, allow Render's outbound addresses (or `0.0.0.0/0` with a strong DB password).
4. Run `npm run seed` once against the production database (Render shell, or locally with the production `MONGODB_URI`). Never run `seed:demo` in production; it refuses.

**Frontend and admin → Vercel** (one project each, root directory `frontend` or `admin`, framework Vite)
1. Replace the placeholder `adventuro-backend.example.com` in both `vercel.json` files with the Render host (e.g. `adventuro-backend.onrender.com`). Vercel can't read env vars inside `vercel.json`.
2. Set `VITE_GOOGLE_CLIENT_ID` in each project. Leave `VITE_API_BASE_URL` unset.
3. Deploy. `vercel.json` rewrites `/api/*` to Render (so the session cookie is first-party), falls back to `index.html` for client routes, and sends the security headers (CSP, nosniff, referrer policy, `frame-ancestors 'none'`). The admin app also sends `noindex`.
4. If images come from a host other than Supabase, Google avatars or the demo photo host, add that host to `img-src` in both CSPs. If you change the inline theme script in an `index.html`, update its `sha256-…` in that app's CSP; `src/deployConfig.test.js` fails until you do.

**After deploying**
- Open both apps, sign in, book a trip, and check the admin dashboard.
- Rate limits: the API's rate limiter should key on your own address. Send a few requests to `/api/v1/search?q=go` through the customer domain and look at the `RateLimit` header. The remaining count should fall by one per request, and a second network (e.g. a phone off Wi-Fi) should start its own count. If both share one count, the proxy hop count is wrong: adjust `TRUST_PROXY_HOPS`.
- To revoke an admin immediately: remove the email from `ADMIN_EMAILS` and rotate `JWT_SECRET` (this signs everyone out). Otherwise the change applies at that person's next sign-in.

### Google OAuth origins for production

In Google Cloud console → APIs & Services → Credentials → your OAuth client (Web) → **Authorised JavaScript origins**, add:
- `https://<customer domain>` (e.g. `https://adventuro.in` and `https://www.adventuro.in` if both are served)
- `https://<admin domain>` (e.g. `https://admin.adventuro.in`)
- each Vercel production URL you sign in on (e.g. `https://adventuro.vercel.app`, `https://adventuro-admin.vercel.app`)

Keep `http://localhost:5173` and `http://localhost:5174` for development. No redirect URIs are needed: Google Identity Services returns the credential in the page.
