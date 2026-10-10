import { z } from 'zod';
import { TAXONOMY_TYPE } from '../config/constants.js';

export const listTaxonomiesQuery = z.object({
  type: z.enum(Object.values(TAXONOMY_TYPE)).optional(),
});
