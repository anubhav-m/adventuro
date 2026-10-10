import { z } from 'zod';
import { LIMITS } from '../config/constants.js';

export const googleSignInBody = z
  .object({ credential: z.string().trim().min(1).max(LIMITS.CREDENTIAL_MAX) })
  .strict();
