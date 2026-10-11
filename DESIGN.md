---
name: Adventuro
description: A flat-ink terrain map of India on a black wall. Five travel worlds, each a field of its own colour and drawn pattern, crossed by one route.
colors:
  wall: "#121212"
  bone: "#f1ede4"
  surface-dark: "#1b1b1a"
  surface-raised-dark: "#252523"
  surface-light: "#faf8f3"
  surface-raised-light: "#ffffff"
  text-muted-dark: "#b5b0a6"
  text-muted-light: "#55514a"
  border-dark: "#3b3a37"
  border-light: "#d2ccbf"
  route-orange: "#ff6a1a"
  tide-lagoon: "#19c2c9"
  saga-marigold: "#f2a81d"
  peak-cobalt: "#1f58f2"
  elite-bottle-green: "#14734e"
  urban-rani-pink: "#ff3d7f"
  success-dark: "#5bd08f"
  warning-dark: "#f2c14e"
  danger-dark: "#ff7a7a"
  info-dark: "#7fb0ff"
typography:
  hero:
    fontFamily: "Archivo, 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(2rem, 11vw, 9rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Archivo, 'Arial Black', system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "'Libre Caslon Text', Georgia, serif"
    fontSize: "clamp(1.25rem, 2.2vw, 2.125rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body-lg:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  plate: "4px"
  field: "10px"
  panel: "16px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  section: "clamp(4rem, 9vw, 8rem)"
  content: "80rem"
  prose: "42rem"
components:
  button-primary:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.wall}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 28px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 28px"
  button-on-accent:
    backgroundColor: "{colors.wall}"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 28px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.bone}"
    rounded: "{rounded.plate}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface-raised-dark}"
    textColor: "{colors.bone}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 14px"
---

# Design System: Adventuro

The frontmatter lists the palette for reading and tooling. **The shipped values live in `/design/theme.css`**, which both apps copy. If the two ever disagree, `theme.css` is right and this file gets fixed.

## Overview

**Creative North Star: "The Terrain Sheet"**

India drawn as one cross-section, coast to peak, in flat ink on a black wall. Each of the five travel verticals is a terrain: a solid field of one loud colour with one hand-drawn pattern in it. Grand India Tour is the dashed orange route that crosses all five. The page is the map; the verticals are places on it you can enter.

It comes from two things the project owner chose and asked to be blended: the terrain cross-section of a survey map, and the loud silkscreen colours of a skate-shop wall.

The scene that sets the theme: someone in their twenties, on a phone, late in the evening, deciding where to go for a long weekend. Dark is the lead theme and gets the first design pass on every screen. Light is the same sheet printed on bone paper, and it must be just as finished. The default stays `system`.

This system rejects what the client's first reference did: navy gradients, glassy cards, glow, darkened stock photos behind centred text, and a different neon accent on every label.

**Key Characteristics:**
- Flat ink only. Colour is a solid field, never a gradient, glow, or tint wash.
- A vertical owns a whole region of the page, not an accent on a neutral card.
- Two grounds: grip black and bone. Text is bone on black or black on bone.
- One very wide, very heavy display face; one plain text face; one italic serif used sparingly.
- Controls are pills. Containers are square-cornered plates.
- No purple, in either theme.

### How much colour, where

| Surface | Colour level |
|---|---|
| Home, vertical pages, tour hero | Full: vertical fields and patterns at page scale |
| Tour detail body, gear store, search | The current vertical's accent on a few elements; neutral grounds |
| Booking, ticket, account, sign-in, static pages | Neutral grounds; the tour's vertical appears once (a chip or one field) |
| Admin app | Neutral only; vertical inks appear as small chips and chart series |

## Colors

Six loud inks on two quiet grounds.

### Primary
- **Bone** / **Grip Black** (`--color-primary`, `--color-on-primary`): the primary action is always the inverse of the ground: a bone pill on black, a black pill on bone. It never takes a vertical's colour, so it reads the same everywhere.

