import { describe, expect, it } from 'vitest';
import { Gear } from '../src/models/Gear.js';
import { createGear, createTaxonomy, createTour } from './helpers/factories.js';

const validationErrorOn = (path) => ({
  name: 'ValidationError',
  errors: { [path]: expect.anything() },
});

describe('Gear', () => {
  it('creates gear with defaults and serializes cleanly', async () => {
    const gear = await createGear({ slug: 'Trail-Pack' });
    const json = gear.toJSON();

    expect(json.id).toBe(String(gear._id));
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(json).toMatchObject({
      slug: 'trail-pack',
      mrp: 3999,
      salePrice: 2899,
      isActive: true,
      clickCount: 0,
      images: [],
      climates: [],
      tags: [],
      tours: [],
      description: '',
    });
  });

  it('links to taxonomies and tours', async () => {
    const [category, climate, tag, tour] = await Promise.all([
      createTaxonomy({ type: 'category' }),
      createTaxonomy({ type: 'climate' }),
      createTaxonomy({ type: 'tag' }),
      createTour(),
    ]);
    const gear = await createGear({
      category: category._id,
      climates: [climate._id],
      tags: [tag._id],
      tours: [tour._id],
      images: [{ url: 'https://cdn.example.com/pack.webp', path: 'gear/pack.webp' }],
    });

    const populated = await Gear.findById(gear._id).populate('category climates tags tours');
    const json = populated.toJSON();
    expect(json.category).toMatchObject({ id: String(category._id), type: 'category' });
    expect(json.climates[0].id).toBe(String(climate._id));
    expect(json.tags[0].id).toBe(String(tag._id));
    expect(json.tours[0].id).toBe(String(tour._id));
    expect(json.images).toEqual([
      { url: 'https://cdn.example.com/pack.webp', path: 'gear/pack.webp' },
    ]);
  });

  describe('salePrice ≤ mrp', () => {
    it('accepts a sale price below or equal to MRP', async () => {
      await expect(createGear({ mrp: 3999, salePrice: 2899 })).resolves.toBeDefined();
      await expect(createGear({ mrp: 3999, salePrice: 3999 })).resolves.toBeDefined();
    });

    it('rejects a sale price above MRP', async () => {
      await expect(createGear({ mrp: 2899, salePrice: 2900 })).rejects.toMatchObject(
        validationErrorOn('salePrice'),
      );
    });

    it('rejects raising the sale price above MRP on a later save', async () => {
      const gear = await createGear({ mrp: 3999, salePrice: 2899 });
      gear.salePrice = 4500;
      await expect(gear.save()).rejects.toMatchObject(validationErrorOn('salePrice'));
    });

    it.each([
      ['mrp', 0],
      ['mrp', 3999.5],
      ['salePrice', 0],
      ['salePrice', 10.25],
      ['mrp', undefined],
      ['salePrice', undefined],
    ])('rejects %s = %s', async (field, value) => {
      await expect(createGear({ [field]: value })).rejects.toMatchObject(validationErrorOn(field));
    });
  });

  describe('affiliateUrl https only', () => {
    it.each([
      'http://example.com/product',
      'ftp://example.com/product',
      'javascript:alert(1)',
      '//example.com/product',
      'example.com/product',
      'not a url',
    ])('rejects %s', async (affiliateUrl) => {
      await expect(createGear({ affiliateUrl })).rejects.toMatchObject(
        validationErrorOn('affiliateUrl'),
      );
    });

    it('accepts an https URL and requires the field', async () => {
      const gear = await createGear({ affiliateUrl: 'https://shop.example.com/p/1?ref=adv' });
      expect(gear.affiliateUrl).toBe('https://shop.example.com/p/1?ref=adv');
      await expect(createGear({ affiliateUrl: undefined })).rejects.toMatchObject(
        validationErrorOn('affiliateUrl'),
      );
    });
  });

  it.each([
    ['name', ''],
    ['slug', 'Bad Slug!'],
    ['clickCount', -1],
  ])('rejects invalid %s (%s)', async (field, value) => {
    await expect(createGear({ [field]: value })).rejects.toMatchObject(validationErrorOn(field));
  });

  it('requires a category', async () => {
    await expect(
      Gear.create({
        name: 'Pack',
        slug: 'pack',
        mrp: 100,
        salePrice: 90,
        affiliateUrl: 'https://example.com/pack',
      }),
    ).rejects.toMatchObject(validationErrorOn('category'));
  });

  it('enforces a unique slug', async () => {
    await createGear({ slug: 'trail-pack' });
    await expect(createGear({ slug: 'trail-pack' })).rejects.toMatchObject({
      code: 11000,
      keyPattern: { slug: 1 },
    });
  });

  it('defines the query indexes', () => {
    const indexes = Gear.schema.indexes().map(([fields]) => fields);
    expect(indexes).toEqual(expect.arrayContaining([{ isActive: 1, category: 1 }, { tours: 1 }]));
  });
});
