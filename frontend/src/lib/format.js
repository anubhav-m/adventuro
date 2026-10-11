const TIMEZONE = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// 14999 → "₹14,999"
export const formatPrice = (amount) => priceFormatter.format(amount);

// Accepts a 'YYYY-MM-DD' string, an ISO timestamp, or a Date. Returns e.g. "15 Sep 2026" in IST.
export const formatDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(
    datePartsFormatter.formatToParts(date).map(({ type, value: text }) => [type, text]),
  );
  return `${parts.day} ${parts.month} ${parts.year}`;
};

// The IST calendar date `offsetDays` from now, as 'YYYY-MM-DD' (the format of <input type="date">).
export const getIstDateOnly = (offsetDays = 0, now = new Date()) =>
  dateOnlyFormatter.format(new Date(now.getTime() + offsetDays * DAY_MS));

// A tour's reporting time: '10:30' → "10:30 AM", '18:05' → "6:05 PM".
export const formatTime = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date);
};

// 1 → "1 day", 4 → "4 days"
export const formatDuration = (days) => `${days} ${days === 1 ? 'day' : 'days'}`;
