# Admin — Adventuro admin app

Read `/CLAUDE.md` first. It holds the product rules, the API envelope, the error codes, and the auth flow. This is a **separate app** from `frontend/`. It shares no code with it, but follows the **same conventions**, restated here so this folder stands on its own.

Visual design is decided. Read `/DESIGN.md`, especially its **Admin app** section: same tokens as the customer app, but calmer and denser, with neutral grounds only.

- Tokens come from `/design/theme.css`, copied unchanged to `src/styles/theme.css` at scaffold. Never edit the copy; change `/design/theme.css` and copy it again.
- `src/styles/index.css` maps the tokens into Tailwind v4 exactly as `/design/tailwind-tokens.md` describes.
- All colors, fonts, radii, and shadows come from those tokens. Never hardcode them.
- No vertical fields, patterns, or terrain line here. A vertical shows as a small chip in its ink plus its name.

## Stack

- React + Vite, JavaScript (ES modules, `.jsx`), React Router (latest), TanStack Query
- `react-hook-form` + `zod` + `@hookform/resolvers`, Tailwind CSS v4, `lucide-react`, `sonner`
- `recharts` for dashboard charts
- Google Identity Services, loaded directly, same as the customer app
- Dev tools: Vitest (+ `@vitest/coverage-v8`), React Testing Library, MSW, jsdom, Playwright (`@playwright/test`, Chromium) with `@axe-core/playwright`, ESLint (flat config + react-hooks), Prettier

Install everything at its latest stable version. `react-hook-form` and `@hookform/resolvers` are not installed yet: nothing uses them until the editors of session 13, which adds them.

## Scripts

`dev` (port 5174), `build`, `preview` (port 4174), `lint`, `format`, `test`, `test:watch`, `test:coverage`, `e2e` (Playwright, see Testing).

**Environment and deploy**
- Env vars: `VITE_API_BASE_URL` (default `/api/v1`), `VITE_GOOGLE_CLIENT_ID`.
- In dev and in `vite preview`, Vite proxies `/api` to `http://localhost:5000`.
- `http://localhost:5174` must be an authorised JavaScript origin of the Google client ID.
- The backend host in `vercel.json` is the placeholder `adventuro-backend.example.com`; replace it before deploying.
- On Vercel, `vercel.json` rewrites `/api/*` to the backend and sends `X-Robots-Tag: noindex`. `index.html` also has `<meta name="robots" content="noindex">`.

## Folder structure

Items marked (13) or (14) are built in that session and do not exist yet.