### Secondary
- **Route Orange** (`--color-brand`): the brand's own colour and Grand India Tour's ink. It is the default accent outside any vertical, the route line, links (`--color-brand-text`), and text selection.

### Tertiary: the vertical inks

Each vertical has four tokens. `accent` and `on-accent` are the same in both themes; `accent-text` and `accent-tint` change per theme.

| Vertical (`data-vertical`) | Ink | Name | Text on it | Pattern | Icon (lucide) |
|---|---|---|---|---|---|
| `tidetrail` | `#19c2c9` | Lagoon | black | Rows of waves | `Waves` |
| `goldensaga` | `#f2a81d` | Marigold | black | Dune stipple (offset dots) | `Tent` |
| `peakpulse` | `#1f58f2` | Cobalt | white | Contour lines rising to a peak | `Mountain` |
| `elitescape` | `#14734e` | Bottle Green | bone | Charbagh garden plan (quartered squares, round pool) | `Gem` |
| `urbanecho` | `#ff3d7f` | Rani Pink | black | Street-block grid | `Building2` |
| `grand-india-tour` | `#ff6a1a` | Route Orange | black | Dashed route line | `Route` |

- `--color-accent-{key}`: the solid field. Backgrounds of bands, heroes, chips, fallback image plates.
- `--color-on-accent-{key}`: text, icons, and pattern lines on that field.
- `--color-accent-text-{key}`: the ink adjusted so it passes as text on neutral grounds in that theme.
- `--color-accent-tint-{key}`: a quiet tinted ground for selected rows, info panels, and the booking summary.

Put `data-vertical="{key}"` on a page or section and use the unsuffixed `--color-accent`, `--color-on-accent`, `--color-accent-text`, `--color-accent-tint`, and `--pattern-accent`. Components never name a vertical.

### Neutral
- `--color-bg`: the wall (`#121212`) or the sheet (`#f1ede4`).
- `--color-surface`: cards and plates. `--color-surface-raised`: inputs, menus, modals. `--color-surface-sunken`: footer and wells.
- `--color-border`: quiet dividers. `--color-border-strong`: edges of inputs and outline controls (3:1 on every ground).
- `--color-text`, `--color-text-muted` (secondary copy), `--color-text-subtle` (meta and placeholders). All three pass 4.5:1 on every neutral ground.

### Status
`--color-success`, `--color-warning`, `--color-danger`, `--color-info`, each with a `-tint` ground. Booking status: confirmed uses info, completed uses success, cancelled uses danger. Always with the word, never colour alone.

### Named Rules

**The Flat Ink Rule.** No gradients, glows, blurs, glass, or transparent colour washes. A colour is either fully there as a field or not there.

**The One Field Rule.** One vertical per region. Two inks meet only edge to edge along the terrain line, never one inside another.

**The Ink Asks Rule.** The main action is bone or black. On a vertical's field, the button is `--color-on-accent` with `--color-accent` text.

**The No Purple Rule.** No purple or violet anywhere. UrbanEcho is rani pink.

**The Light Field Rule.** In the light theme the lagoon, marigold, pink, and orange fields are under 3:1 against bone. They are fine as large fields with text inside. As a small control (chip, dot, bar) on the sheet they take a `--border-ink` black edge.

### Verified contrast

Checked with a script on 2026-10-11: every text token on every neutral ground, every `accent-text` on every ground and on its own tint, every `on-accent` on its field, every status colour on its tint, primary and brand buttons, and `border-strong` on every ground. **196 pairs, 0 failures**, in both themes (WCAG AA: 4.5:1 text, 3:1 UI edges).

| Theme | Lowest text pair | Lowest UI edge |
|---|---|---|
| Dark | 5.00, bone on Bottle Green | 4.19, `border-strong` on `surface-raised` |
| Light | 4.62, TideTrail `accent-text` on `surface-sunken` | 3.51, `border-strong` on `surface-sunken` |

