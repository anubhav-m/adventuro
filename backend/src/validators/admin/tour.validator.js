import { z } from 'zod';
import { DIFFICULTY, LIMITS, TIME_REGEX } from '../../config/constants.js';
import {
  AT_LEAST_ONE_FIELD,
  booleanFlag,
  image,
  objectId,
  optionalText,
  pagination,
  price,
  requiredText,
  searchTerm,
  slug,
} from '../common.js';

const shortText = requiredText(LIMITS.SHORT_TEXT_MAX);
const longText = requiredText(LIMITS.LONG_TEXT_MAX);
const stringList = z.array(shortText).max(LIMITS.LIST_ITEMS_MAX);

const tierFields = {
  name: requiredText(LIMITS.NAME_MAX),
  description: optionalText(LIMITS.SHORT_TEXT_MAX),
  pricePerPerson: price,
};

const hasUniqueNames = (tiers) =>
  new Set(tiers.map(({ name }) => name.toLowerCase())).size === tiers.length;

const tiersOf = (tier) =>
  z
    .array(tier)
    .min(LIMITS.TIERS_MIN)
    .max(LIMITS.TIERS_MAX)
    .refine(hasUniqueNames, 'Tier names must be unique');

const itinerary = z
  .array(
    z
      .object({
        day: z.number().int().min(1),
        title: shortText,
        description: optionalText(LIMITS.LONG_TEXT_MAX),
      })
      .strict(),
  )
  .max(LIMITS.ITINERARY_MAX)
  .refine(
    (days) => days.every(({ day }, index) => day === index + 1),
    'Itinerary days must be sequential starting from 1',
  );

const tourFields = {
  vertical: objectId,
  title: shortText,
  slug: slug.optional(),
  state: shortText,
  destination: shortText,
  tagline: optionalText(LIMITS.SHORT_TEXT_MAX),
  overview: longText,
  durationDays: z.number().int().min(1).max(LIMITS.DURATION_DAYS_MAX),
  difficulty: z.enum(Object.values(DIFFICULTY)),
  coverImage: image.nullable().optional(),
  gallery: z.array(image).max(LIMITS.GALLERY_MAX).optional(),
  topActivities: stringList.optional(),
  signatureActivity: z.object({ title: shortText, description: longText }).strict(),
  itinerary: itinerary.optional(),
  inclusions: stringList.optional(),
  exclusions: stringList.optional(),
  reporting: z
    .object({
      location: shortText,
      address: optionalText(LIMITS.SHORT_TEXT_MAX),
      time: z.string().regex(TIME_REGEX, 'Time must be HH:mm'),
    })
    .strict(),
  isPublished: z.boolean().optional(),
};

export const createTourBody = z
  .object({ ...tourFields, tiers: tiersOf(z.object(tierFields).strict()) })
  .strict();

// A tier sent with its existing `id` keeps that id; one without gets a new id.
export const updateTourBody = z
  .object({
    ...tourFields,
    tiers: tiersOf(z.object({ id: objectId.optional(), ...tierFields }).strict()),
  })
  .partial()
  .strict()
  .refine(...AT_LEAST_ONE_FIELD);

export const listAdminToursQuery = pagination.extend({
  vertical: slug.optional(),
  q: searchTerm.optional(),
  isPublished: booleanFlag.optional(),
});
