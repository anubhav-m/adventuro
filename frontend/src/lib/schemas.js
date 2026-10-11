import { z } from 'zod';
import { LIMITS } from './constants.js';
import { getIstDateOnly } from './format.js';

const PHONE_REGEX = /^[6-9]\d{9}$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Our own wording per field. Also used when the server rejects a field (see lib/errors.js).
export const FIELD_MESSAGES = Object.freeze({
  name: 'Enter your name.',
  phone: 'Enter a 10-digit Indian mobile number, without +91.',
  email: 'Enter a valid email address.',
  tierId: 'Choose a package.',
  travelers: `Choose between ${LIMITS.TRAVELERS_MIN} and ${LIMITS.TRAVELERS_MAX} travelers.`,
  startDate: 'Pick a start date from tomorrow up to a year ahead.',
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, FIELD_MESSAGES.name)
    .max(LIMITS.NAME_MAX, `Keep your name under ${LIMITS.NAME_MAX} characters.`),
  phone: z.string().trim().regex(PHONE_REGEX, FIELD_MESSAGES.phone),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .max(LIMITS.EMAIL_MAX, FIELD_MESSAGES.email)
    .pipe(z.email(FIELD_MESSAGES.email)),
});

// 'YYYY-MM-DD' strings compare correctly as text. The server re-checks the window.
const isBookableDate = (value) =>
  DATE_ONLY_REGEX.test(value) &&
  value >= getIstDateOnly(1) &&
  value <= getIstDateOnly(LIMITS.BOOKING_MAX_DAYS_AHEAD);

export const bookingSchema = z.object({
  tierId: z.string().min(1, FIELD_MESSAGES.tierId),
  travelers: z
    .number(FIELD_MESSAGES.travelers)
    .int(FIELD_MESSAGES.travelers)
    .min(LIMITS.TRAVELERS_MIN, FIELD_MESSAGES.travelers)
    .max(LIMITS.TRAVELERS_MAX, FIELD_MESSAGES.travelers),
  startDate: z.string().refine(isBookableDate, FIELD_MESSAGES.startDate),
});
