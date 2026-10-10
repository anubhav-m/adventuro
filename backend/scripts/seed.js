import { fileURLToPath } from 'node:url';
import { TAXONOMY_TYPE, VERTICALS } from '../src/config/constants.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { Vertical } from '../src/models/Vertical.js';
import { slugify } from '../src/utils/slugify.js';

const VERTICAL_CONTENT = {
  tidetrail: {
    subtitle: 'Ocean Blue & Coastal Thrills',
    description:
      'Beaches, islands and coastal escapes — from the shacks and surf of Goa and Gokarna to the coral reefs of Andaman and Lakshadweep. Every TideTrail journey is built around the water: sail it, dive it, ride it.',
  },
  goldensaga: {
    subtitle: 'Deserts, Forts & Golden Dunes',
    description:
      'Deserts, culture and royal heritage across Jaisalmer, Pushkar and the heart of Rajasthan. Sleep under desert stars, ride the dunes and walk through centuries of forts, havelis and folk tradition.',
  },
  peakpulse: {
    subtitle: 'Snow Peaks, Passes & Alpine Treks',
    description:
      'Mountains, treks and high-altitude adventure through Manali, Kasol, Uttarakhand and Ladakh. Cross passes, camp by glacial rivers and earn every summit view.',
  },
  elitescape: {
    subtitle: 'Ultra Luxury, Palaces & Private Sanctuaries',
    description:
      'Luxury, comfort and exclusive escapes. Palace stays, private sanctuaries and unhurried itineraries where every detail is handled and every experience is reserved for you.',
  },
  urbanecho: {
    subtitle: 'Metropolis Lights, Street Culture & Heritage Trails',
    description:
      'Cities, culture, food and nightlife in Mumbai, Delhi, Jaipur and Bengaluru. Heritage walks by day, street food and city lights by night — the pulse of urban India.',
  },
  'grand-india-tour': {
    subtitle: 'One Journey. Countless Stories.',
    description:
      'The flagship Adventuro circuit. One continuous journey from coast to camp and peak to palace, showcasing the full diversity of India in a single expedition.',
  },
};

const STARTER_TAXONOMIES = {
  [TAXONOMY_TYPE.CATEGORY]: [
    'Backpacks',
    'Shoes',
    'Camping',
    'Water Gear',
    'Winter Gear',
    'Accessories',
    'Travel Kits',
    'Caps',
  ],
  [TAXONOMY_TYPE.CLIMATE]: [
    'Tropical/Beach',
    'Desert/Dust',
    'High Altitude/Snow',
    'Luxury/Resort',
    'Urban/Transit',
  ],
};

// Identity fields are always re-synced; content fields are written only on first insert so
// re-running the seed never overwrites admin edits.
const seedVerticals = () =>
  Promise.all(
    VERTICALS.map(({ key, code, name }, index) =>
      Vertical.updateOne(
        { key },
        { $set: { code, name, order: index + 1 }, $setOnInsert: VERTICAL_CONTENT[key] },
        { upsert: true, runValidators: true },
      ),
    ),
  );

const seedTaxonomies = () =>
  Promise.all(
    Object.entries(STARTER_TAXONOMIES).flatMap(([type, names]) =>
      names.map((name) =>
        Taxonomy.updateOne(
          { type, slug: slugify(name) },
          { $setOnInsert: { name } },
          { upsert: true, runValidators: true },
        ),
      ),
    ),
  );

export const runSeed = async () => {
  await Promise.all([Vertical.init(), Taxonomy.init()]);
  await Promise.all([seedVerticals(), seedTaxonomies()]);
  const [verticals, taxonomies] = await Promise.all([
    Vertical.countDocuments(),
    Taxonomy.countDocuments(),
  ]);
  return { verticals, taxonomies };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDb();
  try {
    const counts = await runSeed();
    logger.info(counts, 'Seed complete');
  } finally {
    await disconnectDb();
  }
}
