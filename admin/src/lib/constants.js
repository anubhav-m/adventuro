import { Backpack, Layers, LayoutDashboard, MapIcon, Monitor, Moon, Sun, Tags } from 'lucide-react';

export const BRAND = Object.freeze({ NAME: 'Adventuro', APP: 'Adventuro Admin' });

export const ROUTES = Object.freeze({
  DASHBOARD: '/',
  LOGIN: '/login',
  VERTICALS: '/verticals',
  TOURS: '/tours',
  NEW_TOUR: '/tours/new',
  GEAR: '/gear',
  NEW_GEAR: '/gear/new',
  TAXONOMIES: '/taxonomies',
});

export const verticalPath = (id) => `${ROUTES.VERTICALS}/${id}`;
export const tourPath = (id) => `${ROUTES.TOURS}/${id}`;
export const gearPath = (id) => `${ROUTES.GEAR}/${id}`;

// The sidebar's sections, in order. Each session that builds a section adds it here.
// `end` keeps the dashboard from staying current on every other path.
export const NAV_SECTIONS = Object.freeze([
  Object.freeze({ label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard, end: true }),
  Object.freeze({ label: 'Verticals', to: ROUTES.VERTICALS, icon: Layers }),
  Object.freeze({ label: 'Tours', to: ROUTES.TOURS, icon: MapIcon }),
  Object.freeze({ label: 'Gear', to: ROUTES.GEAR, icon: Backpack }),
  Object.freeze({ label: 'Taxonomies', to: ROUTES.TAXONOMIES, icon: Tags }),
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

// The server's limits, mirrored so a form can say what is wrong before it is sent.
export const LIMITS = Object.freeze({
  SEARCH_MIN: 2,
  SEARCH_MAX: 64,
  DASHBOARD_MAX_DAYS: 366,
  NAME_MAX: 120,
  SLUG_MAX: 120,
  SHORT_TEXT_MAX: 300,
  LONG_TEXT_MAX: 5000,
  URL_MAX: 2048,
  PRICE_MAX: 10_000_000,
  DURATION_DAYS_MAX: 365,
  LIST_ITEMS_MAX: 30,
  ITINERARY_MAX: 60,
  TIERS_MIN: 1,
  TIERS_MAX: 5,
  GALLERY_MAX: 12,
  GEAR_IMAGES_MAX: 8,
  GEAR_TAXONOMIES_MAX: 20,
  GEAR_TOURS_MAX: 100,
  PAGE_LIMIT_MAX: 50,
});

export const PAGE_SIZE = 20;

// What the upload endpoint accepts. The server sniffs the real type; this check only spares
// the admin a round trip.
export const IMAGE_UPLOAD = Object.freeze({
  TYPES: Object.freeze(['image/jpeg', 'image/png', 'image/webp']),
  MAX_BYTES: 5 * 1024 * 1024,
});

export const UPLOAD_FOLDER = Object.freeze({
  TOURS: 'tours',
  GEAR: 'gear',
  VERTICALS: 'verticals',
});

export const DIFFICULTY_OPTIONS = Object.freeze([
  Object.freeze({ value: 'easy', label: 'Easy' }),
  Object.freeze({ value: 'moderate', label: 'Moderate' }),
  Object.freeze({ value: 'challenging', label: 'Challenging' }),
]);

// The three lists of the Taxonomies page, in the order of its tabs. `plural` is the tab.
export const TAXONOMY_TYPES = Object.freeze([
  Object.freeze({ value: 'category', label: 'Category', plural: 'Categories' }),
  Object.freeze({ value: 'climate', label: 'Climate', plural: 'Climates' }),
  Object.freeze({ value: 'tag', label: 'Tag', plural: 'Tags' }),
]);

// A list filter's yes / no choice, as the API's query strings.
export const PUBLISHED_OPTIONS = Object.freeze([
  Object.freeze({ value: 'true', label: 'Published' }),
  Object.freeze({ value: 'false', label: 'Draft' }),
]);

export const ACTIVE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'true', label: 'Active' }),
  Object.freeze({ value: 'false', label: 'Inactive' }),
]);

export const SEARCH_DEBOUNCE_MS = 300;

export const CUSTOM_RANGE = 'custom';

// The dashboard's date ranges. The first is the default, so it is never written to the URL.
export const DASHBOARD_RANGES = Object.freeze([
  Object.freeze({ value: '30', label: '30 days', days: 30 }),
  Object.freeze({ value: '7', label: '7 days', days: 7 }),
  Object.freeze({ value: '90', label: '90 days', days: 90 }),
  Object.freeze({ value: CUSTOM_RANGE, label: 'Custom' }),
]);
