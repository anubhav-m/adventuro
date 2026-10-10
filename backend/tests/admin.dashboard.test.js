import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GearClick } from '../src/models/GearClick.js';
import { NewsletterSubscriber } from '../src/models/NewsletterSubscriber.js';
import { authAgent } from './helpers/authAgent.js';
import {
  createBooking,
  createGear,
  createTour,
  createUser,
  createVertical,
} from './helpers/factories.js';

const PATH = '/api/v1/admin/dashboard';
const RANGE = { from: '2026-10-01', to: '2026-10-07' };
const LONG_AGO = '2026-01-01T00:00:00Z';

let agent;

beforeEach(async () => {
  agent = authAgent(await createUser({ role: 'admin', createdAt: LONG_AGO }));
});

afterEach(() => {
  vi.useRealTimers();
});

// A fixture with known numbers. Prices are 14,999 per person on every tour.
const seedFixture = async () => {
  const coast = await createVertical({ order: 1 });
  const desert = await createVertical({
    key: 'goldensaga',
    code: 'GS',
    name: 'GoldenSaga',
    order: 2,
  });
  const peaks = await createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse', order: 3 });
  const goa = await createTour({ vertical: coast, title: 'Goa Coastal Escape' });
  const jaisalmer = await createTour({ vertical: desert, title: 'Jaisalmer Dunes' });
  const customer = await createUser({ createdAt: LONG_AGO });
  const book = (tour, createdAt, overrides) =>
    createBooking({ user: customer, tour, createdAt, ...overrides });

  // In range. 18:00Z is 23:30 IST on the same day; 18:30Z is 00:00 IST on the next.
  await book(goa, '2026-10-01T18:00:00Z');
  await book(goa, '2026-10-01T18:30:00Z', { travelers: 1, status: 'completed' });
  await book(jaisalmer, '2026-10-03T06:00:00Z', { travelers: 3, status: 'cancelled' });
  await book(jaisalmer, '2026-10-03T07:00:00Z');
  // Out of range: 23:59 IST on 30 Sep and 00:00 IST on 8 Oct.
  await book(goa, '2026-09-30T18:29:59Z');
  await book(goa, '2026-10-07T18:30:00Z');

  // 00:30 IST and 15:30 IST on 5 Oct.
  await createUser({ createdAt: '2026-10-04T19:00:00Z' });
  await createUser({ createdAt: '2026-10-05T10:00:00Z' });

  await NewsletterSubscriber.create(['a', 'b', 'c'].map((n) => ({ email: `${n}@example.com` })));

  const pack = await createGear({ name: 'Trail Pack', slug: 'trail-pack' });
  const boots = await createGear({ name: 'Summit Boots', slug: 'summit-boots' });
  const click = (gear, createdAt) => ({ gear: gear._id, createdAt });
  await GearClick.create([
    click(boots, '2026-10-02T10:00:00Z'),
    click(pack, '2026-10-02T10:00:00Z'),
    click(pack, '2026-10-04T10:00:00Z'),
    click(pack, '2026-10-07T18:29:59Z'),
    ...Array.from({ length: 5 }, () => click(boots, '2026-09-01T10:00:00Z')),
  ]);

  return { coast, desert, peaks, goa, jaisalmer, customer, pack, boots };
};