```
admin/src/
├── main.jsx, App.jsx, router.jsx   # /login is outside the guard; RequireAdmin → AdminLayout → pages
├── styles/ (index.css, theme.css — theme.css is a copy of /design/theme.css)
├── api/
│   ├── client.js (JSON; a FormData body goes as it is), ApiError.js (+ forbiddenError), queryKeys.js
│   └── auth.api.js (also updateMe, for the theme), dashboard.api.js, verticals.api.js, tours.api.js,
│       gear.api.js, taxonomies.api.js, uploads.api.js, bookings.api.js, users.api.js, newsletter.api.js
├── hooks/
│   ├── queries/ (useMe, useDashboard), mutations/ (useGoogleSignIn, useSignOut, useUpdateProfile)
│   ├── useAdminSession.js      # the session as this app sees it: loading | error | signedOut | admin
│   └── useUrlFilters.js, useDebounce.js, useTheme.js, useUnsavedChanges.js (13)
├── components/
│   ├── ui/          # Button, IconButton (button or link), Input, Textarea, Select, MultiSelect, Field,
│   │                # Checkbox, Switch, Segmented, Badge, VerticalChip, Card, Avatar,
│   │                # Modal (center | left), ConfirmDialog, Tabs, Skeleton, SkeletonText, Spinner,
│   │                # EmptyState, ErrorState, InlineError, Pagination
│   ├── layout/      # AdminLayout, Sidebar (column from 1024px, drawer below), SidebarNav, Topbar,
│   │                # PageHeader (h1 + document title), ThemeSwitcher, Wordmark, AppToaster, RouteFallback
│   ├── data/        # DataTable, FilterBar (+ FILTER_TYPE), SearchField, StatCard, ChartCard,
│   │                # TrendChart, CategoryChart, ChartTooltip, chartStyle.js
│   ├── dashboard/   # DateRangePicker, DashboardStats, DailyCharts, BreakdownCharts, DashboardTables,
│   │                # DashboardSection, DashboardSkeleton
│   ├── forms/       # (13) ImageUploader, ImageGallery, StringListEditor (inclusions/activities),
│   │                # ItineraryEditor, TierEditor, TaxonomySelect, TourMultiSelect, PriceInputs
│   ├── auth/        # GoogleSignInButton, RequireAdmin, SessionBoundary
│   ├── ThemeProvider.jsx, SessionThemeProvider.jsx, ThemeSync.jsx
│   └── QueryBoundary.jsx
├── pages/
│   ├── LoginPage.jsx, DashboardPage.jsx, NotFoundPage.jsx
│   ├── (13) VerticalsPage, VerticalEditPage
│   ├── (13) ToursPage, TourEditPage             # /tours/new and /tours/:id share TourEditPage
│   ├── (13) GearPage, GearEditPage              # /gear/new and /gear/:id share GearEditPage
│   ├── (13) TaxonomiesPage
│   └── (14) BookingsPage, BookingDetailPage, UsersPage, UserDetailPage, NewsletterPage
├── lib/ (errors.js, format.js, constants.js, schemas.js, storage.js, dashboardRange.js,
│        queryClient.js, googleIdentity.js, cn.js, csv.js (14))
└── test/ (setup.js, server.js, render.jsx, matchMedia.js, googleIdentity.js, fixtures.js)

admin/e2e/           # Playwright specs + fixtures.js; screenshots/ is gitignored
```

**Adding a section** (sessions 13 and 14): add its routes inside `AdminLayout` in `router.jsx`, and its entry to `NAV_SECTIONS` in `lib/constants.js`. The sidebar lists only what is in `NAV_SECTIONS`.

## Shared pieces and how to use them

- **DataTable**: `columns` are `{ key, header, render?, align?: 'right', className? }`. `rowActions(row)` returns `{ key, label, icon, onSelect? | to?, variant? }`, and each `label` names its row ("Edit Goa Escape"). `pagination` is the list's `meta` plus `onPageChange`. `loading` draws placeholder rows and an empty list draws `empty` in one row, so a list page passes `<DataTable loading />` as the `QueryBoundary` skeleton with `isEmpty={() => false}`. A wide table scrolls sideways inside its own frame.
- **FilterBar**: `<FilterBar defaults={DEFAULTS} fields={[{ key, label, type, options?, placeholder? }]} />`, with `type` from `FILTER_TYPE` (search, select, date). It writes the URL through `useUrlFilters(DEFAULTS)`; the page calls the same hook with the same module-level `DEFAULTS` to read the filters. Search is debounced 300 ms and replaces the history entry. Any filter change returns the list to page 1.
- **Charts** (recharts): `TrendChart` (one figure per day, as a line or bars, in `--color-text`) and `CategoryChart` (one named bar per category, each in its own ink). Colours come only from `chartStyle.js`, `VERTICAL_INKS` and `BOOKING_STATUS[…].ink`, all CSS variables, so both themes work without script. Every chart sits in a `ChartCard`, which hides the drawing from assistive technology and gives the same figures as a visually hidden table (`columns`, `rows`). `empty` replaces an all-zero chart with a line of text.
- **VerticalChip** is the only way a vertical is shown. A status is a **Badge** with `BOOKING_STATUS[status]`.
- **Tabs** keeps every panel mounted (hidden while closed) so one form can run across them. `flagged` marks a tab that needs attention.
- **Switch** applies as it is pressed (Published, Active). **ConfirmDialog** stays open and cannot be dismissed while `loading`, and shows `error` inside itself.
- **PageHeader** renders the page's only `h1` and sets the document title (`{title} · Adventuro Admin`).
- **Density** (from `/DESIGN.md`): controls 40px, table rows 44px, `text-sm` in tables and forms, 24px page padding.

