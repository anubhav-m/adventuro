import { Booking } from '../../src/models/Booking.js';
import { Gear } from '../../src/models/Gear.js';
import { Taxonomy } from '../../src/models/Taxonomy.js';
import { Tour } from '../../src/models/Tour.js';
import { User } from '../../src/models/User.js';
import { Vertical } from '../../src/models/Vertical.js';

let sequence = 0;
const nextId = () => {
  sequence += 1;
  return sequence;
};

export const createUser = (overrides = {}) => {
  const n = nextId();
  return User.create({
    googleId: `google-${n}`,
    email: `user${n}@example.com`,
    name: `Test User ${n}`,
    phone: `9${String(n).padStart(9, '0')}`,
    ...overrides,
  });
};

export const createVertical = (overrides = {}) =>
  Vertical.create({
    key: 'tidetrail',
    code: 'TT',
    name: 'TideTrail',
    subtitle: 'Ocean Blue & Coastal Thrills',
    description: 'Beaches, islands and coastal escapes.',
    order: 1,
    ...overrides,
  });

export const buildTourData = (overrides = {}) => {
  const n = nextId();
  return {
    title: `Goa Coastal Escape ${n}`,
    slug: `goa-coastal-escape-${n}`,
    state: 'Goa',
    destination: 'North Goa',
    tagline: 'Sun, surf and shacks',
    overview: 'Four days along the Goan coast.',
    durationDays: 4,
    difficulty: 'easy',
    topActivities: ['Parasailing', 'Beach hopping'],
    signatureActivity: { title: 'Parasailing', description: 'Fly over Calangute beach.' },
    itinerary: [
      { day: 1, title: 'Arrival', description: 'Check in and sunset walk.' },
      { day: 2, title: 'Water sports', description: 'Parasailing and jet ski.' },
    ],
    inclusions: ['Stay', 'Breakfast'],
    exclusions: ['Flights'],
    tiers: [
      { name: 'Essential', description: 'Shared stay', pricePerPerson: 14999 },
      { name: 'Explorer', description: 'Private stay', pricePerPerson: 18749 },
    ],
    reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
    isPublished: true,
    ...overrides,
  };
};

export const createTour = async (overrides = {}) => {
  const vertical = overrides.vertical ?? (await Vertical.findOne()) ?? (await createVertical());
  return Tour.create(buildTourData({ ...overrides, vertical: vertical._id ?? vertical }));
};

export const createTaxonomy = (overrides = {}) => {
  const n = nextId();
  return Taxonomy.create({
    type: 'category',
    name: `Backpacks ${n}`,
    slug: `backpacks-${n}`,
    ...overrides,
  });
};

export const buildGearData = (overrides = {}) => {
  const n = nextId();
  return {
    name: `Trail Backpack ${n}`,
    slug: `trail-backpack-${n}`,
    shortDescription: '40L weatherproof pack',
    mrp: 3999,
    salePrice: 2899,
    affiliateUrl: `https://example.com/trail-backpack-${n}`,
    ...overrides,
  };
};

export const createGear = async (overrides = {}) => {
  const category = overrides.category ?? (await createTaxonomy())._id;
  return Gear.create(buildGearData({ ...overrides, category }));
};

export const createBooking = async (overrides = {}) => {
  const n = nextId();
  const user = overrides.user ?? (await createUser());
  const tour = overrides.tour ?? (await createTour());
  const vertical = await Vertical.findById(tour.vertical);
  const [tier] = tour.tiers;
  const travelers = overrides.travelers ?? 2;
  return Booking.create({
    bookingNumber: `ADV-${vertical.code}-2026-${String(n).padStart(6, '0')}`,
    vertical: vertical._id,
    snapshot: {
      tourTitle: tour.title,
      verticalName: vertical.name,
      verticalCode: vertical.code,
      tierName: tier.name,
      pricePerPerson: tier.pricePerPerson,
      durationDays: tour.durationDays,
    },
    startDate: new Date('2026-12-01T00:00:00.000Z'),
    totalAmount: tier.pricePerPerson * travelers,
    contact: { name: user.name, phone: user.phone, email: user.email },
    ...overrides,
    user: user._id,
    tour: tour._id,
    travelers,
  });
};
