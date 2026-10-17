export const ADMIN = Object.freeze({
  id: '6acb6f4b2fce015e85723261',
  email: 'aditya@example.com',
  name: 'Aditya Admin',
  avatarUrl: null,
  phone: '9876543211',
  role: 'admin',
  themePreference: 'system',
  profileComplete: true,
});

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

const VERTICALS = Object.freeze(
  [
    ['tidetrail', 'TT', 'TideTrail'],
    ['goldensaga', 'GS', 'GoldenSaga'],
    ['peakpulse', 'PP', 'PeakPulse'],
    ['elitescape', 'ES', 'EliteScape'],
    ['urbanecho', 'UE', 'UrbanEcho'],
    ['grand-india-tour', 'GI', 'Grand India Tour'],
  ].map(([key, code, name], index) =>
    Object.freeze({ id: `vertical-${index + 1}`, key, code, name }),
  ),
);

const [TIDETRAIL, GOLDENSAGA] = VERTICALS;

const booking = ({ bookingNumber, vertical, tourTitle, tierName, travelers, price, status }) => ({
  id: `booking-${bookingNumber}`,
  bookingNumber,
  status,
  statusUpdatedAt: null,
  travelers,
  startDate: '2026-11-11',
  totalAmount: price * travelers,
  createdAt: '2026-10-12T06:30:00.000Z',
  snapshot: {
    tourTitle,
    verticalName: vertical.name,
    verticalCode: vertical.code,
    tierName,
    pricePerPerson: price,
    durationDays: 4,
  },
  contact: { name: 'Asha Customer', phone: '9876543210', email: 'asha@example.com' },
  tour: { id: `tour-${bookingNumber}`, slug: 'a-tour' },
  vertical,
  reporting: { location: 'Dabolim Airport', address: 'Goa', time: '10:30' },
  user: CUSTOMER.id,
});

// GET /admin/dashboard for the three days 10–12 Oct 2026, with every section filled.
export const DASHBOARD = Object.freeze({
  range: { from: '2026-10-10', to: '2026-10-12', days: 3 },
  totals: {
    users: 1234,
    newUsers: 3,
    bookings: 4,
    bookingValue: 97496,
    newsletterSubscribers: 56,
  },
  newUsersPerDay: [
    { date: '2026-10-10', count: 0 },
    { date: '2026-10-11', count: 1 },
    { date: '2026-10-12', count: 2 },
  ],
  bookingsPerDay: [
    { date: '2026-10-10', bookings: 0, value: 0 },
    { date: '2026-10-11', bookings: 1, value: 37498 },
    { date: '2026-10-12', bookings: 3, value: 59998 },
  ],
  bookingsByStatus: { confirmed: 2, cancelled: 1, completed: 1 },
  bookingsByVertical: VERTICALS.map((vertical) => ({
    vertical,
    ...({
      tidetrail: { bookings: 3, value: 59998 },
      goldensaga: { bookings: 1, value: 37498 },
    }[vertical.key] ?? { bookings: 0, value: 0 }),
  })),
  topTours: [
    { tourId: 'tour-goa', title: 'Goa Coastal Escape', bookings: 3, value: 59998 },
    { tourId: 'tour-jaisalmer', title: 'Jaisalmer Dunes Desert Camp', bookings: 1, value: 37498 },
  ],
  topGear: [
    { gearId: 'gear-1', name: 'Trailhead 45L Trek Backpack', slug: 'trailhead-45l', clicks: 12 },
    { gearId: 'gear-2', name: 'DryTide 20L Dry Bag', slug: 'drytide-20l', clicks: 7 },
  ],
  recentBookings: [
    booking({
      bookingNumber: 'ADV-TT-2026-000002',
      vertical: TIDETRAIL,
      tourTitle: 'Goa Coastal Escape',
      tierName: 'Explorer',
      travelers: 2,
      price: 18749,
      status: 'confirmed',
    }),
    booking({
      bookingNumber: 'ADV-GS-2026-000001',
      vertical: GOLDENSAGA,
      tourTitle: 'Jaisalmer Dunes Desert Camp',
      tierName: 'Essential',
      travelers: 4,
      price: 9374,
      status: 'cancelled',
    }),
  ],
});

// The same shape with nothing in it, as the API answers for a range without activity.
export const EMPTY_DASHBOARD = Object.freeze({
  range: DASHBOARD.range,
  totals: { users: 2, newUsers: 0, bookings: 0, bookingValue: 0, newsletterSubscribers: 0 },
  newUsersPerDay: DASHBOARD.newUsersPerDay.map(({ date }) => ({ date, count: 0 })),
  bookingsPerDay: DASHBOARD.bookingsPerDay.map(({ date }) => ({ date, bookings: 0, value: 0 })),
  bookingsByStatus: { confirmed: 0, cancelled: 0, completed: 0 },
  bookingsByVertical: VERTICALS.map((vertical) => ({ vertical, bookings: 0, value: 0 })),
  topTours: [],
  topGear: [],
  recentBookings: [],
});

// A list's `meta` for `total` items on one page.
export const pageMeta = (total, { page = 1, limit = 20 } = {}) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// GET /admin/verticals: the six, with the words and images an admin edits.
export const VERTICAL_LIST = Object.freeze(
  VERTICALS.map((vertical, index) =>
    Object.freeze({
      ...vertical,
      id: `6acb6f4b2fce015e8572300${index + 1}`,
      subtitle: index === 0 ? 'Beaches • Islands • Coastal escapes' : '',
      description: index === 0 ? 'Sun, sand and sea across India’s coasts.' : '',
      heroImage:
        index === 0 ? { url: 'https://cdn.example.com/verticals/tidetrail.jpg', path: null } : null,
      order: index + 1,
    }),
  ),
);

