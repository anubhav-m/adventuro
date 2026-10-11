# Frontend — Adventuro customer app

Read `/CLAUDE.md` first. It holds the product rules, the **UI flow** (page structure), the API envelope, the error codes, and the auth flow. This file covers how the customer app is built.

Visual design is decided. Read `/DESIGN.md` (rules) and `/PRODUCT.md` (audience and brand) before building UI.

- Tokens come from `/design/theme.css`, copied unchanged to `src/styles/theme.css` at scaffold. Never edit the copy; change `/design/theme.css` and copy it again.
- `src/styles/index.css` maps the tokens into Tailwind v4 exactly as `/design/tailwind-tokens.md` describes, and loads the three Google Fonts named there.
- Every color, radius, shadow, and font comes from those tokens. Never hardcode a hex value or font in a component.
- A vertical's theme is applied by putting `data-vertical="{key}"` on the page or section wrapper and using the `accent` utilities inside it. Components never name a vertical's colour.

## Stack

- Node.js 24.x (LTS; `engines` pins `24.x`) for tooling and builds
- React + Vite, JavaScript (ES modules, `.jsx`)
- React Router (latest), with lazy-loaded routes
- TanStack Query for **all** server state
- `react-hook-form` + `zod` + `@hookform/resolvers` for forms
- Tailwind CSS v4 (CSS-first config in `src/styles/index.css`, no `tailwind.config.js`)
- `lucide-react` for icons, `sonner` for toasts
- Google Identity Services, loaded directly from `https://accounts.google.com/gsi/client` and wrapped in one component. No wrapper library.
- Dev tools: Vitest (+ `@vitest/coverage-v8`), React Testing Library (+ `user-event`, `jest-dom`), MSW, jsdom, Playwright (`@playwright/test`, Chromium), ESLint (flat config + react-hooks plugin), Prettier

Install everything at its latest stable version. Don't add a UI kit or a date library: use native `<input type="date">` and `Intl`.

## Scripts

`dev` (port 5173), `build`, `preview` (port 4173), `lint`, `format`, `test`, `test:watch`, `test:coverage`, `e2e` (Playwright, see Testing).

## Environment

| Var | Notes |
|---|---|
| `VITE_API_BASE_URL` | default `/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | |

- In dev, Vite proxies `/api` to `http://localhost:5000`.
- `vite preview` uses the same proxy, so the Playwright suite runs against a production build.
- In production, `vercel.json` rewrites `/api/*` to the backend, keeping the cookie first-party. Vercel cannot read env vars inside `vercel.json`, so the backend host there is the placeholder `adventuro-backend.example.com`; replace it before deploying (also noted in `.env.example` and `README.md`).
- Never put secrets in `VITE_` vars.

## Folder structure

