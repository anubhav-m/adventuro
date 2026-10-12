import { z } from 'zod';
import { LIMITS } from './constants.js';
import { countDaysInclusive, isDateOnly } from './format.js';

// Our own wording per field. Also used when the server rejects a field (see lib/errors.js).
export const FIELD_MESSAGES = Object.freeze({
  from: 'Pick a start date on or before the end date.',
  to: `Keep the range within ${LIMITS.DASHBOARD_MAX_DAYS} days.`,
});

const dateOnly = (message) => z.string().refine(isDateOnly, message);

// The dashboard's custom range, checked the way the server checks it.
export const dateRangeSchema = z
  .object({
    from: dateOnly('Pick a start date.'),
    to: dateOnly('Pick an end date.'),
  })
  .refine(({ from, to }) => from <= to, { path: ['from'], message: FIELD_MESSAGES.from })
  .refine(({ from, to }) => countDaysInclusive(from, to) <= LIMITS.DASHBOARD_MAX_DAYS, {
    path: ['to'],
    message: FIELD_MESSAGES.to,
  });
