import { LayoutDashboard, Monitor, Moon, Sun } from 'lucide-react';

export const BRAND = Object.freeze({ NAME: 'Adventuro', APP: 'Adventuro Admin' });

export const ROUTES = Object.freeze({ DASHBOARD: '/', LOGIN: '/login' });

// The sidebar's sections, in order. Each session that builds a section adds it here.
// `end` keeps the dashboard from staying current on every other path.
export const NAV_SECTIONS = Object.freeze([
  Object.freeze({ label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard, end: true }),
]);

export const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

// The six vertical keys. `ink` is the token of the vertical's flat colour, for a chip's square
// and a chart's series; the name beside it always comes from the API.
export const VERTICAL_INKS = Object.freeze({
  tidetrail: 'var(--color-accent-tidetrail)',
  goldensaga: 'var(--color-accent-goldensaga)',
  peakpulse: 'var(--color-accent-peakpulse)',
  elitescape: 'var(--color-accent-elitescape)',
  urbanecho: 'var(--color-accent-urbanecho)',
  'grand-india-tour': 'var(--color-accent-grand-india-tour)',
});

// `tone` is a Badge tone and `ink` the same colour for a chart. The word always shows too.
export const BOOKING_STATUS = Object.freeze({
  confirmed: Object.freeze({ label: 'Confirmed', tone: 'info', ink: 'var(--color-info)' }),
  completed: Object.freeze({ label: 'Completed', tone: 'success', ink: 'var(--color-success)' }),
  cancelled: Object.freeze({ label: 'Cancelled', tone: 'danger', ink: 'var(--color-danger)' }),
});

export const THEME = Object.freeze({ SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' });

export const THEME_OPTIONS = Object.freeze([
  Object.freeze({ value: THEME.SYSTEM, label: 'System', icon: Monitor }),
  Object.freeze({ value: THEME.LIGHT, label: 'Light', icon: Sun }),
  Object.freeze({ value: THEME.DARK, label: 'Dark', icon: Moon }),
]);

export const STORAGE_KEYS = Object.freeze({
  // Also read by the inline no-flash script in index.html.
  THEME: 'adventuro.theme',
});

export const LIMITS = Object.freeze({
  SEARCH_MIN: 2,
  SEARCH_MAX: 64,
  DASHBOARD_MAX_DAYS: 366,
});

export const SEARCH_DEBOUNCE_MS = 300;

export const CUSTOM_RANGE = 'custom';

// The dashboard's date ranges. The first is the default, so it is never written to the URL.
export const DASHBOARD_RANGES = Object.freeze([
  Object.freeze({ value: '30', label: '30 days', days: 30 }),
  Object.freeze({ value: '7', label: '7 days', days: 7 }),
  Object.freeze({ value: '90', label: '90 days', days: 90 }),
  Object.freeze({ value: CUSTOM_RANGE, label: 'Custom' }),
]);
