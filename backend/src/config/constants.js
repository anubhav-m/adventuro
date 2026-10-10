const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const VERTICALS = Object.freeze([
  Object.freeze({ key: 'tidetrail', code: 'TT', name: 'TideTrail' }),
  Object.freeze({ key: 'goldensaga', code: 'GS', name: 'GoldenSaga' }),
  Object.freeze({ key: 'peakpulse', code: 'PP', name: 'PeakPulse' }),
  Object.freeze({ key: 'elitescape', code: 'ES', name: 'EliteScape' }),
  Object.freeze({ key: 'urbanecho', code: 'UE', name: 'UrbanEcho' }),
  Object.freeze({ key: 'grand-india-tour', code: 'GI', name: 'Grand India Tour' }),
]);

export const VERTICAL_KEYS = Object.freeze(VERTICALS.map(({ key }) => key));
export const VERTICAL_CODES = Object.freeze(VERTICALS.map(({ code }) => code));

export const ROLES = Object.freeze({ USER: 'user', ADMIN: 'admin' });

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

export const BOOKING_STATUS_TRANSITIONS = Object.freeze({
  [BOOKING_STATUS.CONFIRMED]: Object.freeze([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED]),
  [BOOKING_STATUS.CANCELLED]: Object.freeze([]),
  [BOOKING_STATUS.COMPLETED]: Object.freeze([]),
});

export const THEME = Object.freeze({ SYSTEM: 'system', LIGHT: 'light', DARK: 'dark' });

export const DIFFICULTY = Object.freeze({
  EASY: 'easy',
  MODERATE: 'moderate',
  CHALLENGING: 'challenging',
});

export const TAXONOMY_TYPE = Object.freeze({
  CATEGORY: 'category',
  CLIMATE: 'climate',
  TAG: 'tag',
});

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE: 'INVALID_FILE',
  INVALID_GOOGLE_TOKEN: 'INVALID_GOOGLE_TOKEN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  NOT_FOUND: 'NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  PHONE_TAKEN: 'PHONE_TAKEN',
  DUPLICATE: 'DUPLICATE',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  TOUR_UNAVAILABLE: 'TOUR_UNAVAILABLE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

export const AUTH_COOKIE_NAME = 'adv_session';
export const TIMEZONE = 'Asia/Kolkata';

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const LIMITS = Object.freeze({
  JSON_BODY: '100kb',
  PAGE_LIMIT_DEFAULT: 12,
  PAGE_LIMIT_MAX: 50,
  TRAVELERS_MIN: 1,
  TRAVELERS_MAX: 20,
  TIERS_MIN: 1,
  TIERS_MAX: 5,
  BOOKING_MAX_DAYS_AHEAD: 365,
  SLUG_MAX: 120,
  NAME_MAX: 120,
  SHORT_TEXT_MAX: 300,
  LONG_TEXT_MAX: 5000,
  URL_MAX: 2048,
  EMAIL_MAX: 254,
});

export const RATE_LIMITS = Object.freeze({
  GLOBAL: Object.freeze({ windowMs: 15 * MINUTE_MS, limit: 300 }),
  AUTH: Object.freeze({ windowMs: 15 * MINUTE_MS, limit: 20 }),
  BOOKING: Object.freeze({ windowMs: HOUR_MS, limit: 10 }),
  NEWSLETTER: Object.freeze({ windowMs: HOUR_MS, limit: 5 }),
  SEARCH: Object.freeze({ windowMs: MINUTE_MS, limit: 60 }),
  GO: Object.freeze({ windowMs: MINUTE_MS, limit: 60 }),
});
