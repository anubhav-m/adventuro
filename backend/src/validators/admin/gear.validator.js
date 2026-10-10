import { z } from 'zod';
import { GEAR_SORT, LIMITS } from '../../config/constants.js';
import {
  AT_LEAST_ONE_FIELD,
  booleanFlag,
  httpsUrl,
  image,
  objectId,
  optionalText,
  pagination,
  price,
  requiredText,
  searchTerm,
  slug,
} from '../common.js';

const idList = (max) =>
  z
    .array(objectId)
    .max(max)
    .transform((ids) => [...new Set(ids)]);

const gearFields = {
  name: requiredText(LIMITS.SHORT_TEXT_MAX),
  slug: slug.optional(),
  shortDescription: optionalText(LIMITS.SHORT_TEXT_MAX),
  description: optionalText(LIMITS.LONG_TEXT_MAX),
  images: z.array(image).max(LIMITS.GEAR_IMAGES_MAX).optional(),
  mrp: price,
  salePrice: price,
  affiliateUrl: httpsUrl,
  category: objectId,
  climates: idList(LIMITS.GEAR_TAXONOMIES_MAX).optional(),
  tags: idList(LIMITS.GEAR_TAXONOMIES_MAX).optional(),
  tours: idList(LIMITS.GEAR_TOURS_MAX).optional(),
  isActive: z.boolean().optional(),
};

// On a partial update only one price may be present; the model re-checks the saved pair.
const SALE_PRICE_WITHIN_MRP = Object.freeze([
  ({ mrp, salePrice }) => mrp === undefined || salePrice === undefined || salePrice <= mrp,
  { path: ['salePrice'], message: 'Sale price must not exceed MRP' },
]);

export const createGearBody = z
  .object(gearFields)
  .strict()
  .refine(...SALE_PRICE_WITHIN_MRP);

export const updateGearBody = z
  .object(gearFields)
  .partial()
  .strict()
  .refine(...AT_LEAST_ONE_FIELD)
  .refine(...SALE_PRICE_WITHIN_MRP);

export const listAdminGearQuery = pagination.extend({
  q: searchTerm.optional(),
  category: objectId.optional(),
  climate: objectId.optional(),
  tag: objectId.optional(),
  tour: objectId.optional(),
  isActive: booleanFlag.optional(),
  sort: z.enum(Object.values(GEAR_SORT)).default(GEAR_SORT.NEWEST),
});