Any token change must be re-checked against the same pairs.

## Typography

**Display Font:** Archivo (Google Fonts, variable `wdth` 62–125 and `wght` 100–900), set at `font-stretch: 125%` and weight 900.
**Body Font:** Onest (Google Fonts, variable 100–900).
**Italic Font:** Libre Caslon Text, italic only.

Load as: `Archivo:wdth,wght@62..125,400..900`, `Onest:wght@400..800`, `Libre+Caslon+Text:ital@1`, with `display=swap`.

**Character:** Archivo at full width and full weight is the lettering on the sheet: blunt, wide, immovable. Onest does the reading and the interface. Caslon italic is the map-maker's hand for seas and taglines, a second voice used once per section at most.

### Hierarchy
- **Hero** (`--text-hero`, Archivo 125/900, line-height 0.9, tracking -0.03em): the ADVENTURO wordmark on the home page only. Uppercase.
- **Display** (`--text-h1`, `--text-h2`, Archivo 125/900, line-height 1.1): page titles, vertical names, section headings. Sentence or title case, not uppercase.
- **Lead** (`--text-lead`, Caslon italic 400): the tagline, a vertical's subtitle, a tour's tagline.
- **Title** (`--text-h3`, `--text-h4`, Onest 800): card titles, tier names, panel headings.
- **Body** (`--text-body`, Onest 400, line-height 1.55): copy, capped at `--container-prose`. `--text-body-lg` for intros.
- **Label** (`--text-sm`, Onest 700): buttons, chips, form labels, table headers.
- **Meta** (`--text-xs`, Onest 500): captions and helper text. Nothing smaller.

### Named Rules

**The One Loud Voice Rule.** Archivo expanded is for names and headings only. Never for body, buttons, chips, or anything under 24px (except the navbar wordmark on phones, see Navigation).

**The No Label-On-Top Rule.** No small uppercase label above a heading. The vertical page's "Ecosystem Vertical" badge is a chip with the vertical's icon, set beside or below the name.

**The Figures Rule.** Prices, dates, booking numbers, and traveler counts use `font-variant-numeric: tabular-nums`. Prices are Onest 800.

## Layout

- Content width `--container-content` (80rem), side padding `--space-gutter`. Vertical fields and the terrain run full-bleed past it.
- Sections are separated by `--space-section`. More space above a heading than below it.
- Compose left-aligned and asymmetric. Do not centre a headline over a subtitle over two buttons.
- Grids: tour cards 1 / 2 / 3 columns at 0 / 640 / 1024px; gear cards 2 / 3 / 4.
- Breakpoints are Tailwind's defaults (640, 768, 1024, 1280).
- Touch targets are at least 44px.

### The terrain line

Where a vertical's field meets the ground above it, the edge is a drawn profile (a wave crest, a dune, a flat street line, a peak, a still lake), not a straight rule and not a rounded card. It is an inline SVG path with `preserveAspectRatio="none"`, filled with `--color-accent`. This is the seam used at the top of the vertical hero, the terrain section, and the footer.

### Phone

- Below 1280px the terrain section becomes five stacked full-width fields, each at least 96px tall with its own profile on top, in the same coast-to-peak order. Each profile is cut into the field above it, and Grand India Tour is a route-orange row on top of the stack. (Five bands side by side need 1280px for the names to fit at 24px.)
- The hero wordmark stays on one line: `--text-hero` is `clamp(2rem, 11vw, 9rem)`, which keeps it inside the content width from 320px up to the 80rem container.
- The booking panel becomes a sheet pinned to the bottom with the live total and Confirm Booking.

## Elevation & Depth

Flat. Depth comes from ground steps (`bg` → `surface` → `surface-raised`) and 1px borders, never from shadow on resting content.

### Shadow Vocabulary
- `--shadow-raised`: dropdowns, the logo menu, the search results panel.
- `--shadow-overlay`: modals and bottom sheets, over `--color-overlay`.

