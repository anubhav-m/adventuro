const TIMEZONE = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const compactPriceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const toParts = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(
    datePartsFormatter.formatToParts(date).map(({ type, value: text }) => [type, text]),
  );
};

// 14999 → "₹14,999"
export const formatPrice = (amount) => priceFormatter.format(amount);

// For a chart's axis: 150000 → "₹1.5L"
export const formatCompactPrice = (amount) => compactPriceFormatter.format(amount);

// 12345 → "12,345"
export const formatNumber = (value) => numberFormatter.format(value);

// Accepts a 'YYYY-MM-DD' string, an ISO timestamp, or a Date. Returns e.g. "15 Sep 2026" in IST.
export const formatDate = (value) => {
  const parts = toParts(value);
  return parts ? `${parts.day} ${parts.month} ${parts.year}` : '';
};

// For a chart's axis: "15 Sep"
export const formatDay = (value) => {
  const parts = toParts(value);
  return parts ? `${parts.day} ${parts.month}` : '';
};

// When something happened, in IST: "15 Sep 2026, 6:05 PM"
export const formatDateTime = (value) => {
  const parts = toParts(value);
  return parts ? `${formatDate(value)}, ${parts.hour}:${parts.minute} ${parts.dayPeriod}` : '';
};

// The IST calendar date `offsetDays` from now, as 'YYYY-MM-DD' (the format of <input type="date">).
export const getIstDateOnly = (offsetDays = 0, now = new Date()) =>
  dateOnlyFormatter.format(new Date(now.getTime() + offsetDays * DAY_MS));

// A real calendar date written as 'YYYY-MM-DD' (so not 2026-02-31).
export const isDateOnly = (value) =>
  typeof value === 'string' &&
  DATE_ONLY_REGEX.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

// '2026-09-15', -14 → '2026-09-01'
export const shiftDateOnly = (dateOnly, days) =>
  new Date(Date.parse(`${dateOnly}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

// The number of calendar days from `from` to `to`, counting both.
export const countDaysInclusive = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
