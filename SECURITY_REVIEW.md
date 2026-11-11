# Adventuro — Security review

**Date:** 2026-10-20 (session 15) · **Scope:** `backend/`, `frontend/`, `admin/`, and the deploy config (`render.yaml`, both `vercel.json`).

**Method:** I read the code instead of relying on grep: every route and its middleware chain, the auth, cookie, CORS, rate-limit, upload, validation and error-handling code, and the client code that handles URLs, redirects, storage and rendering. Then I checked the running system:
- the backend started with `NODE_ENV=production` on an in-memory MongoDB and probed with `curl`
- both production builds scanned for secrets
- both builds served with the exact `vercel.json` headers and loaded in Chromium while recording CSP violations

## Summary

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Open redirect after sign-in through `?next=` with a tab or newline | Medium | **Fixed** |
| 2 | Behind the Vercel rewrite, every visitor shares one rate-limit bucket | Medium (availability) | **Fixed** (config) |
| 3 | The customer and admin apps sent no security headers | Medium | **Fixed** |
| 4 | Zod's eval probe breaks a strict CSP | Low | **Fixed** |
| 5 | Admin wordmark link name doesn't contain its visible text (WCAG 2.5.3) | Low (a11y) | **Fixed** |
| 6 | A removed admin keeps admin rights until their next sign-in | Low | Accepted, procedure documented |
| 7 | Sessions can't be revoked one at a time | Low | Accepted |
| 8 | Validation messages name the pattern that failed | Info | Accepted |

---

## Findings and fixes

### 1. Open redirect through `?next=` (customer app). Fixed
`safeNext` (`frontend/src/lib/next.js`) accepted any value that started with one `/` not followed by `/` or `\`. Browsers strip tabs and newlines from URLs, so `/signin?next=%2F%09%2Fevil.example` passed the check and resolved to `https://evil.example/` (confirmed with `new URL`). React Router falls back to `location.assign` when `pushState` refuses a cross-origin URL, so after sign-in the visitor would leave the site.

**Fix:** the path may not contain whitespace or control characters (`/^\/(?![/\\])[^\s\p{Cc}]*$/u`). Tests were added for tab, newline and NUL. Real `next` values come from `location`, which is already percent-encoded, so nothing legitimate is refused.

### 2. Rate limits behind Vercel → Render. Fixed in config
The API used `trust proxy 1`. In production the request passes through two proxies that append to `X-Forwarded-For`: Vercel's `/api` rewrite, then Render's load balancer. With one hop trusted, `req.ip` is Vercel's egress address, so every visitor would share one bucket of the global limiter (300 requests per 15 minutes). Ordinary traffic would then lock everyone out.

**Fix:** new env var `TRUST_PROXY_HOPS` (default `1`, validated as 0–5). `render.yaml` sets it to `2`.
- **Trade-off:** a client calling the Render URL directly, bypassing Vercel, can choose the address the limiter sees. Bookings are also limited per user, and that limit doesn't depend on the IP.
- **Check after deploy:** see the README.

### 3. No security headers on the static apps. Fixed
Before this session, `vercel.json` had only rewrites (plus `X-Robots-Tag` on admin). Both apps now send:
- **`Content-Security-Policy`:**
  - `default-src 'self'`
  - `script-src 'self'` + the SHA-256 of the inline theme script + `https://accounts.google.com/gsi/client`
  - `style-src 'self' 'unsafe-inline'` + Google Fonts + GIS style. `'unsafe-inline'` is needed for the `<style>` tags injected at runtime by sonner and GIS. Scripts stay strict.
  - `font-src` Google Fonts
  - `img-src 'self' data: blob:` + `*.supabase.co`, Google avatars (`lh3.googleusercontent.com`) and the demo photo host (`picsum.photos`, `fastly.picsum.photos`)
  - `connect-src 'self' https://accounts.google.com/gsi/`
  - `frame-src https://accounts.google.com/gsi/`
  - `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, `upgrade-insecure-requests`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin` (what GIS expects)
- `X-Frame-Options: DENY`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (the GIS popup needs it)
- `Permissions-Policy` (camera, microphone, geolocation, payment all off)
- `Strict-Transport-Security`
- long-lived caching for the hashed `/assets/*`
- admin also keeps `X-Robots-Tag: noindex` and its `<meta name="robots">`

**Drift guard:** `src/deployConfig.test.js` in each app hashes the inline script in `index.html` and fails if `vercel.json` doesn't allow that hash. It also checks `frame-ancestors`, `nosniff`, the referrer policy and the rewrites, plus `noindex` for admin.

**Verified:** both production builds were served with these headers. Chromium loaded home, a vertical, a tour with the booking modal, the gear store, sign-in (real GIS script), account, a ticket, admin login, dashboard, tours, bookings and users. **0 CSP violations** (after fix 4).

### 4. Zod's eval probe under the CSP. Fixed
When a schema is defined, Zod 4 tests for `eval` with `Function('')`. It catches the failure and falls back, but the CSP still blocks the call and reports a violation on every page load. Setting `z.config({ jitless: true })` in `main.jsx` was too late, because the bundler evaluates the shared chunk that defines the schemas first.

**Fix:** `src/lib/zod.js` sets `jitless` and re-exports `z`, and `lib/schemas.js` imports from it, so the config runs before the first schema by dependency order. ESLint `no-restricted-imports` now forbids importing `zod` anywhere else.

