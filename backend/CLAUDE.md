# Backend — Adventuro API

Read `/CLAUDE.md` first. It holds the product rules, the API envelope, the error codes, and the auth flow. This file covers how the API is built.

## Stack

- **Runtime:** Node.js 24.x (LTS; `engines` pins `24.x`), `"type": "module"`, Express 5
- **Data:** Mongoose (latest)
- **Validation:** Zod for request validation and for env validation
- **Auth:** `google-auth-library`, `jsonwebtoken`, `cookie-parser`
- **Security:** `helmet`, `cors`, `express-rate-limit`
- **Files:** `multer` (memory storage), `file-type` (magic-byte sniffing), `@supabase/supabase-js`
- **Tickets:** `pdfkit`
- **Logging:** `pino` + `pino-http`
- **Dev tools:** Vitest, Supertest, mongodb-memory-server, ESLint (flat config), Prettier

Install everything at its latest stable version. **Do not use:**

| Package | Use instead |
|---|---|
| `nodemon` | `node --watch` |
| `dotenv` | `--env-file` |
| `body-parser` | `express.json()` |
| `uuid` | `crypto.randomUUID()` |
| `moment` | `Intl` / native `Date` |
| `express-mongo-sanitize` | Mongoose `sanitizeFilter` + strict Zod (the package breaks on Express 5's read-only `req.query`) |
| `bcrypt` | Not needed — there are no passwords |

## Scripts

```
dev            node --watch --env-file=.env src/server.js
start          node src/server.js
test           vitest run
test:watch     vitest
test:coverage  vitest run --coverage
lint           eslint .
format         prettier --write .
seed           node --env-file=.env scripts/seed.js
seed:demo      node --env-file=.env scripts/seed-demo.js     # demo tours and gear, never in production
e2e:server     node --env-file=.env scripts/e2e-server.js    # E2E harness for the frontends, see Testing
```

`npx knip` (configured by `knip.json`, not installed as a dependency) reports unused files, exports and dependencies.

## Environment (`src/config/env.js`, validated with Zod at startup — fail fast)

| Var | Notes |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `PORT` | default 5000 |
| `MONGODB_URI` | |
| `JWT_SECRET` | ≥ 32 chars |
| `JWT_EXPIRES_IN` | default `7d` |
| `GOOGLE_CLIENT_ID` | |
| `ADMIN_EMAILS` | comma-separated, lowercased on parse |
| `CORS_ORIGINS` | comma-separated allowlist |
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | backend only, never logged |
| `SUPABASE_BUCKET` | public bucket for images |
| `LOG_LEVEL` | default `info` |

Export a frozen, typed object. Nothing else reads `process.env`.

## Folder structure

```
backend/
├── src/
│   ├── server.js              # connect DB, listen, graceful shutdown (SIGINT/SIGTERM)
│   ├── app.js                 # builds and exports the Express app (no listen) — tests import this
│   ├── config/
│   │   ├── env.js
│   │   ├── db.js              # mongoose.connect, sets sanitizeFilter + strictQuery
│   │   ├── supabase.js        # storage client
│   │   ├── logger.js          # pino instance with redaction
│   │   └── constants.js       # VERTICALS, ROLES, BOOKING_STATUS, THEME, limits
│   ├── routes/
│   │   ├── index.js           # mounts every router under /api/v1
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vertical.routes.js
│   │   ├── tour.routes.js
│   │   ├── gear.routes.js
│   │   ├── taxonomy.routes.js
│   │   ├── booking.routes.js
│   │   ├── search.routes.js
│   │   ├── newsletter.routes.js
│   │   └── admin/
│   │       ├── index.js       # applies requireAuth + requireAdmin ONCE, mounts admin routers
│   │       ├── dashboard.routes.js
│   │       ├── vertical.routes.js
│   │       ├── tour.routes.js
│   │       ├── gear.routes.js
│   │       ├── taxonomy.routes.js
│   │       ├── upload.routes.js
│   │       ├── booking.routes.js
│   │       ├── user.routes.js
│   │       └── newsletter.routes.js
│   ├── controllers/           # mirrors routes/ (including admin/)
│   ├── services/              # business logic + DB access, mirrors domains
│   │                          # + storage.service.js (Supabase images) and admin/ (admin CRUD per domain)
│   ├── models/                # User, Vertical, Tour, Gear, Taxonomy, Booking, Counter, GearClick, NewsletterSubscriber
│   │                          # + schemaHelpers.js (toJSONOptions, imageSchema, integerValidator, isHttpsUrl)
│   ├── validators/            # Zod schemas per domain (+ common.js: objectId, slug, pagination, phone, image, …)
│   │                          # + admin/ (admin bodies and list queries per domain)
│   ├── assets/fonts/          # Noto Sans (regular, bold) + OFL.txt, embedded in the ticket PDF
│   ├── middlewares/
│   │   ├── auth.js            # requireAuth, optionalAuth, requireAdmin, requireCompleteProfile
│   │   ├── validate.js
│   │   ├── rateLimiters.js
│   │   ├── upload.js          # receiveImage: multer (memory) + file-type sniff → req.image
│   │   ├── notFound.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── AppError.js
│       ├── response.js        # sendSuccess
│       ├── cookies.js         # auth cookie options, set/clear helpers
│       ├── escapeRegex.js     # escapeRegex + containsRegex / exactRegex (literal, case-insensitive)
│       ├── pagination.js
│       ├── dates.js           # IST "tomorrow", date-only helpers, IST day ranges for queries
│       ├── format.js          # display strings: rupees, calendar date, clock time, IST date-time
│       ├── serialize.js       # `_id` → `id`, drops `__v` for `.lean()` results
│       └── slugify.js
├── scripts/
│   ├── seed.js                # idempotent: 6 verticals + starter taxonomies
│   ├── seed-demo.js           # idempotent by slug: demo tours, gear, tags, vertical hero images
│   ├── demo/                  # the demo content itself: tours.<vertical>.js, gear.js, helpers.js
│   └── e2e-server.js          # E2E harness (dev only, never imported by src)
├── tests/
│   ├── setup.js               # mongodb-memory-server lifecycle, clears collections between tests
│   ├── helpers/               # factories (user, tour, gear, booking), authAgent(user), supabaseMock
│   └── *.test.js              # one file per route group
├── .env.example
├── eslint.config.js
├── knip.json
└── vitest.config.js
```

Conventions:
- Files are named `<domain>.<layer>.js`; models are PascalCase files (`Tour.js`).
- **Named exports only.** No default exports.
- Functions are camelCase, constants UPPER_SNAKE.
- Each module does one job. If a file passes about 200 lines, split it by responsibility.

## Layer responsibilities

| Layer | Does | Never |
|---|---|---|
| routes | path + middleware chain + controller | logic, DB calls |
| controllers | read `req.validated` / `req.user`, call services, `sendSuccess` | business rules, queries, building error responses |
| services | business rules, queries, throw `AppError` | touch `req` / `res` |
| models | schema, indexes, field validation, `toJSON` transform | business workflows |
| validators | Zod schemas for body / query / params | DB access |

### Controller pattern (mandatory)

Every controller is `async` with `try/catch`. The `catch` block calls `next(err)` and does **nothing else**.

```js
export const getTourBySlug = async (req, res, next) => {
  try {
    const tour = await tourService.getPublishedBySlug(req.validated.params.slug);
    return sendSuccess(res, { message: 'Tour fetched', data: { tour } });
  } catch (err) {
    next(err);
  }
};
```

### Response helper

```js
export const sendSuccess = (res, { status = 200, message, data, meta }) =>
  res.status(status).json({ success: true, message, ...(data && { data }), ...(meta && { meta }) });
```

Status codes:
- `200` for reads, updates, and deletes.
- `201` for creates.
- `302` only for the gear affiliate redirect.
- Errors per the table in `/CLAUDE.md`.
- **Never 204**, because every JSON response must include `success` and `message`.

## Centralized error handling

- `AppError(statusCode, code, message, errors?)`: services throw it. Controllers never write error responses themselves.
- Order in `app.js`: routes → `notFound` (throws `ROUTE_NOT_FOUND`) → `errorHandler`. **`errorHandler` is the last `app.use`.**
- `errorHandler` normalizes errors:

  | Incoming error | Response |
  |---|---|
  | `AppError` | as thrown |
  | `ZodError` | 400 `VALIDATION_ERROR`, `errors: [{ field, message }]` |
  | Mongoose `ValidationError` / `CastError` | 400 `VALIDATION_ERROR` |
  | Mongo duplicate key `11000` | 409 — `PHONE_TAKEN` if the key is `phone`, otherwise `DUPLICATE` |
  | JWT errors (`JsonWebTokenError`, `TokenExpiredError`) | 401 `UNAUTHENTICATED`, and clear the cookie |
  | Multer `LIMIT_FILE_SIZE` | 413 `FILE_TOO_LARGE` |
  | Body parse failure (`entity.parse.failed`) or JSON body over the 100kb limit (`entity.too.large`) | 400 `VALIDATION_ERROR` |
  | Anything else | 500 `INTERNAL_ERROR` with a generic message, logged with its stack |

- In production, never leak stacks, queries, or internal messages. Include `stack` only when `NODE_ENV=development`.
- In `server.js`, `unhandledRejection` and `uncaughtException` handlers log the error and shut down gracefully.

## Validation

- The `validate({ body, query, params })` middleware parses with Zod and writes the result to `req.validated = { body, query, params }`.
- Controllers read **only** from `req.validated`. Express 5's `req.query` is read-only, and raw input is never trusted.
- Body schemas use `.strict()`, so unknown keys are rejected. This is the mass-assignment protection. Never spread `req.body` into a model, and never accept `role`, `status`, `bookingNumber`, `totalAmount`, `clickCount`, or `profileComplete` from clients.
- Use the shared `objectId`, `slug`, `phone` (`/^[6-9]\d{9}$/`), `pagination`, `dateOnly` (`YYYY-MM-DD`), and `httpsUrl` schemas from `validators/common.js`.
- `validate` checks all three sources before responding, so one 400 lists every failing field. An unknown key is reported as `{ field: '<key>', message: 'Unknown field' }`.
- Coerce query numbers with `z.coerce.number().int()` and bound them. Trim strings and give them max lengths. Search `q` must be 2–64 chars (the shared `searchTerm` schema, used by `/search`, `/tours` and `/gear`).
- Query schemas are not strict: unknown query keys are dropped. Express 5's default query parser does not build nested objects, so `?state[$ne]=x` arrives as the literal key `state[$ne]` and is dropped too.

## Data models

All models have timestamps. Every `toJSON` transform maps `_id` → `id` and strips `__v` and internal fields. Images use an `Image` subdocument: `{ url, path }`, where `path` is the Supabase object path used for deletion.

**User**
- `googleId` (unique, hidden from JSON), `email` (unique, lowercase), `name`, `avatarUrl`
- `phone` (unique, sparse)
- `role` (`user` | `admin`)
- `themePreference` (`system` | `light` | `dark`, default `system`)
- `lastLoginAt`
- Virtual `profileComplete = Boolean(name && phone)`

**Vertical**
- `key` (enum of the 6 keys, unique), `code` (TT/GS/PP/ES/UE/GI), `name`, `subtitle`, `description`
- `heroImage`, `order`
- Seeded only.

**Tour**
- `vertical` (ref), `title`, `slug` (unique)
- `state`, `destination`, `tagline`, `overview`
- `durationDays`, `difficulty` (`easy` | `moderate` | `challenging`)
- `coverImage`, `gallery[]`
- `topActivities[]`, `signatureActivity { title, description }` (required)
- `itinerary[{ day, title, description }]` (days sequential from 1)
- `inclusions[]`, `exclusions[]`
- `tiers[{ _id, name, description, pricePerPerson }]` (1–5 tiers, unique names)
- `reporting { location, address, time 'HH:mm' }`
- `startingPrice` (min tier price, kept in sync in a `pre('save')` / update hook). The `findOneAndUpdate` hook forces `runValidators` and only re-syncs when the update replaces the whole `tiers` array (top-level or `$set`), so services must write tiers that way or via `doc.save()`.
- `isPublished`
- Indexes: `{ vertical, isPublished }`, `{ state }`

**Taxonomy**
- `type` (`category` | `climate` | `tag`), `name`, `slug`
- Unique index `{ type, slug }`

**Gear**
- `name`, `slug` (unique), `shortDescription`, `description`, `images[]`
- `mrp`, `salePrice` (≤ mrp)
- `affiliateUrl` (https only)
- `category` (ref Taxonomy, type category), `climates[]`, `tags[]` (refs)
- `tours[]` (ref Tour)
- `isActive`, `clickCount`
- Indexes: `{ isActive, category }`, `{ tours }`

**Booking**
- `bookingNumber` (unique), `user`, `tour`, `vertical` (refs)
- `snapshot { tourTitle, verticalName, verticalCode, tierName, pricePerPerson, durationDays }`
- `travelers` (1–20), `startDate` (Date at 00:00 UTC representing the calendar date), `totalAmount`
- `contact { name, phone, email }` (snapshot)
- `status` (`confirmed` | `cancelled` | `completed`), `statusUpdatedAt`
- Indexes: `{ user, createdAt: -1 }`, `{ status }`, `{ vertical }`

**Counter**
- `_id` (e.g. `booking-TT-2026`), `seq`
- Incremented atomically with `findOneAndUpdate({ $inc }, { upsert: true, returnDocument: 'after' })` through `nextSequence(key)` in `services/counter.service.js`. Gaps in the sequence are acceptable.

**GearClick**
- `gear` (ref), `user` (ref, optional), `createdAt`
- No IP or user-agent stored.

**NewsletterSubscriber**
- `email` (unique, lowercase)

Query rules:
- Use `.lean()` for reads and select only the fields you need. Lean results skip `toJSON`, so pass them through `serialize()` (`utils/serialize.js`) before returning them.
- `sanitizeFilter` is on: wrap operator objects in a filter (`$in`, `$gte`, …) with `mongoose.trusted()`. `RegExp` values and top-level `$and` / `$or` need no wrapping.
- Run independent queries with `Promise.all`.
- Never return unbounded lists; paginate, max 50.

## Endpoints (`/api/v1`)

### Public / customer

| Method | Path | Middleware | Notes |
|---|---|---|---|
| GET | `/health` | — | `{ success, message: 'OK', data: { uptime } }` (uptime in seconds). Used as the Render health check |
| POST | `/auth/google` | authLimiter | Body `{ credential }`. Upserts the user, syncs the role, sets the cookie |
| GET | `/auth/me` | requireAuth | `{ user }` |
| POST | `/auth/logout` | — | Clears the cookie; succeeds even with no session |
| PATCH | `/users/me` | requireAuth | Body `{ name?, phone?, themePreference? }`, at least one field. Returns `{ user }` |
| GET | `/verticals` | — | `{ verticals }`: all 6, by `order` |
| GET | `/verticals/:key` | — | `{ vertical, tours }`: its published tour cards, newest first, at most 50. Unknown key is 404 |
| GET | `/tours` | — | `?vertical&state&difficulty&q&page&limit`, published only, newest first. `{ tours }` (cards with `vertical { id, key, name, code }`) + `meta` |
| GET | `/tours/:slug` | — | `{ tour }`: full detail with `vertical { id, key, name, code }` and tier ids, published only |
| GET | `/gear` | — | `?q&category&climate&tag&tour&vertical&sort(newest\|price_asc\|price_desc\|popular)&page&limit`, active only. `{ gear }` (cards) + `meta` |
| GET | `/gear/:id/go` | goLimiter, optionalAuth | Logs a GearClick, `$inc clickCount`, then 302 to `affiliateUrl`. Inactive or unknown gear is a 404 envelope |
| GET | `/taxonomies` | — | `?type`. `{ taxonomies }` sorted by type then name |
| GET | `/search` | searchLimiter | `?q`. Returns `{ tours: [≤5], gear: [≤5] }` |
| POST | `/bookings` | requireAuth, requireCompleteProfile, bookingLimiter | Body `{ tourId, tierId, travelers, startDate 'YYYY-MM-DD' }`. 201 `{ booking }` |
| GET | `/bookings/me` | requireAuth | `{ bookings }` + `meta`, newest first |
| GET | `/bookings/:bookingNumber` | requireAuth | `{ booking }`. Owner (or admin) only. Others get 404 |
| GET | `/bookings/:bookingNumber/ticket` | requireAuth | PDF, `Content-Disposition: attachment; filename=Adventuro-{bookingNumber}.pdf`. Owner (or admin) only |
| POST | `/newsletter` | newsletterLimiter | Body `{ email }`. Idempotent: always 200 with the same body whether new or existing (no enumeration) |

### Admin (`/admin/*`, requireAuth + requireAdmin applied once in `routes/admin/index.js`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | `?from&to` (`YYYY-MM-DD`, default last 30 days, at most 366 days). See Dashboard below |
| GET / PATCH | `/admin/verticals`, `/admin/verticals/:id` | PATCH body `{ subtitle?, description?, heroImage? }` only. No create or delete |
| GET / POST | `/admin/tours` | List includes unpublished. Filters `?vertical(key)&q&isPublished(true\|false)&page&limit` |
| GET / PATCH / DELETE | `/admin/tours/:id` | Delete returns 409 `RESOURCE_IN_USE` if bookings exist (unpublish instead). Delete removes the tour's images and pulls it from `gear.tours` |
| GET / POST | `/admin/gear` | Includes inactive. Filters `?q&category&climate&tag&tour` (all ids) `&isActive(true\|false)&sort&page&limit` |
| GET / PATCH / DELETE | `/admin/gear/:id` | Delete removes its images and GearClick docs |
| GET / POST | `/admin/taxonomies` | GET takes `?type`. POST body `{ type, name, slug? }` |
| PATCH / DELETE | `/admin/taxonomies/:id` | PATCH body `{ name?, slug? }` (type is fixed). Delete returns 409 `RESOURCE_IN_USE` if any gear references it |
| POST | `/admin/uploads` | multipart field `image`, `?folder=tours\|gear\|verticals`. 201 `{ image: { url, path } }` |
| DELETE | `/admin/uploads` | Body `{ path }`. Path must be one this API generated: `{folder}/{uuid}.{jpg\|png\|webp}` |
| GET | `/admin/bookings` | `?status&vertical(key)&tour(id)&from&to&q(bookingNumber/name/phone/email)&page&limit`. `{ bookings }` + `meta`, newest first |
| GET | `/admin/bookings/:bookingNumber` | `{ booking }`, any user's |
| PATCH | `/admin/bookings/:bookingNumber/status` | Body `{ status }`. Only `confirmed→cancelled` and `confirmed→completed`; anything else is 409 `INVALID_STATUS_TRANSITION`. Sets `statusUpdatedAt`. Returns `{ booking }` |
| GET | `/admin/users` | `?q(name/email/phone)&role&page&limit`. `{ users }` + `meta`, newest first |
| GET | `/admin/users/:id` | `{ user, bookings }`: the user and their 50 most recent bookings |
| GET | `/admin/newsletter` | `?page&limit`. `{ subscribers: [{ id, email, createdAt }] }` + `meta`, newest first |

When a tour, gear item or vertical has images removed or replaced in an update, the service deletes the orphaned Supabase objects.

### Admin content behavior

- **Bodies:** create bodies take every required model field; PATCH bodies take any subset (at least one field). Both are strict. Arrays and nested objects (`tiers`, `itinerary`, `gallery`, `reporting`, `signatureActivity`, `images`, `climates`, …) are replaced whole, never merged.
- **Never accepted from the client:** `startingPrice`, `clickCount`, timestamps, a vertical's `key` / `code` / `name` / `order`, a taxonomy's `type` on PATCH.
- **Slugs:** generated from the title/name when `slug` is not sent on create. A PATCH never regenerates the slug; it changes only when `slug` is sent. A clash is 409 `DUPLICATE`. A name that yields no slug (e.g. `!!!`) is 400 on field `slug`.
- **Images** are `{ url, path }`: `url` must be https; `path` is `null` (external image, never deleted) or a path generated by `POST /admin/uploads`. Anything else is 400, so a forged path can never reach `deleteImages`.
- **Image cleanup** runs after a successful save and is best effort: a storage failure is logged and the request still succeeds. An image that only moved (gallery reorder, cover ↔ gallery) is kept. `DELETE /admin/uploads` is for uploads that were never saved on a document.
- **Tours:** `vertical` is a vertical id and must exist (400 on field `vertical`). The rules of the model (1–5 tiers, unique tier names, sequential itinerary days, `HH:mm` reporting time, signature activity) are checked by Zod first, with the model as the backstop. Updates go through `doc.save()`, which re-syncs `startingPrice`.
- **Tier ids:** on PATCH a tier sent with the `id` of an existing tier keeps that id; any other tier (no id, unknown id, repeated id) gets a new one. Create rejects tier ids.
- **Gear:** `category`, `climates[]`, `tags[]` and `tours[]` are ids. Each taxonomy id must exist with the type its field expects, and each tour must exist (published or not); otherwise 400 naming the field. Repeated ids are stored once. `salePrice ≤ mrp` is checked against the stored value when a PATCH sends only one of the two.
- **Taxonomies:** names are unique per type, ignoring case (409 `DUPLICATE`); the same name in another type is fine.
- **Responses:** tour detail is the full document with `vertical { id, key, name, code }`. Gear detail has `category` / `climates[]` / `tags[]` as `{ id, type, name, slug }` and `tours[]` as `{ id, title, slug }`. Lists return a slimmer projection (tour list: card fields + `isPublished`, `vertical`, timestamps; gear list: `name, slug, images, mrp, salePrice, category, isActive, clickCount`, timestamps).
- **Uploads:** an oversized file is 413 `FILE_TOO_LARGE`; a missing file or a type other than jpeg/png/webp is 400 `INVALID_FILE`; a bad `folder`, a wrong field name or a broken multipart body is 400 `VALIDATION_ERROR`. A storage failure on upload is 500 `INTERNAL_ERROR`.
- Unknown `/admin/*` paths answer 401/403 to non-admins and 404 `ROUTE_NOT_FOUND` to admins.

### Admin ops behavior

- **Admin booking object:** the booking object from "Booking behavior" plus `user` (the id of the user who booked). Used by the bookings list, booking detail, the status update and the dashboard's `recentBookings`. The bookings inside `GET /admin/users/:id` are the plain booking object.
- **Bookings list filters:** `vertical` is a vertical key (an unknown key gives an empty page), `tour` is a tour id, `status` is one of the three statuses. `from` / `to` are `YYYY-MM-DD` IST calendar days on which the booking was **made** (`createdAt`), both inclusive; either can be sent alone, and `from` after `to` is 400.
- **Search:** `q` (2–64 chars) is an escaped, case-insensitive substring match — bookings on `bookingNumber`, `contact.name`, `contact.phone`, `contact.email`; users on `name`, `email`, `phone`.
- **Status update:** the body accepts any of the three statuses; the transition table (`BOOKING_STATUS_TRANSITIONS`) decides. A change to the same status is also 409. The write is conditional on the status that was read, so two concurrent updates cannot both succeed.
- **Admin user object:** `id, email, name, avatarUrl, phone, role, themePreference, lastLoginAt, createdAt, profileComplete`. `phone` is absent until the user sets one. `googleId` is never returned.
- Roles are read-only here; they come from `ADMIN_EMAILS` at sign-in.

### Public catalog behavior

- **Tour card:** `id, title, slug, state, destination, tagline, durationDays, difficulty, coverImage, topActivities, startingPrice`.
- **Gear card:** `id, name, slug, shortDescription, images, mrp, salePrice`, plus `category`, `climates[]`, `tags[]` populated as `{ id, name, slug }`. `affiliateUrl`, `clickCount`, `tours` and `description` are never in public responses; the only way to the affiliate URL is `/gear/:id/go`.
- **Filters:** `vertical` takes a vertical key; `category` / `climate` / `tag` take a taxonomy slug of that type; `tour` takes a tour slug. A filter value that matches nothing (unknown key or slug, a slug of another taxonomy type, an unpublished tour) gives an empty page with 200, not a 404.
- `/tours?state` is a case-insensitive exact match. `q` is a case-insensitive substring match on tour `title` / `state` / `destination` or gear `name`.
- `/gear?vertical` resolves to that vertical's published tour ids and matches gear linked to any of them.
- **Sorts:** `newest` (default) = `createdAt` desc, `price_asc` / `price_desc` = `salePrice`, `popular` = `clickCount` desc.
- The affiliate click does not bump the gear's `updatedAt`.

### Booking behavior

- **Booking object** (the same shape from all three JSON endpoints): `id, bookingNumber, status, statusUpdatedAt, travelers, startDate, totalAmount, createdAt`, `snapshot { tourTitle, verticalName, verticalCode, tierName, pricePerPerson, durationDays }`, `contact { name, phone, email }`, `tour { id, slug }`, `vertical { id, key, name, code }`, `reporting { location, address, time }`.
- `startDate` is returned as the `YYYY-MM-DD` string it was booked with, not as a timestamp.
- `reporting` is read from the tour on every request. `snapshot`, `contact` and `totalAmount` never change after creation. If the tour document no longer exists, `tour` and `reporting` are `null`.
- `:bookingNumber` must match `ADV-{code}-{yyyy}-{6+ digits}` exactly, otherwise 400 `VALIDATION_ERROR`.
- An unknown tour id, an unpublished tour, and a tier id that is not on the tour all answer 409 `TOUR_UNAVAILABLE` with the same body.
- A start date outside the window is 400 `VALIDATION_ERROR` with `errors: [{ field: 'startDate', … }]`. A failed booking never consumes a sequence number.
- The year in the booking number is the IST year at the moment of booking (not the start date's year).
- `bookingLimiter` sits after `requireAuth`, so it counts every `POST /bookings` attempt per user, including ones that fail validation.
- A ticket can be downloaded in any status; the status is printed on it.

## Key business logic

**Sign-in (`auth.service`)**
1. Verify the token with `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })` and require `email_verified`.
2. Upsert by `googleId`. On first sign-in, set name and avatar from Google; later sign-ins never overwrite them.
3. Set `email` (lowercased) and `role` from `ADMIN_EMAILS` on **every** sign-in.
4. Update `lastLoginAt`.

Any verification failure (bad token, wrong audience, unverified email, Google unreachable) is 401 `INVALID_GOOGLE_TOKEN`. `google-auth-library` error messages can contain the raw token, so they are never logged or returned.

**Booking create (`booking.service`)**
1. Load the tour, which must be published, along with its vertical.
2. Find the tier by id. If either the tour or tier is missing or unavailable, return `TOUR_UNAVAILABLE`.
3. Validate that `startDate` is between tomorrow and 365 days ahead, both in Asia/Kolkata.
4. Compute `totalAmount = pricePerPerson × travelers`.
5. Get the next counter value for `booking-{code}-{year}` and format the booking number as `ADV-{code}-{year}-{seq padded to 6}`.
6. Create the booking with the tour/tier snapshot and the contact snapshot from the user.

**Ticket (`ticket.service`, pdfkit)**
- Contents: booking number, status, tour, vertical, tier, travelers, start date, duration, reporting time, location and address (read live from the tour), total with the per-person breakdown, contact, issued-at (the booking's creation time in IST).
- Do the ownership check **before** streaming starts, so errors are still JSON. `createTicketDocument(booking)` takes the booking object described above and returns a finished PDFKit document; the controller sets the headers and pipes it.
- One A4 page, neutral greyscale. Every free-text field is clipped to a fixed number of lines with an ellipsis, which is what guarantees a single page; keep that when adding fields.
- The standard PDF fonts have no `₹` glyph, so Noto Sans from `src/assets/fonts/` is embedded (subsetted by PDFKit). It covers Latin, Greek and Cyrillic only; text in other scripts (e.g. a Devanagari name) will not render.

**Dashboard**

`GET /admin/dashboard?from&to`. Both are `YYYY-MM-DD` IST calendar days, inclusive. A missing `to` is today (IST); a missing `from` is 29 days before `to`, so the default is the last 30 days. `from` after `to`, or a range longer than 366 days, is 400 `VALIDATION_ERROR`.

Everything is scoped to the range by `createdAt`, except the two all-time totals. "Value" always means `totalAmount` summed over **confirmed and completed** bookings; cancelled bookings count as bookings but add no value.

`data`:

| Key | Shape |
|---|---|
| `range` | `{ from, to, days }` — the resolved range |
| `totals` | `{ users, newUsers, bookings, bookingValue, newsletterSubscribers }`. `users` and `newsletterSubscribers` are all-time; the rest are for the range |
| `newUsersPerDay` | `[{ date, count }]`, one entry per day of the range, zero-filled |
| `bookingsPerDay` | `[{ date, bookings, value }]`, one entry per day, zero-filled |
| `bookingsByStatus` | `{ confirmed, cancelled, completed }` |
| `bookingsByVertical` | `[{ vertical: { id, key, name, code }, bookings, value }]`, every vertical in `order`, zero-filled |
| `topTours` | Up to 5 `{ tourId, title, bookings, value }`, by bookings, then value. `title` is the snapshot from the tour's latest booking in the range |
| `topGear` | Up to 5 `{ gearId, name, slug, clicks }`, by affiliate clicks in the range |
| `recentBookings` | Up to 10 admin booking objects from the range, newest first |

Days are bucketed in `Asia/Kolkata` (`$dateToString` with `timezone`), so a booking made at 23:30 IST belongs to that IST day. The independent pipelines and counts run in one `Promise.all` (`services/admin/dashboard.service.js`).

**Search**
- Escape user input with `escapeRegex`, then use a case-insensitive regex on tour `title`/`state`/`destination` and gear `name`.
- Published or active items only, limit 5 each.

## Security checklist (all mandatory)

**HTTP layer**
- `helmet()`.
- `app.set('trust proxy', 1)` (Render).
- `express.json({ limit: '100kb' })`.
- `cors({ origin: CORS_ORIGINS allowlist, credentials: true })`.

**Database**
- Set `mongoose.set('sanitizeFilter', true)` and `mongoose.set('strictQuery', true)`.
- Combined with strict Zod schemas, this blocks NoSQL operator injection.

**Session**
- The JWT is HS256 with `algorithms: ['HS256']` passed explicitly to `verify`, payload `{ sub }`, expiring per `JWT_EXPIRES_IN`.
- The cookie is `adv_session`: `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/'`, `maxAge` matching the JWT.
- `requireAuth` **loads the user from the DB on every request**, so role changes and deletions take effect immediately. `req.user` is a hydrated Mongoose document (`req.user.id`, `req.user.profileComplete`).
- `optionalAuth` sets `req.user` for a valid session and otherwise continues as a guest; it never errors and never clears the cookie.
- `sameSite: 'lax'` on a first-party cookie (via the Vercel rewrites) is the CSRF defense. Never move the token to `localStorage` or response bodies.

**Authorization and trust**
- Customer booking lookups query `{ bookingNumber, user: req.user.id }` and return 404 (not 403) for other users' bookings, to prevent enumeration.
- Admin routes are guarded at the router level, never per handler.
- Never trust the client for price, total, role, status, booking number, or click counts.

**Inputs and redirects**
- `escapeRegex` all user search input and cap its length.
- The affiliate URL must be https (validated with `z.url()` plus a protocol check). The redirect target always comes from the DB by id, never from a query parameter, so there is no open redirect.

**Uploads**
- Multer memory storage, 5 MB limit, single file.
- Verify the real type with `file-type`: jpeg, png, or webp only.
- Store under `{folder}/{randomUUID()}.{ext}` (extension from the sniffed type) and never use the original filename or client MIME type.
- Image paths in request bodies must match `IMAGE_PATH_REGEX`, so no client-chosen path is ever deleted from storage.
- The bucket itself is public-read with a 5 MB limit and jpeg/png/webp only. The service-role key lives only in `config/supabase.js`.
- Uploads are admin only.

**Rate limits** (all return the standard `RATE_LIMITED` envelope)

| Limiter | Limit |
|---|---|
| global | 300 / 15 min / IP |
| auth | 20 / 15 min |
| booking | 10 / hour / user |
| newsletter | 5 / hour |
| search | 60 / min |
| go | 60 / min |

**Logging**
- Use pino with redaction of `req.headers.cookie`, `authorization`, `credential`, and `*.phone`.
- Request logs carry the path only, never the query string (`serializeRequest` in `config/logger.js`): an admin search term can be a customer's phone number or email.
- Never log tokens, keys, or full user objects.

**Dependencies**
- `npm audit` must report **0 vulnerabilities**.
- Fix by upgrading. Never use `npm audit fix --force` blindly, and if something can't be fixed cleanly, stop and report it.

## Modern code standards

- ES2023+ throughout: `import` / `export`, `async` / `await` (no `.then` chains), `const` by default, destructuring, optional chaining, nullish coalescing, template literals, arrow functions for non-method functions, spread over `Object.assign`.
- Use `structuredClone` and `crypto.randomUUID`, and `Number.parseInt(x, 10)`.
- Top-level `await` only in `server.js` and `scripts/`.
- Use the `logger` (pino) instead of `console`.
- Constants come from `config/constants.js`. No magic strings or numbers for statuses, roles, verticals, or limits.
- ESLint flat config: `no-unused-vars` and `no-console` are errors, plus `prefer-const`, `eqeqeq`, `no-var`, `object-shorthand`. Prettier handles formatting.

## Seed (`npm run seed`)

Idempotent upserts:
- The 6 verticals (key, code, name, subtitle, description from the founder vision).
- Starter taxonomies:
  - categories: Backpacks, Shoes, Camping, Water Gear, Winter Gear, Accessories, Travel Kits, Caps
  - climates: Tropical/Beach, Desert/Dust, High Altitude/Snow, Luxury/Resort, Urban/Transit

Re-running is safe on a live DB: vertical `code`/`name`/`order` are re-synced, but `subtitle`, `description`, and taxonomy names are written only on first insert, so admin edits are never overwritten. `scripts/seed.js` exports `runSeed()` for tests and other scripts.

No admin user is seeded; admin access comes from `ADMIN_EMAILS`.

## Demo seed (`npm run seed:demo`)

Demo content for development and E2E tests. It throws if `NODE_ENV=production`. It runs the base seed first, then adds:
- **17 tours:** 2–3 published per vertical (among them Goa Coastal Escape, 4 days / easy / from ₹14,999, and Andaman & Nicobar Island Odyssey, 6 days / moderate / from ₹28,999) and 1 unpublished (`spiti-valley-winter-expedition`). Every tour has the tiers Essential / Explorer / VIP Palace at 1× / 1.25× / 1.7× of its base price.
- **23 gear items** across all 8 categories and 5 climates, each linked to the tours it suits; 1 is inactive (`treklite-carbon-trekking-poles`).
- **5 tags** (Waterproof, Lightweight, UV Protection, Quick Dry, Travel Friendly) and a hero image for any vertical that has none.

Images are `{ url: https://picsum.photos/seed/<slug>/1200/800, path: null }`; affiliate URLs are `https://example.com/<slug>`.

Idempotent by slug: a tour or gear item whose slug already exists is left untouched (admin edits survive), and only missing ones are created. The content lives in `scripts/demo/`; `scripts/seed-demo.js` exports `runDemoSeed()`.

## Testing

- Use Vitest + Supertest against `app.js`, with mongodb-memory-server providing a fresh DB per test file and collections cleared between tests.
- Mock **external services only**:
  - `google-auth-library` verification, via `vi.mock('google-auth-library')` with a stub `OAuth2Client.verifyIdToken` (see `tests/auth.test.js`)
  - the Supabase storage client (`config/supabase.js`), via `tests/helpers/supabaseMock.js` (`bucket` spies, `resetBucket()`, `storedImage(folder)`, `removedPaths()`); the `vi.mock` line to copy is at the top of that file

  Never mock Mongoose.
- `helpers/authAgent(user, app?)` signs a JWT directly and returns a Supertest agent with the cookie set.
- `authLimiter` allows 20 requests per test file, so keep `POST /auth/google` calls in one file under that; the limit itself is tested in `tests/auth.limiter.test.js`.
- To stay under a per-IP limiter in a test file, send a distinct `X-Forwarded-For` per request (the app trusts one proxy hop); see `tests/newsletter.test.js`.
- Every route group must test:
  - happy path, with exact status and envelope shape
  - validation failure (400 + `VALIDATION_ERROR`)
  - unauthenticated (401) and non-admin on admin routes (403)
  - not found (404)
  - ownership / IDOR (another user's booking → 404)
  - booking price computed server-side (a client-sent total is rejected)
  - booking number format and per-vertical sequence
  - status transitions, delete-blocked conflicts (409)
  - upload type and size rejection
  - the error-handler mapping (duplicate key, CastError, malformed JSON)
- Coverage threshold: **80% lines and branches** on `src/`, excluding `server.js` and `config/db.js`.
- `tests/contract.test.js` walks the mounted router stack and sends an unknown key to every POST/PATCH route. A new body route is picked up automatically; a new top-level mount path or URL parameter name must be added to the lists at the top of that file (the test fails until it is).

### E2E harness (`npm run e2e:server`)

`scripts/e2e-server.js` is what the frontends run their Playwright suites against. It is development only (it throws if `NODE_ENV=production`) and nothing in `src/` imports it.

1. Starts an in-memory MongoDB (mongodb-memory-server). `MONGODB_URI` is ignored, so the real database is never touched.
2. Runs the seed and the demo seed against it.
3. Creates three users, plus activity for the dashboard and lists: 3 confirmed bookings for the customer (`ADV-TT-…-000001`, `ADV-GS-…-000001`, `ADV-PP-…-000001`), 6 affiliate clicks across 3 gear items, and 2 newsletter subscribers.
4. Signs a session JWT for each user with `JWT_SECRET` and writes `/e2e/.auth.json` at the repo root (gitignored):
   ```json
   { "customer": "<jwt>", "incompleteCustomer": "<jwt>", "admin": "<jwt>" }
   ```
   Each value is the value of the `adv_session` cookie. `customer` has a complete profile, `incompleteCustomer` has a name but no phone, `admin` has the admin role (set directly on the user; `ADMIN_EMAILS` is not involved).
5. Serves the real app on port **5000**.

Nothing is mocked: every other env var is read from `.env` as usual, and Supabase is real, so uploads made during E2E runs land in the dev bucket and the suite must delete what it creates. All data is lost when the process stops; restart it for a clean state.

Flags, used by `tests/e2e-server.test.js`: `--port=<n>` and `--auth-file=<path>`.

The rate limiters are live in the harness. A suite that would pass 300 requests in 15 minutes from one address should send a distinct `X-Forwarded-For` per test or worker, as the backend tests do.

## Definition of done

1. `npm run lint` is clean, with no warnings left behind.
2. `npm test` passes and coverage meets the threshold.
3. `npm audit` reports 0 vulnerabilities.
4. There is no dead code, no unused dependencies in `package.json`, and no `console.*`. `npx knip` reports nothing.
5. Every new endpoint follows routes → validator → controller (try/catch → `next(err)`) → service, and responds with `{ success, message, … }`.
6. `.env.example` and this file are updated if env vars or endpoints changed.
