# Mapping the theme tokens into Tailwind

Both apps use Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`). The mapping below was tested against `tailwindcss` 4.3.3.

- `/design/theme.css` is the source of truth for values. `/DESIGN.md` says how to use them.
- Each app copies `/design/theme.css` to `src/styles/theme.css` unchanged. When a token changes, change it in `/design/theme.css` and copy it again to both apps.
- Components use only the utilities this mapping creates. No hex values, font names, radii, or shadows in components.

## `src/styles/index.css`

```css
@import 'tailwindcss';
@import './theme.css';

@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));

@theme inline reference {
  /* Remove Tailwind's default palette, radii, shadows, and fonts so only our tokens exist. */
  --color-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --font-*: initial;

  --color-bg: var(--color-bg);
  --color-surface: var(--color-surface);
  --color-surface-raised: var(--color-surface-raised);
  --color-surface-sunken: var(--color-surface-sunken);
  --color-border: var(--color-border);
  --color-border-strong: var(--color-border-strong);
  --color-text: var(--color-text);
  --color-text-muted: var(--color-text-muted);
  --color-text-subtle: var(--color-text-subtle);
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
  --color-on-primary: var(--color-on-primary);
  --color-brand: var(--color-brand);
  --color-on-brand: var(--color-on-brand);
  --color-brand-text: var(--color-brand-text);
  --color-brand-tint: var(--color-brand-tint);
  --color-accent: var(--color-accent);
  --color-on-accent: var(--color-on-accent);
  --color-accent-text: var(--color-accent-text);
  --color-accent-tint: var(--color-accent-tint);
  --color-success: var(--color-success);
  --color-success-tint: var(--color-success-tint);
  --color-warning: var(--color-warning);
  --color-warning-tint: var(--color-warning-tint);
  --color-danger: var(--color-danger);
  --color-danger-tint: var(--color-danger-tint);
  --color-info: var(--color-info);
  --color-info-tint: var(--color-info-tint);
  --color-overlay: var(--color-overlay);
  --color-focus-inner: var(--color-focus-inner);
  --color-focus-outer: var(--color-focus-outer);

  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-serif: var(--font-serif);

  --text-hero: var(--text-hero);
  --text-h1: var(--text-h1);
  --text-h2: var(--text-h2);
  --text-h3: var(--text-h3);
  --text-h4: var(--text-h4);
  --text-lead: var(--text-lead);
  --text-body-lg: var(--text-body-lg);
  --text-body: var(--text-body);
  --text-sm: var(--text-sm);
  --text-xs: var(--text-xs);

  --radius-plate: var(--radius-plate);
  --radius-field: var(--radius-field);
  --radius-panel: var(--radius-panel);
  --radius-pill: var(--radius-pill);

  --shadow-raised: var(--shadow-raised);
  --shadow-overlay: var(--shadow-overlay);

  --container-content: var(--container-content);
  --container-prose: var(--container-prose);

  --ease-out: var(--ease-out);
  --ease-in-out: var(--ease-in-out);
}
```

Why `inline reference`: the theme names match the token names, so the utilities must point straight at the tokens (`inline`) and Tailwind must not emit its own copy of each variable (`reference`). Without `reference` it writes `--color-bg: var(--color-bg)` on `:root`, which refers to itself.

## What you get

| Token group | Utilities | Example |
|---|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`, `outline-*`, `ring-*` | `bg-surface text-text-muted border-border` |
| Accent (follows `data-vertical`) | same, with `accent`, `on-accent`, `accent-text`, `accent-tint` | `bg-accent text-on-accent` |
| `--font-*` | `font-display`, `font-body`, `font-serif` | `font-display` |
| `--text-*` | `text-hero` … `text-xs` (font size) | `text-h2` |
| `--radius-*` | `rounded-plate`, `rounded-field`, `rounded-panel`, `rounded-pill` | `rounded-pill` |
| `--shadow-*` | `shadow-raised`, `shadow-overlay` | `shadow-overlay` |
| `--container-*` | `max-w-content`, `max-w-prose` | `max-w-content` |
| `--ease-*` | `ease-out`, `ease-in-out` | `ease-out` |

Tokens with no Tailwind namespace are used through arbitrary values:

| Token | Use |
|---|---|
| `--space-gutter`, `--space-section` | `px-(--space-gutter)`, `py-(--space-section)` |
| `--duration-fast`, `--duration-base`, `--duration-slow` | `duration-(--duration-base)` |
| `--border-hairline`, `--border-ink` | `border-(length:--border-ink)` |
| `--pattern-accent` | `bg-(image:--pattern-accent)` |
| `--leading-*`, `--tracking-*`, `--font-display-stretch` | set once in the base styles below |

Spacing inside components uses Tailwind's default 4px scale (`p-4`, `gap-6`).

## Base styles (same file, after the theme block)

```css
@layer base {
  html {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    line-height: var(--leading-body);
    scrollbar-color: var(--color-border-strong) var(--color-bg);
    accent-color: var(--color-accent-text);
    caret-color: var(--color-accent-text);
  }

  ::selection {
    background-color: var(--color-brand);
    color: var(--color-on-brand);
  }

  :focus-visible {
    outline: 2px solid var(--color-focus-inner);
    outline-offset: 2px;
    box-shadow: 0 0 0 6px var(--color-focus-outer);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@utility type-display {
  font-family: var(--font-display);
  font-stretch: var(--font-display-stretch);
  font-weight: 900;
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-heading);
}

@utility type-hero {
  font-family: var(--font-display);
  font-stretch: var(--font-display-stretch);
  font-weight: 900;
  font-size: var(--text-hero);
  line-height: var(--leading-display);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
}

@utility type-lead {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: var(--text-lead);
  line-height: 1.25;
}
```

## Verticals

Set the vertical once on the page or section wrapper and use accent utilities inside it:

```jsx
<section data-vertical={vertical.key} className="bg-accent text-on-accent">
```

`data-vertical` takes the vertical `key` from `/CLAUDE.md` unchanged (`tidetrail`, `goldensaga`, `peakpulse`, `elitescape`, `urbanecho`, `grand-india-tour`). Outside any `data-vertical`, the accent is the route orange.

## Theme and fonts

- `data-theme="light"` or `"dark"` is always present on `<html>`. The inline script in `index.html` sets it before first paint, and `ThemeProvider` keeps it in sync. There are no token values without it.
- Fonts, in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Libre+Caslon+Text:ital@1&family=Onest:wght@400..800&display=swap"
  rel="stylesheet"
/>
```

## Admin app

The admin app uses the same file and the same mapping. It does not use `data-vertical` regions, `--pattern-*`, `type-hero`, or `type-lead`. For a vertical chip or chart series it reads the suffixed tokens directly, for example `bg-(--color-accent-tidetrail)`.
