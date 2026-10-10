import { z } from 'zod';
import { LIMITS, THEME } from '../config/constants.js';
import { phone } from './common.js';

export const updateMeBody = z
  .object({
    name: z.string().trim().min(1).max(LIMITS.NAME_MAX).optional(),
    phone: phone.optional(),
    themePreference: z.enum(Object.values(THEME)).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');