```
frontend/src/
├── main.jsx
├── App.jsx                    # providers: QueryClient, Theme, Router, Toaster
├── router.jsx                 # `routes` (lazy pages inside PageLayout, catch-all last) + createAppRouter()
├── styles/
│   ├── index.css              # tailwind import, token mapping, base styles (per /design/tailwind-tokens.md)
│   └── theme.css              # copy of /design/theme.css
├── api/
│   ├── client.js              # request / requestBlob: credentials 'include', JSON, unwraps envelope, throws ApiError
│   ├── ApiError.js            # { status, code, fieldErrors: [{ field }], isNetworkError }
│   ├── queryKeys.js           # single query-key factory
│   └── auth.api.js, users.api.js, verticals.api.js, tours.api.js, gear.api.js,
│       taxonomies.api.js, bookings.api.js, search.api.js, newsletter.api.js
├── hooks/
│   ├── queries/               # useMe, useVerticals, useVertical, useTours, useTour, useGearList,
│   │                          # useTaxonomies, useMyBookings, useBooking, useSearch
│   ├── mutations/             # useGoogleSignIn, useSignOut, useUpdateProfile, useCreateBooking, useSubscribe
│   ├── useTheme.js            # ThemeContext + useTheme()
│   ├── useScrolled.js         # true once the page has left the top (navbar border)
│   ├── useDebounce.js
│   └── useUrlFilters.js       # read/write filters to URL search params
├── components/
│   ├── ui/                    # Button, IconButton, Card, Badge, Chip, ChipGroup, Input, Select, Field,
│   │                          # Modal, Dropdown, Stepper, Skeleton, Spinner, Pagination, Avatar,
│   │                          # EmptyState, ErrorState, InlineError, Price, SectionHeader
│   ├── layout/                # PageLayout, Navbar, LogoMenu, AccountMenu, AccountSummary, ThemeSwitcher,
│   │                          # SearchOverlay, Footer, FooterLinks, NewsletterForm,
│   │                          # Wordmark, TerrainLine, RouteFallback, AppToaster
│   ├── home/                  # HomeHero, ChooseYourAdventure, Terrain, RouteLine,
│   │                          # GrandIndiaFeature, GrandIndiaBanner, GearCategories
│   ├── verticals/             # VerticalCard (a band of the home terrain), terrain.js (its profiles),
│   │                          # VerticalHero
│   ├── tours/                 # TourCard, TourGrid, TourHero, ItineraryTimeline, SignatureActivity,
│   │                          # InclusionList, ReportingInfo, TierSelector
│   ├── booking/               # BookingModal, BookingForm, TravelerStepper, PriceSummary, Ticket
│   ├── gear/                  # GearCard, GearGrid, GearFilters, SuggestedGear, AffiliateDisclosure,
│   │                          # GearCategoryCard, categoryIcons.js (icon per category slug)
│   ├── auth/                  # GoogleSignInButton, SessionBoundary, RequireAuth, RequireCompleteProfile,
│   │                          # ProfileForm (name + phone, shared by onboarding and account)
│   ├── ThemeProvider.jsx      # resolves the theme, sets data-theme, persists the choice
│   ├── SessionThemeProvider.jsx # the app's provider: ThemeProvider + ThemeSync
│   ├── ThemeSync.jsx          # saves the choice to the signed-in user; the server value wins
│   └── QueryBoundary.jsx      # renders loading / error / empty / data for any query
├── pages/
│   ├── HomePage.jsx
│   ├── VerticalPage.jsx       # /v/:verticalKey
│   ├── TourPage.jsx           # /tours/:slug
│   ├── GearStorePage.jsx      # /gear
│   ├── TicketPage.jsx         # /bookings/:bookingNumber
│   ├── SignInPage.jsx
│   ├── OnboardingPage.jsx
│   ├── AccountPage.jsx
│   ├── MyBookingsPage.jsx
│   ├── AboutPage.jsx
│   ├── StaticPage.jsx         # privacy, terms, cancellation, affiliate disclosure (content from lib/staticContent.js)
│   └── NotFoundPage.jsx
├── lib/
│   ├── errors.js              # getErrorMessage(err), getFieldError(err, field)
│   ├── format.js              # formatPrice (Intl en-IN INR, 0 decimals), formatDate (IST, "15 Sep 2026"),
│   │                          # getIstDateOnly(offsetDays) → 'YYYY-MM-DD'
│   ├── constants.js           # ROUTES, VERTICALS meta (key, name, route, icon from /DESIGN.md), THEME,
│   │                          # STORAGE_KEYS, LIMITS, BRAND, contact and social links
│   ├── schemas.js             # zod form schemas (profile, booking, newsletter) + FIELD_MESSAGES
│   ├── storage.js             # localStore / sessionStore: get, set, remove that never throw;
│   │                          # bookingIntent: save / restore / clear (sessionStorage)
│   ├── next.js                # ?next= handling: safeNext, readNext, withNext, getSignedInPath
│   ├── googleIdentity.js      # loads and initialises Google Identity Services once
│   ├── queryClient.js         # createQueryClient(): staleTime, retry policy, UNAUTHENTICATED clears `me`
│   ├── menu.js                # arrow / Home / End navigation shared by Dropdown and LogoMenu
│   └── cn.js                  # joins class names
└── test/                      # setup.js, server.js (MSW + envelope helpers), render.jsx, matchMedia.js,
                               # fixtures.js (users, catalog), googleIdentity.js (stand-in for Google)

frontend/e2e/                  # Playwright specs + fixtures.js; screenshots/ is gitignored
```

