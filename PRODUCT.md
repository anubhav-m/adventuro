# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Customer app (`frontend/`).** Young adults in India, 22–35: working professionals and students who book with friends or a partner. They are mostly on a phone, often on mobile data, and they arrive from Instagram travel pages, creator reels, and trek-operator sites. They are choosing a trip for a long weekend or a week off, and they compare by destination, what they will actually do there, and price per person.

**Admin app (`admin/`).** The Adventuro team: a small number of staff on laptops who manage tours, gear, images, and bookings, and who read the dashboard. They use it for long sessions and need to find and edit things quickly.

## Product Purpose

Adventuro sells curated travel experiences across six travel verticals and recommends the gear for each trip. A customer discovers a tour, books it (no payment in this phase), receives a ticket, and finds the gear that trip needs through affiliate links.

Success for the prototype: a visitor understands the six verticals at a glance, picks one, finds a tour, and completes a booking without help. The client sees their brand taken seriously.

## Positioning

- **Every trip has a signature activity.** The brand idea is "travel should be experienced, not simply visited," so each tour is built around one thing the destination is known for (parasailing in Goa, an ATV ride in the Thar).
- **Six travel worlds, one brand.** Each vertical is a distinct style of travel with its own character, not a filter on one catalogue.
- **Trip and gear together.** The gear a trip needs is shown next to the trip.

## Operating Context

- Discovery is mobile and visual. Booking a tour takes four inputs: tier, travelers, start date, confirm.
- The ticket page and its PDF are what the customer carries on the day: booking number, reporting time, and reporting location.
- Tour and vertical photos are uploaded by the admin, so their quality varies. Starter images ship with the demo seed and can be replaced from the admin app.
- Gear purchases happen on other sites through affiliate redirects.

## Capabilities and Constraints

Product rules, scope, UI flow, and API contracts live in `/CLAUDE.md` and are not repeated here. The ones that shape design:

- Six fixed verticals: TideTrail, GoldenSaga, PeakPulse, EliteScape, UrbanEcho, Grand India Tour.
- Light and dark themes are both required. The user chooses System, Light, or Dark.
- No payment. The action is **Confirm Booking**, never "Pay".
- Prices are whole rupees (₹14,999).
- Gear is affiliate-only (Phase 1). No Adventuro-branded product badges or filters.
- India-only destinations for now. Nothing in the design may assume India-only forever.
- Out of scope and never to be hinted at in the UI: payments, Memory Book, creator adventures, outlets, blog, community stories, emergency hotline.

## Brand Commitments

- Name: **Adventuro**.
- Tagline: "From Coast to Camp, Peak to Palace."
- Line: "One India. Infinite Adventures."
- Promise: Discover • Experience • Equip • Remember.
- Philosophy: "We don't just take you there. We make you experience it."
- **Each vertical has its own recognisable theme.** This is the one thing kept from the client's reference.
- **No purple in dark mode.** Confirmed by the project owner: purple on dark reads as machine-made.
- The logo in the client's reference is a placeholder. The design system sets a typographic wordmark that can be replaced when a real logo exists.
- The rest of the client's reference (dark navy base, glassy cards, amber and cyan buttons, centred heroes) is not binding and is treated as what to move away from.

### Vertical character (from the founder vision)

| Vertical | Covers | Experience idea |
|---|---|---|
| TideTrail | Beaches, islands, coastal escapes, water | Relaxation plus one memorable water or coastal activity |
| GoldenSaga | Deserts, royal destinations, heritage, camps, local traditions | An authentic desert or cultural experience |
| PeakPulse | Mountains, treks, nature, camping, snow | Adventure and nature |
| EliteScape | Luxury stays, honeymoons, private trips | Comfort, exclusivity, personalisation |
| UrbanEcho | City breaks, food, local culture, shopping, nightlife | Experience the city like a local |
| Grand India Tour | One larger journey across mountains, beaches, deserts, heritage, cities | The diversity of India in one trip |

## Evidence on Hand

- Founder vision document: `screenshots/Adventuro_Founder_Vision.pdf`. Used only for vertical character.
- Client reference screens: `screenshots/*.png`. An anti-reference, apart from per-vertical theming.
- Demo content from `backend` (`npm run seed:demo`): 17 tours, 23 gear items, vertical hero images.
- There are no testimonials, ratings, traveler counts, safety certifications, press, or partner logos. Do not invent any. The hero stat chips in `/CLAUDE.md` (5 verticals, 28+ states, 100% curated, memories) are the client's own copy.

## Product Principles

1. **The activity sells the trip.** Lead with what the traveler will do, then where, then the price.
2. **Six worlds, one house.** A vertical should be recognisable on its own, and still clearly Adventuro.
3. **Booking is short and honest.** Show the total live, say plainly that nothing is charged, and put the reporting details where they cannot be missed.
4. **Gear supports the trip.** It appears beside tours as a recommendation, is never in the total, and is always disclosed as affiliate.
5. **Content is the admin's.** Every layout must hold with an average photo, a long title, or a missing image.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast in both themes: 4.5:1 for body text, 3:1 for large text and UI boundaries.
- Full keyboard operation, visible focus, focus trapped in modals and restored on close.
- `prefers-reduced-motion` is respected.
- Vertical identity is never carried by colour alone: every vertical also has a name and an icon.
