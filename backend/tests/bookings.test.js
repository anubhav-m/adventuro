import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { Booking } from '../src/models/Booking.js';
import { Counter } from '../src/models/Counter.js';
import { Tour } from '../src/models/Tour.js';
import { authAgent } from './helpers/authAgent.js';
import { createTour, createUser, createVertical } from './helpers/factories.js';

const PATH = '/api/v1/bookings';
const NOW = '2026-10-11T06:30:00.000Z';
const START_DATE = '2026-12-01';
const BOOKING_NUMBER_FORMAT = /^ADV-(TT|GS|PP|ES|UE|GI)-\d{4}-\d{6}$/;
const TOUR_UNAVAILABLE = {
  success: false,
  message: 'This tour is not available for booking',
  code: 'TOUR_UNAVAILABLE',
};
const NOT_FOUND = { success: false, message: 'Booking not found', code: 'NOT_FOUND' };

const setNow = (iso) => vi.setSystemTime(new Date(iso));

const bodyFor = (tour, overrides = {}) => ({
  tourId: tour.id,
  tierId: tour.tiers[0].id,
  travelers: 2,
  startDate: START_DATE,
  ...overrides,
});

const book = (user, tour, overrides) => authAgent(user).post(PATH).send(bodyFor(tour, overrides));

