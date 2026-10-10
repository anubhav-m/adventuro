import { z } from 'zod';
import { GEAR_SORT } from '../config/constants.js';
import { objectId, pagination, searchTerm, slug } from './common.js';

export const listGearQuery = pagination.extend({
  q: searchTerm.optional(),
  category: slug.optional(),
  climate: slug.optional(),
  tag: slug.optional(),
  tour: slug.optional(),
  vertical: slug.optional(),
  sort: z.enum(Object.values(GEAR_SORT)).default(GEAR_SORT.NEWEST),
});

export const gearIdParams = z.object({ id: objectId });
