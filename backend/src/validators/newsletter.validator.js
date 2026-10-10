import { z } from 'zod';
import { LIMITS } from '../config/constants.js';

export const subscribeBody = z
  .object({
    email: z.string().trim().toLowerCase().max(LIMITS.EMAIL_MAX).pipe(z.email()),
  })
  .strict();
