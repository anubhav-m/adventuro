import { LIMITS } from './constants.js';
import { getIstDateOnly } from './format.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// A start date the form can submit: tomorrow (IST) up to a year ahead.
export const getStartDateBounds = () => ({
  min: getIstDateOnly(1),
  max: getIstDateOnly(LIMITS.BOOKING_MAX_DAYS_AHEAD),
});

// What the booking form opens with. A saved intent for this tour wins (the visitor is coming
// back from sign-in), then the package the Book link named, then the first package. Anything
// the tour or the calendar no longer allows falls back to the default.
export const getBookingDefaults = (tour, { intent, tierId } = {}) => {
  const saved = intent?.tourSlug === tour.slug ? intent : null;
  const hasTier = (id) => tour.tiers.some((tier) => tier.id === id);
  const { min, max } = getStartDateBounds();
  const startDate = saved?.startDate ?? '';

  return {
    tierId: [saved?.tierId, tierId].find(hasTier) ?? tour.tiers[0].id,
    travelers: clamp(
      saved?.travelers ?? LIMITS.TRAVELERS_MIN,
      LIMITS.TRAVELERS_MIN,
      LIMITS.TRAVELERS_MAX,
    ),
    startDate: startDate >= min && startDate <= max ? startDate : '',
  };
};
