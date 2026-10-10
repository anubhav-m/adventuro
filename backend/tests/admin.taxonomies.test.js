import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Taxonomy } from '../src/models/Taxonomy.js';
import { authAgent } from './helpers/authAgent.js';
import { createGear, createTaxonomy, createUser } from './helpers/factories.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const BASE = '/api/v1/admin/taxonomies';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let agent;

beforeEach(async () => {
  agent = authAgent(await createUser({ role: 'admin' }));
});

describe('GET /api/v1/admin/taxonomies', () => {
  it('lists all taxonomies by type then name, and filters by type', async () => {
    await createTaxonomy({ type: 'tag', name: 'Waterproof', slug: 'waterproof' });
    await createTaxonomy({ name: 'Shoes', slug: 'shoes' });
    await createTaxonomy({ name: 'Backpacks', slug: 'backpacks' });

    const all = await agent.get(BASE);
    expect(all.status).toBe(200);
    expect(all.body.data.taxonomies.map(({ name }) => name)).toEqual([
      'Backpacks',
      'Shoes',
      'Waterproof',
    ]);

    const tags = await agent.get(BASE).query({ type: 'tag' });
    expect(tags.body.data.taxonomies).toEqual([
      { id: expect.any(String), type: 'tag', name: 'Waterproof', slug: 'waterproof' },
    ]);

    expect((await agent.get(BASE).query({ type: 'colour' })).status).toBe(400);
  });
});

describe('POST /api/v1/admin/taxonomies', () => {
  it('creates a taxonomy with a slug generated from the name', async () => {
    const res = await agent.post(BASE).send({ type: 'climate', name: '  Tropical / Beach ' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Taxonomy created',
      data: {
        taxonomy: {
          id: expect.any(String),
          type: 'climate',
          name: 'Tropical / Beach',
          slug: 'tropical-beach',
        },
      },
    });
  });

  it('uses a provided slug', async () => {
    const res = await agent.post(BASE).send({ type: 'tag', name: 'Ultra Light', slug: 'ul' });

    expect(res.body.data.taxonomy.slug).toBe('ul');
  });

  it('duplicate name in the same type → 409 DUPLICATE, ignoring case', async () => {
    await agent.post(BASE).send({ type: 'category', name: 'Backpacks' });

    const res = await agent.post(BASE).send({ type: 'category', name: 'backpacks', slug: 'packs' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE');
    expect(await Taxonomy.countDocuments()).toBe(1);
  });

  it('duplicate slug in the same type → 409 DUPLICATE', async () => {
    await agent.post(BASE).send({ type: 'category', name: 'Backpacks' });

    const res = await agent.post(BASE).send({ type: 'category', name: 'Bags', slug: 'backpacks' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE');
  });

  it('the same name in a different type is fine', async () => {
    await agent.post(BASE).send({ type: 'category', name: 'Winter' });

    const res = await agent.post(BASE).send({ type: 'climate', name: 'Winter' });

    expect(res.status).toBe(201);
    expect(res.body.data.taxonomy).toMatchObject({ type: 'climate', slug: 'winter' });
  });

  it('treats regex characters in a name literally', async () => {
    await agent.post(BASE).send({ type: 'tag', name: 'Rain Cover' });

    const res = await agent.post(BASE).send({ type: 'tag', name: 'R.*', slug: 'r-star' });

    expect(res.status).toBe(201);
  });

  it('validates the body', async () => {
    const bad = [
      { name: 'No type' },
      { type: 'colour', name: 'Red' },
      { type: 'tag', name: '   ' },
      { type: 'tag', name: 'x'.repeat(121) },
      { type: 'tag', name: 'Ok', slug: 'Not A Slug' },
      { type: 'tag', name: 'Ok', id: UNKNOWN_ID },
    ];
    const responses = await Promise.all(bad.map((body) => agent.post(BASE).send(body)));

    responses.forEach((res) => {
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  it('asks for a slug when one cannot be generated from the name', async () => {
    const res = await agent.post(BASE).send({ type: 'tag', name: '!!!' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'slug', message: expect.any(String) }]);
  });
});

describe('PATCH /api/v1/admin/taxonomies/:id', () => {
  it('renames and keeps the slug', async () => {
    const taxonomy = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });

    const res = await agent.patch(`${BASE}/${taxonomy.id}`).send({ name: 'Footwear' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxonomy).toEqual({
      id: taxonomy.id,
      type: 'category',
      name: 'Footwear',
      slug: 'shoes',
    });
  });

  it('changes the slug when one is sent', async () => {
    const taxonomy = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });

    const res = await agent.patch(`${BASE}/${taxonomy.id}`).send({ slug: 'footwear' });

    expect(res.body.data.taxonomy).toMatchObject({ name: 'Shoes', slug: 'footwear' });
  });

  it('can change only the letter case of its own name', async () => {
    const taxonomy = await createTaxonomy({ name: 'shoes', slug: 'shoes' });

    const res = await agent.patch(`${BASE}/${taxonomy.id}`).send({ name: 'Shoes' });

    expect(res.status).toBe(200);
  });

  it('rename onto another name or slug of the same type → 409 DUPLICATE', async () => {
    await createTaxonomy({ name: 'Backpacks', slug: 'backpacks' });
    const shoes = await createTaxonomy({ name: 'Shoes', slug: 'shoes' });

    const byName = await agent.patch(`${BASE}/${shoes.id}`).send({ name: 'BACKPACKS' });
    const bySlug = await agent.patch(`${BASE}/${shoes.id}`).send({ slug: 'backpacks' });

    expect(byName.status).toBe(409);
    expect(byName.body.code).toBe('DUPLICATE');
    expect(bySlug.status).toBe(409);
    expect(bySlug.body.code).toBe('DUPLICATE');
  });

  it('cannot change the type, and needs at least one field', async () => {
    const taxonomy = await createTaxonomy();

    const typed = await agent.patch(`${BASE}/${taxonomy.id}`).send({ name: 'x', type: 'tag' });
    expect(typed.status).toBe(400);
    expect(typed.body.errors).toEqual([{ field: 'type', message: 'Unknown field' }]);
    expect((await agent.patch(`${BASE}/${taxonomy.id}`).send({})).status).toBe(400);
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.patch(`${BASE}/${UNKNOWN_ID}`).send({ name: 'x' })).status).toBe(404);
    expect((await agent.patch(`${BASE}/nope`).send({ name: 'x' })).status).toBe(400);
  });
});

describe('DELETE /api/v1/admin/taxonomies/:id', () => {
  it('deletes an unused taxonomy', async () => {
    const taxonomy = await createTaxonomy();

    const res = await agent.delete(`${BASE}/${taxonomy.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Taxonomy deleted' });
    expect(await Taxonomy.countDocuments()).toBe(0);
  });

  it.each([
    ['category', 'category', (id) => ({ category: id })],
    ['climate', 'climates', (id) => ({ climates: [id] })],
    ['tag', 'tags', (id) => ({ tags: [id] })],
  ])('a %s referenced by gear.%s → 409 RESOURCE_IN_USE', async (type, _path, link) => {
    const taxonomy = await createTaxonomy({ type });
    await createGear({ ...link(taxonomy._id), isActive: false });

    const res = await agent.delete(`${BASE}/${taxonomy.id}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Taxonomy is used by gear',
      code: 'RESOURCE_IN_USE',
    });
    expect(await Taxonomy.exists({ _id: taxonomy._id })).not.toBeNull();
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.delete(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    expect((await agent.delete(`${BASE}/nope`)).body.code).toBe('VALIDATION_ERROR');
  });
});
