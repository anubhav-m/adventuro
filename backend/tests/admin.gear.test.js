import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { Gear } from '../src/models/Gear.js';
import { GearClick } from '../src/models/GearClick.js';
import { authAgent } from './helpers/authAgent.js';
import {
  buildGearData,
  createGear,
  createTaxonomy,
  createTour,
  createUser,
} from './helpers/factories.js';
import { bucket, removedPaths, resetBucket, storedImage } from './helpers/supabaseMock.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const BASE = '/api/v1/admin/gear';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let agent;
let category;
let climate;
let tag;

// A complete, valid create body. `slug` is left out so the server generates it.
const gearBody = (overrides = {}) => {
  const { slug: _slug, ...data } = buildGearData({ category: category.id });
  return { ...data, ...overrides };
};

const create = (overrides) => agent.post(BASE).send(gearBody(overrides));
const patch = (id, body) => agent.patch(`${BASE}/${id}`).send(body);
const fieldsOf = (res) => res.body.errors.map(({ field }) => field);
const summary = ({ id, type, name, slug }) => ({ id, type, name, slug });

beforeEach(async () => {
  resetBucket();
  agent = authAgent(await createUser({ role: 'admin' }));
  [category, climate, tag] = await Promise.all([
    createTaxonomy({ name: 'Backpacks', slug: 'backpacks' }),
    createTaxonomy({ type: 'climate', name: 'Desert', slug: 'desert' }),
    createTaxonomy({ type: 'tag', name: 'Waterproof', slug: 'waterproof' }),
  ]);
});

