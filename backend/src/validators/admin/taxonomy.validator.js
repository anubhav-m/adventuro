import { z } from 'zod';
import { LIMITS, TAXONOMY_TYPE } from '../../config/constants.js';
import { AT_LEAST_ONE_FIELD, requiredText, slug } from '../common.js';

const name = requiredText(LIMITS.NAME_MAX);

export const createTaxonomyBody = z
  .object({
    type: z.enum(Object.values(TAXONOMY_TYPE)),
    name,
    slug: slug.optional(),
  })
  .strict();

export const updateTaxonomyBody = z
  .object({ name: name.optional(), slug: slug.optional() })
  .strict()
  .refine(...AT_LEAST_ONE_FIELD);
