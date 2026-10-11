# Adventuro

> From Coast to Camp, Peak to Palace.

Adventuro is a travel-experience and adventure-gear web app built for a client. It is in the **prototype phase**. Customers discover curated tours across six travel verticals, book a tour (no payment yet), receive a ticket, and find gear for each trip. Gear is bought through affiliate links. A separate admin app controls all content and shows business metrics.

---

## Repo layout

```
/
├── CLAUDE.md      ← this file: product, scope, UI flow, shared contracts
├── PRODUCT.md     ← audience, positioning, brand commitments
├── DESIGN.md      ← design system: colour, type, components, per-vertical themes
├── design/        ← theme.css (token source of truth), tailwind-tokens.md, reference sketch
├── backend/       ← Express + MongoDB REST API          → backend/CLAUDE.md
├── frontend/      ← customer-facing React app           → frontend/CLAUDE.md
└── admin/         ← admin React app (dashboard + panel) → admin/CLAUDE.md
```

- These are three independent npm projects with no shared package. The **Shared contracts** section below is the single source of truth between them.
- If you change a contract, update this file **and** every app that uses it in the same change.
- Before working inside a folder, read that folder's CLAUDE.md. Folder rules add to this file. They never override **Scope** or **Shared contracts**.

## Tech stack

| Layer | Choice |
|---|---|
| Database | MongoDB (Atlas) + Mongoose |
| API | Node.js 24.x (LTS), Express 5, ES modules only |
| Frontends | React + Vite, React Router, TanStack Query, Tailwind CSS v4 |
| Auth | Google Sign-In only (Google Identity Services → backend-issued httpOnly cookie) |
| Images | Supabase Storage (public bucket, uploads go through the backend only) |
| Deploy | `frontend` + `admin` → Vercel; `backend` → Render. Each Vercel app rewrites `/api/*` to the backend, so the auth cookie is first-party. |

---

## Product

### Verticals (fixed set)

| key | Name | Code | What it covers |
|---|---|---|---|
| `tidetrail` | TideTrail | TT | Beaches • Islands • Coastal escapes (Goa, Gokarna, Andaman, Lakshadweep) |
| `goldensaga` | GoldenSaga | GS | Deserts • Culture • Royal heritage (Jaisalmer, Rajasthan, Pushkar) |
| `peakpulse` | PeakPulse | PP | Mountains • Treks • Adventure (Manali, Kasol, Uttarakhand, Ladakh) |
| `elitescape` | EliteScape | ES | Luxury • Comfort • Exclusive escapes |
| `urbanecho` | UrbanEcho | UE | Cities • Culture • Food • Nightlife (Mumbai, Delhi, Jaipur, Bengaluru) |
| `grand-india-tour` | Grand India Tour | GI | Flagship circuit showcasing India's diversity |

- Verticals are **seeded**. They are never created or deleted through the API. Admins edit their content only.
- **Grand India Tour is a separate vertical with its own tours.** It is not an aggregation of the other five. For now it works exactly like the others.
- Brand rule: every tour has at least one **signature activity**, because the brand line is "travel should be experienced, not simply visited." Examples: parasailing in Goa, an ATV ride in the desert.

### Core entities

- **User**: Google account, name, phone, theme preference. Role is `user` or `admin`.
- **Vertical**: has many **Tours**.
- **Tour**: overview, day-wise itinerary, inclusions and exclusions, package **tiers** (e.g. Essential / Explorer / VIP Palace), reporting location and time. Linked many-to-many with **Gear**.
- **Gear**: an affiliate product. It has a category, climates, and tags (all **Taxonomy** items), linked tours, an affiliate URL, MRP, and a sale price.
- **Taxonomy**: admin-managed lists of type `category`, `climate`, or `tag`.
- **Booking**: user + tour + tier + travelers + start date. Produces a booking number and a ticket.
- **GearClick**: log of affiliate clicks.
- **NewsletterSubscriber**: footer email capture.

### Business rules