### Named Rules

**The Flat At Rest Rule.** Cards, buttons, chips, and inputs have no shadow in any state. Hover changes fill or border, and may move the element (a card lifts 4px); it never adds a shadow.

## Shapes

- **Pills** (`--radius-pill`): everything you press: buttons, chips, the theme switcher, pagination, steppers.
- **Plates** (`--radius-plate`, 4px): everything that holds content: cards, images, tables, the ticket.
- **Fields** (`--radius-field`, 10px): inputs, selects, textareas.
- **Panels** (`--radius-panel`, 16px): modals, sheets, dropdown menus.
- Borders are `--border-hairline` (1px) for dividers and `--border-ink` (2px) for outline buttons and photo plates.
- No coloured side stripe on cards or alerts. No nested cards.

## Components

Every interactive element has hover, focus-visible, active, and disabled states. Focus is two rings so it shows on any ground: `outline: 2px solid var(--color-focus-inner); outline-offset: 2px; box-shadow: 0 0 0 6px var(--color-focus-outer)`.

### Buttons
- **Primary:** `--color-primary` fill, `--color-on-primary` text, pill, Onest 800. Height 52px (44px small). Hover: `--color-primary-hover`.
- **Secondary:** transparent, 2px `--color-text` border, `--color-text` label. Hover: fills with `--color-text`, label flips to `--color-bg`.
- **On a vertical field:** `--color-on-accent` fill, `--color-accent` label.
- **Ghost:** no border, `--color-text`. Hover: `--color-surface-raised`.
- **Danger:** `--color-danger` border and label on neutral ground. Used by admin destructive actions.
- **Buy (gear):** secondary button with an external-link icon; it opens another site.
- Loading keeps the button's width and shows a spinner beside the label. Disabled is 45% opacity with `cursor: not-allowed`.
- Icons are lucide at 1.75 stroke, 18px in buttons. Arrows are lucide icons, not typed characters.

### Chips
- Pill, 36px, Onest 700, 1px `--color-border-strong`.
- **Selected:** `--color-accent` fill with `--color-on-accent` text inside a vertical; `--color-text` fill with `--color-bg` text elsewhere.
- **Badge** (duration/difficulty, status): 28px, not interactive. On a photo it sits on a solid `--color-bg` plate, never on a translucent one.

### Cards / Containers
- `--color-surface`, 1px `--color-border`, plate radius, no shadow, 20px padding.
- **Tour card:** photo plate on top (4:3). Then state in `--color-accent-text`, title (Title), tagline in Caslon italic, up to three activity chips, and a footer row with "from" price left and Explore / Book right. The duration badge sits on the photo's top-left corner. Hover: border becomes `--color-accent`, the card lifts 4px, and the photo grows 5% inside its plate.
- **Gear card:** square image on `--color-surface-raised`, category, name, sale price with the MRP struck through in `--color-text-subtle`, Buy. Hover is the tour card's.
- **Vertical card (home):** not a card. It is a band of the terrain section.

### Inputs / Fields
- 48px, `--color-surface-raised`, 1px `--color-border-strong`, field radius, label above in Label style.
- Focus: the two-ring focus and a `--color-text` border.
- Error: `--color-danger` border, and a message below with an icon in `--color-danger`.
- Placeholders use `--color-text-subtle`.
- The traveler stepper is two 44px pill buttons around a tabular number.

