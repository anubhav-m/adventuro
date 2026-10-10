import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { createTaxonomy } from './helpers/factories.js';

const list = (query = {}) => request(app).get('/api/v1/taxonomies').query(query);

const seed = async () => {
  const shoes = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });
  const backpacks = await createTaxonomy({ name: 'Backpacks', slug: 'backpacks' });
  const snow = await createTaxonomy({ type: 'climate', name: 'Snow', slug: 'snow' });
  const waterproof = await createTaxonomy({ type: 'tag', name: 'Waterproof', slug: 'waterproof' });
  return { shoes, backpacks, snow, waterproof };
};

describe('GET /api/v1/taxonomies', () => {
  it('returns every taxonomy sorted by type then name', async () => {
    const { shoes, backpacks, snow, waterproof } = await seed();

    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Taxonomies fetched',
      data: {
        taxonomies: [
          { id: backpacks.id, type: 'category', name: 'Backpacks', slug: 'backpacks' },
          { id: shoes.id, type: 'category', name: 'Shoes', slug: 'shoes' },
          { id: snow.id, type: 'climate', name: 'Snow', slug: 'snow' },
          { id: waterproof.id, type: 'tag', name: 'Waterproof', slug: 'waterproof' },
        ],
      },
    });
  });

  it.each([
    ['category', ['backpacks', 'shoes']],
    ['climate', ['snow']],
    ['tag', ['waterproof']],
  ])('filters by type=%s', async (type, slugs) => {
    await seed();
    const res = await list({ type });
    expect(res.status).toBe(200);
    expect(res.body.data.taxonomies.map(({ slug }) => slug)).toEqual(slugs);
  });

  it('returns an empty list when there are none', async () => {
    const res = await list({ type: 'tag' });
    expect(res.status).toBe(200);
    expect(res.body.data.taxonomies).toEqual([]);
  });

  it.each([{ type: 'brand' }, { type: '' }, { type: 'Category' }])(
    'invalid type %j → 400 VALIDATION_ERROR',
    async (query) => {
      const res = await list(query);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
      expect(res.body.errors).toEqual([{ field: 'type', message: expect.any(String) }]);
    },
  );
});
