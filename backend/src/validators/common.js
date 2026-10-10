import { z } from 'zod';
import { IMAGE_PATH_REGEX, LIMITS, PHONE_REGEX, SLUG_REGEX } from '../config/constants.js';
import { parseDateOnly } from '../utils/dates.js';

export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id')
  .toLowerCase();

export const idParams = z.object({ id: objectId });

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

export const requiredText = (max) => z.string().trim().min(1).max(max);

export const optionalText = (max) => z.string().trim().max(max).optional();

export const price = z.number().int().min(1).max(LIMITS.PRICE_MAX);

// Query-string boolean: only the literal strings are accepted.
export const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

export const imagePath = z.string().regex(IMAGE_PATH_REGEX, 'Invalid image path');

export const image = z.object({ url: httpsUrl, path: imagePath.nullable().default(null) }).strict();

export const AT_LEAST_ONE_FIELD = Object.freeze([
  (body) => Object.keys(body).length > 0,
  'At least one field is required',
]);
