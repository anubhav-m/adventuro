# Frontend — Adventuro customer app

Read `/CLAUDE.md` first. It holds the product rules, the **UI flow** (page structure), the API envelope, the error codes, and the auth flow. This file covers how the customer app is built.

Visual design is decided. Read `/DESIGN.md` (rules) and `/PRODUCT.md` (audience and brand) before building UI.

- Tokens come from `/design/theme.css`, copied unchanged to `src/styles/theme.css` at scaffold. Never edit the copy; change `/design/theme.css` and copy it again.
- `src/styles/index.css` maps the tokens into Tailwind v4 exactly as `/design/tailwind-tokens.md` describes, and loads the three Google Fonts named there.
- Every color, radius, shadow, and font comes from those tokens. Never hardcode a hex value or font in a component.
- A vertical's theme is applied by putting `data-vertical="{key}"` on the page or section wrapper and using the `accent` utilities inside it. Components never name a vertical's colour.

## Stack

- React + Vite, JavaScript (ES modules, `.jsx`)
- React Router (latest), with lazy-loaded routes
- TanStack Query for **all** server state
- `react-hook-form` + `zod` + `@hookform/resolvers` for forms
- Tailwind CSS v4 (CSS-first config in `src/styles/index.css`, no `tailwind.config.js`)
- `lucide-react` for icons, `sonner` for toasts
- Google Identity Services, loaded directly from `https://accounts.google.com/gsi/client` and wrapped in one component. No wrapper library.
- Dev tools: Vitest, React Testing Library, MSW, ESLint (flat config + react-hooks plugin), Prettier

Install everything at its latest stable version. Don't add a UI kit or a date library: use native `<input type="date">` and `Intl`.

## Scripts

`dev`, `build`, `preview`, `lint`, `format`, `test`, `test:watch`.

## Environment

| Var | Notes |
|---|---|
| `VITE_API_BASE_URL` | default `/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | |

- In dev, Vite proxies `/api` to `http://localhost:5000`.
- In production, `vercel.json` rewrites `/api/*` to the backend, keeping the cookie first-party.
- Never put secrets in `VITE_` vars.

## Folder structure

```
frontend/src/
├── main.jsx
├── App.jsx                    # providers: QueryClient, Theme, Router, Toaster
├── router.jsx                 # route table, lazy pages, guards
├── styles/
│   ├── index.css              # tailwind import, token mapping, base styles (per /design/tailwind-tokens.md)
│   └── theme.css              # copy of /design/theme.css
├── api/
│   ├── client.js              # fetch wrapper: credentials 'include', JSON, unwraps envelope, throws ApiError
│   ├── ApiError.js            # { status, code, fieldErrors }
│   ├── queryKeys.js           # single query-key factory
│   └── auth.api.js, users.api.js, verticals.api.js, tours.api.js, gear.api.js,
│       taxonomies.api.js, bookings.api.js, search.api.js, newsletter.api.js
├── hooks/
│   ├── queries/               # useMe, useVerticals, useVertical, useTours, useTour, useGearList,
│   │                          # useTaxonomies, useMyBookings, useBooking, useSearch
│   ├── mutations/             # useGoogleSignIn, useSignOut, useUpdateProfile, useCreateBooking, useSubscribe
│   ├── useTheme.js
│   ├── useDebounce.js
│   └── useUrlFilters.js       # read/write filters to URL search params
├── components/
│   ├── ui/                    # Button, IconButton, Card, Badge, Chip, ChipGroup, Input, Select, Field,
│   │                          # Modal, Dropdown, Stepper, Skeleton, Spinner, Pagination,
│   │                          # EmptyState, ErrorState, Price, SectionHeader
│   ├── layout/                # PageLayout, Navbar, LogoMenu, AccountMenu, ThemeSwitcher,
│   │                          # SearchOverlay, Footer, NewsletterForm
│   ├── verticals/             # VerticalCard, VerticalHero
│   ├── tours/                 # TourCard, TourGrid, TourHero, ItineraryTimeline, SignatureActivity,
│   │                          # InclusionList, ReportingInfo, TierSelector
│   ├── booking/               # BookingModal, BookingForm, TravelerStepper, PriceSummary, Ticket
│   ├── gear/                  # GearCard, GearGrid, GearFilters, SuggestedGear, AffiliateDisclosure
│   ├── auth/                  # GoogleSignInButton, RequireAuth, RequireCompleteProfile
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
└── lib/
    ├── errors.js              # getErrorMessage(err), getFieldError(err, field)
    ├── format.js              # formatPrice (Intl en-IN INR, 0 decimals), formatDate (IST, "15 Sep 2026")
    ├── constants.js           # VERTICALS meta (key, name, route, icon from /DESIGN.md), THEME, limits
    ├── schemas.js             # zod form schemas (profile, booking, newsletter)
    └── storage.js             # safe localStorage/sessionStorage helpers (try/catch)
```

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

- `api/client.js` throws `ApiError { status, code, fieldErrors }`. **Never render `error.message` from the server, stack traces, or status numbers.**
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

- `useMe()` (`GET /auth/me`) is the source of truth for the session. A 401 means signed out. Don't keep a duplicate auth context.
- `GoogleSignInButton` loads the GIS script once, renders the button, and on callback runs `useGoogleSignIn` (`POST /auth/google`). Afterwards:
  - profile incomplete → `/onboarding?next=…`
  - otherwise → `next`, or home
- Guards:
  - `RequireAuth`: `/account`, `/account/bookings`, `/bookings/:bookingNumber`
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
- Always mirror the resolved value to localStorage. A tiny inline script in `index.html` applies it before first paint so there's no flash.

## Behavior requirements from the UI flow

- **Logo menu:** opens on hover, focus, click, and tap. Closes on Escape, outside click, and route change. Fully keyboard-navigable with proper ARIA (`aria-expanded`, `aria-haspopup`, menu roles).
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
- **Newsletter:** always shows the same success message ("You're on the list!"), whether the email is new or existing.
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

- Vitest + React Testing Library, with MSW mocking the API using the real envelope shape.
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