### 5. Admin wordmark link name (found by axe 4.14 after the upgrade). Fixed
The visible text of the sidebar logo link was "AdventuroAdmin" (two spans, no space), which isn't contained in its name "Adventuro Admin home". A space between the spans fixes it with no visual change.

### 6. Admin removal takes effect at the next sign-in. Accepted
The role is re-synced from `ADMIN_EMAILS` on every sign-in, as `/CLAUDE.md` specifies, and `requireAuth` reads the stored role on every request. Removing an email from `ADMIN_EMAILS` therefore takes effect when that person next signs in, or when their 7-day session ends.

**To revoke at once:** remove the email, then rotate `JWT_SECRET` on Render. That signs everyone out. Recorded in the README.

### 7. Stateless sessions. Accepted
Logout clears the cookie, but a copied JWT stays valid until it expires (7 days). The token is httpOnly, never reaches JavaScript, and is `Secure` + `SameSite=Lax` in production. Rotating `JWT_SECRET` is the global kill switch.

### 8. Validation detail in error bodies. Accepted
`errors[].message` can name a regex pattern (e.g. the slug pattern) or an enum. This reveals nothing secret, and both frontends never display server messages: they map `code` and the field name to their own text.

---

## Checked and found sound

**Auth and cookies**
- Google ID tokens are verified with `audience = GOOGLE_CLIENT_ID`, and `email_verified` must be `true`. Library errors are never logged, because they can contain the token.
- The session JWT is HS256 with `algorithms` pinned. An `alg: none` token is refused (probed: 401, cookie cleared).
- `JWT_SECRET` is at least 32 characters. Render generates it (`generateValue`).
- Cookie `adv_session` is `HttpOnly; Secure` (in production, probed) `; SameSite=Lax; Path=/`, and `maxAge` matches the JWT.
- `requireAuth` loads the user on every request.

**CORS**
- Allowlist from `CORS_ORIGINS` with credentials.
- Probed: an unlisted origin gets no `Access-Control-Allow-Origin`. A listed one is echoed.
- In production the apps call the API same-origin through the rewrite, so CORS is a second line of defence only.

**Rate limits**
- global 300 / 15 min, auth 20 / 15 min, booking 10 / hour per user, newsletter 5 / hour, search 60 / min, go 60 / min
- all return the `RATE_LIMITED` envelope

**IDOR, every `:param` route**

| Route | Protection |
|---|---|
| `/bookings/:bookingNumber` and `/ticket` | Query on `{ bookingNumber, user }`; another user's booking is 404. Admins can see any booking |
| `/tours/:slug`, `/verticals/:key`, `/gear/:id/go` | Public, and only published or active items |
| `/admin/*/:id`, `/admin/bookings/:bookingNumber` | `requireAuth` + `requireAdmin`, applied once at the admin router. Probed without a session: 401 |
| `PATCH /users/me` | Acts only on the session user |

**Validation**
- Every body schema is `.strict()`. `tests/contract.test.js` sends an unknown key to every POST and PATCH route; probed `__proto__` → 400 `Unknown field`.
- Client-owned fields are never accepted: price, total, role, status, booking number, click count, starting price.
- `sanitizeFilter` + `strictQuery` are on. `?state[$ne]=x` is dropped (probed: an empty page, not a match-all).
- `express.json` is limited to 100 kB (probed: 400 `VALIDATION_ERROR`).

**Uploads**
- admin only, multer memory storage, 5 MB limit, 1 file
- the type is sniffed from the bytes (jpeg, png or webp only; the client's MIME type and filename are ignored)
- stored as `{folder}/{uuid}.{ext}`
- deletable paths must match `IMAGE_PATH_REGEX`, so a forged path never reaches storage

**Redirects**
- `/gear/:id/go` reads the affiliate URL from the database, and it must be https. There is no URL parameter, so no open redirect.
- The admin "Test link" only appears for an `https:` URL.

**XSS**
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in either app.
- All content renders as text.
- External links use `rel="noopener noreferrer"` (Buy also has `sponsored`).

**Secrets in client bundles**
- `frontend/dist` and `admin/dist` were scanned for `SUPABASE`, `service_role`, `JWT`, `secret`, `mongodb` and `eyJhbGci`.
- The only matches are zod's built-in JWT *format validator* (the strings `jwt` / `JWT`). No key, URL or token.
- The only `VITE_` vars are the API base path and the public Google client ID.

**Headers on the API**
- `helmet()`: CSP, HSTS, `nosniff`, `X-Frame-Options`, CORP / COOP, `Referrer-Policy: no-referrer`
- no `X-Powered-By` (probed)

**Production error responses** (probed with `NODE_ENV=production`)
- malformed JSON → 400
- oversized body → 400
- unknown route → 404
- bad id or slug → 400 with field names
- bad or `alg: none` JWT → 401
- no session on `/admin` → 401
- bad Google credential → 401
- `TRACE` → 404

None of these carried a stack, query or internal message. The 500 path is covered by `tests/errorHandler.test.js`: in production mode it returns only "Something went wrong" + `INTERNAL_ERROR`.

**Logging:** pino redacts the cookie, authorization, credential and phone fields. Request logs drop the query string.

**Dependencies:** `npm audit` reports 0 vulnerabilities in all three apps and the root E2E project after upgrading to the latest stable versions.

**Admin CSV export:** every cell is quoted, and a cell starting with `=`, `+`, `-`, `@`, tab or CR is prefixed with `'` (formula-injection guard).
