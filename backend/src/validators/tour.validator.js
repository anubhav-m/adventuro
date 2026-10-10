import { z } from 'zod';
import { DIFFICULTY, LIMITS } from '../config/constants.js';
import { pagination, searchTerm, slug } from './common.js';

export const listToursQuery = pagination.extend({
  vertical: slug.optional(),
  state: z.string().trim().min(1).max(LIMITS.SHORT_TEXT_MAX).optional(),
  difficulty: z.enum(Object.values(DIFFICULTY)).optional(),
  q: searchTerm.optional(),
});

export const tourSlugParams = z.object({ slug });
