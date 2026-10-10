import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { createTour, createVertical } from './helpers/factories.js';

const BASE = '/api/v1/tours';

const createPeakPulse = () =>
  createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse', order: 3 });

const list = (query = {}) => request(app).get(BASE).query(query);
const ids = (res) => res.body.data.tours.map(({ id }) => id);

describe('GET /api/v1/tours', () => {
  it('returns published tour cards with the vertical summary and pagination meta', async () => {
    const vertical = await createVertical();
    const tour = await createTour({ vertical });
    await createTour({ vertical, isPublished: false });

    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tours fetched');
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
    expect(res.body.data.tours).toEqual([
      {
        id: tour.id,
        vertical: { id: vertical.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
        title: tour.title,
        slug: tour.slug,
        state: 'Goa',
        destination: 'North Goa',
        tagline: 'Sun, surf and shacks',
        durationDays: 4,
        difficulty: 'easy',
        coverImage: null,
        topActivities: ['Parasailing', 'Beach hopping'],
        startingPrice: 14999,
      },
    ]);
  });

  it('filters by vertical key', async () => {
    const tideTrail = await createVertical();
    const peakPulse = await createPeakPulse();
    await createTour({ vertical: tideTrail });
    const trek = await createTour({ vertical: peakPulse });
    await createTour({ vertical: peakPulse, isPublished: false });

    const res = await list({ vertical: 'peakpulse' });
    expect(ids(res)).toEqual([trek.id]);
    expect(res.body.meta.total).toBe(1);
  });

  it('returns an empty page for a vertical that does not exist', async () => {
    await createTour();
    const res = await list({ vertical: 'moonwalk', limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.tours).toEqual([]);
    expect(res.body.meta).toEqual({ page: 1, limit: 5, total: 0, totalPages: 0 });
  });

  it('filters by state as a case-insensitive exact match', async () => {
    const goa = await createTour({ state: 'Goa' });
    await createTour({ state: 'Goa Border' });
    await createTour({ state: 'Kerala' });

    expect(ids(await list({ state: 'goa' }))).toEqual([goa.id]);
    expect(ids(await list({ state: 'go' }))).toEqual([]);
  });

  it('filters by difficulty', async () => {
    await createTour({ difficulty: 'easy' });
    const hard = await createTour({ difficulty: 'challenging' });
    expect(ids(await list({ difficulty: 'challenging' }))).toEqual([hard.id]);
  });

  it.each([
    ['title', 'hampta'],
    ['state', 'HIMACHAL'],
    ['destination', 'manali'],
  ])('q matches on %s, case-insensitively', async (_field, q) => {
    const match = await createTour({
      title: 'Hampta Pass Trek',
      state: 'Himachal Pradesh',
      destination: 'Manali',
    });
    await createTour();

    expect(ids(await list({ q }))).toEqual([match.id]);
  });

  it('combines filters and never leaks unpublished tours', async () => {
    const tideTrail = await createVertical();
    const peakPulse = await createPeakPulse();
    const match = await createTour({
      vertical: peakPulse,
      state: 'Ladakh',
      difficulty: 'challenging',
      title: 'Markha Valley Trek',
    });
    await createTour({
      vertical: peakPulse,
      state: 'Ladakh',
      difficulty: 'challenging',
      title: 'Markha Valley Winter',
      isPublished: false,
    });
    await createTour({ vertical: peakPulse, state: 'Ladakh', difficulty: 'easy', title: 'Markha' });
    await createTour({ vertical: tideTrail, state: 'Ladakh', difficulty: 'challenging' });

    const res = await list({
      vertical: 'peakpulse',
      state: 'ladakh',
      difficulty: 'challenging',
      q: 'markha',
    });
    expect(ids(res)).toEqual([match.id]);
    expect(res.body.meta.total).toBe(1);
  });

  it('treats regex special characters in q literally', async () => {
    const literal = await createTour({ title: 'Goa (North) .* Special' });
    await createTour({ title: 'Goa South' });

    for (const q of ['.*', '(North)', '(n']) {
      const res = await list({ q });
      expect(res.status).toBe(200);
      expect(ids(res)).toEqual([literal.id]);
    }
    for (const q of ['[a-z]+', '\\d|.', '^$', '((']) {
      const res = await list({ q });
      expect(res.status).toBe(200);
      expect(ids(res)).toEqual([]);
    }
  });

  it('paginates newest first with correct meta', async () => {
    const vertical = await createVertical();
    const tours = [];
    for (let i = 0; i < 5; i += 1) tours.push(await createTour({ vertical }));
    const newestFirst = tours.map(({ id }) => id).reverse();

    const first = await list({ limit: 2 });
    expect(ids(first)).toEqual(newestFirst.slice(0, 2));
    expect(first.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });

    const last = await list({ limit: 2, page: 3 });
    expect(ids(last)).toEqual(newestFirst.slice(4));
    expect(last.body.meta).toEqual({ page: 3, limit: 2, total: 5, totalPages: 3 });

    const beyond = await list({ limit: 2, page: 9 });
    expect(ids(beyond)).toEqual([]);
    expect(beyond.body.meta).toEqual({ page: 9, limit: 2, total: 5, totalPages: 3 });
  });

  it('ignores bracketed operator syntax in the query string', async () => {
    const goa = await createTour({ state: 'Goa' });
    const res = await list({ 'state[$ne]': 'Goa', 'vertical[$exists]': 'true' });
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([goa.id]);
  });

  it('accepts the maximum limit of 50', async () => {
    const res = await list({ limit: 50 });
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(50);
  });

  it.each([
    ['limit above 50', { limit: 51 }, 'limit'],
    ['limit of 0', { limit: 0 }, 'limit'],
    ['non-numeric limit', { limit: 'ten' }, 'limit'],
    ['page of 0', { page: 0 }, 'page'],
    ['fractional page', { page: 1.5 }, 'page'],
    ['one-character q', { q: 'a' }, 'q'],
    ['q over 64 characters', { q: 'x'.repeat(65) }, 'q'],
    ['unknown difficulty', { difficulty: 'extreme' }, 'difficulty'],
    ['malformed vertical key', { vertical: 'Peak Pulse!' }, 'vertical'],
  ])('%s → 400 VALIDATION_ERROR', async (_label, query, field) => {
    const res = await list(query);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
  });
});

describe('GET /api/v1/tours/:slug', () => {
  it('returns the full published tour with its vertical', async () => {
    const vertical = await createVertical();
    const tour = await createTour({ vertical });

    const res = await request(app).get(`${BASE}/${tour.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Tour fetched');
    expect(res.body.data.tour).toEqual({
      id: tour.id,
      vertical: { id: vertical.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
      title: tour.title,
      slug: tour.slug,
      state: 'Goa',
      destination: 'North Goa',
      tagline: 'Sun, surf and shacks',
      overview: 'Four days along the Goan coast.',
      durationDays: 4,
      difficulty: 'easy',
      coverImage: null,
      gallery: [],
      topActivities: ['Parasailing', 'Beach hopping'],
      signatureActivity: { title: 'Parasailing', description: 'Fly over Calangute beach.' },
      itinerary: [
        { day: 1, title: 'Arrival', description: 'Check in and sunset walk.' },
        { day: 2, title: 'Water sports', description: 'Parasailing and jet ski.' },
      ],
      inclusions: ['Stay', 'Breakfast'],
      exclusions: ['Flights'],
      tiers: [
        {
          id: tour.tiers[0].id,
          name: 'Essential',
          description: 'Shared stay',
          pricePerPerson: 14999,
        },
        {
          id: tour.tiers[1].id,
          name: 'Explorer',
          description: 'Private stay',
          pricePerPerson: 18749,
        },
      ],
      reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
      startingPrice: 14999,
    });
  });

  it('matches the slug case-insensitively', async () => {
    const tour = await createTour();
    const res = await request(app).get(`${BASE}/${tour.slug.toUpperCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tour.id).toBe(tour.id);
  });

  it('unpublished tour → 404 NOT_FOUND', async () => {
    const tour = await createTour({ isPublished: false });
    const res = await request(app).get(`${BASE}/${tour.slug}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Tour not found', code: 'NOT_FOUND' });
  });

  it('unknown slug → 404 NOT_FOUND', async () => {
    const res = await request(app).get(`${BASE}/no-such-tour`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it.each(['bad_slug', 'bad slug!', 'trailing-', '.*'])(
    'invalid slug %j → 400 VALIDATION_ERROR',
    async (slug) => {
      const res = await request(app).get(`${BASE}/${encodeURIComponent(slug)}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual([{ field: 'slug', message: expect.any(String) }]);
    },
  );
});
