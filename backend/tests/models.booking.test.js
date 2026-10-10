import { describe, expect, it } from 'vitest';
import { BOOKING_STATUS, BOOKING_STATUS_TRANSITIONS } from '../src/config/constants.js';
import { Booking } from '../src/models/Booking.js';
import { Counter } from '../src/models/Counter.js';
import { nextSequence } from '../src/services/counter.service.js';
import { createBooking, createTour, createUser } from './helpers/factories.js';

const validationErrorOn = (path) => ({
  name: 'ValidationError',
  errors: { [path]: expect.anything() },
});

describe('Booking', () => {
  it('creates a confirmed booking with snapshots and serializes cleanly', async () => {
    const [user, tour] = await Promise.all([createUser(), createTour()]);
    const booking = await createBooking({ user, tour, travelers: 3 });
    const json = booking.toJSON();

    expect(json.id).toBe(String(booking._id));
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(json).toMatchObject({
      bookingNumber: expect.stringMatching(/^ADV-TT-2026-\d{6}$/),
      status: 'confirmed',
      statusUpdatedAt: null,
      travelers: 3,
      totalAmount: 44997,
      snapshot: {
        tourTitle: tour.title,
        verticalName: 'TideTrail',
        verticalCode: 'TT',
        tierName: 'Essential',
        pricePerPerson: 14999,
        durationDays: 4,
      },
      contact: { name: user.name, phone: user.phone, email: user.email },
    });
    expect(json.startDate.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it.each([0, 21, 2.5])('rejects %s travelers', async (travelers) => {
    await expect(createBooking({ travelers })).rejects.toMatchObject(
      validationErrorOn('travelers'),
    );
  });

  it('accepts 1 and 20 travelers', async () => {
    await expect(createBooking({ travelers: 1 })).resolves.toBeDefined();
    await expect(createBooking({ travelers: 20 })).resolves.toBeDefined();
  });

  it('rejects a start date that is not a calendar date at 00:00 UTC', async () => {
    await expect(
      createBooking({ startDate: new Date('2026-12-01T05:30:00.000Z') }),
    ).rejects.toMatchObject(validationErrorOn('startDate'));
  });

  it.each([
    ['status', 'pending'],
    ['totalAmount', 0],
    ['totalAmount', 100.5],
    ['bookingNumber', undefined],
    ['snapshot', undefined],
    ['contact', undefined],
    ['startDate', undefined],
  ])('rejects invalid %s (%s)', async (field, value) => {
    await expect(createBooking({ [field]: value })).rejects.toMatchObject(validationErrorOn(field));
  });

  it('validates the contact and snapshot subdocuments', async () => {
    await expect(
      createBooking({ contact: { name: 'Asha', phone: '12345', email: 'a@example.com' } }),
    ).rejects.toMatchObject(validationErrorOn('contact.phone'));
    await expect(
      createBooking({ snapshot: { tourTitle: 'Goa', verticalCode: 'XX' } }),
    ).rejects.toMatchObject(validationErrorOn('snapshot.verticalCode'));
  });

  it('requires user, tour and vertical references', async () => {
    await expect(Booking.create({ bookingNumber: 'ADV-TT-2026-000001' })).rejects.toMatchObject({
      errors: {
        user: expect.anything(),
        tour: expect.anything(),
        vertical: expect.anything(),
      },
    });
  });

  it('enforces a unique booking number', async () => {
    await createBooking({ bookingNumber: 'ADV-TT-2026-000001' });
    await expect(createBooking({ bookingNumber: 'ADV-TT-2026-000001' })).rejects.toMatchObject({
      code: 11000,
      keyPattern: { bookingNumber: 1 },
    });
  });

  it('defines the query indexes', () => {
    const indexes = Booking.schema.indexes().map(([fields]) => fields);
    expect(indexes).toEqual(
      expect.arrayContaining([{ user: 1, createdAt: -1 }, { status: 1 }, { vertical: 1 }]),
    );
  });

  it('only allows confirmed → cancelled | completed transitions', () => {
    expect(BOOKING_STATUS_TRANSITIONS).toEqual({
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.COMPLETED]: [],
    });
  });
});

describe('Counter / nextSequence', () => {
  it('starts at 1 and increments', async () => {
    expect(await nextSequence('booking-TT-2026')).toBe(1);
    expect(await nextSequence('booking-TT-2026')).toBe(2);
    expect(await nextSequence('booking-TT-2026')).toBe(3);
  });

  it('keeps independent sequences per key', async () => {
    await nextSequence('booking-TT-2026');
    await nextSequence('booking-TT-2026');
    expect(await nextSequence('booking-GS-2026')).toBe(1);
    expect(await nextSequence('booking-TT-2027')).toBe(1);
    expect(await nextSequence('booking-TT-2026')).toBe(3);
  });

  it('returns 20 unique sequential values for 20 concurrent calls', async () => {
    const key = 'booking-PP-2026';
    const values = await Promise.all(Array.from({ length: 20 }, () => nextSequence(key)));

    expect(new Set(values).size).toBe(20);
    expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));

    const counter = await Counter.findById(key);
    expect(counter.toJSON()).toMatchObject({ id: key, seq: 20 });
    expect(await Counter.countDocuments()).toBe(1);
  });
});
