import { z } from 'zod';
import { LIMITS, PHONE_REGEX, SLUG_REGEX } from '../config/constants.js';
import { parseDateOnly } from '../utils/dates.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const slug = z.string().trim().toLowerCase().max(LIMITS.SLUG_MAX).regex(SLUG_REGEX);

export const phone = z.string().trim().regex(PHONE_REGEX, 'Invalid phone number');

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIMITS.PAGE_LIMIT_MAX)
    .default(LIMITS.PAGE_LIMIT_DEFAULT),
});

export const searchTerm = z.string().trim().min(LIMITS.SEARCH_Q_MIN).max(LIMITS.SEARCH_Q_MAX);

export const dateOnly = z
  .string()
  .refine((value) => parseDateOnly(value) !== null, 'Invalid date, expected YYYY-MM-DD');

export const httpsUrl = z
  .url({ protocol: /^https$/, hostname: z.regexes.domain, error: 'Must be an https URL' })
  .max(LIMITS.URL_MAX);