## Conventions (same as the customer app)

- **Pages compose, components render.** Keep pages under ~120 lines and components under ~150, and split when they grow. Use one component per file, PascalCase, **named exports only**.
- **No duplication.** All list pages use `DataTable` + `FilterBar`. Both create and edit use one editor page per entity. Every image field uses `ImageUploader`.
- Data flows only through `hooks/queries` and `hooks/mutations`. Query keys come only from `queryKeys.js`. Mutations invalidate the affected keys.
- List filters, search, sort, and page live in URL search params.
- Every data view goes through `QueryBoundary` (skeleton → error with Retry → empty → content).
- Modern JS, no dead code, no `console.*`, ESLint zero warnings.

## Errors — never show raw backend errors

- `api/client.js` throws `ApiError { status, code, fieldErrors }`, and `lib/errors.js#getErrorMessage` maps it to human text.
- Use the same map as `frontend/CLAUDE.md`, plus these admin-relevant codes:

| code | Text shown |
|---|---|
| `DUPLICATE` | Something with this name already exists. Try a different name. |
| `RESOURCE_IN_USE` | This is still being used elsewhere, so it can't be deleted. (Tours: "This tour has bookings — unpublish it instead.") |
| `INVALID_STATUS_TRANSITION` | This booking's status can't be changed that way. |
| `INVALID_FILE` | Please upload a JPG, PNG or WebP image. |
| `FILE_TOO_LARGE` | That image is too large. The limit is 5 MB. |
| `FORBIDDEN` | This account doesn't have admin access. |

- `getErrorMessage(error, { subject: ERROR_SUBJECT.TOUR })` gives the tour wording of `RESOURCE_IN_USE`.
- Field errors map to form fields using our own zod messages, with the fallback "Please check this field."
- Never render the server `message`, stacks, or status codes.

## Auth

- `/login` shows the Google button and calls `POST /auth/google`.
- If the returned `user.role !== 'admin'`, call logout and show the `FORBIDDEN` message. Never let a non-admin into the layout.
- `RequireAdmin` wraps every route except `/login`, using `useMe()`:
  - 401 → `/login`
  - non-admin → logout + `/login` with the message
- The backend enforces admin on every `/admin/*` call anyway. The UI guard is for UX only.