- **No payment gateway.** "Confirm booking" immediately creates a Booking with status `confirmed`.
- The price is always computed **server-side** as `tier.pricePerPerson × travelers`. Tier name and price are **snapshotted** on the booking.
- Reporting location and reporting time are set **per tour** by the admin. They are read **live** from the tour, so admin edits reach existing tickets.
- Start date can be any date from **tomorrow (Asia/Kolkata)** up to **365 days ahead**. There are no capacity limits or departure batches.
- Booking number format: `ADV-{verticalCode}-{year}-{6-digit sequence}`, e.g. `ADV-TT-2026-000123`. The sequence is per vertical per year.
- Booking status: `confirmed → cancelled` or `confirmed → completed`. Only an admin can change status. Users cannot cancel in-app.
- Gear is **never** part of a booking total. Every "Buy" goes through `GET /api/v1/gear/:id/go`, which logs a click and redirects (302) to the affiliate URL.
- All prices are INR, stored as **whole-rupee integers**.
- Booking requires a **complete profile** (name + phone).
- Phone: Indian mobile number, 10 digits starting with 6–9, stored without `+91`, unique per user.
- An admin is any user whose email is in the `ADMIN_EMAILS` env var. The role is re-synced on every sign-in.
- Theme preference: `system | light | dark`, default `system`. It is stored on the User document. Guests fall back to localStorage.

---

## Scope

### In scope
- The 6 verticals: vertical pages, tour listing, tour detail
- Booking flow, ticket page, and ticket PDF download
- **Gear Phase 1 only**: curated affiliate products, suggestions under verticals and tours, and a gear store with search and filters
- Google sign-in, onboarding (name + phone), profile, My Bookings, theme preference
- Global search across tours and gear
- Newsletter email capture
- Static pages: About (Our Story), Privacy & Terms, Cancellation & Refund policy, Affiliate disclosure
- Admin app: dashboard, content management (verticals, tours, gear, taxonomies, images), bookings, users, newsletter list

### Out of scope — do not build, scaffold, or leave TODO stubs for these
- Payments (Razorpay or any other gateway)
- Gear Phase 2–4: Adventuro merchandise, own products, manufacturing. No "Adventuro Brand" badges or filters.
- Physical outlets (vision §7)
- Customer-journey features from vision §8, the Memory Book (§9), creator adventures (§10)
- Blog, community stories, emergency hotline
- OTP or phone verification, email/password auth, email or SMS notifications
- Seat capacity, departure batches, user-initiated cancellation, refunds
- Global (non-India) destinations. The data model must not block them, but build no UI for them.

If a task seems to need anything on this list, **stop and ask**.

---

## UI flow (structure and behavior only)

This section covers structure and behavior. The visual design is decided:

- Design rules live in `/DESIGN.md`. Product context (audience, brand commitments) lives in `/PRODUCT.md`.
- Theme tokens come from `/design/theme.css`. Each app copies it to `src/styles/theme.css` at scaffold and maps it into Tailwind as described in `/design/tailwind-tokens.md`.
- All styling is Tailwind classes driven by those CSS variables. Never hardcode a colour, font, radius, or shadow in a component.
- To change a token, edit `/design/theme.css`, copy it to both apps again, and update `/DESIGN.md` in the same change.

### Navbar (customer app, every page)
1. **Adventuro logo**. Click goes home. Hover opens a menu listing the **6 verticals**. The same menu must also open on keyboard focus/Enter and on tap (touch). Escape closes it.
2. **Gear Store** and **About Us** links. On narrow screens they move into the logo menu.
3. **Search** icon → search overlay with grouped results for tours and gear.
4. **Theme toggle**: one button that flips between light and dark. A visitor starts on `system`; the account page can set System / Light / Dark.
5. **Account**:
   - Signed in: avatar opens a menu with name, email, phone, user ID, My Bookings, Profile, Sign out.
   - Signed out: Sign in / Sign up button.

### Home page (`/`), top to bottom
1. **Hero**: "ADVENTURO", the tagline "From Coast to Camp • Peak to Palace", the line "One India. Infinite Adventures.", stat chips (5 verticals, 28+ states, 100% curated, memories), and two CTAs: **Book Now** (scrolls to Choose Your Adventure) and **Explore Gear Store**.
2. **Choose Your Adventure**: one card per vertical (icon, name, one-liner, Explore →).
3. **Grand India Tour feature**: signature-experience banner with highlight chips and a **View Itinerary** button.
4. **Gear For Every Terrain**: gear category cards that link to the gear store pre-filtered.
5. **Footer**: logo, tagline, short description, newsletter subscribe, list of verticals, navigation links, support & safety links (static pages), contact and social links.

### Vertical page (`/v/:verticalKey`)
1. **Hero**: "Ecosystem Vertical" badge, name, subtitle, description.
2. **Curated Expeditions**: tour cards with cover image, duration/difficulty badge, state, title, tagline, top activities, starting price, and **Explore** and **Book** buttons.
3. **Suggested gear for this vertical**: category filter chips and gear cards with **Buy**.

### Tour detail (`/tours/:slug`)
Hero/gallery → overview → signature activity → day-wise itinerary → inclusions / exclusions → reporting info → package tiers with the booking panel → suggested gear for this tour.