// Only Date is faked: the MongoDB driver and Supertest keep their real timers.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  setNow(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/v1/bookings', () => {
  it('signed out → 401 UNAUTHENTICATED', async () => {
    const tour = await createTour();
    const res = await request(app).post(PATH).send(bodyFor(tour));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHENTICATED',
    });
    expect(await Booking.countDocuments()).toBe(0);
  });

  it.each([
    ['no phone', { phone: undefined }],
    ['no name', { name: '' }],
  ])('incomplete profile (%s) → 403 PROFILE_INCOMPLETE', async (_label, overrides) => {
    const user = await createUser(overrides);
    const tour = await createTour();
    const res = await book(user, tour);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: 'Complete your profile to continue',
      code: 'PROFILE_INCOMPLETE',
    });
    expect(await Booking.countDocuments()).toBe(0);
  });

  it('creates a confirmed booking with a server-side total and snapshots', async () => {
    const user = await createUser({ name: 'Asha Rao', phone: '9876543210' });
    const vertical = await createVertical();
    const tour = await createTour({ vertical });
    const [, explorer] = tour.tiers;

    const res = await book(user, tour, { tierId: explorer.id, travelers: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Booking confirmed',
      data: {
        booking: {
          id: expect.stringMatching(/^[a-f\d]{24}$/),
          bookingNumber: 'ADV-TT-2026-000001',
          status: 'confirmed',
          statusUpdatedAt: null,
          tour: { id: tour.id, slug: tour.slug },
          vertical: { id: vertical.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
          snapshot: {
            tourTitle: tour.title,
            verticalName: 'TideTrail',
            verticalCode: 'TT',
            tierName: 'Explorer',
            pricePerPerson: 18749,
            durationDays: 4,
          },
          travelers: 3,
          startDate: START_DATE,
          totalAmount: 56247,
          contact: { name: 'Asha Rao', phone: '9876543210', email: user.email },
          reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
          createdAt: NOW,
        },
      },
    });
    expect(res.body.data.booking.bookingNumber).toMatch(BOOKING_NUMBER_FORMAT);

    const stored = await Booking.findOne({ bookingNumber: 'ADV-TT-2026-000001' });
    expect(String(stored.user)).toBe(user.id);
    expect(String(stored.tour)).toBe(tour.id);
    expect(String(stored.vertical)).toBe(vertical.id);
    expect(stored.startDate).toEqual(new Date('2026-12-01T00:00:00.000Z'));
    expect(stored.totalAmount).toBe(explorer.pricePerPerson * 3);
    expect(stored.status).toBe('confirmed');
  });

  it('increments the sequence per vertical, independently across verticals', async () => {
    const user = await createUser();
    const coast = await createTour({ vertical: await createVertical() });
    const desert = await createTour({
      vertical: await createVertical({ key: 'goldensaga', code: 'GS', name: 'GoldenSaga' }),
    });
    const otherCoast = await createTour({ vertical: coast.vertical });

    const numbers = [];
    for (const tour of [coast, desert, otherCoast, desert, coast]) {
      const res = await book(user, tour);
      expect(res.status).toBe(201);
      numbers.push(res.body.data.booking.bookingNumber);
    }

    expect(numbers).toEqual([
      'ADV-TT-2026-000001',
      'ADV-GS-2026-000001',
      'ADV-TT-2026-000002',
      'ADV-GS-2026-000002',
      'ADV-TT-2026-000003',
    ]);
    const counters = await Counter.find().sort({ _id: 1 }).lean();
    expect(counters.map(({ _id, seq }) => [_id, seq])).toEqual([
      ['booking-GS-2026', 2],
      ['booking-TT-2026', 3],
    ]);
  });

  it('takes the year from the IST date and restarts the sequence each year', async () => {
    const user = await createUser();
    const tour = await createTour();

    setNow('2026-12-31T18:29:59.000Z');
    const lastOfYear = await book(user, tour, { startDate: '2027-02-01' });
    setNow('2026-12-31T18:30:00.000Z');
    const firstOfYear = await book(user, tour, { startDate: '2027-02-01' });

    expect(lastOfYear.body.data.booking.bookingNumber).toBe('ADV-TT-2026-000001');
    expect(firstOfYear.body.data.booking.bookingNumber).toBe('ADV-TT-2027-000001');
  });

  it('gives 20 concurrent bookings on one vertical 20 unique numbers', async () => {
    const tour = await createTour();
    const users = await Promise.all(Array.from({ length: 20 }, () => createUser()));

    const responses = await Promise.all(users.map((user) => book(user, tour)));

    expect(responses.every(({ status }) => status === 201)).toBe(true);
    const numbers = responses.map(({ body }) => body.data.booking.bookingNumber).sort();
    expect(numbers).toEqual(
      Array.from({ length: 20 }, (_, i) => `ADV-TT-2026-${String(i + 1).padStart(6, '0')}`),
    );
    expect(await Booking.countDocuments()).toBe(20);
  });

  it.each([
    ['totalAmount', 1],
    ['status', 'completed'],
    ['bookingNumber', 'ADV-TT-2026-999999'],
    ['pricePerPerson', 1],
    ['user', new mongoose.Types.ObjectId().toString()],
  ])('rejects a client-sent %s → 400 VALIDATION_ERROR', async (field, value) => {
    const user = await createUser();
    const tour = await createTour();

    const res = await book(user, tour, { [field]: value });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [{ field, message: 'Unknown field' }],
    });
    expect(await Booking.countDocuments()).toBe(0);
  });

  it.each([
    ['travelers', 0],
    ['travelers', 21],
    ['travelers', 1.5],
    ['travelers', '2'],
    ['travelers', undefined],
    ['tourId', 'not-an-id'],
    ['tourId', { $ne: null }],
    ['tierId', '123'],
    ['tierId', undefined],
    ['startDate', undefined],
    ['startDate', '01-12-2026'],
    ['startDate', '2026-13-01'],
    ['startDate', '2027-02-30'],
    ['startDate', '2026-12-01T00:00:00.000Z'],
    ['startDate', 20261201],
  ])('invalid %s (%j) → 400 VALIDATION_ERROR', async (field, value) => {
    const user = await createUser();
    const tour = await createTour();

    const res = await book(user, tour, { [field]: value });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
    expect(await Booking.countDocuments()).toBe(0);
  });

  it.each([1, 20])('accepts %i travelers', async (travelers) => {
    const tour = await createTour();
    const res = await book(await createUser(), tour, { travelers });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.totalAmount).toBe(tour.tiers[0].pricePerPerson * travelers);
  });

  describe('tour availability', () => {
    it('unpublished tour → 409 TOUR_UNAVAILABLE', async () => {
      const tour = await createTour({ isPublished: false });
      const res = await book(await createUser(), tour);
      expect(res.status).toBe(409);
      expect(res.body).toEqual(TOUR_UNAVAILABLE);
    });

    it('deleted tier → 409 TOUR_UNAVAILABLE', async () => {
      const tour = await createTour();
      const body = bodyFor(tour, { tierId: tour.tiers[1].id });
      tour.tiers.pull(tour.tiers[1]._id);
      await tour.save();

      const res = await authAgent(await createUser())
        .post(PATH)
        .send(body);
      expect(res.status).toBe(409);
      expect(res.body).toEqual(TOUR_UNAVAILABLE);
    });

    it('tier of another tour → 409 TOUR_UNAVAILABLE', async () => {
      const tour = await createTour();
      const other = await createTour();
      const res = await book(await createUser(), tour, { tierId: other.tiers[0].id });
      expect(res.status).toBe(409);
      expect(res.body).toEqual(TOUR_UNAVAILABLE);
    });

    it('unknown tour answers exactly like an unpublished one', async () => {
      const tour = await createTour();
      const res = await book(await createUser(), tour, {
        tourId: new mongoose.Types.ObjectId().toString(),
      });
      expect(res.status).toBe(409);
      expect(res.body).toEqual(TOUR_UNAVAILABLE);
    });

    it('does not create a booking or use up a sequence number', async () => {
      const tour = await createTour({ isPublished: false });
      await book(await createUser(), tour);
      expect(await Booking.countDocuments()).toBe(0);
      expect(await Counter.countDocuments()).toBe(0);
    });
  });

  describe('start date window (Asia/Kolkata)', () => {
    const startDateError = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [
        { field: 'startDate', message: 'Start date must be between tomorrow and 365 days ahead' },
      ],
    };

    // 23:59:59 IST on 11 Oct 2026, one second before the IST date changes.
    const BEFORE_IST_MIDNIGHT = '2026-10-11T18:29:59.000Z';
    const AT_IST_MIDNIGHT = '2026-10-11T18:30:00.000Z';

    it.each([
      [BEFORE_IST_MIDNIGHT, '2026-10-10', 400, 'yesterday'],
      [BEFORE_IST_MIDNIGHT, '2026-10-11', 400, 'today'],
      [BEFORE_IST_MIDNIGHT, '2026-10-12', 201, 'tomorrow'],
      [BEFORE_IST_MIDNIGHT, '2027-10-11', 201, '+365 days'],
      [BEFORE_IST_MIDNIGHT, '2027-10-12', 400, '+366 days'],
      [AT_IST_MIDNIGHT, '2026-10-12', 400, 'today, although still 11 Oct in UTC'],
      [AT_IST_MIDNIGHT, '2026-10-13', 201, 'tomorrow'],
      [AT_IST_MIDNIGHT, '2027-10-12', 201, '+365 days'],
      [AT_IST_MIDNIGHT, '2027-10-13', 400, '+366 days'],
    ])('at %s, %s → %i (%s)', async (now, startDate, status) => {
      setNow(now);
      const res = await book(await createUser(), await createTour(), { startDate });

      expect(res.status).toBe(status);
      if (status === 201) {
        expect(res.body.data.booking.startDate).toBe(startDate);
      } else {
        expect(res.body).toEqual(startDateError);
        expect(await Counter.countDocuments()).toBe(0);
      }
    });
  });
});

