import { LIMITS, TIMEZONE } from '../config/constants.js';

const DAY_MS = 86_400_000;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const istDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Calendar dates are represented as a Date at 00:00 UTC of that day.
export const parseDateOnly = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) return null;
  return date;
};

export const formatDateOnly = (date) => date.toISOString().slice(0, 10);

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

export const getIstToday = (now = new Date()) => parseDateOnly(istDateFormat.format(now));

export const getIstTomorrow = (now = new Date()) => addDays(getIstToday(now), 1);

export const getMaxStartDate = (now = new Date()) =>
  addDays(getIstToday(now), LIMITS.BOOKING_MAX_DAYS_AHEAD);

export const isBookableStartDate = (date, now = new Date()) =>
  date >= getIstTomorrow(now) && date <= getMaxStartDate(now);
