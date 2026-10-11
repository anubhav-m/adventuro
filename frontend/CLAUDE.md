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
- Dev tools: Vitest (+ `@vitest/coverage-v8`), React Testing Library (+ `user-event`, `jest-dom`), MSW, jsdom, Playwright (`@playwright/test`, Chromium) with `@axe-core/playwright`, ESLint (flat config + react-hooks plugin), Prettier

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
│   ├── queries/               # useMe, useVerticals, useVertical, useTour (+ usePrefetchTour), useTourPreview,
│   │                          # useGearList, useTaxonomies, useMyBookings, useBooking, useSearch
│   ├── mutations/             # useGoogleSignIn, useSignOut, useUpdateProfile, useCreateBooking,
│   │                          # useDownloadTicket, useSubscribe
│   ├── useTheme.js            # ThemeContext + useTheme()
│   ├── useScrolled.js         # true once the page has left the top (navbar border)
│   ├── useReveal.js           # [ref, revealed]: true while the element is on screen or above it (IntersectionObserver)
│   ├── useDebounce.js
│   └── useUrlFilters.js       # { filters, setFilters, clearFilters } on URL search params
├── components/
│   ├── ui/                    # Button, IconButton, Card, Badge, Chip, ChipGroup, Input, Select, Field,
│   │                          # Modal, Dropdown, Stepper, Skeleton, SkeletonText, Spinner, Pagination, Avatar,
│   │                          # EmptyState, ErrorState, InlineError, Price, SectionHeader,
│   │                          # Photo (a photo plate: a pulsing block until loaded, at once when the browser already holds it,
│   │                          # fallback when missing; `zoom`, `parallax`),
│   │                          # Reveal (rises in on scroll; `stagger` for a group's children)
│   ├── layout/                # PageLayout, Navbar, LogoMenu, AccountMenu, AccountSummary, ThemeSwitcher,
│   │                          # SearchOverlay, SearchPanel, SearchGroup, Footer, FooterLinks,
│   │                          # NewsletterForm, Wordmark, TerrainLine, RouteFallback, AppToaster,
│   │                          # ParticleField (the canvas of survey marks behind every page, in PageLayout),
│   │                          # FieldBand (a vertical's ink field: copy left, photo plate right),
│   │                          # BandSkeleton (a band that is still loading),
│   │                          # InPageScroll (smooth scroll for same-page hash links),
│   │                          # ContentSection (one titled part of About and the policy pages)
│   ├── home/                  # HomeHero, ChooseYourAdventure, Terrain, RouteLine,
│   │                          # GrandIndiaFeature, GrandIndiaBanner, GearCategories
│   ├── verticals/             # VerticalCard (a band of the home terrain), terrain.js (its profiles),
│   │                          # VerticalHero
│   ├── tours/                 # TourCard, TourGrid, TourDetail (everything under the hero for a loaded tour;
│   │                          # holds the chosen tier), TourHero, TourGallery, TourSection,
│   │                          # SignatureActivity,
│   │                          # ItineraryTimeline, InclusionList, ReportingInfo, ReportingDetails (also on
│   │                          # the ticket), TourPackages, TierSelector
│   ├── booking/               # BookingModal (in PageLayout, opened by the URL), BookingForm, TravelerStepper,
│   │                          # PriceSummary, RecommendedGear, BookingBar (the tour page's Book bar below
│   │                          # desktop), Ticket, BookingList, BookingStatusBadge
│   ├── about/                 # VerticalRoster, PromiseSteps
│   ├── gear/                  # GearCard, GearGrid, GearFilters, GearSearchField, GearResults,
│   │                          # SuggestedGear, AffiliateDisclosure, GearCategoryCard,
│   │                          # categoryIcons.js (icon per category slug)
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
│   │                          # formatTime ('10:30' → "10:30 AM"), formatDuration ("4 days"),
│   │                          # getIstDateOnly(offsetDays) → 'YYYY-MM-DD'
│   ├── constants.js           # ROUTES, NAV_LINKS, VERTICALS meta (key, name, route, icon from /DESIGN.md), THEME,
│   │                          # STORAGE_KEYS, LIMITS, BRAND, BOOKING_PARAMS + bookingLink, BOOKING_STATUS,
│   │                          # contact and social links
│   ├── bookingDefaults.js     # what the booking form opens with (intent, linked tier, first tier); date bounds
│   ├── staticContent.js       # the policy pages' copy: placeholders marked for client review
│   ├── aboutContent.js        # the About page's copy
│   ├── download.js            # saveBlob(blob, filename)
│   ├── schemas.js             # zod form schemas (profile, booking, newsletter) + FIELD_MESSAGES
│   ├── storage.js             # localStore / sessionStore: get, set, remove that never throw;
│   │                          # bookingIntent: save / restore / clear (sessionStorage)
│   ├── next.js                # ?next= handling: safeNext, readNext, withNext, getSignedInPath
│   ├── googleIdentity.js      # loads and initialises Google Identity Services once
│   ├── queryClient.js         # createQueryClient(): staleTime, retry policy, UNAUTHENTICATED clears `me`
│   ├── menu.js                # arrow / Home / End navigation shared by Dropdown and LogoMenu
│   ├── particles.js           # the survey marks: createMarks, stepMarks, easeScrollSpeed (no DOM)
│   └── cn.js                  # joins class names
└── test/                      # setup.js, server.js (MSW + envelope helpers), render.jsx, matchMedia.js,
                               # fixtures.js (users, catalog, mockGear, mockTaxonomies),
                               # googleIdentity.js (stand-in for Google)