How it is built:
- `useGoogleSignIn` checks the role inside the mutation: a non-admin is signed out and the mutation fails with `forbiddenError()`, so that account never becomes the cached session.
- `useAdminSession` is the one place that reads the session for the guard and the login page. A signed-in non-admin (a customer's cookie from the other app) is signed out there; it reads as `loading` until that finishes and then as `signedOut` with `denied: true`. `RequireAdmin` passes `denied` to `/login` in the navigation state, and the login page shows the message for either. If the sign-out fails, an error with Retry shows and the layout still does not.
- There is no `next` param: after sign-in the admin lands on the dashboard.
- Sign out (topbar) ends the session and removes every other cached query; the guard then navigates.
- `lib/queryClient.js`: `UNAUTHENTICATED` on any request clears `me`. `FORBIDDEN` re-reads it, so an admin whose role was removed is turned away by the guard.

## App flow

**Layout:** sidebar (Dashboard, Verticals, Tours, Gear, Taxonomies, Bookings, Users, Newsletter) and topbar (admin name/avatar, theme switcher, sign out). Theme is persisted exactly as in the customer app (`user.themePreference`, default `system`).

- Theme: the choice is applied at once and saved with `PATCH /users/me`; the server value wins whenever no save is in flight (sign-in, and rollback of a failed save, which also shows a toast). The preference is mirrored to localStorage under `adventuro.theme`, which the inline script in `index.html` reads before first paint.
- The theme switcher is one control with three choices, System / Light / Dark, because this app has no account page on which to choose System again.
- The sidebar is a fixed column from 1024px. Below that it is a drawer opened from the topbar's menu button; it closes on Escape, a press outside, and choosing a section.
- The sidebar shows only the sections that are built (see `NAV_SECTIONS`).

### Dashboard (`/`)
- Date range picker (presets: 7 / 30 / 90 days, custom), stored in the URL.
- Stat cards: total users, new users in range, total bookings, booking value (confirmed + completed), newsletter subscribers.
- Charts: new users per day, bookings per day, bookings and value per vertical, bookings by status.
- Tables: top 5 tours by bookings, top 5 gear by affiliate clicks, 10 most recent bookings (rows link to booking detail).
- Data comes from `GET /admin/dashboard?from&to`.
- Label money as "booking value", since there are no payments yet.
- URL params: `range` is `7`, `90` or `custom` (30 days is the default and is left out), plus `from` and `to` (`YYYY-MM-DD`) when custom. `lib/dashboardRange.js` turns them into the range to ask for: a preset is counted back from today in IST, today included, and `from` and `to` are always sent. An unknown `range` falls back to 30 days.
- A custom range is checked the way the server checks it (real dates, `from` ≤ `to`, at most 366 days). An invalid one shows its message on the date field and is not requested.
- Bookings per day is a bar chart of the count; each day's booking value is in its tooltip and its data table.
- Recent bookings shows booking number, customer, tour, vertical, travelers, booking value, status and when it was booked. Its rows become links when session 14 builds the booking detail page.

### Verticals (`/verticals`, `/verticals/:id`)
- List of the 6 verticals.
- Edit page: subtitle, description, hero image.
- No create or delete.

### Tours (`/tours`, `/tours/new`, `/tours/:id`)
- **List:** filters (vertical, published, search), columns (cover, title, vertical, state, starting price, published, updated), and actions (edit, publish/unpublish toggle, delete).
- **Editor**, tabbed with one form and one Save button:
  1. **Basics**: vertical, title, slug (auto from title, editable), state, destination, tagline, overview, duration, difficulty, published.
  2. **Media**: cover image + gallery (upload, reorder, remove).
  3. **Experience**: signature activity (required), top activities.
  4. **Itinerary**: add, remove, and reorder days; day numbers auto-renumber.
  5. **Inclusions / Exclusions**: string lists.
  6. **Packages**: tiers (name, description, price per person), 1–5 tiers.
  7. **Reporting**: location, address, reporting time (HH:mm).
  8. **Gear**: read-only list of gear linked to this tour, with links to edit each item. Links are managed from the gear side.
- **Delete:** use `ConfirmDialog`. On a `RESOURCE_IN_USE` error, offer to unpublish instead.

### Gear (`/gear`, `/gear/new`, `/gear/:id`)
- **List:** filters (category, climate, tag, active, search), columns (image, name, category, sale price/MRP, clicks, active), and actions (edit, activate/deactivate, delete).
- **Editor:**
  - name, slug, short description, description, images
  - MRP and sale price (sale ≤ MRP, validated)
  - **affiliate URL** (https only, with a "Test link" button that opens it in a new tab)
  - category (single), climates (multi), tags (multi, from Taxonomies)
  - **linked tours** (searchable multi-select across all verticals)
  - active switch

### Taxonomies (`/taxonomies`)
- Three tabs: Categories / Climates / Tags.
- Inline add, rename, and delete. Delete blocked by `RESOURCE_IN_USE` shows the friendly message.

### Bookings (`/bookings`, `/bookings/:bookingNumber`)
- **List:** filters (status, vertical, tour, date range, search by booking number / name / phone / email), columns (booking number, customer, tour, tier, travelers, start date, total, status, created).
- **Detail:**
  - all booking info plus customer contact
  - status actions: **Mark completed** / **Cancel**, only from `confirmed`, each with a `ConfirmDialog`
  - download the ticket PDF

### Users (`/users`, `/users/:id`)
- **List:** search, role filter, columns (avatar, name, email, phone, role, joined, last login).
- **Detail:** profile plus that user's bookings table.
- Read-only. Roles come from `ADMIN_EMAILS`, so there is no role editing in the UI.

### Newsletter (`/newsletter`)
- Paginated list of subscribers.
- **Export CSV**, built client-side by `lib/csv.js` from all pages. Escape cells to prevent CSV/formula injection by prefixing `= + - @` with `'`.

## Form behavior

- Validate on the client with zod (mirroring backend limits). Disable Save while submitting or when nothing has changed.
- `useUnsavedChanges` blocks navigation (router blocker + `beforeunload`) when the form is dirty.
- **`ImageUploader`:**
  1. Checks type (jpeg/png/webp) and size (≤ 5 MB) client-side.
  2. `POST /admin/uploads?folder=…` and shows a preview.
  3. Removing an image that was uploaded during this session but not yet saved calls `DELETE /admin/uploads { path }`.
- Show success toasts after a save. Show errors inline at the top of the form, with field errors on their fields.
- Destructive actions always go through `ConfirmDialog`, naming the item.

## Security

- No `dangerouslySetInnerHTML`. Content entered by admins renders as text everywhere.
- Never store tokens in JS (the session is an httpOnly cookie). Only non-secret `VITE_` vars.
- Run `npm audit` and keep it at 0 vulnerabilities.

## Testing

- Vitest + React Testing Library + MSW, with the real envelope shape (`success()` / `failure()` in `src/test/server.js`). An unhandled request fails the test. Every test starts signed out; `signedInAs(ADMIN)` signs one in and `record(method, path, resolver)` captures request bodies.
- Render through `renderApp` / `renderRoutes` (`src/test/render.jsx`). Pass `{ queryClient: createQueryClient() }` to test what the app's own client does when a session ends.
- jsdom has no layout: `ResizeObserver` is a no-op stand-in, so recharts draws nothing. Assert a chart's figures through its `ChartCard` table (`getByRole('table', { name })`); the drawing itself is checked in E2E.
- dom-testing-library treats every `<header>` as a banner, so find the topbar through its Sign out button.
- A test that renders the real `routes` imports the lazy pages in a `beforeAll` (see `AdminLayout.test.jsx`): the dashboard brings recharts with it.
- jsdom's `FormData` is not the one Node's `fetch` encodes, so the upload request is asserted at `fetch` (see `endpoints.test.js`).
- **E2E:** `npm run e2e` runs the Playwright specs in `e2e/` at 768px (tablet) and 1440px (desktop). It starts the backend harness (`npm run e2e:server` in `../backend`, port 5000) and a production build on `vite preview` (port 4174), or reuses them if they are already running. Stop a dev backend on port 5000 first, or the suite runs against the dev database. First run on a machine: `npx playwright install chromium`.
- **E2E fixtures** (`e2e/fixtures.js`): import `test` from there. It gives every test its own `X-Forwarded-For` and `signInAs('admin' | 'customer')`, which injects that user's cookie from `/e2e/.auth.json`. `open(page, path, theme)` waits until nothing is loading. `watchForErrors` ignores only the browser's own report of the 401 from `GET /auth/me`. `findA11yViolations` runs axe (WCAG 2.1 A and AA) and returns the serious and critical violations.
- Every test shares the one harness admin, so a spec must not really change that user (its theme, say). Answer the save with `page.route` instead, as the theme test in `dashboard.spec.js` does.
- Required tests:
  - `lib/errors.js` mapping
  - `lib/csv.js` (escaping + formula-injection guard)
  - `RequireAdmin` (401, non-admin, admin)
  - `TierEditor` and `ItineraryEditor` (add, remove, reorder, renumber)
  - `ImageUploader` client-side rejection
  - gear form sale ≤ MRP and https-URL validation
  - booking status actions only shown for `confirmed`

## Definition of done

1. `npm run lint` passes with zero warnings, and `npm test` passes.
2. `npm run build` succeeds.
3. `npm run e2e` passes on a fresh harness, and `npm audit` reports 0 vulnerabilities.
4. There are no hardcoded colors or fonts, no duplicated table or form markup, no unused files or dependencies, and no `console.*`.
5. All user-facing errors go through `lib/errors.js`.