### Booking (modal from **Book**, or the panel on the tour page)
1. Select tier → travelers stepper → start date → live total.
2. Recommended gear is shown as links only and is not added to the total.
3. **Confirm Booking**.

If the user is signed out, send them to sign in, then onboarding if their profile is incomplete, then back to the booking with their selections kept. On success, go to the ticket page.

### Ticket (`/bookings/:bookingNumber`)
Booking number, status, tour, vertical, tier, travelers, start date, **reporting time and location**, total, traveler contact, and **Download PDF**.

### Gear store (`/gear`)
Search, category chips, climate chips, tag filter, sort, paginated grid, and an affiliate disclosure note. **Buy** opens the affiliate redirect in a new tab.

### Account and auth pages
- `/signin`: Google button.
- `/onboarding`: name (prefilled from Google) and phone. This is mandatory after the first sign-in, before booking or any account page.
- `/account`: view and edit profile and theme.
- `/account/bookings`: the user's bookings.

### Other pages
- `/about` (Our Story)
- Static policy pages
- 404 page

The admin app's flow is described in `admin/CLAUDE.md`.

---

## Shared contracts

### API envelope
- Base path is `/api/v1`. Everything is JSON, except the admin image upload (multipart) and the ticket PDF (`application/pdf`).
- Success response:
  ```json
  { "success": true, "message": "Tours fetched", "data": { }, "meta": { } }
  ```
  `data` and `meta` are optional.
- Error response:
  ```json
  { "success": false, "message": "…", "code": "PHONE_TAKEN", "errors": [{ "field": "phone", "message": "…" }] }
  ```
  `errors` appears only on validation errors.
- `success` and `message` are present in **every** JSON response. Never use 204.
- Pagination uses `?page=1&limit=12` (max limit 50) and returns `meta: { page, limit, total, totalPages }`.
- **Frontends never display the server `message` or `errors[].message` verbatim.** They map `code` (and the field name) to human-readable text.

### Error codes

| code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body, query, or params failed validation, or the JSON was malformed |
| `INVALID_FILE` | 400 | Upload type not allowed |
| `INVALID_GOOGLE_TOKEN` | 401 | Google credential was rejected |
| `UNAUTHENTICATED` | 401 | No session, or the session is invalid or expired |
| `FORBIDDEN` | 403 | Authenticated but not allowed (e.g. a non-admin calling `/admin`) |
| `PROFILE_INCOMPLETE` | 403 | Name or phone missing for an action that needs them |
| `NOT_FOUND` | 404 | Resource doesn't exist or isn't visible to this user |
| `ROUTE_NOT_FOUND` | 404 | Unknown endpoint |
| `PHONE_TAKEN` | 409 | Phone number already belongs to another user |
| `DUPLICATE` | 409 | Another unique field clashes (slug, taxonomy name, …) |
| `RESOURCE_IN_USE` | 409 | Delete blocked because other records depend on it |
| `INVALID_STATUS_TRANSITION` | 409 | Booking status change not allowed |
| `TOUR_UNAVAILABLE` | 409 | Tour is unpublished, or the tier no longer exists |
| `FILE_TOO_LARGE` | 413 | Upload exceeds the size limit |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Anything unexpected |

To add a code: add it here first, then in the backend, then in **both** frontends' error-message maps.

### Auth flow
1. The frontend renders the Google Identity Services button and receives an ID token (`credential`).
2. `POST /api/v1/auth/google { credential }`. The backend verifies the token (audience = `GOOGLE_CLIENT_ID`, `email_verified` must be true), upserts the user, syncs the role from `ADMIN_EMAILS`, sets an httpOnly cookie, and returns `{ user }`. The user object includes `profileComplete`.
3. The cookie is sent with every request (same-origin through the proxy). `GET /api/v1/auth/me` restores the session.
4. `POST /api/v1/auth/logout` clears the cookie.
5. The admin app uses the same endpoints. It blocks non-admins in the UI, and the backend enforces the role on every `/admin` route.

---

## Working agreements (for Claude Code)

- Plan before making multi-file changes, and keep each change scoped to its task.
- Ask before adding a dependency. Use only maintained packages at their **latest stable** version (check with `npm view <pkg>`). Never use deprecated packages.
- ES modules everywhere: `import` / `export` only, never `require` or `module.exports`.
- **No dead code**: no commented-out code, unused imports, exports, files, or dependencies, no placeholder stubs, and no stray `console.log`.
- No secrets in code or git. `.env` is gitignored, and `.env.example` is kept up to date.
- Before calling work done in a folder, follow that folder's "Definition of done".
- When a decision changes, update the relevant CLAUDE.md in the same change.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).
