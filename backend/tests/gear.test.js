import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { createGear, createTaxonomy, createTour, createVertical } from './helpers/factories.js';

const BASE = '/api/v1/gear';

const list = (query = {}) => request(app).get(BASE).query(query);
const ids = (res) => res.body.data.gear.map(({ id }) => id);

const createPeakPulse = () =>
  createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse', order: 3 });

describe('GET /api/v1/gear', () => {
  it('returns active gear cards with populated taxonomies and pagination meta', async () => {
    const category = await createTaxonomy({ name: 'Backpacks', slug: 'backpacks' });
    const climate = await createTaxonomy({ type: 'climate', name: 'Desert', slug: 'desert' });
    const tag = await createTaxonomy({ type: 'tag', name: 'Waterproof', slug: 'waterproof' });
    const tour = await createTour();
    const gear = await createGear({
      category: category._id,
      climates: [climate._id],
      tags: [tag._id],
      tours: [tour._id],
      images: [{ url: 'https://cdn.example.com/pack.webp', path: 'gear/pack.webp' }],
    });
    await createGear({ isActive: false });

    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Gear fetched');
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
    expect(res.body.data.gear).toEqual([
      {
        id: gear.id,
        name: gear.name,
        slug: gear.slug,
        shortDescription: '40L weatherproof pack',
        images: [{ url: 'https://cdn.example.com/pack.webp', path: 'gear/pack.webp' }],
        mrp: 3999,
        salePrice: 2899,
        category: { id: category.id, name: 'Backpacks', slug: 'backpacks' },
        climates: [{ id: climate.id, name: 'Desert', slug: 'desert' }],
        tags: [{ id: tag.id, name: 'Waterproof', slug: 'waterproof' }],
      },
    ]);
  });

  it('filters by q on the name, case-insensitively', async () => {
    const tent = await createGear({ name: 'Alpine Dome Tent' });
    await createGear({ name: 'Trail Shoes' });
    await createGear({ name: 'Alpine Stove', isActive: false });

    expect(ids(await list({ q: 'ALPINE' }))).toEqual([tent.id]);
  });

  it('filters by category slug', async () => {
    const shoes = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });
    const match = await createGear({ category: shoes._id });
    await createGear();

    expect(ids(await list({ category: 'shoes' }))).toEqual([match.id]);
  });

  it('filters by climate slug', async () => {
    const snow = await createTaxonomy({ type: 'climate', name: 'Snow', slug: 'snow' });
    const match = await createGear({ climates: [snow._id] });
    await createGear();

    expect(ids(await list({ climate: 'snow' }))).toEqual([match.id]);
  });

  it('filters by tag slug', async () => {
    const light = await createTaxonomy({ type: 'tag', name: 'Ultralight', slug: 'ultralight' });
    const match = await createGear({ tags: [light._id] });
    await createGear();

    expect(ids(await list({ tag: 'ultralight' }))).toEqual([match.id]);
  });

  it('does not match a taxonomy slug of a different type', async () => {
    const snow = await createTaxonomy({ type: 'climate', name: 'Snow', slug: 'snow' });
    await createGear({ climates: [snow._id] });

    const res = await list({ category: 'snow' });
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([]);
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 0, totalPages: 0 });
  });

  it('filters by tour slug, and only for a published tour', async () => {
    const tour = await createTour();
    const hidden = await createTour({ isPublished: false });
    const match = await createGear({ tours: [tour._id] });
    await createGear({ tours: [hidden._id] });
    await createGear();

    expect(ids(await list({ tour: tour.slug }))).toEqual([match.id]);
    expect(ids(await list({ tour: hidden.slug }))).toEqual([]);
    expect(ids(await list({ tour: 'no-such-tour' }))).toEqual([]);
  });

  it("filters by vertical through that vertical's published tours", async () => {
    const tideTrail = await createVertical();
    const peakPulse = await createPeakPulse();
    const beach = await createTour({ vertical: tideTrail });
    const beachTwo = await createTour({ vertical: tideTrail });
    const beachDraft = await createTour({ vertical: tideTrail, isPublished: false });
    const trek = await createTour({ vertical: peakPulse });

    const snorkel = await createGear({ tours: [beach._id] });
    const dryBag = await createGear({ tours: [beachTwo._id, trek._id] });
    await createGear({ tours: [beachDraft._id] });
    await createGear({ tours: [trek._id] });
    await createGear({ tours: [beach._id], isActive: false });

    const res = await list({ vertical: 'tidetrail' });
    expect(ids(res)).toEqual([dryBag.id, snorkel.id]);
    expect(res.body.meta.total).toBe(2);
  });

  it('returns nothing for a vertical with no published tours or an unknown vertical', async () => {
    const tideTrail = await createVertical();
    const draft = await createTour({ vertical: tideTrail, isPublished: false });
    await createGear({ tours: [draft._id] });

    expect(ids(await list({ vertical: 'tidetrail' }))).toEqual([]);
    expect(ids(await list({ vertical: 'moonwalk' }))).toEqual([]);
  });

  it('combines every filter', async () => {
    const tideTrail = await createVertical();
    const peakPulse = await createPeakPulse();
    const beach = await createTour({ vertical: tideTrail });
    const trek = await createTour({ vertical: peakPulse });
    const category = await createTaxonomy({ name: 'Water Gear', slug: 'water-gear' });
    const climate = await createTaxonomy({ type: 'climate', name: 'Tropical', slug: 'tropical' });
    const tag = await createTaxonomy({ type: 'tag', name: 'Quick Dry', slug: 'quick-dry' });
    const full = {
      name: 'Reef Snorkel Set',
      category: category._id,
      climates: [climate._id],
      tags: [tag._id],
      tours: [beach._id],
    };

    const match = await createGear(full);
    await createGear({ ...full, isActive: false });
    await createGear({ ...full, name: 'Reef Sandals' });
    await createGear({ ...full, category: undefined });
    await createGear({ ...full, climates: [] });
    await createGear({ ...full, tags: [] });
    await createGear({ ...full, tours: [trek._id] });

    const res = await list({
      q: 'snorkel',
      category: 'water-gear',
      climate: 'tropical',
      tag: 'quick-dry',
      tour: beach.slug,
      vertical: 'tidetrail',
    });
    expect(ids(res)).toEqual([match.id]);
    expect(res.body.meta.total).toBe(1);

    const mismatched = await list({ tour: beach.slug, vertical: 'peakpulse' });
    expect(ids(mismatched)).toEqual([]);
  });

  describe('sorting', () => {
    const seed = async () => {
      const cheap = await createGear({ mrp: 5000, salePrice: 500, clickCount: 5 });
      const pricey = await createGear({ mrp: 5000, salePrice: 4500, clickCount: 40 });
      const mid = await createGear({ mrp: 5000, salePrice: 2000, clickCount: 0 });
      return { cheap, pricey, mid };
    };

    it('defaults to newest first', async () => {
      const { cheap, pricey, mid } = await seed();
      expect(ids(await list())).toEqual([mid.id, pricey.id, cheap.id]);
      expect(ids(await list({ sort: 'newest' }))).toEqual([mid.id, pricey.id, cheap.id]);
    });

    it('price_asc sorts by sale price ascending', async () => {
      const { cheap, pricey, mid } = await seed();
      expect(ids(await list({ sort: 'price_asc' }))).toEqual([cheap.id, mid.id, pricey.id]);
    });

    it('price_desc sorts by sale price descending', async () => {
      const { cheap, pricey, mid } = await seed();
      expect(ids(await list({ sort: 'price_desc' }))).toEqual([pricey.id, mid.id, cheap.id]);
    });

    it('popular sorts by click count descending', async () => {
      const { cheap, pricey, mid } = await seed();
      expect(ids(await list({ sort: 'popular' }))).toEqual([pricey.id, cheap.id, mid.id]);
    });
  });

  it('paginates with correct meta', async () => {
    const category = (await createTaxonomy())._id;
    const gear = [];
    for (let i = 0; i < 5; i += 1) {
      gear.push(await createGear({ category, mrp: 9000, salePrice: 1000 + i }));
    }
    const byPrice = gear.map(({ id }) => id);

    const first = await list({ sort: 'price_asc', limit: 2 });
    expect(ids(first)).toEqual(byPrice.slice(0, 2));
    expect(first.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });

    const last = await list({ sort: 'price_asc', limit: 2, page: 3 });
    expect(ids(last)).toEqual(byPrice.slice(4));
    expect(last.body.meta).toEqual({ page: 3, limit: 2, total: 5, totalPages: 3 });

    const beyond = await list({ limit: 2, page: 4 });
    expect(ids(beyond)).toEqual([]);
    expect(beyond.body.meta.total).toBe(5);
  });

  it('treats regex special characters in q literally', async () => {
    const literal = await createGear({ name: 'Flask (1L) .* Steel' });
    await createGear({ name: 'Flask Mini' });

    for (const q of ['.*', '(1L)', '(1']) {
      const res = await list({ q });
      expect(res.status).toBe(200);
      expect(ids(res)).toEqual([literal.id]);
    }
    for (const q of ['[a-z]+', 'Flask|Mini', '((']) {
      const res = await list({ q });
      expect(res.status).toBe(200);
      expect(ids(res)).toEqual([]);
    }
  });

  it('ignores bracketed operator syntax in the query string', async () => {
    const gear = await createGear();
    await createGear({ isActive: false });
    const res = await list({ 'isActive[$ne]': 'true', 'category[$exists]': 'false' });
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([gear.id]);
  });

  it.each([
    ['limit above 50', { limit: 51 }, 'limit'],
    ['page of 0', { page: 0 }, 'page'],
    ['unknown sort', { sort: 'cheapest' }, 'sort'],
    ['one-character q', { q: 'a' }, 'q'],
    ['malformed category slug', { category: 'Water Gear' }, 'category'],
    ['malformed climate slug', { climate: 'snow_' }, 'climate'],
    ['malformed tag slug', { tag: '.*' }, 'tag'],
    ['malformed tour slug', { tour: 'goa/escape' }, 'tour'],
    ['malformed vertical key', { vertical: '$tidetrail' }, 'vertical'],
  ])('%s → 400 VALIDATION_ERROR', async (_label, query, field) => {
    const res = await list(query);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
  });
});