describe('GET /api/v1/admin/dashboard', () => {
  it('returns exact figures for the range', async () => {
    const { coast, desert, peaks, goa, jaisalmer, pack, boots } = await seedFixture();

    const res = await agent.get(PATH).query(RANGE);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Dashboard fetched');
    const { data } = res.body;

    expect(data.range).toEqual({ from: '2026-10-01', to: '2026-10-07', days: 7 });
    expect(data.totals).toEqual({
      users: 4,
      newUsers: 2,
      bookings: 4,
      bookingValue: 29998 + 14999 + 29998,
      newsletterSubscribers: 3,
    });
    expect(data.bookingsByStatus).toEqual({ confirmed: 2, cancelled: 1, completed: 1 });
    expect(data.bookingsByVertical).toEqual([
      {
        vertical: { id: coast.id, key: 'tidetrail', name: 'TideTrail', code: 'TT' },
        bookings: 2,
        value: 44997,
      },
      {
        vertical: { id: desert.id, key: 'goldensaga', name: 'GoldenSaga', code: 'GS' },
        bookings: 2,
        value: 29998,
      },
      {
        vertical: { id: peaks.id, key: 'peakpulse', name: 'PeakPulse', code: 'PP' },
        bookings: 0,
        value: 0,
      },
    ]);
    expect(data.topTours).toEqual([
      { tourId: goa.id, title: 'Goa Coastal Escape', bookings: 2, value: 44997 },
      { tourId: jaisalmer.id, title: 'Jaisalmer Dunes', bookings: 2, value: 29998 },
    ]);
    expect(data.topGear).toEqual([
      { gearId: pack.id, name: 'Trail Pack', slug: 'trail-pack', clicks: 3 },
      { gearId: boots.id, name: 'Summit Boots', slug: 'summit-boots', clicks: 1 },
    ]);
  });

  it('buckets by IST day and zero-fills every day of the range', async () => {
    await seedFixture();

    const { data } = (await agent.get(PATH).query(RANGE)).body;

    expect(data.bookingsPerDay).toEqual([
      { date: '2026-10-01', bookings: 1, value: 29998 },
      { date: '2026-10-02', bookings: 1, value: 14999 },
      { date: '2026-10-03', bookings: 2, value: 29998 },
      { date: '2026-10-04', bookings: 0, value: 0 },
      { date: '2026-10-05', bookings: 0, value: 0 },
      { date: '2026-10-06', bookings: 0, value: 0 },
      { date: '2026-10-07', bookings: 0, value: 0 },
    ]);
    expect(data.newUsersPerDay).toEqual([
      { date: '2026-10-01', count: 0 },
      { date: '2026-10-02', count: 0 },
      { date: '2026-10-03', count: 0 },
      { date: '2026-10-04', count: 0 },
      { date: '2026-10-05', count: 2 },
      { date: '2026-10-06', count: 0 },
      { date: '2026-10-07', count: 0 },
    ]);
  });

  it('lists the most recent bookings of the range, newest first, in the admin shape', async () => {
    const { customer, jaisalmer } = await seedFixture();

    const { data } = (await agent.get(PATH).query(RANGE)).body;

    expect(data.recentBookings.map(({ createdAt }) => createdAt)).toEqual([
      '2026-10-03T07:00:00.000Z',
      '2026-10-03T06:00:00.000Z',
      '2026-10-01T18:30:00.000Z',
      '2026-10-01T18:00:00.000Z',
    ]);
    expect(data.recentBookings[0]).toMatchObject({
      user: customer.id,
      status: 'confirmed',
      totalAmount: 29998,
      tour: { id: jaisalmer.id, slug: jaisalmer.slug },
      vertical: { key: 'goldensaga' },
    });
  });

  it('caps recent bookings at 10 and top lists at 5', async () => {
    const vertical = await createVertical();
    const tours = await Promise.all(Array.from({ length: 6 }, () => createTour({ vertical })));
    const customer = await createUser({ createdAt: LONG_AGO });
    for (const tour of [...tours, ...tours]) {
      await createBooking({ user: customer, tour, createdAt: '2026-10-02T10:00:00Z' });
    }
    await createBooking({ user: customer, tour: tours[5], createdAt: '2026-10-02T11:00:00Z' });
    const gear = await Promise.all(Array.from({ length: 6 }, () => createGear()));
    await GearClick.create(
      gear.map(({ _id }) => ({ gear: _id, createdAt: '2026-10-02T10:00:00Z' })),
    );

    const { data } = (await agent.get(PATH).query(RANGE)).body;

    expect(data.totals.bookings).toBe(13);
    expect(data.recentBookings).toHaveLength(10);
    expect(data.topTours).toHaveLength(5);
    expect(data.topTours[0]).toMatchObject({ tourId: tours[5].id, bookings: 3 });
    expect(data.topGear).toHaveLength(5);
  });

  it('with no data returns zeroes, not missing keys', async () => {
    const { data } = (await agent.get(PATH).query(RANGE)).body;

    expect(data.totals).toEqual({
      users: 1,
      newUsers: 0,
      bookings: 0,
      bookingValue: 0,
      newsletterSubscribers: 0,
    });
    expect(data.bookingsByStatus).toEqual({ confirmed: 0, cancelled: 0, completed: 0 });
    expect(data.bookingsPerDay).toHaveLength(7);
    expect(data.newUsersPerDay).toHaveLength(7);
    expect(data.bookingsByVertical).toEqual([]);
    expect(data.topTours).toEqual([]);
    expect(data.topGear).toEqual([]);
    expect(data.recentBookings).toEqual([]);
  });

  it('defaults to the last 30 IST days ending today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 01:00 IST on 11 Oct, which is still 10 Oct in UTC.
    vi.setSystemTime(new Date('2026-10-10T19:30:00Z'));

    const { data } = (await agent.get(PATH)).body;

    expect(data.range).toEqual({ from: '2026-09-12', to: '2026-10-11', days: 30 });
    expect(data.bookingsPerDay).toHaveLength(30);
    expect(data.bookingsPerDay[0].date).toBe('2026-09-12');
    expect(data.bookingsPerDay.at(-1).date).toBe('2026-10-11');
  });

  it('a lone `to` ends the default window; a lone `from` runs up to today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T06:30:00Z'));

    const toOnly = (await agent.get(PATH).query({ to: '2026-03-01' })).body.data;
    const fromOnly = (await agent.get(PATH).query({ from: '2026-10-09' })).body.data;

    expect(toOnly.range).toEqual({ from: '2026-01-31', to: '2026-03-01', days: 30 });
    expect(fromOnly.range).toEqual({ from: '2026-10-09', to: '2026-10-11', days: 3 });
  });

  it('accepts a single day and a 366-day range', async () => {
    const oneDay = await agent.get(PATH).query({ from: '2026-10-05', to: '2026-10-05' });
    const leapYear = await agent.get(PATH).query({ from: '2024-01-01', to: '2024-12-31' });

    expect(oneDay.body.data.bookingsPerDay).toEqual([
      { date: '2026-10-05', bookings: 0, value: 0 },
    ]);
    expect(leapYear.status).toBe(200);
    expect(leapYear.body.data.range.days).toBe(366);
    expect(leapYear.body.data.newUsersPerDay).toHaveLength(366);
  });

  it('a range longer than 366 days → 400', async () => {
    const res = await agent.get(PATH).query({ from: '2025-01-01', to: '2026-01-02' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [{ field: 'to', message: 'The range must not exceed 366 days' }],
    });
  });

  it.each([
    [{ from: '2026-10-02', to: '2026-10-01' }, 'from'],
    [{ from: '2026-02-30' }, 'from'],
    [{ to: 'yesterday' }, 'to'],
  ])('rejects the query %j', async (query, field) => {
    const res = await agent.get(PATH).query(query);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
  });
});
