import { LIMITS, TIMEZONE } from '../config/constants.js';

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
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

export const countDaysInclusive = (from, to) => Math.round((to - from) / DAY_MS) + 1;

export const listDateOnlyRange = (from, to) =>
  Array.from({ length: countDaysInclusive(from, to) }, (_, index) =>
    formatDateOnly(addDays(from, index)),
  );

// The instant an IST calendar day begins. India has no DST, so the offset is fixed.
const istStartOfDay = (date) => new Date(date.getTime() - IST_OFFSET_MS);

// A range of instants covering whole IST calendar days. Either bound may be omitted.
export const istDayRange = ({ from, to }) => ({
  ...(from && { $gte: istStartOfDay(from) }),
  ...(to && { $lt: istStartOfDay(addDays(to, 1)) }),
});
