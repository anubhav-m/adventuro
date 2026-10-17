import { z } from 'zod';
import { DIFFICULTY_OPTIONS, LIMITS } from './constants.js';
import { countDaysInclusive, formatNumber, isDateOnly } from './format.js';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const SHORT = formatNumber(LIMITS.SHORT_TEXT_MAX);
const LONG = formatNumber(LIMITS.LONG_TEXT_MAX);
const LINE = `Keep each line within ${SHORT} characters.`;
const IMAGE = 'This image can’t be used. Remove it and upload it again.';

// Our own wording per field. The forms use it, and so does a field the server rejects (see
// lib/errors.js). `*` stands for any position in a list: 'tiers.*.name'.
export const FIELD_MESSAGES = Object.freeze({
  from: 'Pick a start date on or before the end date.',
  to: `Keep the range within ${LIMITS.DASHBOARD_MAX_DAYS} days.`,
  vertical: 'Choose a vertical.',
  title: `Enter a title of up to ${SHORT} characters.`,
  name: 'Enter a name that isn’t too long.',
  slug: 'Use lowercase letters, numbers and single hyphens, like goa-coastal-escape.',
  state: `Enter the state, up to ${SHORT} characters.`,
  destination: `Enter the destination, up to ${SHORT} characters.`,
  tagline: `Keep the tagline within ${SHORT} characters.`,
  subtitle: `Keep the subtitle within ${SHORT} characters.`,
  overview: `Write an overview of up to ${LONG} characters.`,
  shortDescription: `Keep the short description within ${SHORT} characters.`,
  description: `Keep the description within ${LONG} characters.`,
  durationDays: `Enter a whole number of days, from 1 to ${LIMITS.DURATION_DAYS_MAX}.`,
  difficulty: 'Choose a difficulty.',
  coverImage: IMAGE,
  heroImage: IMAGE,
  gallery: `Keep the gallery to ${LIMITS.GALLERY_MAX} images.`,
  'gallery.*': IMAGE,
  images: `Keep to ${LIMITS.GEAR_IMAGES_MAX} images.`,
  'images.*': IMAGE,
  'signatureActivity.title': 'Name the signature activity. Every tour needs one.',
  'signatureActivity.description': `Describe the signature activity, up to ${LONG} characters.`,
  topActivities: `Keep to ${LIMITS.LIST_ITEMS_MAX} lines.`,
  'topActivities.*': LINE,
  inclusions: `Keep to ${LIMITS.LIST_ITEMS_MAX} lines.`,
  'inclusions.*': LINE,
  exclusions: `Keep to ${LIMITS.LIST_ITEMS_MAX} lines.`,
  'exclusions.*': LINE,
  itinerary: `Keep the itinerary to ${LIMITS.ITINERARY_MAX} days, numbered from day 1.`,
  'itinerary.*.title': `Give this day a title of up to ${SHORT} characters.`,
  'itinerary.*.description': `Keep this day’s plan within ${LONG} characters.`,
  tiers: `Offer ${LIMITS.TIERS_MIN} to ${LIMITS.TIERS_MAX} packages, each with its own name.`,
  'tiers.*.name': 'Name this package, with a name no other package uses.',
  'tiers.*.description': `Keep the description within ${SHORT} characters.`,
  'tiers.*.pricePerPerson': 'Enter a whole-rupee price of at least ₹1.',
  'reporting.location': `Enter where travellers report, up to ${SHORT} characters.`,
  'reporting.address': `Keep the address within ${SHORT} characters.`,
  'reporting.time': 'Enter the time as HH:mm in 24-hour time, like 07:30.',
  mrp: 'Enter a whole-rupee MRP of at least ₹1.',
  salePrice: 'Enter a whole-rupee sale price of at least ₹1, no higher than the MRP.',
  affiliateUrl: 'Enter a full link that starts with https://.',
  category: 'Choose a category.',
  climates: 'Choose climates from the list.',
  tags: 'Choose tags from the list.',
  tours: 'Choose tours from the list.',
});

const M = FIELD_MESSAGES;

const dateOnly = (message) => z.string().refine(isDateOnly, message);

// The dashboard's custom range, checked the way the server checks it.
export const dateRangeSchema = z
  .object({
    from: dateOnly('Pick a start date.'),
    to: dateOnly('Pick an end date.'),
  })
  .refine(({ from, to }) => from <= to, { path: ['from'], message: M.from })
  .refine(({ from, to }) => countDaysInclusive(from, to) <= LIMITS.DASHBOARD_MAX_DAYS, {
    path: ['to'],
    message: M.to,
  });

const requiredText = (max, message) => z.string().trim().min(1, message).max(max, message);
const optionalText = (max, message) => z.string().trim().max(max, message);
const wholeNumber = (min, max, message) =>
  z.number({ error: message }).int(message).min(min, message).max(max, message);
const price = (message) => wholeNumber(1, LIMITS.PRICE_MAX, message);
const isPrice = (value) => price('').safeParse(value).success;
const lines = (field) =>
  z
    .array(requiredText(LIMITS.SHORT_TEXT_MAX, M[`${field}.*`]))
    .max(LIMITS.LIST_ITEMS_MAX, M[field]);
