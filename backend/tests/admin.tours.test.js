import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { Gear } from '../src/models/Gear.js';
import { Tour } from '../src/models/Tour.js';
import { authAgent } from './helpers/authAgent.js';
import {
  buildTourData,
  createBooking,
  createGear,
  createTour,
  createUser,
  createVertical,
} from './helpers/factories.js';
import { bucket, removedPaths, resetBucket, storedImage } from './helpers/supabaseMock.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const BASE = '/api/v1/admin/tours';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let agent;
let vertical;

// A complete, valid create body. `slug` is left out so the server generates it.
const tourBody = (overrides = {}) => {
  const { slug: _slug, ...data } = buildTourData({ vertical: vertical.id });
  return { ...data, ...overrides };
};

const create = (overrides) => agent.post(BASE).send(tourBody(overrides));
const patch = (id, body) => agent.patch(`${BASE}/${id}`).send(body);
const fieldsOf = (res) => res.body.errors.map(({ field }) => field);

beforeEach(async () => {
  resetBucket();
  agent = authAgent(await createUser({ role: 'admin' }));
  vertical = await createVertical();
});

describe('POST /api/v1/admin/tours', () => {
  it('creates a tour with a generated slug and the starting price of its cheapest tier', async () => {
    const coverImage = storedImage('tours');
    const gallery = [storedImage('tours'), storedImage('tours', 'jpg')];

    const res = await create({ title: 'Goa & Gokarna Escape', coverImage, gallery });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Tour created');
    expect(res.body.data.tour).toMatchObject({
      id: expect.any(String),
      title: 'Goa & Gokarna Escape',
      slug: 'goa-and-gokarna-escape',
      vertical: { id: vertical.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
      state: 'Goa',
      durationDays: 4,
      difficulty: 'easy',
      coverImage,
      gallery,
      signatureActivity: { title: 'Parasailing', description: 'Fly over Calangute beach.' },
      reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
      startingPrice: 14999,
      isPublished: true,
    });
    expect(res.body.data.tour.tiers).toEqual([
      {
        id: expect.any(String),
        name: 'Essential',
        description: 'Shared stay',
        pricePerPerson: 14999,
      },
      {
        id: expect.any(String),
        name: 'Explorer',
        description: 'Private stay',
        pricePerPerson: 18749,
      },
    ]);
  });

  it('defaults to unpublished with empty optional lists', async () => {
    const {
      isPublished: _p,
      tagline: _t,
      topActivities: _a,
      itinerary: _i,
      inclusions: _in,
      exclusions: _ex,
      ...minimal
    } = tourBody();

    const res = await agent.post(BASE).send(minimal);

    expect(res.status).toBe(201);
    expect(res.body.data.tour).toMatchObject({
      isPublished: false,
      tagline: '',
      coverImage: null,
      gallery: [],
      topActivities: [],
      itinerary: [],
      inclusions: [],
      exclusions: [],
    });
  });

  it('uses a provided slug, and a clashing slug → 409 DUPLICATE', async () => {
    const first = await create({ slug: 'goa-special' });
    expect(first.body.data.tour.slug).toBe('goa-special');

    const provided = await create({ slug: 'goa-special' });
    expect(provided.status).toBe(409);
    expect(provided.body.code).toBe('DUPLICATE');

    await create({ title: 'Same Title' });
    const generated = await create({ title: 'Same Title' });
    expect(generated.status).toBe(409);
    expect(generated.body.code).toBe('DUPLICATE');
  });

  it('requires the signature activity', async () => {
    const { signatureActivity: _s, ...body } = tourBody();

    const missing = await agent.post(BASE).send(body);
    expect(missing.status).toBe(400);
    expect(fieldsOf(missing)).toEqual(['signatureActivity']);

    const partial = await create({ signatureActivity: { title: 'Parasailing' } });
    expect(fieldsOf(partial)).toEqual(['signatureActivity.description']);

    const blank = await create({ signatureActivity: { title: '  ', description: 'x' } });
    expect(fieldsOf(blank)).toEqual(['signatureActivity.title']);
  });

  it.each([
    ['no tiers', []],
    [
      'six tiers',
      Array.from({ length: 6 }, (_, index) => ({ name: `Tier ${index}`, pricePerPerson: 1000 })),
    ],
    [
      'duplicate names',
      [
        { name: 'Essential', pricePerPerson: 1000 },
        { name: ' essential ', pricePerPerson: 2000 },
      ],
    ],
  ])('rejects %s', async (_label, tiers) => {
    const res = await create({ tiers });

    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(['tiers']);
  });

  it.each([
    ['zero', 0],
    ['negative', -500],
    ['fractional', 1499.5],
    ['a string', '14999'],
  ])('rejects a tier price that is %s', async (_label, pricePerPerson) => {
    const res = await create({ tiers: [{ name: 'Essential', pricePerPerson }] });

    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(['tiers.0.pricePerPerson']);
  });

  it('rejects client-supplied tier ids and startingPrice on create', async () => {
    const withId = await create({
      tiers: [{ id: UNKNOWN_ID, name: 'Essential', pricePerPerson: 1000 }],
    });
    expect(withId.status).toBe(400);
    expect(fieldsOf(withId)).toEqual(['tiers.0.id']);

    const withPrice = await create({ startingPrice: 1 });
    expect(withPrice.status).toBe(400);
    expect(withPrice.body.errors).toEqual([{ field: 'startingPrice', message: 'Unknown field' }]);
  });

  it.each([
    ['starting at 2', [{ day: 2, title: 'Late start' }]],
    [
      'with a gap',
      [
        { day: 1, title: 'One' },
        { day: 3, title: 'Three' },
      ],
    ],
    [
      'out of order',
      [
        { day: 2, title: 'Two' },
        { day: 1, title: 'One' },
      ],
    ],
  ])('rejects an itinerary %s', async (_label, itinerary) => {
    const res = await create({ itinerary });

    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(['itinerary']);
  });

  it('rejects an itinerary day without a title', async () => {
    const res = await create({ itinerary: [{ day: 1, description: 'No title' }] });

    expect(fieldsOf(res)).toEqual(['itinerary.0.title']);
  });

  it.each(['9:30', '24:00', '10:60', '10.30', '10:30 AM', ''])(
    'rejects reporting time "%s"',
    async (time) => {
      const res = await create({ reporting: { location: 'Airport', time } });

      expect(res.status).toBe(400);
      expect(fieldsOf(res)).toEqual(['reporting.time']);
    },
  );

  it.each(['00:00', '09:05', '23:59'])('accepts reporting time "%s"', async (time) => {
    const res = await create({ reporting: { location: 'Airport', time } });

    expect(res.status).toBe(201);
    expect(res.body.data.tour.reporting).toEqual({ location: 'Airport', address: '', time });
  });

  it('reports every invalid field in one response', async () => {
    const res = await create({
      title: '',
      durationDays: 0,
      difficulty: 'extreme',
      overview: 'x'.repeat(5001),
      coverImage: { url: 'http://cdn.example.com/a.png' },
      gallery: [{ url: 'https://cdn.example.com/a.png', path: 'tours/../../etc/passwd' }],
      topActivities: ['ok', ''],
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(fieldsOf(res).sort()).toEqual([
      'coverImage.url',
      'difficulty',
      'durationDays',
      'gallery.0.path',
      'overview',
      'title',
      'topActivities.1',
    ]);
  });

  it('rejects a vertical that does not exist or is malformed', async () => {
    const unknown = await create({ vertical: UNKNOWN_ID });
    expect(unknown.status).toBe(400);
    expect(unknown.body.errors).toEqual([{ field: 'vertical', message: expect.any(String) }]);

    const malformed = await create({ vertical: 'tidetrail' });
    expect(fieldsOf(malformed)).toEqual(['vertical']);
    expect(await Tour.countDocuments()).toBe(0);
  });
});

describe('GET /api/v1/admin/tours', () => {
  it('includes unpublished tours, newest first, with pagination meta', async () => {
    const older = await createTour({ createdAt: new Date('2026-01-01') });
    const draft = await createTour({ isPublished: false, createdAt: new Date('2026-02-01') });

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 2, totalPages: 1 });
    expect(res.body.data.tours.map(({ id }) => id)).toEqual([draft.id, older.id]);
    expect(res.body.data.tours[0]).toEqual({
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      state: 'Goa',
      destination: 'North Goa',
      durationDays: 4,
      difficulty: 'easy',
      coverImage: null,
      startingPrice: 14999,
      isPublished: false,
      vertical: { id: vertical.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('filters by vertical key, isPublished and q', async () => {
    const peak = await createVertical({
      key: 'peakpulse',
      code: 'PP',
      name: 'PeakPulse',
      order: 3,
    });
    const goa = await createTour({ title: 'Goa Escape' });
    const draft = await createTour({ title: 'Gokarna Draft', isPublished: false });
    const manali = await createTour({ vertical: peak, title: 'Manali Trek', state: 'Himachal' });
    const ids = async (query) =>
      (await agent.get(BASE).query(query)).body.data.tours.map(({ id }) => id).sort();

    expect(await ids({ vertical: 'peakpulse' })).toEqual([manali.id]);
    expect(await ids({ vertical: 'urbanecho' })).toEqual([]);
    expect(await ids({ isPublished: 'false' })).toEqual([draft.id]);
    expect(await ids({ isPublished: 'true' })).toEqual([goa.id, manali.id].sort());
    expect(await ids({ q: 'HIMACHAL' })).toEqual([manali.id]);
    expect(await ids({ q: '.*' })).toEqual([]);
    expect(await ids({ vertical: 'tidetrail', isPublished: 'true', q: 'goa' })).toEqual([goa.id]);
  });

  it('paginates and validates the query', async () => {
    await Promise.all([createTour(), createTour(), createTour()]);

    const page2 = await agent.get(BASE).query({ page: 2, limit: 2 });
    expect(page2.body.data.tours).toHaveLength(1);
    expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });

    expect((await agent.get(BASE).query({ limit: 51 })).status).toBe(400);
    expect((await agent.get(BASE).query({ isPublished: 'yes' })).status).toBe(400);
    expect((await agent.get(BASE).query({ q: 'a' })).status).toBe(400);
  });
});

describe('GET /api/v1/admin/tours/:id', () => {
  it('returns the full tour, published or not', async () => {
    const tour = await createTour({ isPublished: false });

    const res = await agent.get(`${BASE}/${tour.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tour).toMatchObject({
      id: tour.id,
      isPublished: false,
      itinerary: [
        { day: 1, title: 'Arrival', description: 'Check in and sunset walk.' },
        { day: 2, title: 'Water sports', description: 'Parasailing and jet ski.' },
      ],
      inclusions: ['Stay', 'Breakfast'],
      exclusions: ['Flights'],
    });
    expect(res.body.data.tour.tiers.map(({ id }) => id)).toEqual(tour.tiers.map(({ id }) => id));
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.get(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    expect((await agent.get(`${BASE}/nope`)).body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/v1/admin/tours/:id', () => {
  it('updates only the fields that are sent', async () => {
    const tour = await createTour();

    const res = await patch(tour.id, { tagline: 'New tagline', isPublished: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Tour updated');
    expect(res.body.data.tour).toMatchObject({
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      tagline: 'New tagline',
      isPublished: false,
      startingPrice: 14999,
    });
  });

  it('keeps the slug when the title changes, unless a slug is sent', async () => {
    const tour = await createTour({ slug: 'goa-original' });

    const retitled = await patch(tour.id, { title: 'A Completely New Title' });
    expect(retitled.body.data.tour.slug).toBe('goa-original');

    const reslugged = await patch(tour.id, { slug: 'goa-renamed' });
    expect(reslugged.body.data.tour.slug).toBe('goa-renamed');
  });

  it('a slug that belongs to another tour → 409 DUPLICATE', async () => {
    await createTour({ slug: 'taken' });
    const tour = await createTour();

    const res = await patch(tour.id, { slug: 'taken' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE');
  });

  it('recomputes startingPrice when tiers are replaced', async () => {
    const tour = await createTour();

    const cheaper = await patch(tour.id, {
      tiers: [
        { name: 'Budget', pricePerPerson: 9999 },
        { name: 'Explorer', pricePerPerson: 18749 },
      ],
    });
    expect(cheaper.body.data.tour.startingPrice).toBe(9999);

    const pricier = await patch(tour.id, {
      tiers: [{ name: 'VIP Palace', pricePerPerson: 25498 }],
    });
    expect(pricier.body.data.tour.startingPrice).toBe(25498);
    expect((await Tour.findById(tour.id).lean()).startingPrice).toBe(25498);

    const card = await request(app).get(`/api/v1/tours/${tour.slug}`);
    expect(card.body.data.tour.startingPrice).toBe(25498);
  });

  it('keeps the id of a tier sent with its id and gives new tiers a new id', async () => {
    const tour = await createTour();
    const [essential, explorer] = tour.tiers;

    const res = await patch(tour.id, {
      tiers: [
        { id: explorer.id, name: 'Explorer Plus', pricePerPerson: 19999 },
        { name: 'Essential', pricePerPerson: 14999 },
        { id: UNKNOWN_ID, name: 'Foreign id', pricePerPerson: 30000 },
      ],
    });

    const [first, second, third] = res.body.data.tour.tiers;
    expect(first).toMatchObject({ id: explorer.id, name: 'Explorer Plus', pricePerPerson: 19999 });
    expect(second.id).not.toBe(essential.id);
    expect(third.id).not.toBe(UNKNOWN_ID);
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  });

  it('gives a repeated tier id to one tier only', async () => {
    const tour = await createTour();
    const [essential] = tour.tiers;

    const res = await patch(tour.id, {
      tiers: [
        { id: essential.id, name: 'One', pricePerPerson: 1000 },
        { id: essential.id, name: 'Two', pricePerPerson: 2000 },
      ],
    });

    const [first, second] = res.body.data.tour.tiers;
    expect(first.id).toBe(essential.id);
    expect(second.id).not.toBe(essential.id);
  });

  it('applies the tier, itinerary and reporting rules on update', async () => {
    const tour = await createTour();

    const tiers = await patch(tour.id, { tiers: [] });
    const itinerary = await patch(tour.id, { itinerary: [{ day: 2, title: 'Two' }] });
    const reporting = await patch(tour.id, { reporting: { location: 'Airport', time: '25:00' } });
    const signature = await patch(tour.id, { signatureActivity: { title: 'Only a title' } });

    expect(fieldsOf(tiers)).toEqual(['tiers']);
    expect(fieldsOf(itinerary)).toEqual(['itinerary']);
    expect(fieldsOf(reporting)).toEqual(['reporting.time']);
    expect(fieldsOf(signature)).toEqual(['signatureActivity.description']);
    const saved = await Tour.findById(tour.id).lean();
    expect(saved.tiers).toHaveLength(2);
    expect(saved.reporting.time).toBe('10:30');
  });

  it('rejects an empty body and fields the client must not set', async () => {
    const tour = await createTour();

    expect((await patch(tour.id, {})).status).toBe(400);
    const res = await patch(tour.id, { title: 'ok', startingPrice: 1, createdAt: '2020-01-01' });
    expect(res.status).toBe(400);
    expect(fieldsOf(res).sort()).toEqual(['createdAt', 'startingPrice']);
  });

  it('moves a tour to another vertical, but not to one that does not exist', async () => {
    const peak = await createVertical({
      key: 'peakpulse',
      code: 'PP',
      name: 'PeakPulse',
      order: 3,
    });
    const tour = await createTour();

    const moved = await patch(tour.id, { vertical: peak.id });
    expect(moved.body.data.tour.vertical).toMatchObject({ id: peak.id, key: 'peakpulse' });

    const missing = await patch(tour.id, { vertical: UNKNOWN_ID });
    expect(missing.status).toBe(400);
    expect(fieldsOf(missing)).toEqual(['vertical']);
  });

  it('reporting edits reach the public tour', async () => {
    const tour = await createTour();

    await patch(tour.id, { reporting: { location: 'Madgaon Station', time: '06:15' } });

    const res = await request(app).get(`/api/v1/tours/${tour.slug}`);
    expect(res.body.data.tour.reporting).toEqual({
      location: 'Madgaon Station',
      address: '',
      time: '06:15',
    });
  });

  it('deletes the old cover image from storage when it is replaced', async () => {
    const oldCover = storedImage('tours');
    const kept = storedImage('tours');
    const tour = await createTour({ coverImage: oldCover, gallery: [kept] });
    const newCover = storedImage('tours');

    const res = await patch(tour.id, { coverImage: newCover });

    expect(res.body.data.tour.coverImage).toEqual(newCover);
    expect(removedPaths()).toEqual([oldCover.path]);
  });

  it('deletes gallery images that were removed and keeps reordered ones', async () => {
    const [a, b, c] = [storedImage('tours'), storedImage('tours'), storedImage('tours')];
    const cover = storedImage('tours');
    const tour = await createTour({ coverImage: cover, gallery: [a, b, c] });

    await patch(tour.id, { gallery: [c, a] });

    expect(removedPaths()).toEqual([b.path]);
  });

  it('does not delete an image that moved between cover and gallery', async () => {
    const cover = storedImage('tours');
    const other = storedImage('tours');
    const tour = await createTour({ coverImage: cover, gallery: [other] });

    await patch(tour.id, { coverImage: other, gallery: [cover] });

    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('clearing the cover deletes it; images without a storage path are never deleted', async () => {
    const cover = storedImage('tours');
    const external = { url: 'https://picsum.photos/seed/goa/1200/800', path: null };
    const tour = await createTour({ coverImage: cover, gallery: [external] });

    await patch(tour.id, { coverImage: null, gallery: [] });

    expect(removedPaths()).toEqual([cover.path]);
  });

  it('a failed update deletes nothing from storage', async () => {
    const cover = storedImage('tours');
    await createTour({ slug: 'taken' });
    const tour = await createTour({ coverImage: cover });

    const res = await patch(tour.id, { slug: 'taken', coverImage: storedImage('tours') });

    expect(res.status).toBe(409);
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await patch(UNKNOWN_ID, { title: 'x' })).status).toBe(404);
    expect((await patch('nope', { title: 'x' })).status).toBe(400);
  });
});

describe('DELETE /api/v1/admin/tours/:id', () => {
  it('is blocked with 409 RESOURCE_IN_USE while bookings exist, whatever their status', async () => {
    const tour = await createTour({ coverImage: storedImage('tours') });
    await createBooking({ tour, status: 'cancelled' });

    const res = await agent.delete(`${BASE}/${tour.id}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Tour has bookings',
      code: 'RESOURCE_IN_USE',
    });
    expect(await Tour.exists({ _id: tour._id })).not.toBeNull();
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('deletes the tour, pulls it from gear.tours and deletes its images', async () => {
    const cover = storedImage('tours');
    const gallery = [storedImage('tours'), storedImage('tours')];
    const external = { url: 'https://picsum.photos/seed/x/800/600', path: null };
    const tour = await createTour({ coverImage: cover, gallery: [...gallery, external] });
    const other = await createTour();
    const linked = await createGear({ tours: [tour._id, other._id] });
    const onlyThis = await createGear({ tours: [tour._id] });
    const unrelated = await createGear({ tours: [other._id] });

    const res = await agent.delete(`${BASE}/${tour.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Tour deleted' });
    expect(await Tour.exists({ _id: tour._id })).toBeNull();

    const toursOf = async (gear) => (await Gear.findById(gear.id).lean()).tours.map(String);
    expect(await toursOf(linked)).toEqual([other.id]);
    expect(await toursOf(onlyThis)).toEqual([]);
    expect(await toursOf(unrelated)).toEqual([other.id]);

    expect(bucket.remove).toHaveBeenCalledTimes(1);
    expect(removedPaths().sort()).toEqual([cover.path, ...gallery.map(({ path }) => path)].sort());
  });

  it('deletes a tour with no images without calling storage', async () => {
    const tour = await createTour();

    const res = await agent.delete(`${BASE}/${tour.id}`);

    expect(res.status).toBe(200);
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('still deletes the tour when storage cleanup fails', async () => {
    bucket.remove.mockRejectedValue(new Error('storage down'));
    const tour = await createTour({ coverImage: storedImage('tours') });

    const res = await agent.delete(`${BASE}/${tour.id}`);

    expect(res.status).toBe(200);
    expect(await Tour.exists({ _id: tour._id })).toBeNull();
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.delete(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    expect((await agent.delete(`${BASE}/nope`)).body.code).toBe('VALIDATION_ERROR');
  });
});