Tests sit next to the file they cover (`Button.test.jsx`, `errors.test.js`).

## Component and code rules

- **Pages compose, components render.** A page wires routes, data hooks, and sections together and holds almost no markup of its own. Aim for under ~120 lines per page and under ~150 per component. Split when a file grows past that.
- **No duplication.** When markup or logic appears a second time, extract it into a component, hook, or `lib/` util. Reuse `ui/` primitives everywhere. Never re-style a raw `<button>` in a feature component.
- **One component per file**, PascalCase filename, **named exports only**.
- Components never call `fetch` or `api/*` directly. Data flows through `hooks/queries` and `hooks/mutations`. Query keys come only from `queryKeys.js`.
- Every data view follows the same pattern via `QueryBoundary`: skeleton while loading → `ErrorState` (human message + Retry) → `EmptyState` → content.
- Mutations invalidate exactly the affected query keys. Use optimistic updates only for the theme preference.
- Props over variants explosion: use `variant` and `size` props on primitives instead of near-duplicate components.
- Filters, search, and pagination on list pages live in **URL search params** (`useUrlFilters`), so they can be shared and the back button works.
- Modern JS only: `const`, destructuring, optional chaining, `??`, async/await, no `var`, no class components.
- No dead code, no commented-out blocks, no `console.*`. ESLint with `react-hooks` rules must pass with no warnings.

## Error messages — never show raw backend errors

- `api/client.js` throws `ApiError { status, code, fieldErrors }`. It keeps only the field names of `errors[]` and drops the server's messages, so they cannot reach the UI. **Never render `error.message` from the server, stack traces, or status numbers.**
- `request(path, { method, body, params, signal })` resolves to the envelope's `data`, with `meta` merged in beside it for paginated lists (`{ tours, meta }`). Empty params are not sent. A cancelled request rejects with the `AbortError`, not an `ApiError`.
- `lib/errors.js#getErrorMessage(err)` resolves the text in this order:
  1. Known `code` → friendly text (the map below).
  2. Network failure → "We can't reach Adventuro right now. Check your connection and try again."
  3. Status 5xx → "Something went wrong on our side. Please try again in a moment."
  4. Anything else → "Something didn't work. Please try again."

| code | Text shown |
|---|---|
| `VALIDATION_ERROR` | Some details don't look right. Please check the highlighted fields. |
| `INVALID_GOOGLE_TOKEN` | Google sign-in didn't go through. Please try again. |
| `UNAUTHENTICATED` | Please sign in to continue. |
| `FORBIDDEN` | You don't have access to this. |
| `PROFILE_INCOMPLETE` | Add your name and phone number to continue. |
| `NOT_FOUND` / `ROUTE_NOT_FOUND` | We couldn't find what you're looking for. |
| `PHONE_TAKEN` | This phone number is already linked to another account. |
| `TOUR_UNAVAILABLE` | This trip or package isn't available right now. Please pick another. |
| `RATE_LIMITED` | You're going a bit fast. Please wait a moment and try again. |
| `INTERNAL_ERROR` | Something went wrong on our side. Please try again in a moment. |

- **Field errors:** forms validate on the client with zod first, using our own messages. If the server still returns `VALIDATION_ERROR`, map each `fieldErrors[].field` to the form field and show our own message for that field (from `schemas.js`), falling back to "Please check this field."
- `UNAUTHENTICATED` on any query clears the `me` cache. Protected pages then redirect to `/signin?next=…`.
- Show errors inline where the user is acting (forms, sections). Use toasts only for background actions such as subscribe, sign out, or theme sync.

## Auth and guards

