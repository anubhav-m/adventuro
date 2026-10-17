import { describe, expect, it } from 'vitest';
import { GEAR, TOUR } from '../test/fixtures.js';
import { EMPTY_GEAR_VALUES, toGearFormValues } from './gearForm.js';
import { moveItem, removeAt } from './list.js';
import { toListParams } from './listParams.js';
import { FIELD_MESSAGES, gearFormSchema, isTestableUrl, tourFormSchema } from './schemas.js';
import { slugify } from './slugify.js';
import {
  EMPTY_TOUR_VALUES,
  flaggedTabs,
  TOUR_TABS,
  toTourBody,
  toTourFormValues,
} from './tourForm.js';

const issuesOf = (schema, values) =>
  Object.fromEntries(
    (schema.safeParse(values).error?.issues ?? []).map(({ path, message }) => [
      path.join('.'),
      message,
    ]),
  );

const validTour = () => toTourFormValues(TOUR);
const validGear = () => toGearFormValues(GEAR);

describe('tourFormSchema', () => {
  it('accepts a saved tour as it is', () => {
    expect(tourFormSchema.safeParse(validTour()).success).toBe(true);
  });

  it('requires the signature activity', () => {
    const issues = issuesOf(tourFormSchema, {
      ...validTour(),
      signatureActivity: { title: '  ', description: '' },
    });

    expect(issues).toEqual({
      'signatureActivity.title': FIELD_MESSAGES['signatureActivity.title'],
      'signatureActivity.description': FIELD_MESSAGES['signatureActivity.description'],
    });
  });

  it('takes the reporting time only as HH:mm', () => {
    for (const time of ['7:30', '24:00', '07:60', '0730', '']) {
      expect(
        issuesOf(tourFormSchema, { ...validTour(), reporting: { ...TOUR.reporting, time } }),
      ).toEqual({
        'reporting.time': FIELD_MESSAGES['reporting.time'],
      });
    }
    expect(
      tourFormSchema.safeParse({ ...validTour(), reporting: { ...TOUR.reporting, time: '23:59' } })
        .success,
    ).toBe(true);
  });

  it('wants 1 to 5 packages with different names and whole-rupee prices', () => {
    const tier = (name, pricePerPerson = 1000) => ({ name, description: '', pricePerPerson });

    expect(issuesOf(tourFormSchema, { ...validTour(), tiers: [] })).toEqual({
      tiers: FIELD_MESSAGES.tiers,
    });
    expect(
      issuesOf(tourFormSchema, {
        ...validTour(),
        tiers: ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => tier(name)),
      }),
    ).toEqual({ tiers: FIELD_MESSAGES.tiers });
    expect(
      issuesOf(tourFormSchema, { ...validTour(), tiers: [tier('Essential'), tier(' essential ')] }),
    ).toEqual({
      'tiers.1.name': FIELD_MESSAGES['tiers.*.name'],
    });
    expect(
      issuesOf(tourFormSchema, {
        ...validTour(),
        tiers: [tier('A', ''), tier('B', 0), tier('C', 99.5)],
      }),
    ).toEqual({
      'tiers.0.pricePerPerson': FIELD_MESSAGES['tiers.*.pricePerPerson'],
      'tiers.1.pricePerPerson': FIELD_MESSAGES['tiers.*.pricePerPerson'],
      'tiers.2.pricePerPerson': FIELD_MESSAGES['tiers.*.pricePerPerson'],
    });
  });

  it('wants a title on every itinerary day', () => {
    const itinerary = [...TOUR.itinerary, { day: 3, title: '', description: '' }];

    expect(issuesOf(tourFormSchema, { ...validTour(), itinerary })).toEqual({
      'itinerary.2.title': FIELD_MESSAGES['itinerary.*.title'],
    });
  });

  it('refuses a new tour that has nothing filled in, field by field', () => {
    expect(Object.keys(issuesOf(tourFormSchema, EMPTY_TOUR_VALUES)).sort()).toEqual(
      [
        'vertical',
        'title',
        'slug',
        'state',
        'destination',
        'overview',
        'durationDays',
        'difficulty',
        'signatureActivity.title',
        'signatureActivity.description',
        'tiers.0.name',
        'tiers.0.pricePerPerson',
        'reporting.location',
        'reporting.time',
      ].sort(),
    );
  });

  it('wants a slug of lowercase words joined by single hyphens', () => {
    for (const slug of ['Goa', 'goa--escape', '-goa', 'goa escape']) {
      expect(issuesOf(tourFormSchema, { ...validTour(), slug })).toEqual({
        slug: FIELD_MESSAGES.slug,
      });
    }
  });
});

