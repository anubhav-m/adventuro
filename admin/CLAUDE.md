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
- Dev tools: Vitest, React Testing Library, MSW, ESLint (flat config + react-hooks), Prettier

Install everything at its latest stable version.

**Environment and deploy**
- Env vars: `VITE_API_BASE_URL` (default `/api/v1`), `VITE_GOOGLE_CLIENT_ID`.
- In dev, Vite proxies `/api` to `http://localhost:5000`.
- On Vercel, `vercel.json` rewrites `/api/*` to the backend and sends `X-Robots-Tag: noindex`. `index.html` also has `<meta name="robots" content="noindex">`.

## Folder structure

```
admin/src/
├── main.jsx, App.jsx, router.jsx
├── styles/ (index.css, theme.css — theme.css is a copy of /design/theme.css)
├── api/
│   ├── client.js, ApiError.js, queryKeys.js
│   └── auth.api.js, dashboard.api.js, verticals.api.js, tours.api.js, gear.api.js,
│       taxonomies.api.js, uploads.api.js, bookings.api.js, users.api.js, newsletter.api.js
├── hooks/ (queries/, mutations/, useUrlFilters.js, useDebounce.js, useUnsavedChanges.js, useTheme.js)
├── components/
│   ├── ui/          # Button, Input, Textarea, Select, MultiSelect, Field, Checkbox, Switch, Badge,
│   │                # Modal, ConfirmDialog, Tabs, Skeleton, EmptyState, ErrorState, Pagination
│   ├── layout/      # AdminLayout (sidebar + topbar), Sidebar, Topbar, PageHeader
│   ├── data/        # DataTable (columns config, server pagination, row actions), FilterBar, StatCard, ChartCard
│   ├── forms/       # ImageUploader, ImageGallery, StringListEditor (inclusions/activities),
│   │                # ItineraryEditor, TierEditor, TaxonomySelect, TourMultiSelect, PriceInputs
│   ├── auth/        # GoogleSignInButton, RequireAdmin
│   └── QueryBoundary.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── VerticalsPage.jsx, VerticalEditPage.jsx
│   ├── ToursPage.jsx, TourEditPage.jsx          # /tours/new and /tours/:id share TourEditPage
│   ├── GearPage.jsx, GearEditPage.jsx           # /gear/new and /gear/:id share GearEditPage
│   ├── TaxonomiesPage.jsx
│   ├── BookingsPage.jsx, BookingDetailPage.jsx
│   ├── UsersPage.jsx, UserDetailPage.jsx
│   ├── NewsletterPage.jsx
│   └── NotFoundPage.jsx
└── lib/ (errors.js, format.js, constants.js, schemas.js, csv.js, storage.js)
```

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

- Field errors map to form fields using our own zod messages, with the fallback "Please check this field."
- Never render the server `message`, stacks, or status codes.

## Auth

- `/login` shows the Google button and calls `POST /auth/google`.
- If the returned `user.role !== 'admin'`, call logout and show the `FORBIDDEN` message. Never let a non-admin into the layout.
- `RequireAdmin` wraps every route except `/login`, using `useMe()`:
  - 401 → `/login`
  - non-admin → logout + `/login` with the message
- The backend enforces admin on every `/admin/*` call anyway. The UI guard is for UX only.

## App flow

**Layout:** sidebar (Dashboard, Verticals, Tours, Gear, Taxonomies, Bookings, Users, Newsletter) and topbar (admin name/avatar, theme switcher, sign out). Theme is persisted exactly as in the customer app (`user.themePreference`, default `system`).

### Dashboard (`/`)
- Date range picker (presets: 7 / 30 / 90 days, custom), stored in the URL.
- Stat cards: total users, new users in range, total bookings, booking value (confirmed + completed), newsletter subscribers.
- Charts: new users per day, bookings per day, bookings and value per vertical, bookings by status.
- Tables: top 5 tours by bookings, top 5 gear by affiliate clicks, 10 most recent bookings (rows link to booking detail).
- Data comes from `GET /admin/dashboard?from&to`.
- Label money as "booking value", since there are no payments yet.

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

- Vitest + React Testing Library + MSW.
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
3. `npm audit` reports 0 vulnerabilities.
4. There are no hardcoded colors or fonts, no duplicated table or form markup, no unused files or dependencies, and no `console.*`.
5. All user-facing errors go through `lib/errors.js`.
