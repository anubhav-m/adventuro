import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { runDemoSeed } from '../scripts/seed-demo.js';
import { app } from '../src/app.js';
import { VERTICAL_KEYS } from '../src/config/constants.js';
import { Gear } from '../src/models/Gear.js';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { Tour } from '../src/models/Tour.js';
import { Vertical } from '../src/models/Vertical.js';

const PICSUM = /^https:\/\/picsum\.photos\/seed\/[a-z0-9-]+\/1200\/800$/;

// The base seed's upserts touch `updatedAt` on verticals and taxonomies, so it is left out.
const snapshot = async () => {
  const [tours, gear, taxonomies, verticals] = await Promise.all([
    Tour.find().sort({ slug: 1 }).lean(),
    Gear.find().sort({ slug: 1 }).lean(),
    Taxonomy.find().select('-updatedAt').sort({ type: 1, slug: 1 }).lean(),
    Vertical.find().select('-updatedAt').sort({ order: 1 }).lean(),
  ]);
  return JSON.stringify({ tours, gear, taxonomies, verticals });
};

describe('demo seed', () => {
  it('creates 2–3 published tours per vertical and one unpublished tour', async () => {
    const counts = await runDemoSeed();
    expect(counts).toEqual({ tours: 17, gear: 23, tags: 5 });

    const verticals = await Vertical.find().lean();
    expect(verticals).toHaveLength(6);
    const published = await Promise.all(
      VERTICAL_KEYS.map((key) => {
        const { _id } = verticals.find((vertical) => vertical.key === key);
        return Tour.countDocuments({ vertical: _id, isPublished: true });
      }),
    );
    published.forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(3);
    });
    expect(await Tour.countDocuments({ isPublished: false })).toBe(1);
    verticals.forEach(({ heroImage }) => expect(heroImage.url).toMatch(PICSUM));
  });

  it('seeds the Goa and Andaman tours with the agreed prices', async () => {
    await runDemoSeed();

    const goa = await Tour.findOne({ slug: 'goa-coastal-escape' }).lean();
    expect(goa).toMatchObject({ durationDays: 4, difficulty: 'easy', startingPrice: 14999 });
    expect(goa.tiers.map(({ name, pricePerPerson }) => [name, pricePerPerson])).toEqual([
      ['Essential', 14999],
      ['Explorer', 18749],
      ['VIP Palace', 25498],
    ]);

    const andaman = await Tour.findOne({ slug: 'andaman-nicobar-island-odyssey' }).lean();
    expect(andaman).toMatchObject({
      title: 'Andaman & Nicobar Island Odyssey',
      durationDays: 6,
      difficulty: 'moderate',
      startingPrice: 28999,
    });
  });

  it('gives every tour a full itinerary, a signature activity and placeholder images', async () => {
    await runDemoSeed();

    const tours = await Tour.find().lean();
    tours.forEach((tour) => {
      expect(tour.itinerary).toHaveLength(tour.durationDays);
      expect(tour.signatureActivity.title).toBeTruthy();
      expect(tour.coverImage).toEqual({
        url: `https://picsum.photos/seed/${tour.slug}/1200/800`,
        path: null,
      });
      expect(tour.gallery.length).toBeGreaterThan(0);
      tour.gallery.forEach(({ url, path }) => {
        expect(url).toMatch(PICSUM);
        expect(path).toBeNull();
      });
    });
  });

  it('seeds gear across every category and climate, linked to real tours', async () => {
    await runDemoSeed();

    const [gear, tourIds, categories, climates] = await Promise.all([
      Gear.find().lean(),
      Tour.distinct('_id'),
      Taxonomy.find({ type: 'category' }).lean(),
      Taxonomy.find({ type: 'climate' }).lean(),
    ]);
    const known = new Set(tourIds.map(String));
    const used = (field) => new Set(gear.flatMap((item) => [item[field]].flat().map(String)));

    expect(gear.filter(({ isActive }) => !isActive)).toHaveLength(1);
    expect(used('category').size).toBe(categories.length);
    expect(used('climates').size).toBe(climates.length);
    gear.forEach((item) => {
      expect(item.affiliateUrl).toBe(`https://example.com/${item.slug}`);
      expect(item.salePrice).toBeLessThan(item.mrp);
      expect(item.images).toEqual([
        { url: `https://picsum.photos/seed/${item.slug}/1200/800`, path: null },
      ]);
      expect(item.tours.length).toBeGreaterThan(0);
      item.tours.forEach((id) => expect(known.has(String(id))).toBe(true));
      [item.category, ...item.climates, ...item.tags].forEach((id) => expect(id).toBeTruthy());
    });
    expect(gear.find(({ slug }) => slug === 'trailhead-45l-trek-backpack')).toMatchObject({
      salePrice: 2899,
      mrp: 3999,
    });
  });

  it('is idempotent: a second run changes nothing', async () => {
    await runDemoSeed();
    const before = await snapshot();

    const counts = await runDemoSeed();

    expect(counts).toEqual({ tours: 17, gear: 23, tags: 5 });
    expect(await snapshot()).toBe(before);
  });

  it('matches by slug: admin edits survive and only missing documents are added', async () => {
    await runDemoSeed();
    await Tour.updateOne({ slug: 'goa-coastal-escape' }, { $set: { title: 'Edited by admin' } });
    await Gear.deleteOne({ slug: 'alpine-fleece-beanie' });
    await Vertical.updateOne({ key: 'tidetrail' }, { $set: { heroImage: null } });
    await Vertical.updateOne(
      { key: 'peakpulse' },
      { $set: { heroImage: { url: 'https://cdn.example.com/peaks.webp', path: null } } },
    );

    await runDemoSeed();

    expect((await Tour.findOne({ slug: 'goa-coastal-escape' })).title).toBe('Edited by admin');
    expect(await Gear.countDocuments({ slug: 'alpine-fleece-beanie' })).toBe(1);
    expect((await Vertical.findOne({ key: 'tidetrail' })).heroImage.url).toMatch(PICSUM);
    expect((await Vertical.findOne({ key: 'peakpulse' })).heroImage.url).toBe(
      'https://cdn.example.com/peaks.webp',
    );
  });

  it('refuses to run in production and writes nothing', async () => {
    await expect(runDemoSeed({ nodeEnv: 'production' })).rejects.toThrow(
      'The demo seed must not run in production',
    );

    expect(await Tour.countDocuments()).toBe(0);
    expect(await Vertical.countDocuments()).toBe(0);
  });

  it('the seeded catalogue is served by the public API', async () => {
    await runDemoSeed();

    const vertical = await request(app).get('/api/v1/verticals/tidetrail');
    const tour = await request(app).get('/api/v1/tours/goa-coastal-escape');
    const hidden = await request(app).get('/api/v1/tours/spiti-valley-winter-expedition');
    const gear = await request(app).get('/api/v1/gear').query({ tour: 'goa-coastal-escape' });
    const search = await request(app).get('/api/v1/search').query({ q: 'goa' });

    expect(vertical.body.data.tours).toHaveLength(3);
    expect(tour.body.data.tour.tiers).toHaveLength(3);
    expect(hidden.status).toBe(404);
    expect(gear.body.meta.total).toBeGreaterThan(0);
    expect(search.body.data.tours.map(({ slug }) => slug)).toContain('goa-coastal-escape');
  });
});