### Navigation
- **Navbar:** `--color-bg`, no border until the page scrolls, then a 1px `--color-border` bottom edge. Wordmark left, the Gear Store and About Us links in Onest 600, icons right. Sticky. A link's 2px rule draws in from the left on hover and stays under the current page.
- **Theme toggle:** one icon button showing the current theme's icon (sun or moon). A press flips between light and dark; the icon turns into place. It opens no menu. `system` is where a visitor starts and can be chosen again on the account page.
- **Wordmark:** "ADVENTURO" in Archivo 125/900, uppercase, tracking 0.02em, `--color-text`. It is one component so a real logo can replace it. In the navbar it is 24px from 640px up, 20px from 420px, and 18px below that: at 24px it is 208px wide and the bar cannot hold it beside the menu button, theme switcher, and Sign in on a phone. This is the one place Archivo goes under 24px.
- **Navbar on phones:** the Gear Store and About Us links move into the logo menu below 768px. Below 420px the signed-out Sign in button becomes an icon button, so search, theme and account fit beside the wordmark from 360px.
- **Logo menu:** a panel listing the six verticals, each row a 12px square of its ink, its icon, and its name. The hovered row fills with that vertical's ink. Below 768px the navbar's links follow under a divider.
- **Footer:** `--color-surface-sunken`, topped by a terrain line in route orange. On a vertical's page the line is that vertical's ink.

### Modal and sheet
- Panel radius, `--color-surface-raised`, `--shadow-overlay`, on `--color-overlay`. Max width 560px; a bottom sheet under 640px.
- Title in Title style, a close icon button top-right. The primary action is bottom-right, or full width on phones.
- The search overlay is the same panel hung from the top at every width, so it grows downward as results arrive.

### Tables (admin, My Bookings)
- Header row in Label style on `--color-surface-sunken`. Rows separated by 1px `--color-border`. No zebra striping.
- Numbers are tabular and right-aligned. Row hover: `--color-surface-raised`.

### Signature: the terrain section (home, "Choose Your Adventure")

The home page's vertical picker and its most recognisable element. Reference sketch: `design/reference/home-hero.html` (open it in a browser; it has a light/dark toggle).

- Five bands side by side, in this order: TideTrail, GoldenSaga, UrbanEcho, PeakPulse, EliteScape. Together their top edges make one continuous ground profile: sea level, a dune, a flat city block with a skyline, a peak, a palace on a lake.
- Each band is a solid field of its ink. Its pattern fills the upper part only; the lower part is plain so the name and one-line description sit on flat colour.
- Each band is one link: name in Display, the one-liner in Label, an arrow icon.
- Grand India Tour is the dashed route-orange line that runs through the sky above all five and ends in a ring. It starts from a route-orange pill that links to the Grand India Tour vertical.
- Hover or focus on a band: it rises 8px and its pattern grows to fill the band above its label, which stays on flat colour.
- It is not a carousel. Nothing scrolls sideways at any width, so it has no previous / next controls.

### Signature: the vertical hero (`/v/:verticalKey`)

- The whole hero is the vertical's field, full-bleed, with its pattern across the top third and a terrain line as its bottom edge.
- Left: the name in Display, the subtitle in Caslon italic, the description in Body, all in `--color-on-accent`.
- The tour hero (`/tours/:slug`) is the same field without the pattern strip: title, tagline, facts as outline badges, and the cover photo at 16:9.
- Right: the vertical's hero photo as a plate with a 2px `--color-on-accent` border. If there is no photo, the pattern takes that space.

### The ticket (`/bookings/:bookingNumber`)

- One plate on `--color-surface`, split by a dashed 1px rule into a main part and a stub.
- The booking number is the largest thing on it (Onest 800, tabular). Reporting time and location come next, at Title size, above everything else.
- The tour's vertical appears once: a solid band of its ink across the top with the vertical name.
- Status is a badge with a word.

### Images
- Photos are always shown as plates: sharp, uncropped by shapes, with nothing laid over them except a badge on a solid plate.
- Never darken a photo to put text on it. Text goes on a field or a ground beside the photo.
- Ratios: tour card 4:3, tour hero and gallery 16:9, vertical hero 4:5 on desktop and 16:9 on phones, gear 1:1. `object-fit: cover`.
- Missing image: the vertical's field and pattern, with its icon. For gear: `--color-surface-raised` with the category icon.
- While loading: a flat `--color-surface-raised` block that fades in over `--duration-base`. No shimmer sweep.