describe('GET /api/v1/bookings/me', () => {
  it('signed out → 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get(`${PATH}/me`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns an empty page for a user with no bookings', async () => {
    const res = await authAgent(await createUser()).get(`${PATH}/me`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Bookings fetched',
      data: { bookings: [] },
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    });
  });

  it("lists only the user's bookings, newest first, paginated", async () => {
    const user = await createUser();
    const other = await createUser();
    const tour = await createTour();

    for (let minute = 0; minute < 5; minute += 1) {
      setNow(`2026-10-11T06:0${minute}:00.000Z`);
      await book(user, tour, { travelers: minute + 1 });
    }
    await book(other, tour);

    const first = await authAgent(user).get(`${PATH}/me`).query({ limit: 2 });
    expect(first.status).toBe(200);
    expect(first.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
    expect(first.body.data.bookings.map(({ travelers }) => travelers)).toEqual([5, 4]);
    expect(first.body.data.bookings[0]).toMatchObject({
      bookingNumber: 'ADV-TT-2026-000005',
      status: 'confirmed',
      startDate: START_DATE,
      tour: { id: tour.id, slug: tour.slug },
      reporting: { location: 'Dabolim Airport', time: '10:30' },
    });

    const last = await authAgent(user).get(`${PATH}/me`).query({ limit: 2, page: 3 });
    expect(last.body.data.bookings.map(({ travelers }) => travelers)).toEqual([1]);

    const others = await authAgent(other).get(`${PATH}/me`);
    expect(others.body.meta.total).toBe(1);
    expect(others.body.data.bookings[0].contact.email).toBe(other.email);
  });

  it('limit above 50 → 400 VALIDATION_ERROR', async () => {
    const res = await authAgent(await createUser())
      .get(`${PATH}/me`)
      .query({ limit: 51 });
    expect(res.status).toBe(400);
    expect(res.body.errors.map(({ field }) => field)).toEqual(['limit']);
  });
});