- `useMe()` (`GET /auth/me`) is the source of truth for the session. A 401 means signed out: the hook resolves to `null`, not an error. Don't keep a duplicate auth context.
- Redirects are declarative. Pages and guards read the session and render `<Navigate>`; `getSignedInPath(user, next)` in `lib/next.js` is the one rule for where a signed-in user belongs. Nothing navigates from a mutation callback.
- `next` is only ever an in-app path (`safeNext`): one leading slash, never a protocol-relative or backslash URL. Anything else is dropped and the user goes home.
- Sign out navigates home first and then calls the API, so a guarded page cannot bounce the now signed-out user to sign-in. It clears `me` and removes the user's bookings from the cache.
- The account menu's user ID is copied with a **Copy user ID** menu item, so it is reachable from the keyboard like every other item.
- `GoogleSignInButton` loads the GIS script once, renders the button, and on callback runs `useGoogleSignIn` (`POST /auth/google`). Afterwards:
  - profile incomplete → `/onboarding?next=…`
  - otherwise → `next`, or home
- Guards:
  - `RequireAuth`: `/onboarding`, `/account`, `/account/bookings`, `/bookings/:bookingNumber`
  - `RequireCompleteProfile`: wraps booking confirmation and the account pages
- **Booking intent survives sign-in.** Before redirecting to sign-in from the booking modal, save `{ tourSlug, tierId, travelers, startDate }` to sessionStorage. Restore it and reopen the modal after sign-in or onboarding, then clear it.
- Never read or store the auth token in JS. It's an httpOnly cookie.

## Theme

- Values are `system | light | dark`, default `system`.
- `ThemeProvider` resolves `system` with `matchMedia('(prefers-color-scheme: dark)')`, listens for changes, and sets `data-theme` (`light` or `dark`) on `<html>`. The tokens in `theme.css` have no values without it.
- Persistence:
  - **Signed in:** the source is `user.themePreference`. A change updates the UI optimistically, then `PATCH /users/me { themePreference }`. If the request fails, roll back and show a toast.
  - **Guest:** localStorage.
  - **On sign-in:** the server value wins.
- Always mirror the **preference** to localStorage under `adventuro.theme` (`STORAGE_KEYS.THEME`), for guests and signed-in users alike. A tiny inline script in `index.html` reads it, resolves `system` with `matchMedia`, and sets `data-theme` before first paint so there's no flash. The key is written in both places; change them together.
- `ThemeSync` (inside `SessionThemeProvider`) holds one rule: for a signed-in user, whenever no save is in flight the server's value is applied. That applies it on sign-in and rolls back a failed save; the failure also shows a toast.
- `ThemeProvider` takes `onChange(next, previous)`, called when the user picks a theme: this is where the signed-in `PATCH` goes. `setPreference(value, { notify: false })` applies a value without calling it, for applying the server value on sign-in and for rolling back a failed save.

## Behavior requirements from the UI flow

- **Home, Choose Your Adventure:** the terrain section from `/DESIGN.md`, not a carousel. Five bands side by side from 1280px; below that, full-width stacked rows with Grand India Tour as a route-orange row on top. Each band is one link, in coast-to-peak order (`TERRAIN_ORDER`), with its name and subtitle from `GET /verticals`. Nothing scrolls sideways, so there are no prev/next controls.
- **Home, Book Now:** a link to `#choose-your-adventure`; the router's scroll restoration moves to the section.
- **Home, Grand India Tour:** the banner's chips are the newest tour's `topActivities`, and View Itinerary opens that tour, or the vertical page when it has no tour.
- **Logo menu:** the wordmark is the home link; the chevron button beside it owns the menu. It opens on hover, keyboard focus, click, and tap. Closes on Escape, outside press, pointer leave, focus leaving, and route change. A mouse click never closes it (hovering already opened it); a tap toggles. Fully keyboard-navigable with proper ARIA (`aria-expanded`, `aria-haspopup`, menu roles).
- **Navbar on phones:** below 640px the About Us link moves into the logo menu, and the wordmark steps down in size, so the bar fits from 360px wide.
- **Static page paths** (in `ROUTES`): `/privacy-terms`, `/cancellation-refund`, `/affiliate-disclosure`.
- **Search overlay:**
  - opens from the navbar icon and the `/` key
  - debounce 300 ms, minimum 2 chars
  - grouped results (Tours / Gear); Enter on a gear result opens its detail context in the store