frontend/e2e/                  # Playwright specs + fixtures.js; screenshots/ is gitignored
```

Tests sit next to the file they cover (`Button.test.jsx`, `errors.test.js`).

## Component and code rules

- **Pages compose, components render.** A page wires routes, data hooks, and sections together and holds almost no markup of its own. Aim for under ~120 lines per page and under ~150 per component. Split when a file grows past that.
- **No duplication.** When markup or logic appears a second time, extract it into a component, hook, or `lib/` util. Reuse `ui/` primitives everywhere. Never re-style a raw `<button>` in a feature component.
- **One component per file**, PascalCase filename, **named exports only**.
- Components never call `fetch` or `api/*` directly. Data flows through `hooks/queries` and `hooks/mutations`. Query keys come only from `queryKeys.js`.
- Every data view follows the same pattern via `QueryBoundary`: a skeleton while loading → `ErrorState` (human message + Retry) → `EmptyState` → content.
- **Loading is a skeleton, never a spinner and never one big block** (the home page alone shows nothing and reveals its content instead, see below). A skeleton has the shape of what it stands for and is built from `Skeleton` pieces (`pill` for buttons and chips) and `SkeletonText`: `TourCardSkeleton`, `GearCardSkeleton`, `GearFiltersSkeleton`, `BookingFormSkeleton`, `TicketSkeleton`, `BookingListSkeleton`, and `BandSkeleton` for a field band. `QueryBoundary` falls back to `SkeletonText`. The route fallback and `SessionBoundary` are skeletons too. `Spinner` is only for an action in progress: inside a loading `Button`, and beside "Signing you in". Where a page can open from data it already holds (the vertical hero, the tour hero) it does.
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
- **Booking intent survives sign-in.** Before redirecting to sign-in from the booking modal, save `{ tourSlug, tierId, travelers, startDate }` to sessionStorage. Restore it and reopen the modal after sign-in or onboarding, then clear it. The modal reopens by itself because `next` is the page's URL, which carries `?book=`; the form reads the intent once when it mounts and clears it. An intent for another tour is ignored, and anything in it that is no longer bookable falls back to the default.
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
- The navbar's `ThemeSwitcher` is one toggle button, not a menu: it sets the opposite of the theme that is showing (`resolved`), so the first press leaves `system`. Its name is "Switch to light theme" / "Switch to dark theme". The account page's chips are the only place `system` can be chosen again.
- `ThemeProvider` takes `onChange(next, previous)`, called when the user picks a theme: this is where the signed-in `PATCH` goes. `setPreference(value, { notify: false })` applies a value without calling it, for applying the server value on sign-in and for rolling back a failed save.

## Behavior requirements from the UI flow

- **Home, Choose Your Adventure:** the terrain section from `/DESIGN.md`, not a carousel. Five bands side by side from 1280px; below that, full-width stacked rows with Grand India Tour as a route-orange row on top. Each band is one link, in coast-to-peak order (`TERRAIN_ORDER`), with its name and subtitle from `GET /verticals`. Nothing scrolls sideways, so there are no prev/next controls.
- **Home, Book Now:** a link to `#choose-your-adventure`; the router's scroll restoration moves to the section. The section's `scroll-margin-top` cancels its own top padding, so the heading lands just under the navbar and the whole terrain fits on the screen.
- **In-page links scroll, pages do not:** `InPageScroll` (in `PageLayout`, rendered just before `ScrollRestoration` so its layout effect runs first) sets `scroll-behavior: smooth` on `<html>` when a navigation stays on the same path and has a hash (Book Now, View packages), and clears it otherwise. A new page, the first page and a link to a section of another page open in place. Do not put `scroll-behavior: smooth` in the CSS: the router's scroll to the top of a new page would glide too.
- **Home, loading:** the home page shows no skeletons. Each data section passes `QueryBoundary` an empty block of about the section's height as its `skeleton`, so the page keeps its length, and the content rises in staggered (`Reveal stagger`, the terrain's own reveal) when it arrives. Everywhere else loading is a skeleton.
- **Home, Grand India Tour:** the banner's chips are the newest tour's `topActivities`, and View Itinerary opens that tour, or the vertical page when it has no tour.
- **Logo menu:** the wordmark is the home link; the chevron button beside it owns the menu. It lists the six verticals, and below 768px the navbar's links (`NAV_LINKS`) after them. It opens on hover, keyboard focus, click, and tap. Closes on Escape, outside press, pointer leave, focus leaving, and route change. A mouse click never closes it (hovering already opened it); a tap toggles. Fully keyboard-navigable with proper ARIA (`aria-expanded`, `aria-haspopup`, menu roles).
- **Navbar links:** Gear Store and About Us (`NAV_LINKS`), as `NavLink`s so the current page keeps its underline. They need 768px beside the wordmark and Sign in, so below that they are in the logo menu.
- **Navbar on phones:** below 640px the wordmark steps down in size. Below 420px the signed-out Sign in button is an icon button with the same name. Together the bar fits search, theme and account from 360px wide.
- **Static page paths** (in `ROUTES`): `/privacy-terms`, `/cancellation-refund`, `/affiliate-disclosure`.
- **Search overlay:**
  - opens from the navbar icon and the `/` key
  - debounce 300 ms, minimum 2 chars
  - grouped results (Tours / Gear); a gear result opens the store searched for it (`/gear?q=<name>`), since gear has no page of its own
  - results are real links: Arrow Down / Up move focus between the box and the results, Enter in the box opens the first result, Escape closes
  - it is a `Modal` with `placement="top"`, and it closes when the location changes
- **Footer:** on `/v/:verticalKey` (a known key) the terrain line above it sits in `data-vertical`, so it is that vertical's ink; elsewhere it is route orange.
- **Motion** (rules in `/DESIGN.md`; the CSS is in `styles/index.css`):
  - page arrival: `PageLayout` keys the outlet's wrapper by `pathname` with `animate-page-in`, so a path change remounts the page and a search-param change does not
  - scroll reveal: wrap a block in `Reveal`, or a group in `<Reveal stagger>` (its direct children rise in turn). A block replays each time the page scrolls back down to it; one already scrolled past stays put. `SectionHeader`, `FieldBand`, `TourGrid`, `GearGrid` and the home terrain already do. The hidden state is CSS on `data-reveal` without `data-revealed`, and only under `prefers-reduced-motion: no-preference`
  - do not put `Reveal` on an element that has its own `transition-*` utility; wrap it instead
  - parallax (`parallax-photo`, `parallax-pattern`) is CSS scroll-driven animation behind `@supports`; no scroll listeners
  - survey marks: `ParticleField` is one fixed canvas behind the page (`-z-10`), mounted once in `PageLayout`. Its frame loop reads `window.scrollY` itself (still no scroll listener) and `lib/particles.js` does the movement, so the numbers are tested without a canvas. Its inks are read from the tokens and read again when `data-theme` changes. With reduced motion it draws once and runs no loop. Anything with a solid ground covers the marks; a section with no background of its own shows them
  - jsdom has no canvas: `src/test/setup.js` makes `getContext` return `null`, and the field does nothing without a context
- **Vertical page:** a key outside the six in `VERTICALS` renders the not-found page without a request. The hero never waits for data: it renders at once as the vertical's field with the name from `VERTICALS`, takes the subtitle, description and photo from the cached `GET /verticals` list when the home page has loaded it (`useVerticals({ enabled: false })`, which never fetches), and then from the vertical's own response. Only the tour grid shows a skeleton, and the suggested gear follows once the vertical has loaded. `data-vertical` sits on the page wrapper. The suggested gear's category chip is local state and is sent to `GET /gear` as `category`.
- **Tour page:** a 404 or a rejected slug renders the not-found page. Like the vertical hero, the tour hero does not wait when the visitor comes from a listing: `useTourPreview(slug)` finds the tour's card (and its vertical) in the cached `GET /verticals/:key` responses without fetching, the hero renders from it, and only the part under the hero shows a skeleton until the tour arrives. The hero stays mounted when it does. A direct visit has no card, so the hero is a `BandSkeleton` until the tour arrives. `TourCard` calls `usePrefetchTour` on pointer enter and on focus, so the tour is usually loaded before Explore is pressed. The package section has the id `book` (`BOOKING_SECTION_ID`), the target of the hero's View packages; it scrolls itself into view because the tour loads after the router has handled the hash. **Book this trip** sits under the packages on desktop and in a bar pinned to the bottom of the screen below 1024px (`BookingBar`); both carry the chosen package into the modal.
- **Gear store:** `q`, `category`, `climate`, `tag`, `sort`, `page` live in the URL; a value equal to its default is left out. A filter change returns to page 1 and keeps the scroll position; a page change scrolls to the top. Typing in the search box replaces the history entry. `q` is sent to the API only between 2 and 64 characters.
- **`useUrlFilters`** builds each change on its own latest params, not the last render's: the router moves the URL before React renders it, and two quick changes would otherwise undo each other.
- **Booking:**
  - the modal is opened by the URL: `?book=<tour slug>`, plus `tier=<id>` to start on a package, on whatever page the visitor is. Every Book link is `bookingLink(slug, tierId)`; closing removes the two params. `BookingModal` is mounted once, in `PageLayout`, and loads the tour itself
  - Confirm for a signed-out visitor or an incomplete profile saves the intent and goes to `/signin?next=…` or `/onboarding?next=…` with the current URL as `next`
  - a booked trip renders `<Navigate>` to the ticket; nothing navigates from the mutation
  - the start date is a native date input with `min` tomorrow (IST) and `max` 365 days ahead; zod checks the same window on submit
  - `TOUR_UNAVAILABLE` and other failures show inline above Confirm; a rejected `startDate` shows on the field
  - the total updates live (`tier.pricePerPerson × travelers`)
  - recommended gear shows as links only
  - the button reads **Confirm Booking**, never "Pay"
  - the displayed total is for UX only; the server computes the real price
  - on success, go to the ticket page
- **Ticket page:** "Download PDF" requests `/bookings/:bookingNumber/ticket` as a blob and saves it as `Adventuro-{bookingNumber}.pdf`. A 404 or a rejected booking number renders the not-found page. The booking number is the page's `h1`.
- **My Bookings:** 10 per page, `page` in the URL. A list, not a table: stacked blocks on phones, columns under a header row from 768px. Each row opens its ticket. The empty state links to the home page's Choose Your Adventure (`ROUTES.ADVENTURES`).
- **Static pages:** one `StaticPage` for the three policy paths; the path is the key into `STATIC_PAGES`. Every page shows `REVIEW_NOTICE` until the client approves the copy.
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
- **E2E fixtures** (`e2e/fixtures.js`): import `test` from there. It answers for the demo photos' host (`picsum.photos`) with a flat placeholder so the suite does not depend on the network, and `watchForErrors` skips requests the app cancelled itself. `screenshot` with `fullPage` is taken with reduced motion, so blocks still waiting below the screen are drawn. It gives every test its own `X-Forwarded-For` (the harness rate-limits per IP) and `signInAs('customer' | 'incompleteCustomer' | 'admin')`, which injects that user's cookie from `/e2e/.auth.json`. `watchForErrors` ignores exactly one console line: the browser's own report of the 401 from `GET /auth/me` for a signed-out visitor.
- Specs that change harness users (`account changes` in `account.spec.js`) run on the desktop project only and need a fresh harness: stop a harness left running before `npm run e2e`. Stop a dev backend on port 5000 too: Playwright reuses whatever answers there, and the suite would then run against the dev database.
- **Accessibility:** `e2e/a11y.spec.js` runs axe (WCAG 2.1 A and AA) on every route, the booking modal, the logo menu and the search overlay, in both themes at both widths, and fails on any serious or critical violation (`findA11yViolations` in `e2e/fixtures.js`). `/onboarding` is checked inside `account.spec.js`.
- The harness has one incomplete user, and a profile can be completed once. Only the serial test in `account.spec.js` may use `incompleteCustomer`: it covers the guard, onboarding and the booking that waited for it.
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
3. `npm audit` reports 0 vulnerabilities, and `npx knip` reports nothing.
4. There are no hardcoded colors or fonts, no duplicated markup, no unused files or dependencies, and no `console.*`.
5. Every new data view uses `QueryBoundary`. Every error shown to users comes from `lib/errors.js`.