describe('GET /api/v1/bookings/:bookingNumber', () => {
  const setup = async () => {
    const owner = await createUser();
    const tour = await createTour();
    const { body } = await book(owner, tour);
    return { owner, tour, booking: body.data.booking };
  };

  it('signed out → 401 UNAUTHENTICATED', async () => {
    const { booking } = await setup();
    const res = await request(app).get(`${PATH}/${booking.bookingNumber}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns the booking to its owner', async () => {
    const { owner, booking } = await setup();
    const res = await authAgent(owner).get(`${PATH}/${booking.bookingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Booking fetched', data: { booking } });
  });

  it("another user's booking → 404, exactly like an unknown number", async () => {
    const { booking } = await setup();
    const intruder = authAgent(await createUser());

    const foreign = await intruder.get(`${PATH}/${booking.bookingNumber}`);
    const unknown = await intruder.get(`${PATH}/ADV-TT-2026-999999`);

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(NOT_FOUND);
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual(NOT_FOUND);
  });

  it('lets an admin read any booking', async () => {
    const { booking } = await setup();
    const admin = await createUser({ role: 'admin' });
    const res = await authAgent(admin).get(`${PATH}/${booking.bookingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking).toEqual(booking);
  });

  it.each(['123', 'adv-tt-2026-000001', 'ADV-XX-2026-000001', 'ADV-TT-2026-1', 'ADV-TT-26-000001'])(
    'malformed number %j → 400 VALIDATION_ERROR',
    async (bookingNumber) => {
      const res = await authAgent(await createUser()).get(`${PATH}/${bookingNumber}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual([
        { field: 'bookingNumber', message: 'Invalid booking number' },
      ]);
    },
  );

  it('reads reporting live from the tour but keeps the price and tier snapshot', async () => {
    const { owner, tour, booking } = await setup();

    tour.title = 'Renamed Tour';
    tour.durationDays = 9;
    tour.reporting = { location: 'Madgaon Station', address: 'Platform 1', time: '06:15' };
    tour.tiers[0].name = 'Renamed Tier';
    tour.tiers[0].pricePerPerson = 99999;
    await tour.save();

    const res = await authAgent(owner).get(`${PATH}/${booking.bookingNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.data.booking).toEqual({
      ...booking,
      reporting: { location: 'Madgaon Station', address: 'Platform 1', time: '06:15' },
    });
    expect(res.body.data.booking.snapshot).toMatchObject({
      tourTitle: booking.snapshot.tourTitle,
      tierName: 'Essential',
      pricePerPerson: 14999,
      durationDays: 4,
    });
    expect(res.body.data.booking.totalAmount).toBe(29998);
  });

  it('still loads after the tour is unpublished or its tier is removed', async () => {
    const { owner, tour, booking } = await setup();
    tour.isPublished = false;
    tour.tiers.pull(tour.tiers[0]._id);
    await tour.save();

    const res = await authAgent(owner).get(`${PATH}/${booking.bookingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking).toEqual(booking);
  });

  it('returns null tour and reporting if the tour document is gone', async () => {
    const { owner, tour, booking } = await setup();
    await Tour.deleteOne({ _id: tour._id });

    const res = await authAgent(owner).get(`${PATH}/${booking.bookingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking).toEqual({ ...booking, tour: null, reporting: null });
  });
});
