import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { createTour, createVertical } from './helpers/factories.js';

const BASE = '/api/v1/verticals';

const createPeakPulse = () =>
  createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse', order: 3 });

describe('GET /api/v1/verticals', () => {
  it('returns every vertical ordered by `order`', async () => {
    await createPeakPulse();
    await createVertical({ key: 'goldensaga', code: 'GS', name: 'GoldenSaga', order: 2 });
    const tideTrail = await createVertical();

    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Verticals fetched');
    expect(res.body.data.verticals.map(({ key }) => key)).toEqual([
      'tidetrail',
      'goldensaga',
      'peakpulse',
    ]);
    expect(res.body.data.verticals[0]).toEqual({
      id: tideTrail.id,
      key: 'tidetrail',
      code: 'TT',
      name: 'TideTrail',
      subtitle: 'Ocean Blue & Coastal Thrills',
      description: 'Beaches, islands and coastal escapes.',
      heroImage: null,
      order: 1,
    });
  });

  it('returns an empty list when nothing is seeded', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.data.verticals).toEqual([]);
  });
});

describe('GET /api/v1/verticals/:key', () => {
  it('returns the vertical with its published tour cards only', async () => {
    const vertical = await createVertical();
    const other = await createPeakPulse();
    const published = await createTour({ vertical });
    await createTour({ vertical, isPublished: false });
    await createTour({ vertical: other });

    const res = await request(app).get(`${BASE}/tidetrail`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Vertical fetched');
    expect(res.body.data.vertical).toMatchObject({ id: vertical.id, key: 'tidetrail', code: 'TT' });
    expect(res.body.data.tours).toEqual([
      {
        id: published.id,
        title: published.title,
        slug: published.slug,
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

  it('lists tours newest first', async () => {
    const vertical = await createVertical();
    const first = await createTour({ vertical });
    const second = await createTour({ vertical });

    const res = await request(app).get(`${BASE}/tidetrail`);
    expect(res.body.data.tours.map(({ id }) => id)).toEqual([second.id, first.id]);
  });

  it('returns an empty tour list for a vertical with no published tours', async () => {
    const vertical = await createVertical();
    await createTour({ vertical, isPublished: false });

    const res = await request(app).get(`${BASE}/tidetrail`);
    expect(res.status).toBe(200);
    expect(res.body.data.tours).toEqual([]);
  });

  it('unknown key → 404 NOT_FOUND', async () => {
    await createVertical();
    const res = await request(app).get(`${BASE}/moonwalk`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Vertical not found', code: 'NOT_FOUND' });
  });

  it.each(['bad_key', 'bad key!', '-leading', 'x'.repeat(121)])(
    'invalid key %j → 400 VALIDATION_ERROR',
    async (key) => {
      const res = await request(app).get(`${BASE}/${encodeURIComponent(key)}`);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
      expect(res.body.errors).toEqual([{ field: 'key', message: expect.any(String) }]);
    },
  );
});
