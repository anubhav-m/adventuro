import { describe, expect, it } from 'vitest';
import { Tour } from '../src/models/Tour.js';
import { buildTourData, createTour, createVertical } from './helpers/factories.js';

const tier = (name, pricePerPerson) => ({ name, pricePerPerson });
const validationErrorOn = (path) => ({
  name: 'ValidationError',
  errors: { [path]: expect.anything() },
});

describe('Tour', () => {
  it('creates a tour with defaults and serializes cleanly', async () => {
    const tour = await createTour({ isPublished: undefined, slug: 'Goa-Escape' });
    const json = tour.toJSON();

    expect(json.id).toBe(String(tour._id));
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(json).toMatchObject({
      slug: 'goa-escape',
      isPublished: false,
      coverImage: null,
      gallery: [],
    });
    expect(json.tiers[0]).toEqual({
      id: String(tour.tiers[0]._id),
      name: 'Essential',
      description: 'Shared stay',
      pricePerPerson: 14999,
    });
    expect(json.itinerary[0]).toEqual({
      day: 1,
      title: 'Arrival',
      description: 'Check in and sunset walk.',
    });
    expect(json.reporting).toEqual({
      location: 'Dabolim Airport',
      address: 'Arrivals gate 2',
      time: '10:30',
    });
  });

  describe('startingPrice sync', () => {
    it('is set to the lowest tier price on create, ignoring client input', async () => {
      const tour = await createTour({
        startingPrice: 1,
        tiers: [tier('VIP Palace', 25498), tier('Essential', 14999), tier('Explorer', 18749)],
      });
      expect(tour.startingPrice).toBe(14999);
    });

    it('is recalculated when tiers change and the document is saved', async () => {
      const tour = await createTour();
      tour.tiers[0].pricePerPerson = 30000;
      await tour.save();
      expect(tour.startingPrice).toBe(18749);

      tour.tiers.push(tier('Budget', 9999));
      await tour.save();
      expect((await Tour.findById(tour._id)).startingPrice).toBe(9999);
    });

    it.each([
      ['$set', (tiers) => ({ $set: { tiers } })],
      ['a top-level field', (tiers) => ({ tiers })],
    ])('is recalculated on findOneAndUpdate using %s', async (_label, buildUpdate) => {
      const tour = await createTour();
      const updated = await Tour.findOneAndUpdate(
        { _id: tour._id },
        buildUpdate([tier('Essential', 21000), tier('Explorer', 12500)]),
        { returnDocument: 'after' },
      );
      expect(updated.startingPrice).toBe(12500);
      expect(updated.tiers).toHaveLength(2);
    });

    it('is recalculated on findByIdAndUpdate', async () => {
      const tour = await createTour();
      const updated = await Tour.findByIdAndUpdate(
        tour._id,
        { $set: { tiers: [tier('Solo', 7000)] } },
        { returnDocument: 'after' },
      );
      expect(updated.startingPrice).toBe(7000);
    });

    it('is left alone by updates that do not touch tiers', async () => {
      const tour = await createTour();
      const updated = await Tour.findOneAndUpdate(
        { _id: tour._id },
        { $set: { tagline: 'New tagline' } },
        { returnDocument: 'after' },
      );
      expect(updated.tagline).toBe('New tagline');
      expect(updated.startingPrice).toBe(14999);
    });
  });

  describe('tier rules', () => {
    it('accepts 1 and 5 tiers', async () => {
      const five = [1, 2, 3, 4, 5].map((n) => tier(`Tier ${n}`, n * 1000));
      await expect(createTour({ tiers: [tier('Only', 5000)] })).resolves.toBeDefined();
      await expect(createTour({ tiers: five })).resolves.toBeDefined();
    });

    it('rejects 0 and 6 tiers', async () => {
      const six = [1, 2, 3, 4, 5, 6].map((n) => tier(`Tier ${n}`, n * 1000));
      await expect(createTour({ tiers: [] })).rejects.toMatchObject(validationErrorOn('tiers'));
      await expect(createTour({ tiers: six })).rejects.toMatchObject(validationErrorOn('tiers'));
    });

    it('rejects duplicate tier names, ignoring case and whitespace', async () => {
      await expect(
        createTour({ tiers: [tier('Explorer', 1000), tier(' explorer ', 2000)] }),
      ).rejects.toMatchObject(validationErrorOn('tiers'));
    });

    it.each([0, -500, 1499.5])('rejects tier price %s', async (price) => {
      await expect(createTour({ tiers: [tier('Essential', price)] })).rejects.toMatchObject(
        validationErrorOn('tiers.0.pricePerPerson'),
      );
    });

    it('rejects a tier without a name', async () => {
      await expect(createTour({ tiers: [{ pricePerPerson: 1000 }] })).rejects.toMatchObject(
        validationErrorOn('tiers.0.name'),
      );
    });

    it('enforces tier rules on findOneAndUpdate', async () => {
      const tour = await createTour();
      await expect(
        Tour.findOneAndUpdate({ _id: tour._id }, { $set: { tiers: [] } }),
      ).rejects.toMatchObject({ name: 'ValidationError' });
      await expect(
        Tour.findOneAndUpdate(
          { _id: tour._id },
          { $set: { tiers: [tier('Same', 1000), tier('same', 2000)] } },
        ),
      ).rejects.toMatchObject({ name: 'ValidationError' });

      const unchanged = await Tour.findById(tour._id);
      expect(unchanged.tiers).toHaveLength(2);
      expect(unchanged.startingPrice).toBe(14999);
    });
  });

  describe('itinerary order', () => {
    const day = (n) => ({ day: n, title: `Day ${n}` });

    it('accepts an empty itinerary and sequential days from 1', async () => {
      await expect(createTour({ itinerary: [] })).resolves.toBeDefined();
      await expect(createTour({ itinerary: [day(1), day(2), day(3)] })).resolves.toBeDefined();
    });

    it.each([
      ['not starting at 1', [day(2), day(3)]],
      ['a gap', [day(1), day(3)]],
      ['a duplicate', [day(1), day(1)]],
      ['out of order', [day(2), day(1)]],
    ])('rejects %s', async (_label, itinerary) => {
      await expect(createTour({ itinerary })).rejects.toMatchObject(validationErrorOn('itinerary'));
    });

    it('enforces the order on findOneAndUpdate', async () => {
      const tour = await createTour();
      await expect(
        Tour.findOneAndUpdate({ _id: tour._id }, { $set: { itinerary: [day(1), day(3)] } }),
      ).rejects.toMatchObject({ name: 'ValidationError' });
    });
  });

  describe('field validation', () => {
    it('requires a signature activity with title and description', async () => {
      await expect(createTour({ signatureActivity: undefined })).rejects.toMatchObject(
        validationErrorOn('signatureActivity'),
      );
      await expect(
        createTour({ signatureActivity: { title: 'Parasailing' } }),
      ).rejects.toMatchObject(validationErrorOn('signatureActivity.description'));
    });

    it.each(['9:30', '24:00', '10:60', '10.30', 'noon'])(
      'rejects reporting time %s',
      async (time) => {
        await expect(
          createTour({ reporting: { location: 'Airport', time } }),
        ).rejects.toMatchObject(validationErrorOn('reporting.time'));
      },
    );

    it.each(['00:00', '09:05', '23:59'])('accepts reporting time %s', async (time) => {
      const tour = await createTour({ reporting: { location: 'Airport', time } });
      expect(tour.reporting).toMatchObject({ time, address: '' });
    });

    it.each([
      ['difficulty', 'extreme'],
      ['durationDays', 0],
      ['durationDays', 2.5],
      ['slug', 'Not A Slug'],
      ['title', ''],
      ['state', undefined],
      ['destination', undefined],
      ['overview', undefined],
      ['reporting', undefined],
    ])('rejects invalid %s (%s)', async (field, value) => {
      await expect(createTour({ [field]: value })).rejects.toMatchObject(validationErrorOn(field));
    });

    it('requires a vertical', async () => {
      await expect(Tour.create(buildTourData())).rejects.toMatchObject(
        validationErrorOn('vertical'),
      );
    });

    it('requires an image url for gallery entries', async () => {
      await expect(createTour({ gallery: [{ path: 'tours/x.png' }] })).rejects.toMatchObject(
        validationErrorOn('gallery.0.url'),
      );
    });
  });

  it('enforces a unique slug', async () => {
    await createTour({ slug: 'goa-escape' });
    await expect(createTour({ slug: 'goa-escape' })).rejects.toMatchObject({
      code: 11000,
      keyPattern: { slug: 1 },
    });
  });

  it('defines the query indexes', () => {
    const indexes = Tour.schema.indexes().map(([fields]) => fields);
    expect(indexes).toEqual(
      expect.arrayContaining([{ vertical: 1, isPublished: 1 }, { state: 1 }]),
    );
  });

  it('links to its vertical', async () => {
    const vertical = await createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse' });
    const tour = await createTour({ vertical });
    const populated = await Tour.findById(tour._id).populate('vertical', 'key name code');
    expect(populated.toJSON().vertical).toMatchObject({
      id: String(vertical._id),
      key: 'peakpulse',
      code: 'PP',
    });
  });
});
