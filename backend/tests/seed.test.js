import { describe, expect, it } from 'vitest';
import { runSeed } from '../scripts/seed.js';
import { VERTICALS } from '../src/config/constants.js';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { Vertical } from '../src/models/Vertical.js';

describe('seed', () => {
  it('creates the 6 verticals in order with their founder-vision subtitles', async () => {
    const counts = await runSeed();
    expect(counts).toEqual({ verticals: 6, taxonomies: 13 });

    const verticals = await Vertical.find().sort({ order: 1 }).lean();
    expect(verticals.map(({ key, code, name }) => ({ key, code, name }))).toEqual(VERTICALS);
    expect(verticals.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(verticals.map(({ subtitle }) => subtitle)).toEqual([
      'Ocean Blue & Coastal Thrills',
      'Deserts, Forts & Golden Dunes',
      'Snow Peaks, Passes & Alpine Treks',
      'Ultra Luxury, Palaces & Private Sanctuaries',
      'Metropolis Lights, Street Culture & Heritage Trails',
      'One Journey. Countless Stories.',
    ]);
    expect(verticals.every(({ description }) => description.length > 40)).toBe(true);
  });

  it('creates the starter categories and climates with slugs', async () => {
    await runSeed();
    const [categories, climates, tags] = await Promise.all([
      Taxonomy.find({ type: 'category' }).sort({ name: 1 }).lean(),
      Taxonomy.find({ type: 'climate' }).sort({ name: 1 }).lean(),
      Taxonomy.countDocuments({ type: 'tag' }),
    ]);

    expect(categories.map(({ name }) => name)).toEqual([
      'Accessories',
      'Backpacks',
      'Camping',
      'Caps',
      'Shoes',
      'Travel Kits',
      'Water Gear',
      'Winter Gear',
    ]);
    expect(climates.map(({ name, slug }) => [name, slug])).toEqual([
      ['Desert/Dust', 'desert-dust'],
      ['High Altitude/Snow', 'high-altitude-snow'],
      ['Luxury/Resort', 'luxury-resort'],
      ['Tropical/Beach', 'tropical-beach'],
      ['Urban/Transit', 'urban-transit'],
    ]);
    expect(tags).toBe(0);
  });

  it('is idempotent: a second run adds no verticals or taxonomies', async () => {
    await runSeed();
    const before = await Vertical.find().sort({ order: 1 }).lean();

    const counts = await runSeed();
    expect(counts).toEqual({ verticals: 6, taxonomies: 13 });
    expect(await Vertical.countDocuments()).toBe(6);
    expect(await Taxonomy.countDocuments()).toBe(13);

    const after = await Vertical.find().sort({ order: 1 }).lean();
    expect(after.map(({ _id }) => String(_id))).toEqual(before.map(({ _id }) => String(_id)));
  });

  it('re-syncs identity fields but never overwrites admin-edited content', async () => {
    await runSeed();
    await Vertical.updateOne(
      { key: 'tidetrail' },
      { $set: { subtitle: 'Edited by admin', name: 'Renamed', order: 99 } },
    );
    await Taxonomy.updateOne({ type: 'category', slug: 'caps' }, { $set: { name: 'Hats & Caps' } });

    await runSeed();

    const vertical = await Vertical.findOne({ key: 'tidetrail' }).lean();
    expect(vertical).toMatchObject({ subtitle: 'Edited by admin', name: 'TideTrail', order: 1 });
    const caps = await Taxonomy.findOne({ type: 'category', slug: 'caps' }).lean();
    expect(caps.name).toBe('Hats & Caps');
  });
});
