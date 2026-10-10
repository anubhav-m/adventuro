import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { createGear, createTaxonomy, createTour, createVertical } from './helpers/factories.js';

const search = (q) => request(app).get('/api/v1/search').query({ q });

describe('GET /api/v1/search', () => {
  it('returns grouped tour and gear results', async () => {
    const tour = await createTour({ title: 'Desert Dune Safari', state: 'Rajasthan' });
    const gear = await createGear({ name: 'Desert Scarf' });
    await createTour({ title: 'Backwater Cruise', state: 'Kerala', destination: 'Alleppey' });
    await createGear({ name: 'Rain Jacket' });

    const res = await search('desert');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Search results fetched',
      data: {
        tours: [
          {
            id: tour.id,
            title: 'Desert Dune Safari',
            slug: tour.slug,
            state: 'Rajasthan',
            destination: 'North Goa',
            coverImage: null,
            startingPrice: 14999,
          },
        ],
        gear: [
          {
            id: gear.id,
            name: 'Desert Scarf',
            slug: gear.slug,
            images: [],
            mrp: 3999,
            salePrice: 2899,
          },
        ],
      },
    });
  });

  it.each([
    ['title', 'SPITI'],
    ['state', 'himachal'],
    ['destination', 'Kaza'],
  ])('matches tours on %s, case-insensitively', async (_field, q) => {
    const tour = await createTour({
      title: 'Spiti Winter Expedition',
      state: 'Himachal Pradesh',
      destination: 'Kaza',
    });
    await createTour();

    const res = await search(q);
    expect(res.body.data.tours.map(({ id }) => id)).toEqual([tour.id]);
  });

  it('returns empty groups when nothing matches', async () => {
    await createTour();
    await createGear();

    const res = await search('zzzz');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ tours: [], gear: [] });
  });

  it('never returns unpublished tours or inactive gear', async () => {
    await createTour({ title: 'Secret Lagoon', isPublished: false });
    await createGear({ name: 'Secret Stash Pouch', isActive: false });

    const res = await search('secret');
    expect(res.body.data).toEqual({ tours: [], gear: [] });
  });

  it('caps each group at 5 results', async () => {
    const vertical = await createVertical();
    const category = (await createTaxonomy())._id;
    for (let i = 1; i <= 7; i += 1) {
      await createTour({ vertical, title: `Coast Walk ${i}` });
      await createGear({ category, name: `Coast Sandal ${i}` });
    }

    const res = await search('coast');
    expect(res.body.data.tours.map(({ title }) => title)).toEqual(
      [1, 2, 3, 4, 5].map((n) => `Coast Walk ${n}`),
    );
    expect(res.body.data.gear.map(({ name }) => name)).toEqual(
      [1, 2, 3, 4, 5].map((n) => `Coast Sandal ${n}`),
    );
  });

  it('treats regex special characters literally', async () => {
    const tour = await createTour({ title: 'Goa (North) .* Special' });
    const gear = await createGear({ name: 'Flask (1L) .* Steel' });
    await createTour({ title: 'Plain Tour' });
    await createGear({ name: 'Plain Flask' });

    const literal = await search('.*');
    expect(literal.status).toBe(200);
    expect(literal.body.data.tours.map(({ id }) => id)).toEqual([tour.id]);
    expect(literal.body.data.gear.map(({ id }) => id)).toEqual([gear.id]);

    for (const q of ['((', '[a-z]+', '\\', '^.+$', 'a{2,}']) {
      const res = await search(q.padEnd(2, '\\'));
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tours: [], gear: [] });
    }
  });

  it('trims q before validating its length', async () => {
    const res = await search('  a  ');
    expect(res.status).toBe(400);
  });

  it.each([
    ['one character', 'a'],
    ['a lone special character', '('],
    ['empty', ''],
    ['over 64 characters', 'x'.repeat(65)],
  ])('q that is %s → 400 VALIDATION_ERROR', async (_label, q) => {
    const res = await search(q);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors).toEqual([{ field: 'q', message: expect.any(String) }]);
  });

  it('missing or repeated q → 400 VALIDATION_ERROR', async () => {
    const missing = await request(app).get('/api/v1/search');
    expect(missing.status).toBe(400);
    expect(missing.body.code).toBe('VALIDATION_ERROR');

    const repeated = await request(app).get('/api/v1/search?q=goa&q=beach');
    expect(repeated.status).toBe(400);
    expect(repeated.body.code).toBe('VALIDATION_ERROR');
  });
});