### Motion
- `--duration-fast` (120ms) for hover and press; `--duration-base` (200ms) for menus, chips, and fades; `--duration-slow` (420ms) for the modal, sheet, and terrain. Easing is `--ease-out`; `--ease-in-out` only for things that move and return.
- **Page arrival:** every page rises 16px and fades in over `--duration-slow` when the path changes. A change of search params (filters, the booking modal) is the same page and does not replay it.
- **Scroll reveal:** a section heading, a field band, and a grid of cards rise 24px and fade in as they come on screen, over 1.5 × `--duration-slow`. The items of a group follow one another 70ms apart (capped at the eighth). A block the page has scrolled past stays in place; one that drops back below the screen goes out of sight at once and rises in again on the way down.
- **The terrain:** each time it comes on screen the bands rise into place left to right and the route line draws itself across them.
- **Hover and press:** cards lift 4px and their photo grows 5%; arrows on a card or band slide 4–6px toward where they point; buttons press in to 97% (icon buttons to 90%). Menus drop in from 8px above.
- **Parallax:** a field band's photo drifts ±6% inside its plate as the plate crosses the screen, and the vertical hero's pattern strip slides under the scroll. Both are CSS scroll-driven animations, so a browser without them shows the page still. Nothing else moves with the scroll, and text never does.
- Motion stays flat: it moves and fades things, and never adds a shadow, blur, or glow.
- `prefers-reduced-motion: reduce`: no movement at all. Nothing waits to be revealed, the terrain is simply there, the route line is drawn, there is no parallax, and state changes are instant or a fade of at most `--duration-fast`.

### Browser surfaces
- Text selection: `--color-brand` background, `--color-on-brand` text.
- Caret and `accent-color`: `--color-accent-text`.
- Scrollbars: `scrollbar-color: var(--color-border-strong) var(--color-bg)`.
- Links in copy: `--color-brand-text`, underlined, `text-underline-offset: 0.2em`.

### Admin app

Same tokens, calmer and denser. It is a working tool.

- Neutral grounds only. No vertical fields, no patterns, no terrain line.
- Onest for everything. Archivo appears only in the sidebar wordmark and the page title (at `--text-h3`).
- Density: table and form text at `--text-sm`, rows 44px, controls 40px, page padding 24px.
- A vertical shows as a small chip: a 10px square of its ink plus its name.
- Charts: per-vertical series use the six inks; single-series charts use `--color-text`; grid lines use `--color-border`. Every series also has a text label or legend, because lagoon, marigold, and pink are close in lightness.
- Booking value is labelled "booking value", never revenue.

## Do's and Don'ts

### Do:
- **Do** give a vertical a whole region: a full-bleed field in its ink with its pattern.
- **Do** keep the primary action bone-on-black or black-on-bone everywhere.
- **Do** design the dark theme first and finish the light theme to the same standard.
- **Do** show photos as clean plates with text beside them.
- **Do** use `data-vertical` and the unsuffixed accent tokens; let the theme file decide the colours.
- **Do** pair every colour signal (vertical, status) with a word or an icon.
- **Do** use the terrain line where a field meets the ground.

### Don't:
- **Don't** use purple or violet, in either theme.
- **Don't** use gradients, glow, blur, glass, or translucent colour.
- **Don't** put text over a darkened photo.
- **Don't** put a small uppercase label above a heading.
- **Don't** centre a hero headline over a subtitle over two buttons.
- **Don't** colour the primary button with a vertical's ink on neutral ground.
- **Don't** mix two verticals' inks inside one component.
- **Don't** add shadows to cards, or a coloured stripe down a card's side.
- **Don't** set Archivo expanded below 24px (the navbar wordmark on phones is the only exception) or in uppercase outside the wordmark.
- **Don't** hardcode a hex value, font name, radius, or shadow in a component.
- **Don't** invent proof: no ratings, traveler counts, testimonials, or safety badges.
