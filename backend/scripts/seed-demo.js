import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { TAXONOMY_TYPE } from '../src/config/constants.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { Gear } from '../src/models/Gear.js';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { Tour } from '../src/models/Tour.js';
import { Vertical } from '../src/models/Vertical.js';
import { slugify } from '../src/utils/slugify.js';
import { DEMO_GEAR, DEMO_TAGS } from './demo/gear.js';
import { demoImage } from './demo/helpers.js';
import { ELITESCAPE_TOURS } from './demo/tours.elitescape.js';
import { GOLDENSAGA_TOURS } from './demo/tours.goldensaga.js';
import { GRAND_INDIA_TOURS } from './demo/tours.grand-india-tour.js';
import { PEAKPULSE_TOURS } from './demo/tours.peakpulse.js';
import { TIDETRAIL_TOURS } from './demo/tours.tidetrail.js';
import { URBANECHO_TOURS } from './demo/tours.urbanecho.js';
import { runSeed } from './seed.js';

const DEMO_TOURS = [
  ...TIDETRAIL_TOURS,
  ...GOLDENSAGA_TOURS,
  ...PEAKPULSE_TOURS,
  ...ELITESCAPE_TOURS,
  ...URBANECHO_TOURS,
  ...GRAND_INDIA_TOURS,
];

// Gear field → the taxonomy type its slugs belong to.
const GEAR_TAXONOMY_FIELDS = {
  category: TAXONOMY_TYPE.CATEGORY,
  climates: TAXONOMY_TYPE.CLIMATE,
  tags: TAXONOMY_TYPE.TAG,
};

const seedTags = () =>
  Promise.all(
    DEMO_TAGS.map((name) =>
      Taxonomy.updateOne(
        { type: TAXONOMY_TYPE.TAG, slug: slugify(name) },
        { $setOnInsert: { name } },
        { upsert: true, runValidators: true },
      ),
    ),
  );

// Only verticals that have no hero image yet get one, so an admin's upload is never replaced.
const seedHeroImages = (verticals) =>
  Promise.all(
    verticals.map(({ key }) =>
      Vertical.updateOne({ key, heroImage: null }, { $set: { heroImage: demoImage(key) } }),
    ),
  );

// Documents are matched by slug: the ones already present are left exactly as they are.
const withoutExisting = async (Model, items) => {
  const slugs = items.map(({ slug }) => slug);
  const existing = await Model.find({ slug: mongoose.trusted({ $in: slugs }) })
    .select('slug')
    .lean();
  const taken = new Set(existing.map(({ slug }) => slug));
  return items.filter(({ slug }) => !taken.has(slug));
};

const seedTours = async (verticals) => {
  const verticalIds = new Map(verticals.map(({ key, _id }) => [key, _id]));
  const missing = await withoutExisting(Tour, DEMO_TOURS);
  await Tour.create(
    missing.map(({ verticalKey, ...tour }) => ({
      ...tour,
      vertical: verticalIds.get(verticalKey),
    })),
    { ordered: true },
  );
};

const seedGear = async () => {
  const [taxonomies, tours, missing] = await Promise.all([
    Taxonomy.find().select('type slug').lean(),
    Tour.find().select('slug').lean(),
    withoutExisting(Gear, DEMO_GEAR),
  ]);
  const taxonomyIds = new Map(taxonomies.map(({ type, slug, _id }) => [`${type}:${slug}`, _id]));
  const tourIds = new Map(tours.map(({ slug, _id }) => [slug, _id]));
  const taxonomyId = (field, slug) => taxonomyIds.get(`${GEAR_TAXONOMY_FIELDS[field]}:${slug}`);

  await Gear.create(
    missing.map((gear) => ({
      ...gear,
      category: taxonomyId('category', gear.category),
      climates: gear.climates.map((slug) => taxonomyId('climates', slug)),
      tags: gear.tags.map((slug) => taxonomyId('tags', slug)),
      tours: gear.tours.map((slug) => tourIds.get(slug)),
    })),
    { ordered: true },
  );
};

// Demo content is for development and end-to-end tests only.
export const runDemoSeed = async ({ nodeEnv = env.NODE_ENV } = {}) => {
  if (nodeEnv === 'production') {
    throw new Error('The demo seed must not run in production');
  }

  await runSeed();
  await Promise.all([Tour.init(), Gear.init()]);
  const verticals = await Vertical.find().select('key').lean();
  await Promise.all([seedTags(), seedHeroImages(verticals), seedTours(verticals)]);
  await seedGear();

  const [tours, gear, tags] = await Promise.all([
    Tour.countDocuments(),
    Gear.countDocuments(),
    Taxonomy.countDocuments({ type: TAXONOMY_TYPE.TAG }),
  ]);
  return { tours, gear, tags };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDb();
  try {
    const counts = await runDemoSeed();
    logger.info(counts, 'Demo seed complete');
  } finally {
    await disconnectDb();
  }
}