const slug = z
  .string()
  .trim()
  .min(1, M.slug)
  .max(LIMITS.SLUG_MAX, M.slug)
  .regex(SLUG_REGEX, M.slug);
// Images only ever come from the upload endpoint or the server, so their shape is not re-checked.
const image = z.object({ url: z.string(), path: z.string().nullable() });

const isHttpsUrl = (value) => {
  const url = URL.parse(value);
  return url?.protocol === 'https:' && url.hostname.includes('.');
};

// Each package's name must differ from the others, ignoring case.
const flagRepeatedNames = (tiers, context) => {
  const seen = new Set();
  tiers.forEach(({ name }, index) => {
    const key = name.trim().toLowerCase();
    if (key && seen.has(key)) {
      context.addIssue({ code: 'custom', path: [index, 'name'], message: M['tiers.*.name'] });
    }
    seen.add(key);
  });
};

export const verticalFormSchema = z.object({
  subtitle: optionalText(LIMITS.SHORT_TEXT_MAX, M.subtitle),
  description: optionalText(LIMITS.LONG_TEXT_MAX, M.description),
  heroImage: image.nullable(),
});

export const tourFormSchema = z.object({
  vertical: z.string().min(1, M.vertical),
  title: requiredText(LIMITS.SHORT_TEXT_MAX, M.title),
  slug,
  state: requiredText(LIMITS.SHORT_TEXT_MAX, M.state),
  destination: requiredText(LIMITS.SHORT_TEXT_MAX, M.destination),
  tagline: optionalText(LIMITS.SHORT_TEXT_MAX, M.tagline),
  overview: requiredText(LIMITS.LONG_TEXT_MAX, M.overview),
  durationDays: wholeNumber(1, LIMITS.DURATION_DAYS_MAX, M.durationDays),
  difficulty: z.enum(
    DIFFICULTY_OPTIONS.map(({ value }) => value),
    { error: M.difficulty },
  ),
  isPublished: z.boolean(),
  coverImage: image.nullable(),
  gallery: z.array(image).max(LIMITS.GALLERY_MAX, M.gallery),
  signatureActivity: z.object({
    title: requiredText(LIMITS.SHORT_TEXT_MAX, M['signatureActivity.title']),
    description: requiredText(LIMITS.LONG_TEXT_MAX, M['signatureActivity.description']),
  }),
  topActivities: lines('topActivities'),
  itinerary: z
    .array(
      z.object({
        day: z.number(),
        title: requiredText(LIMITS.SHORT_TEXT_MAX, M['itinerary.*.title']),
        description: optionalText(LIMITS.LONG_TEXT_MAX, M['itinerary.*.description']),
      }),
    )
    .max(LIMITS.ITINERARY_MAX, M.itinerary),
  inclusions: lines('inclusions'),
  exclusions: lines('exclusions'),
  tiers: z
    .array(
      z.object({
        id: z.string().optional(),
        name: requiredText(LIMITS.NAME_MAX, M['tiers.*.name']),
        description: optionalText(LIMITS.SHORT_TEXT_MAX, M['tiers.*.description']),
        pricePerPerson: price(M['tiers.*.pricePerPerson']),
      }),
    )
    .min(LIMITS.TIERS_MIN, M.tiers)
    .max(LIMITS.TIERS_MAX, M.tiers)
    .superRefine(flagRepeatedNames),
  reporting: z.object({
    location: requiredText(LIMITS.SHORT_TEXT_MAX, M['reporting.location']),
    address: optionalText(LIMITS.SHORT_TEXT_MAX, M['reporting.address']),
    time: z.string().regex(TIME_REGEX, M['reporting.time']),
  }),
});

export const gearFormSchema = z
  .object({
    name: requiredText(LIMITS.SHORT_TEXT_MAX, M.name),
    slug,
    shortDescription: optionalText(LIMITS.SHORT_TEXT_MAX, M.shortDescription),
    description: optionalText(LIMITS.LONG_TEXT_MAX, M.description),
    images: z.array(image).max(LIMITS.GEAR_IMAGES_MAX, M.images),
    mrp: price(M.mrp),
    salePrice: price(M.salePrice),
    affiliateUrl: z
      .string()
      .trim()
      .max(LIMITS.URL_MAX, M.affiliateUrl)
      .refine(isHttpsUrl, M.affiliateUrl),
    category: z.string().min(1, M.category),
    climates: z.array(z.string()).max(LIMITS.GEAR_TAXONOMIES_MAX, M.climates),
    tags: z.array(z.string()).max(LIMITS.GEAR_TAXONOMIES_MAX, M.tags),
    tours: z.array(z.string()).max(LIMITS.GEAR_TOURS_MAX, M.tours),
    isActive: z.boolean(),
  })
  // Checked whenever both prices are valid on their own, even while another field is wrong.
  .refine(({ mrp, salePrice }) => salePrice <= mrp, {
    path: ['salePrice'],
    message: M.salePrice,
    when: ({ value }) => isPrice(value?.mrp) && isPrice(value?.salePrice),
  });

export const taxonomyNameSchema = requiredText(LIMITS.NAME_MAX, M.name);

// True for a link the "Test link" button may open.
export const isTestableUrl = (value) => gearFormSchema.shape.affiliateUrl.safeParse(value).success;
