import { Building2, Gem, Monitor, Moon, Mountain, Route, Sun, Tent, Waves } from 'lucide-react';

// The id of the tour page's package section, the target of the hero's View packages.
export const BOOKING_SECTION_ID = 'book';

// The id of the home page's vertical picker, the target of the hero's Book Now.
export const ADVENTURES_SECTION_ID = 'choose-your-adventure';

export const ROUTES = Object.freeze({
  HOME: '/',
  ADVENTURES: `/#${ADVENTURES_SECTION_ID}`,
  GEAR: '/gear',
  ABOUT: '/about',
  SIGN_IN: '/signin',
  ONBOARDING: '/onboarding',
  ACCOUNT: '/account',
  MY_BOOKINGS: '/account/bookings',
  PRIVACY_TERMS: '/privacy-terms',
  CANCELLATION_REFUND: '/cancellation-refund',
  AFFILIATE_DISCLOSURE: '/affiliate-disclosure',
  vertical: (key) => `/v/${key}`,
  tour: (slug) => `/tours/${slug}`,
  booking: (bookingNumber) => `/bookings/${bookingNumber}`,
  gearCategory: (slug) => `/gear?${new URLSearchParams({ category: slug })}`,
  gearSearch: (q) => `/gear?${new URLSearchParams({ q })}`,
});

// The booking modal is opened by the URL, on whatever page the visitor is: `?book=<tour slug>`,
// with `tier` to start on a package. Sign-in's `next` carries it, so the modal comes back.
export const BOOKING_PARAMS = Object.freeze({ TOUR: 'book', TIER: 'tier' });

// The `to` of a Book link: it keeps the current page and adds the booking params.
export const bookingLink = (tourSlug, tierId) => ({
  search: `?${new URLSearchParams({
    [BOOKING_PARAMS.TOUR]: tourSlug,
    ...(tierId && { [BOOKING_PARAMS.TIER]: tierId }),
  })}`,
});

export const GRAND_INDIA_TOUR_KEY = 'grand-india-tour';

// `key` is also the value of `data-vertical`, which selects the vertical's accent tokens.
export const VERTICALS = Object.freeze(
  [
    { key: 'tidetrail', name: 'TideTrail', icon: Waves },
    { key: 'goldensaga', name: 'GoldenSaga', icon: Tent },
    { key: 'peakpulse', name: 'PeakPulse', icon: Mountain },
    { key: 'elitescape', name: 'EliteScape', icon: Gem },
    { key: 'urbanecho', name: 'UrbanEcho', icon: Building2 },
    { key: GRAND_INDIA_TOUR_KEY, name: 'Grand India Tour', icon: Route },
  ].map((vertical) => Object.freeze({ ...vertical, route: ROUTES.vertical(vertical.key) })),
);

export const getVerticalMeta = (key) => VERTICALS.find((vertical) => vertical.key === key);

export const TAXONOMY_TYPE = Object.freeze({
  CATEGORY: 'category',
  CLIMATE: 'climate',
  TAG: 'tag',
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
  BOOKING_INTENT: 'adventuro.bookingIntent',
});

export const LIMITS = Object.freeze({
  NAME_MAX: 120,
  EMAIL_MAX: 254,
  TRAVELERS_MIN: 1,
  TRAVELERS_MAX: 20,
  BOOKING_MAX_DAYS_AHEAD: 365,
  SEARCH_MIN: 2,
  SEARCH_MAX: 64,
});

export const SEARCH_DEBOUNCE_MS = 300;

export const DIFFICULTY_LABELS = Object.freeze({
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging',
});

// The first option is the API's default, so it is never written to the URL.
export const GEAR_SORT_OPTIONS = Object.freeze([
  Object.freeze({ value: 'newest', label: 'Newest' }),
  Object.freeze({ value: 'price_asc', label: 'Price: low to high' }),
  Object.freeze({ value: 'price_desc', label: 'Price: high to low' }),
  Object.freeze({ value: 'popular', label: 'Most popular' }),
]);

// `tone` is a Badge tone. The word always shows beside the colour.
export const BOOKING_STATUS = Object.freeze({
  confirmed: Object.freeze({ label: 'Confirmed', tone: 'info' }),
  completed: Object.freeze({ label: 'Completed', tone: 'success' }),
  cancelled: Object.freeze({ label: 'Cancelled', tone: 'danger' }),
});

export const BRAND = Object.freeze({
  NAME: 'Adventuro',
  TAGLINE: 'From Coast to Camp, Peak to Palace.',
  HERO_TAGLINE: 'From Coast to Camp • Peak to Palace',
  LINE: 'One India. Infinite Adventures.',
  PHILOSOPHY: 'We don’t just take you there. We make you experience it.',
  DESCRIPTION:
    'Curated trips across India, each built around the one thing its place is known for, with the gear that trip needs alongside.',
});

// Placeholders until the client supplies its real contact address and profiles.
export const CONTACT_EMAIL = 'hello@adventuro.example';

export const SOCIAL_LINKS = Object.freeze([
  Object.freeze({ label: 'Instagram', href: 'https://www.instagram.com/' }),
  Object.freeze({ label: 'YouTube', href: 'https://www.youtube.com/' }),
  Object.freeze({ label: 'Facebook', href: 'https://www.facebook.com/' }),
]);
