import { http } from 'msw';
import { api, server, success } from './server.js';

export const CUSTOMER = Object.freeze({
  id: '6acb6f4b2fce015e85723265',
  email: 'asha@example.com',
  name: 'Asha Customer',
  avatarUrl: null,
  phone: '9876543210',
  role: 'user',
  themePreference: 'system',
  profileComplete: true,
});

export const INCOMPLETE_CUSTOMER = Object.freeze({
  id: '6acb6f4b2fce015e85723266',
  email: 'ira@example.com',
  name: 'Ira Incomplete',
  avatarUrl: null,
  role: 'user',
  themePreference: 'system',
  profileComplete: false,
});

// In the API's own order, which is not the terrain's.
export const VERTICALS = Object.freeze(
  [
    ['tidetrail', 'TT', 'TideTrail', 'Ocean Blue & Coastal Thrills'],
    ['goldensaga', 'GS', 'GoldenSaga', 'Deserts, Forts & Golden Dunes'],
    ['peakpulse', 'PP', 'PeakPulse', 'Snow Peaks, Passes & Alpine Treks'],
    ['elitescape', 'ES', 'EliteScape', 'Ultra Luxury, Palaces & Private Sanctuaries'],
    ['urbanecho', 'UE', 'UrbanEcho', 'Metropolis Lights, Street Culture & Heritage Trails'],
    ['grand-india-tour', 'GI', 'Grand India Tour', 'One Journey. Countless Stories.'],
  ].map(([key, code, name, subtitle], index) => ({
    id: `vertical-${index + 1}`,
    key,
    code,
    name,
    subtitle,
    description: `${name} description.`,
    heroImage: null,
    order: index + 1,
  })),
);

export const GRAND_INDIA = Object.freeze({
  vertical: {
    ...VERTICALS.at(-1),
    heroImage: { url: 'https://images.example.com/grand.jpg', path: 'verticals/grand.jpg' },
  },
  tours: [
    {
      id: 'tour-1',
      slug: 'grand-india-highlights',
      title: 'Grand India Highlights',
      topActivities: ['Taj Mahal at sunrise', 'Hot-air balloon', 'Amber Fort'],
    },
    {
      id: 'tour-2',
      slug: 'grand-india-signature-circuit',
      title: 'Grand India Signature Circuit',
      topActivities: ['Houseboat night'],
    },
  ],
});

export const CATEGORIES = Object.freeze(
  ['Backpacks', 'Water Gear', 'Solar Chargers'].map((name, index) => ({
    id: `category-${index + 1}`,
    type: 'category',
    name,
    slug: name.toLowerCase().replace(' ', '-'),
  })),
);

// Everything the home page reads.
export const mockCatalog = ({
  verticals = VERTICALS,
  grandIndia = GRAND_INDIA,
  categories = CATEGORIES,
} = {}) =>
  server.use(
    http.get(api('/verticals'), () => success({ verticals })),
    http.get(api('/verticals/grand-india-tour'), () => success(grandIndia)),
    http.get(api('/taxonomies'), () => success({ taxonomies: categories })),
  );

const CLIMATES = Object.freeze([
  { id: 'climate-1', type: 'climate', name: 'High Altitude/Snow', slug: 'high-altitude-snow' },
  { id: 'climate-2', type: 'climate', name: 'Tropical/Beach', slug: 'tropical-beach' },
]);

const TAGS = Object.freeze([
  { id: 'tag-1', type: 'tag', name: 'Quick Dry', slug: 'quick-dry' },
  { id: 'tag-2', type: 'tag', name: 'Waterproof', slug: 'waterproof' },
]);

const image = (name) => ({ url: `https://images.example.com/${name}.jpg`, path: null });

// A tour as GET /tours/:slug returns it.
export const GOA_TOUR = Object.freeze({
  id: 'tour-goa',
  slug: 'goa-coastal-escape',
  title: 'Goa Coastal Escape',
  vertical: { id: 'vertical-1', key: 'tidetrail', name: 'TideTrail', code: 'TT' },
  state: 'Goa',
  destination: 'North Goa',
  tagline: 'Sun, surf and shacks along the Konkan coast',
  overview: 'Four easy days on the Goan coast.',
  durationDays: 4,
  difficulty: 'easy',
  coverImage: image('goa'),
  gallery: [image('goa-1'), image('goa-2')],
  topActivities: ['Parasailing', 'Beach hopping', 'Sunset cruise', 'Fontainhas heritage walk'],
  signatureActivity: {
    title: 'Parasailing over Calangute',
    description: 'Float 300 feet above the Arabian Sea.',
  },
  itinerary: [
    { day: 1, title: 'Arrival and Candolim sunset', description: 'Airport pickup and dinner.' },
    { day: 2, title: 'Water sports day', description: '' },
  ],
  inclusions: ['3 nights stay with breakfast', 'Airport transfers'],
  exclusions: ['Travel insurance'],
  tiers: [
    { id: 'tier-1', name: 'Essential', description: 'Shared stays.', pricePerPerson: 14999 },
    { id: 'tier-2', name: 'Explorer', description: 'Private rooms.', pricePerPerson: 18749 },
    { id: 'tier-3', name: 'VIP Palace', description: '', pricePerPerson: 25498 },
  ],
  reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2, Dabolim', time: '10:30' },
  startingPrice: 14999,
});