- **Booking:**
  - the total updates live (`tier.pricePerPerson × travelers`)
  - recommended gear shows as links only
  - the button reads **Confirm Booking**, never "Pay"
  - the displayed total is for UX only; the server computes the real price
  - on success, go to the ticket page
- **Ticket page:** "Download PDF" requests `/bookings/:bookingNumber/ticket` as a blob and saves it as `Adventuro-{bookingNumber}.pdf`.
- **Gear Buy:** an `<a href="/api/v1/gear/{id}/go" target="_blank" rel="noopener noreferrer sponsored">`. Show the affiliate disclosure on gear surfaces.
- **Newsletter:** always shows the same success message ("You're on the list!", as a toast), whether the email is new or existing. Errors show inline under the field.
- **Formatting:** prices via `formatPrice` (₹14,999), dates via `formatDate`, both from `lib/format.js` only.
- **Accessibility:**
  - semantic HTML and labelled inputs
  - visible focus states
  - images have `alt` from titles
  - modals trap focus and restore it on close
  - respect `prefers-reduced-motion`
- **Performance:**
  - lazy-load routes
  - `loading="lazy"` on below-the-fold images
  - sensible `staleTime` (verticals and taxonomies: 10 min; lists: 1 min)

## Security

- No `dangerouslySetInnerHTML`. All content renders as text.
- External links use `rel="noopener noreferrer"`.
- Only `VITE_`-prefixed, non-secret env vars.
- Run `npm audit` and keep it at 0 vulnerabilities.

## Testing

- Vitest + React Testing Library, with MSW mocking the API using the real envelope shape (`success()` / `failure()` in `src/test/server.js`). An unhandled request fails the test.
- Render through `renderApp` / `renderRoutes` (`src/test/render.jsx`): they supply the query client, theme, an in-memory router and the toaster. `setSystemDark()` in `src/test/matchMedia.js` sets the OS colour scheme.
- `src/test/server.js` starts every test signed out (`GET /auth/me` → 401); `signedInAs(user)` signs one in and `record(method, path, resolver)` captures request bodies. Vitest clears mock call history between tests, so anything that must outlive one test (the Google stand-in's callback) is a plain function.
- **E2E fixtures** (`e2e/fixtures.js`): import `test` from there. It gives every test its own `X-Forwarded-For` (the harness rate-limits per IP) and `signInAs('customer' | 'incompleteCustomer' | 'admin')`, which injects that user's cookie from `/e2e/.auth.json`. `watchForErrors` ignores exactly one console line: the browser's own report of the 401 from `GET /auth/me` for a signed-out visitor.
- Specs that change harness users (`account changes` in `account.spec.js`) run on the desktop project only and need a fresh harness: stop a harness left running before `npm run e2e`.
- **E2E:** `npm run e2e` runs the Playwright specs in `e2e/` at 375px and 1440px. It starts the backend harness (`npm run e2e:server` in `../backend`, port 5000) and a production build on `vite preview` (port 4173), or reuses them if they are already running. Screenshots go to `e2e/screenshots/` (gitignored). First run on a machine: `npx playwright install chromium`.
- Required tests:
  - `lib/errors.js`: every code, network, 5xx, field mapping
  - `lib/format.js`
  - `TierSelector` + `PriceSummary` total math
  - `BookingForm` validation (date bounds, traveler limits)
  - guard redirects
  - theme persistence (guest vs signed-in)
  - logo menu keyboard behavior

## Definition of done

1. `npm run lint` passes with zero warnings, and `npm test` passes.
2. `npm run build` succeeds.
3. `npm audit` reports 0 vulnerabilities.
4. There are no hardcoded colors or fonts, no duplicated markup, no unused files or dependencies, and no `console.*`.
5. Every new data view uses `QueryBoundary`. Every error shown to users comes from `lib/errors.js`.
