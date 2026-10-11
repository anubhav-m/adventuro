import { Building2, Gem, Mountain, Route, Tent, Waves } from 'lucide-react';

export const ROUTES = Object.freeze({
  HOME: '/',
  GEAR: '/gear',
  ABOUT: '/about',
  SIGN_IN: '/signin',
  MY_BOOKINGS: '/account/bookings',
  PRIVACY_TERMS: '/privacy-terms',
  CANCELLATION_REFUND: '/cancellation-refund',
  AFFILIATE_DISCLOSURE: '/affiliate-disclosure',
  vertical: (key) => `/v/${key}`,
});

// `key` is also the value of `data-vertical`, which selects the vertical's accent tokens.
export const VERTICALS = Object.freeze(
  [
    { key: 'tidetrail', name: 'TideTrail', icon: Waves },
    { key: 'goldensaga', name: 'GoldenSaga', icon: Tent },
    { key: 'peakpulse', name: 'PeakPulse', icon: Mountain },
    { key: 'elitescape', name: 'EliteScape', icon: Gem },
    { key: 'urbanecho', name: 'UrbanEcho', icon: Building2 },
    { key: 'grand-india-tour', name: 'Grand India Tour', icon: Route },
  ].map((vertical) => Object.freeze({ ...vertical, route: ROUTES.vertical(vertical.key) })),
);

export const THEME = Object.freeze({ SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' });

export const STORAGE_KEYS = Object.freeze({
  // Also read by the inline no-flash script in index.html.
  THEME: 'adventuro.theme',
});

export const LIMITS = Object.freeze({
  NAME_MAX: 120,
  EMAIL_MAX: 254,
  TRAVELERS_MIN: 1,
  TRAVELERS_MAX: 20,
  BOOKING_MAX_DAYS_AHEAD: 365,
});

export const BRAND = Object.freeze({
  NAME: 'Adventuro',
  TAGLINE: 'From Coast to Camp, Peak to Palace.',
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
