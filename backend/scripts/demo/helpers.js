const GALLERY_SIZE = 3;
const EXPLORER_FACTOR = 1.25;
const VIP_FACTOR = 1.7;

const STANDARD_EXCLUSIONS = [
  'Flights or trains to the reporting point',
  'Personal expenses and tips',
  'Travel insurance',
  'Anything not listed under inclusions',
];

// Demo images are external placeholders, so they carry no storage path.
export const demoImage = (seed) => ({
  url: `https://picsum.photos/seed/${seed}/1200/800`,
  path: null,
});

const tiersFrom = (basePrice) => [
  {
    name: 'Essential',
    description: 'Comfortable shared stays and group transfers.',
    pricePerPerson: basePrice,
  },
  {
    name: 'Explorer',
    description: 'Private rooms, upgraded stays and one extra activity.',
    pricePerPerson: Math.round(basePrice * EXPLORER_FACTOR),
  },
  {
    name: 'VIP Palace',
    description: 'Premium stays, private transfers and a dedicated trip captain.',
    pricePerPerson: Math.round(basePrice * VIP_FACTOR),
  },
];

// `days` is a list of [title, description] pairs, one per day; it sets the duration.
export const demoTour = ({ slug, basePrice, days, ...tour }) => ({
  ...tour,
  slug,
  durationDays: days.length,
  coverImage: demoImage(slug),
  gallery: Array.from({ length: GALLERY_SIZE }, (_, index) => demoImage(`${slug}-${index + 1}`)),
  itinerary: days.map(([title, description], index) => ({ day: index + 1, title, description })),
  exclusions: STANDARD_EXCLUSIONS,
  tiers: tiersFrom(basePrice),
  isPublished: true,
});
