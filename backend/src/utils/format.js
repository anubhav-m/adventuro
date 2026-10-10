import { TIMEZONE } from '../config/constants.js';
import { parseDateOnly } from './dates.js';

const LOCALE = 'en-IN';

const numberFormat = new Intl.NumberFormat(LOCALE);
const calendarDateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const clockTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'UTC',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const istDateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
});

// 1499900 → '₹14,99,900'
export const formatRupees = (amount) => `₹${numberFormat.format(amount)}`;

// '2026-12-01' → 'Tue, 1 Dec 2026'
export const formatCalendarDate = (dateOnly) => {
  const parts = calendarDateFormat.formatToParts(parseDateOnly(dateOnly));
  const { weekday, day, month, year } = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${weekday}, ${day} ${month} ${year}`;
};

// '18:05' → '6:05 pm'
export const formatClockTime = (time) =>
  clockTimeFormat.format(new Date(`1970-01-01T${time}:00.000Z`));

// A point in time shown on the IST clock, e.g. '11 Oct 2026, 2:45 pm'.
export const formatIstDateTime = (date) => istDateTimeFormat.format(date);

export const pluralize = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