const toCard = ({
  id,
  slug,
  title,
  state,
  destination,
  tagline,
  durationDays,
  difficulty,
  ...tour
}) => ({
  id,
  slug,
  title,
  state,
  destination,
  tagline,
  durationDays,
  difficulty,
  coverImage: tour.coverImage,
  topActivities: tour.topActivities,
  startingPrice: tour.startingPrice,
});

// Tour cards as GET /verticals/:key returns them. The second has nothing optional.
const TOUR_CARDS = Object.freeze([
  toCard(GOA_TOUR),
  {
    id: 'tour-gokarna',
    slug: 'gokarna-beach-trek',
    title: 'Gokarna Beach Trek',
    state: 'Karnataka',
    destination: 'Gokarna',
    tagline: '',
    durationDays: 1,
    difficulty: 'moderate',
    coverImage: null,
    topActivities: [],
    startingPrice: 8999,
  },
]);

export const TIDETRAIL = Object.freeze({ vertical: VERTICALS[0], tours: TOUR_CARDS });

const [BACKPACKS, WATER_GEAR] = CATEGORIES;

// Gear cards as GET /gear returns them. The second has nothing optional.
export const GEAR = Object.freeze([
  {
    id: '64b7f0c2a1d3e4f5a6b7c8d1',
    slug: 'drytide-20l-dry-bag',
    name: 'DryTide 20L Roll-Top Dry Bag',
    shortDescription: 'Fully waterproof roll-top bag.',
    images: [image('dry-bag')],
    mrp: 1299,
    salePrice: 899,
    category: { id: WATER_GEAR.id, name: WATER_GEAR.name, slug: WATER_GEAR.slug },
    climates: [],
    tags: [],
  },
  {
    id: '64b7f0c2a1d3e4f5a6b7c8d2',
    slug: 'cityhop-22l-daypack',
    name: 'CityHop 22L Daypack',
    shortDescription: '',
    images: [],
    mrp: 1499,
    salePrice: 1499,
    category: { id: BACKPACKS.id, name: BACKPACKS.name, slug: BACKPACKS.slug },
    climates: [],
    tags: [],
  },
]);

export const pageMeta = ({ page = 1, limit = 12, total, totalPages = 1 }) => ({
  page,
  limit,
  total,
  totalPages,
});

// Answers GET /gear with `resolve(params)` → { gear, meta? } and records each request's params.
export const mockGear = (resolve = () => ({ gear: GEAR })) => {
  const requests = [];
  server.use(
    http.get(api('/gear'), ({ request }) => {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      requests.push(params);
      const { gear, meta } = resolve(params);
      return success({ gear }, { meta: meta ?? pageMeta({ total: gear.length }) });
    }),
  );
  return requests;
};

// GET /taxonomies as the API answers it: every type, or one when `?type` is given.
export const mockTaxonomies = (taxonomies = [...CATEGORIES, ...CLIMATES, ...TAGS]) =>
  server.use(
    http.get(api('/taxonomies'), ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      return success({ taxonomies: taxonomies.filter((item) => !type || item.type === type) });
    }),
  );

// A booking as every bookings endpoint returns it.
export const BOOKING = Object.freeze({
  id: 'booking-1',
  bookingNumber: 'ADV-TT-2026-000123',
  status: 'confirmed',
  statusUpdatedAt: null,
  travelers: 2,
  startDate: '2026-12-20',
  totalAmount: 37498,
  createdAt: '2026-10-11T08:30:00.000Z',
  snapshot: {
    tourTitle: GOA_TOUR.title,
    verticalName: 'TideTrail',
    verticalCode: 'TT',
    tierName: 'Explorer',
    pricePerPerson: 18749,
    durationDays: 4,
  },
  contact: { name: CUSTOMER.name, phone: CUSTOMER.phone, email: CUSTOMER.email },
  tour: { id: GOA_TOUR.id, slug: GOA_TOUR.slug },
  vertical: GOA_TOUR.vertical,
  reporting: GOA_TOUR.reporting,
});

export const mockTour = (tour = GOA_TOUR) =>
  server.use(http.get(api(`/tours/${tour.slug}`), () => success({ tour })));