describe('POST /api/v1/admin/gear', () => {
  it('creates gear with a generated slug and populated references', async () => {
    const tour = await createTour();
    const images = [storedImage('gear'), storedImage('gear', 'png')];

    const res = await create({
      name: 'Trail Pack 40L',
      description: 'Long description',
      images,
      climates: [climate.id],
      tags: [tag.id],
      tours: [tour.id],
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gear created');
    expect(res.body.data.gear).toEqual({
      id: expect.any(String),
      name: 'Trail Pack 40L',
      slug: 'trail-pack-40l',
      shortDescription: '40L weatherproof pack',
      description: 'Long description',
      images,
      mrp: 3999,
      salePrice: 2899,
      affiliateUrl: expect.stringMatching(/^https:\/\/example\.com\//),
      category: summary(category),
      climates: [summary(climate)],
      tags: [summary(tag)],
      tours: [{ id: tour.id, title: tour.title, slug: tour.slug }],
      isActive: true,
      clickCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('uses a provided slug, and a clashing slug → 409 DUPLICATE', async () => {
    const first = await create({ slug: 'my-pack' });
    expect(first.body.data.gear.slug).toBe('my-pack');

    const clash = await create({ slug: 'my-pack' });
    expect(clash.status).toBe(409);
    expect(clash.body.code).toBe('DUPLICATE');
  });

  it('salePrice above mrp → 400 on salePrice; equal prices are fine', async () => {
    const over = await create({ mrp: 2000, salePrice: 2001 });
    expect(over.status).toBe(400);
    expect(over.body.code).toBe('VALIDATION_ERROR');
    expect(over.body.errors).toEqual([
      { field: 'salePrice', message: 'Sale price must not exceed MRP' },
    ]);

    expect((await create({ mrp: 2000, salePrice: 2000 })).status).toBe(201);
  });

  it.each([
    ['http', 'http://example.com/pack'],
    ['protocol-relative', '//example.com/pack'],
    ['javascript', 'javascript:alert(1)'],
    ['ftp', 'ftp://example.com/pack'],
    ['not a url', 'example dot com'],
  ])('rejects a %s affiliate URL', async (_label, affiliateUrl) => {
    const res = await create({ affiliateUrl });

    expect(res.status).toBe(400);
    expect([...new Set(fieldsOf(res))]).toEqual(['affiliateUrl']);
    expect(await Gear.countDocuments()).toBe(0);
  });

  it('rejects taxonomy ids of the wrong type, naming each field', async () => {
    const res = await create({
      category: climate.id,
      climates: [tag.id],
      tags: [category.id],
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(fieldsOf(res)).toEqual(['category', 'climates', 'tags']);
    expect(await Gear.countDocuments()).toBe(0);
  });

  it('rejects one wrong-type id among valid ones', async () => {
    const res = await create({ climates: [climate.id, tag.id] });

    expect(fieldsOf(res)).toEqual(['climates']);
  });

  it('rejects taxonomy and tour ids that do not exist', async () => {
    const res = await create({ category: UNKNOWN_ID, tags: [UNKNOWN_ID], tours: [UNKNOWN_ID] });

    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(['category', 'tags', 'tours']);
  });

  it('accepts uppercase ids and stores repeated ids once', async () => {
    const tour = await createTour();

    const res = await create({
      category: category.id.toUpperCase(),
      tags: [tag.id, tag.id.toUpperCase()],
      tours: [tour.id, tour.id],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.gear.tags).toHaveLength(1);
    expect(res.body.data.gear.tours).toHaveLength(1);
  });

  it('can link an unpublished tour', async () => {
    const draft = await createTour({ isPublished: false });

    const res = await create({ tours: [draft.id] });

    expect(res.status).toBe(201);
  });

  it('rejects fields the client must not set and reports invalid ones together', async () => {
    const forbidden = await create({ clickCount: 999 });
    expect(forbidden.status).toBe(400);
    expect(forbidden.body.errors).toEqual([{ field: 'clickCount', message: 'Unknown field' }]);

    const { category: _c, ...withoutCategory } = gearBody();
    const invalid = await agent.post(BASE).send({
      ...withoutCategory,
      name: '',
      mrp: 0,
      salePrice: 99.5,
      images: [{ url: 'https://cdn.example.com/a.png', path: 'gear/not-generated.png' }],
    });
    expect(fieldsOf(invalid).sort()).toEqual([
      'category',
      'images.0.path',
      'mrp',
      'name',
      'salePrice',
    ]);
  });
});

describe('GET /api/v1/admin/gear', () => {
  it('includes inactive gear, with category, clicks and pagination meta', async () => {
    const active = await createGear({ category: category._id, createdAt: new Date('2026-01-01') });
    const inactive = await createGear({
      category: category._id,
      isActive: false,
      clickCount: 7,
      createdAt: new Date('2026-02-01'),
    });

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 2, totalPages: 1 });
    expect(res.body.data.gear.map(({ id }) => id)).toEqual([inactive.id, active.id]);
    expect(res.body.data.gear[0]).toEqual({
      id: inactive.id,
      name: inactive.name,
      slug: inactive.slug,
      images: [],
      mrp: 3999,
      salePrice: 2899,
      category: summary(category),
      isActive: false,
      clickCount: 7,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('filters by q, isActive, category, climate, tag and tour ids, alone and combined', async () => {
    const shoes = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });
    const tour = await createTour({ isPublished: false });
    const pack = await createGear({
      name: 'Alpine Pack',
      category: category._id,
      climates: [climate._id],
      tours: [tour._id],
    });
    const boots = await createGear({ name: 'Alpine Boots', category: shoes._id, tags: [tag._id] });
    const hidden = await createGear({ name: 'Old Sandals', category: shoes._id, isActive: false });
    const ids = async (query) =>
      (await agent.get(BASE).query(query)).body.data.gear.map(({ id }) => id).sort();

    expect(await ids({ q: 'alpine' })).toEqual([pack.id, boots.id].sort());
    expect(await ids({ isActive: 'false' })).toEqual([hidden.id]);
    expect(await ids({ isActive: 'true' })).toEqual([pack.id, boots.id].sort());
    expect(await ids({ category: shoes.id })).toEqual([boots.id, hidden.id].sort());
    expect(await ids({ climate: climate.id })).toEqual([pack.id]);
    expect(await ids({ tag: tag.id })).toEqual([boots.id]);
    expect(await ids({ tour: tour.id })).toEqual([pack.id]);
    expect(await ids({ category: shoes.id, isActive: 'true', q: 'alpine' })).toEqual([boots.id]);
    expect(await ids({ category: UNKNOWN_ID })).toEqual([]);
  });

  it('sorts and paginates, and validates the query', async () => {
    const cheap = await createGear({ category: category._id, salePrice: 500, clickCount: 1 });
    const dear = await createGear({ category: category._id, salePrice: 3000, clickCount: 9 });
    const order = async (sort) =>
      (await agent.get(BASE).query({ sort })).body.data.gear.map(({ id }) => id);

    expect(await order('price_asc')).toEqual([cheap.id, dear.id]);
    expect(await order('price_desc')).toEqual([dear.id, cheap.id]);
    expect(await order('popular')).toEqual([dear.id, cheap.id]);

    const page2 = await agent.get(BASE).query({ sort: 'price_asc', page: 2, limit: 1 });
    expect(page2.body.data.gear.map(({ id }) => id)).toEqual([dear.id]);
    expect(page2.body.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });

    expect((await agent.get(BASE).query({ category: 'backpacks' })).status).toBe(400);
    expect((await agent.get(BASE).query({ isActive: '1' })).status).toBe(400);
    expect((await agent.get(BASE).query({ sort: 'random' })).status).toBe(400);
    expect((await agent.get(BASE).query({ limit: 51 })).status).toBe(400);
  });
});

describe('GET /api/v1/admin/gear/:id', () => {
  it('returns inactive gear with its affiliate URL', async () => {
    const gear = await createGear({ category: category._id, isActive: false });

    const res = await agent.get(`${BASE}/${gear.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.gear).toMatchObject({
      id: gear.id,
      isActive: false,
      affiliateUrl: gear.affiliateUrl,
      category: summary(category),
    });
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.get(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    expect((await agent.get(`${BASE}/nope`)).body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/v1/admin/gear/:id', () => {
  it('updates only the fields that are sent and never the click count', async () => {
    const gear = await createGear({ category: category._id, clickCount: 5 });

    const res = await patch(gear.id, { isActive: false, shortDescription: 'Now 45L' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Gear updated');
    expect(res.body.data.gear).toMatchObject({
      id: gear.id,
      name: gear.name,
      slug: gear.slug,
      shortDescription: 'Now 45L',
      isActive: false,
      clickCount: 5,
    });

    const forbidden = await patch(gear.id, { name: 'Renamed', clickCount: 0 });
    expect(forbidden.status).toBe(400);
    expect(forbidden.body.errors).toEqual([{ field: 'clickCount', message: 'Unknown field' }]);
    expect((await patch(gear.id, {})).status).toBe(400);
  });

  it('checks salePrice against the stored mrp when only one price is sent', async () => {
    const gear = await createGear({ category: category._id, mrp: 3999, salePrice: 2899 });

    const saleOver = await patch(gear.id, { salePrice: 4000 });
    expect(saleOver.status).toBe(400);
    expect(saleOver.body.errors).toEqual([
      { field: 'salePrice', message: 'Sale price must not exceed MRP' },
    ]);

    const mrpUnder = await patch(gear.id, { mrp: 2000 });
    expect(mrpUnder.status).toBe(400);
    expect(fieldsOf(mrpUnder)).toEqual(['salePrice']);

    const both = await patch(gear.id, { mrp: 2000, salePrice: 1500 });
    expect(both.body.data.gear).toMatchObject({ mrp: 2000, salePrice: 1500 });
  });

  it('rejects a non-https affiliate URL and wrong-type taxonomies', async () => {
    const gear = await createGear({ category: category._id });

    const url = await patch(gear.id, { affiliateUrl: 'http://example.com/pack' });
    expect(fieldsOf(url)).toEqual(['affiliateUrl']);

    const wrong = await patch(gear.id, { category: tag.id });
    expect(wrong.status).toBe(400);
    expect(fieldsOf(wrong)).toEqual(['category']);

    const missingTour = await patch(gear.id, { tours: [UNKNOWN_ID] });
    expect(fieldsOf(missingTour)).toEqual(['tours']);

    const saved = await Gear.findById(gear.id).lean();
    expect(String(saved.category)).toBe(category.id);
    expect(saved.affiliateUrl).toBe(gear.affiliateUrl);
  });

  it('replaces linked tours and taxonomies, and the change reaches the public store', async () => {
    const first = await createTour();
    const second = await createTour();
    const gear = await createGear({ category: category._id, tours: [first._id] });

    const res = await patch(gear.id, { tours: [second.id], climates: [climate.id], tags: [] });

    expect(res.body.data.gear.tours.map(({ id }) => id)).toEqual([second.id]);
    expect(res.body.data.gear.climates).toEqual([summary(climate)]);
    const byTour = async (slug) =>
      (await request(app).get('/api/v1/gear').query({ tour: slug })).body.data.gear;
    expect(await byTour(first.slug)).toEqual([]);
    expect((await byTour(second.slug)).map(({ id }) => id)).toEqual([gear.id]);
  });

  it('a slug that belongs to other gear → 409 DUPLICATE', async () => {
    await createGear({ category: category._id, slug: 'taken' });
    const gear = await createGear({ category: category._id });

    const res = await patch(gear.id, { slug: 'taken' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE');
  });

  it('deletes images that were removed or replaced, and keeps the rest', async () => {
    const [a, b, c] = [storedImage('gear'), storedImage('gear'), storedImage('gear')];
    const gear = await createGear({ category: category._id, images: [a, b, c] });
    const fresh = storedImage('gear');

    await patch(gear.id, { images: [c, fresh] });

    expect(removedPaths().sort()).toEqual([a.path, b.path].sort());
  });

  it('leaves storage alone when images are not part of the update, or the update fails', async () => {
    const gear = await createGear({ category: category._id, images: [storedImage('gear')] });

    await patch(gear.id, { name: 'Renamed' });
    await patch(gear.id, { images: [], salePrice: 999999 });

    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await patch(UNKNOWN_ID, { name: 'x' })).status).toBe(404);
    expect((await patch('nope', { name: 'x' })).status).toBe(400);
  });
});

describe('DELETE /api/v1/admin/gear/:id', () => {
  it('deletes the gear, its click log and its images, and nothing else', async () => {
    const images = [storedImage('gear'), storedImage('gear')];
    const gear = await createGear({ category: category._id, images });
    const other = await createGear({ category: category._id, images: [storedImage('gear')] });
    const user = await createUser();
    await GearClick.create([
      { gear: gear._id, user: user._id },
      { gear: gear._id },
      { gear: other._id },
    ]);

    const res = await agent.delete(`${BASE}/${gear.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Gear deleted' });
    expect(await Gear.exists({ _id: gear._id })).toBeNull();
    expect(await GearClick.countDocuments({ gear: gear._id })).toBe(0);
    expect(await GearClick.countDocuments({ gear: other._id })).toBe(1);
    expect(await Gear.exists({ _id: other._id })).not.toBeNull();
    expect(removedPaths().sort()).toEqual(images.map(({ path }) => path).sort());
  });

  it('the affiliate redirect stops working once gear is deleted', async () => {
    const gear = await createGear({ category: category._id });

    await agent.delete(`${BASE}/${gear.id}`);

    const res = await request(app).get(`/api/v1/gear/${gear.id}/go`);
    expect(res.status).toBe(404);
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.delete(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    expect((await agent.delete(`${BASE}/nope`)).body.code).toBe('VALIDATION_ERROR');
  });
});