export const [TIDETRAIL_ITEM, , PEAKPULSE_ITEM] = VERTICAL_LIST;

const summary = ({ id, key, name, code }) => ({ id, key, name, code });

const image = (name) => ({ url: `https://cdn.example.com/${name}.jpg`, path: null });

// GET /admin/tours/:id for a published tour with every section filled.
export const TOUR = Object.freeze({
  id: '6acb6f4b2fce015e85724001',
  vertical: summary(TIDETRAIL_ITEM),
  title: 'Goa Coastal Escape',
  slug: 'goa-coastal-escape',
  state: 'Goa',
  destination: 'North Goa',
  tagline: 'Sun, sand and parasailing',
  overview: 'Four days on the beaches of North Goa.',
  durationDays: 4,
  difficulty: 'easy',
  coverImage: image('goa-cover'),
  gallery: [image('goa-1'), image('goa-2')],
  topActivities: ['Parasailing', 'Sunset cruise'],
  signatureActivity: { title: 'Parasailing at Calangute', description: 'Fly over the sea.' },
  itinerary: [
    { day: 1, title: 'Arrival', description: 'Check in.' },
    { day: 2, title: 'Water sports', description: '' },
  ],
  inclusions: ['Stay'],
  exclusions: ['Flights'],
  tiers: [
    { id: 'tier-essential', name: 'Essential', description: 'Shared stay', pricePerPerson: 14999 },
    { id: 'tier-explorer', name: 'Explorer', description: '', pricePerPerson: 18749 },
  ],
  reporting: { location: 'Dabolim Airport', address: 'Goa', time: '10:30' },
  startingPrice: 14999,
  isPublished: true,
  createdAt: '2026-10-01T06:30:00.000Z',
  updatedAt: '2026-10-12T06:30:00.000Z',
});

const tourListItem = (tour) => ({
  id: tour.id,
  title: tour.title,
  slug: tour.slug,
  state: tour.state,
  destination: tour.destination,
  durationDays: tour.durationDays,
  difficulty: tour.difficulty,
  coverImage: tour.coverImage,
  startingPrice: tour.startingPrice,
  isPublished: tour.isPublished,
  vertical: tour.vertical,
  createdAt: tour.createdAt,
  updatedAt: tour.updatedAt,
});

export const DRAFT_TOUR = Object.freeze({
  ...TOUR,
  id: '6acb6f4b2fce015e85724002',
  vertical: summary(PEAKPULSE_ITEM),
  title: 'Spiti Valley Winter Expedition',
  slug: 'spiti-valley-winter-expedition',
  state: 'Himachal Pradesh',
  coverImage: null,
  startingPrice: 44999,
  isPublished: false,
});

// GET /admin/tours, one page.
export const TOUR_LIST = Object.freeze([tourListItem(TOUR), tourListItem(DRAFT_TOUR)]);

export const TAXONOMIES = Object.freeze({
  category: [
    { id: 'cat-backpacks', type: 'category', name: 'Backpacks', slug: 'backpacks' },
    { id: 'cat-water', type: 'category', name: 'Water Gear', slug: 'water-gear' },
  ],
  climate: [
    { id: 'clim-beach', type: 'climate', name: 'Tropical/Beach', slug: 'tropical-beach' },
    { id: 'clim-snow', type: 'climate', name: 'High Altitude/Snow', slug: 'high-altitude-snow' },
  ],
  tag: [{ id: 'tag-waterproof', type: 'tag', name: 'Waterproof', slug: 'waterproof' }],
});

// GET /admin/gear/:id: linked items come whole.
export const GEAR = Object.freeze({
  id: '6acb6f4b2fce015e85725001',
  name: 'DryTide 20L Dry Bag',
  slug: 'drytide-20l-dry-bag',
  shortDescription: 'Roll-top dry bag',
  description: 'Keeps a day’s kit dry.',
  images: [image('drytide')],
  mrp: 1999,
  salePrice: 1499,
  affiliateUrl: 'https://example.com/drytide-20l-dry-bag',
  category: TAXONOMIES.category[1],
  climates: [TAXONOMIES.climate[0]],
  tags: [TAXONOMIES.tag[0]],
  tours: [{ id: TOUR.id, title: TOUR.title, slug: TOUR.slug }],
  isActive: true,
  clickCount: 7,
  createdAt: '2026-10-01T06:30:00.000Z',
  updatedAt: '2026-10-12T06:30:00.000Z',
});

const gearListItem = (gear) => ({
  id: gear.id,
  name: gear.name,
  slug: gear.slug,
  images: gear.images,
  mrp: gear.mrp,
  salePrice: gear.salePrice,
  category: gear.category,
  isActive: gear.isActive,
  clickCount: gear.clickCount,
  createdAt: gear.createdAt,
  updatedAt: gear.updatedAt,
});

export const INACTIVE_GEAR = Object.freeze({
  ...GEAR,
  id: '6acb6f4b2fce015e85725002',
  name: 'TrekLite Carbon Poles',
  slug: 'treklite-carbon-poles',
  images: [],
  mrp: 3499,
  salePrice: 3499,
  category: TAXONOMIES.category[0],
  isActive: false,
  clickCount: 0,
});

// GET /admin/gear, one page.
export const GEAR_LIST = Object.freeze([gearListItem(GEAR), gearListItem(INACTIVE_GEAR)]);