describe('gearFormSchema', () => {
  it('accepts a saved item as it is', () => {
    expect(gearFormSchema.safeParse(validGear()).success).toBe(true);
  });

  it('keeps the sale price at or below the MRP', () => {
    expect(issuesOf(gearFormSchema, { ...validGear(), salePrice: 2000 })).toEqual({
      salePrice: FIELD_MESSAGES.salePrice,
    });
    expect(gearFormSchema.safeParse({ ...validGear(), salePrice: GEAR.mrp }).success).toBe(true);
    // Compared even while another field is wrong, but only once both prices are valid.
    expect(issuesOf(gearFormSchema, { ...validGear(), name: '', salePrice: 2000 })).toHaveProperty(
      'salePrice',
    );
    expect(issuesOf(gearFormSchema, { ...validGear(), mrp: 0 })).toEqual({
      mrp: FIELD_MESSAGES.mrp,
    });
  });

  it('takes only a full https link', () => {
    for (const affiliateUrl of [
      'http://example.com/x',
      'example.com/x',
      'https://localhost/x',
      '',
    ]) {
      expect(issuesOf(gearFormSchema, { ...validGear(), affiliateUrl })).toEqual({
        affiliateUrl: FIELD_MESSAGES.affiliateUrl,
      });
      expect(isTestableUrl(affiliateUrl)).toBe(false);
    }
    expect(isTestableUrl(' https://www.amazon.in/dp/B0 ')).toBe(true);
  });

  it('refuses a new item that has nothing filled in', () => {
    expect(Object.keys(issuesOf(gearFormSchema, EMPTY_GEAR_VALUES)).sort()).toEqual(
      ['name', 'slug', 'mrp', 'salePrice', 'affiliateUrl', 'category'].sort(),
    );
  });
});

describe('tour form values', () => {
  it('reads a saved tour into the form, with the vertical as its id', () => {
    const values = toTourFormValues({
      ...TOUR,
      tagline: undefined,
      coverImage: null,
      gallery: [{ url: 'https://cdn.example.com/a.jpg' }],
      reporting: { location: 'Airport', time: '09:00' },
      itinerary: [{ day: 1, title: 'Arrival' }],
      tiers: [{ id: 't1', name: 'Essential', pricePerPerson: 999 }],
    });

    expect(values).toMatchObject({
      vertical: TOUR.vertical.id,
      tagline: '',
      coverImage: null,
      gallery: [{ url: 'https://cdn.example.com/a.jpg', path: null }],
      reporting: { location: 'Airport', address: '', time: '09:00' },
      itinerary: [{ day: 1, title: 'Arrival', description: '' }],
      tiers: [{ id: 't1', name: 'Essential', description: '', pricePerPerson: 999 }],
    });
  });

  it('sends package ids only for a saved tour', () => {
    const values = {
      ...validTour(),
      tiers: [...validTour().tiers, { name: 'VIP', description: '', pricePerPerson: 9 }],
    };

    expect(toTourBody(values, { isNew: false }).tiers).toEqual([
      ...TOUR.tiers,
      { name: 'VIP', description: '', pricePerPerson: 9 },
    ]);
    expect(toTourBody(values, { isNew: true }).tiers.every((tier) => !('id' in tier))).toBe(true);
  });

  it('names the tabs that hold an error, in tab order', () => {
    expect(TOUR_TABS.map(({ label }) => label)).toEqual([
      'Basics',
      'Media',
      'Experience',
      'Itinerary',
      'Inclusions / Exclusions',
      'Packages',
      'Reporting',
      'Gear',
    ]);
    expect(flaggedTabs({ reporting: {}, title: {}, exclusions: [] })).toEqual([
      'basics',
      'lists',
      'reporting',
    ]);
    expect(flaggedTabs({})).toEqual([]);
  });
});

describe('gear form values', () => {
  it('keeps the ids of what the item is linked to', () => {
    expect(
      toGearFormValues({ ...GEAR, category: null, shortDescription: undefined }),
    ).toMatchObject({
      category: '',
      shortDescription: '',
      climates: ['clim-beach'],
      tags: ['tag-waterproof'],
      tours: [TOUR.id],
    });
  });
});

describe('helpers', () => {
  it('slugify matches the server', () => {
    expect(slugify('Goa: Coast & Café')).toBe('goa-coast-and-cafe');
    expect(slugify('  --Spiti   Valley!! ')).toBe('spiti-valley');
    expect(slugify('!!!')).toBe('');
    expect(slugify('a'.repeat(200))).toHaveLength(120);
  });

  it('moves and removes list items without changing the original', () => {
    const items = ['a', 'b', 'c'];

    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(removeAt(items, 1)).toEqual(['a', 'c']);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('turns URL filters into the API query', () => {
    expect(toListParams({ page: '3', q: 'goa', vertical: 'tidetrail' })).toEqual({
      page: 3,
      q: 'goa',
      vertical: 'tidetrail',
      limit: 20,
    });
    expect(toListParams({ page: 'x', q: 'g' })).toEqual({ page: 1, q: undefined, limit: 20 });
    expect(toListParams({ page: '-2', q: '' })).toMatchObject({ page: 1 });
  });
});
