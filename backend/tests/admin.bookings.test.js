import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { Booking } from '../src/models/Booking.js';
import { Tour } from '../src/models/Tour.js';
import { authAgent } from './helpers/authAgent.js';
import { createBooking, createTour, createUser, createVertical } from './helpers/factories.js';

const BASE = '/api/v1/admin/bookings';
const UNKNOWN_NUMBER = 'ADV-TT-2026-999999';
const STATUSES = ['confirmed', 'cancelled', 'completed'];
const ALLOWED = new Set(['confirmed→cancelled', 'confirmed→completed']);

let admin;
let agent;

const numbers = (res) => res.body.data.bookings.map(({ bookingNumber }) => bookingNumber);

beforeEach(async () => {
  admin = await createUser({ role: 'admin' });
  agent = authAgent(admin);
});

describe('GET /api/v1/admin/bookings', () => {
  it('lists every user’s bookings, newest first, with the admin booking shape', async () => {
    const customer = await createUser({ name: 'Asha Rao', phone: '9812345678' });
    const tour = await createTour();
    const older = await createBooking({ user: customer, tour, createdAt: '2026-10-01T10:00:00Z' });
    const newer = await createBooking({ tour, createdAt: '2026-10-02T10:00:00Z' });

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Bookings fetched');
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 2, totalPages: 1 });
    expect(numbers(res)).toEqual([newer.bookingNumber, older.bookingNumber]);
    expect(res.body.data.bookings[1]).toEqual({
      id: older.id,
      bookingNumber: older.bookingNumber,
      user: customer.id,
      status: 'confirmed',
      statusUpdatedAt: null,
      travelers: 2,
      startDate: '2026-12-01',
      totalAmount: 29998,
      createdAt: '2026-10-01T10:00:00.000Z',
      snapshot: {
        tourTitle: tour.title,
        verticalName: 'TideTrail',
        verticalCode: 'TT',
        tierName: 'Essential',
        pricePerPerson: 14999,
        durationDays: 4,
      },
      contact: { name: 'Asha Rao', phone: '9812345678', email: customer.email },
      tour: { id: tour.id, slug: tour.slug },
      vertical: { id: String(tour.vertical), key: 'tidetrail', name: 'TideTrail', code: 'TT' },
      reporting: { location: 'Dabolim Airport', address: 'Arrivals gate 2', time: '10:30' },
    });
  });

  it('paginates', async () => {
    const tour = await createTour();
    await Promise.all([1, 2, 3].map(() => createBooking({ tour })));

    const res = await agent.get(BASE).query({ page: 2, limit: 2 });

    expect(res.body.data.bookings).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('filters by status, vertical key and tour id', async () => {
    const goa = await createTour();
    const desert = await createVertical({ key: 'goldensaga', code: 'GS', name: 'GoldenSaga' });
    const jaisalmer = await createTour({ vertical: desert });
    const confirmed = await createBooking({ tour: goa });
    const cancelled = await createBooking({ tour: goa, status: 'cancelled' });
    const inDesert = await createBooking({ tour: jaisalmer });

    const byStatus = await agent.get(BASE).query({ status: 'cancelled' });
    const byVertical = await agent.get(BASE).query({ vertical: 'goldensaga' });
    const byTour = await agent.get(BASE).query({ tour: goa.id });
    const combined = await agent.get(BASE).query({ tour: goa.id, status: 'confirmed' });
    const unknownVertical = await agent.get(BASE).query({ vertical: 'nowhere' });

    expect(numbers(byStatus)).toEqual([cancelled.bookingNumber]);
    expect(numbers(byVertical)).toEqual([inDesert.bookingNumber]);
    expect(numbers(byTour).sort()).toEqual(
      [confirmed.bookingNumber, cancelled.bookingNumber].sort(),
    );
    expect(numbers(combined)).toEqual([confirmed.bookingNumber]);
    expect(unknownVertical.status).toBe(200);
    expect(unknownVertical.body.data.bookings).toEqual([]);
    expect(unknownVertical.body.meta.total).toBe(0);
  });

  it('filters by the IST day the booking was made, both bounds inclusive', async () => {
    const tour = await createTour();
    // 23:59 IST on 30 Sep, 00:00 IST on 1 Oct, 23:30 IST on 2 Oct, 00:00 IST on 3 Oct.
    const before = await createBooking({ tour, createdAt: '2026-09-30T18:29:00Z' });
    const first = await createBooking({ tour, createdAt: '2026-09-30T18:30:00Z' });
    const last = await createBooking({ tour, createdAt: '2026-10-02T18:00:00Z' });
    const after = await createBooking({ tour, createdAt: '2026-10-02T18:30:00Z' });

    const both = await agent.get(BASE).query({ from: '2026-10-01', to: '2026-10-02' });
    const fromOnly = await agent.get(BASE).query({ from: '2026-10-03' });
    const toOnly = await agent.get(BASE).query({ to: '2026-09-30' });

    expect(numbers(both)).toEqual([last.bookingNumber, first.bookingNumber]);
    expect(numbers(fromOnly)).toEqual([after.bookingNumber]);
    expect(numbers(toOnly)).toEqual([before.bookingNumber]);
  });

  it.each([
    ['booking number', 'adv-tt-2026-000777'],
    ['contact name', 'meera'],
    ['contact phone', '98111'],
    ['contact email', 'MEERA.K@'],
  ])('searches by %s', async (_label, q) => {
    const tour = await createTour();
    const target = await createBooking({
      tour,
      bookingNumber: 'ADV-TT-2026-000777',
      contact: { name: 'Meera Kapoor', phone: '9811122233', email: 'meera.k@example.com' },
    });
    await createBooking({ tour });

    const res = await agent.get(BASE).query({ q });

    expect(numbers(res)).toEqual([target.bookingNumber]);
  });

  it('treats regex characters in q literally', async () => {
    await createBooking();

    const res = await agent.get(BASE).query({ q: '.*' });

    expect(res.status).toBe(200);
    expect(res.body.data.bookings).toEqual([]);
  });

  it.each([
    [{ status: 'pending' }],
    [{ vertical: 'Not A Key' }],
    [{ tour: 'nope' }],
    [{ from: '2026-13-01' }],
    [{ to: '01-10-2026' }],
    [{ from: '2026-10-02', to: '2026-10-01' }],
    [{ q: 'a' }],
    [{ limit: 51 }],
  ])('rejects the query %j', async (query) => {
    const res = await agent.get(BASE).query(query);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/admin/bookings/:bookingNumber', () => {
  it('returns any user’s booking with live reporting details', async () => {
    const tour = await createTour();
    const booking = await createBooking({ tour });
    await Tour.updateOne({ _id: tour._id }, { $set: { 'reporting.time': '06:15' } });

    const res = await agent.get(`${BASE}/${booking.bookingNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Booking fetched');
    expect(res.body.data.booking).toMatchObject({
      bookingNumber: booking.bookingNumber,
      user: String(booking.user),
      reporting: { time: '06:15' },
    });
  });

  it('unknown number → 404, malformed number → 400', async () => {
    const unknown = await agent.get(`${BASE}/${UNKNOWN_NUMBER}`);
    const malformed = await agent.get(`${BASE}/ADV-XX-2026-1`);

    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({
      success: false,
      message: 'Booking not found',
      code: 'NOT_FOUND',
    });
    expect(malformed.status).toBe(400);
    expect(malformed.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/v1/admin/bookings/:bookingNumber/status', () => {
  const transitions = STATUSES.flatMap((from) => STATUSES.map((to) => [from, to]));

  it.each(transitions)('%s → %s', async (from, to) => {
    const booking = await createBooking({ status: from });
    const before = Date.now();

    const res = await agent.patch(`${BASE}/${booking.bookingNumber}/status`).send({ status: to });
    const stored = await Booking.findById(booking.id);

    if (ALLOWED.has(`${from}→${to}`)) {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Booking status updated');
      expect(res.body.data.booking).toMatchObject({
        bookingNumber: booking.bookingNumber,
        status: to,
        totalAmount: booking.totalAmount,
      });
      expect(new Date(res.body.data.booking.statusUpdatedAt).getTime()).toBeGreaterThanOrEqual(
        before,
      );
      expect(stored.status).toBe(to);
      expect(stored.statusUpdatedAt).toBeInstanceOf(Date);
    } else {
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        message: `A ${from} booking cannot be changed to ${to}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
      expect(stored.status).toBe(from);
      expect(stored.statusUpdatedAt).toBeNull();
    }
  });

  it('the customer sees the new status on their own booking', async () => {
    const customer = await createUser();
    const booking = await createBooking({ user: customer });

    await agent.patch(`${BASE}/${booking.bookingNumber}/status`).send({ status: 'completed' });
    const res = await authAgent(customer).get(`/api/v1/bookings/${booking.bookingNumber}`);

    expect(res.body.data.booking.status).toBe('completed');
  });

  it('is admin only: the owner cannot change the status of their own booking', async () => {
    const customer = await createUser();
    const booking = await createBooking({ user: customer });
    const path = `${BASE}/${booking.bookingNumber}/status`;

    const asOwner = await authAgent(customer).patch(path).send({ status: 'cancelled' });
    const signedOut = await request(app).patch(path).send({ status: 'cancelled' });

    expect(asOwner.status).toBe(403);
    expect(asOwner.body.code).toBe('FORBIDDEN');
    expect(signedOut.status).toBe(401);
    expect((await Booking.findById(booking.id)).status).toBe('confirmed');
  });

  it.each([
    [{}],
    [{ status: 'refunded' }],
    [{ status: 'cancelled', totalAmount: 1 }],
    [{ status: 'cancelled', statusUpdatedAt: '2020-01-01T00:00:00Z' }],
  ])('rejects the body %j', async (body) => {
    const booking = await createBooking();

    const res = await agent.patch(`${BASE}/${booking.bookingNumber}/status`).send(body);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect((await Booking.findById(booking.id)).status).toBe('confirmed');
  });

  it('unknown number → 404, malformed number → 400', async () => {
    const body = { status: 'cancelled' };

    expect((await agent.patch(`${BASE}/${UNKNOWN_NUMBER}/status`).send(body)).status).toBe(404);
    expect((await agent.patch(`${BASE}/nope/status`).send(body)).status).toBe(400);
  });
});
