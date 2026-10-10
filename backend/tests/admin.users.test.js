import { beforeEach, describe, expect, it } from 'vitest';
import { authAgent } from './helpers/authAgent.js';
import { createBooking, createTour, createUser } from './helpers/factories.js';

const BASE = '/api/v1/admin/users';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let admin;
let agent;

const emails = (res) => res.body.data.users.map(({ email }) => email);

beforeEach(async () => {
  admin = await createUser({
    role: 'admin',
    name: 'Site Admin',
    email: 'admin@example.com',
    phone: '9000000001',
    createdAt: '2026-01-01T00:00:00Z',
  });
  agent = authAgent(admin);
});

describe('GET /api/v1/admin/users', () => {
  it('lists users newest first, without internal fields', async () => {
    const complete = await createUser({
      name: 'Asha Rao',
      email: 'asha@example.com',
      phone: '9812345678',
      createdAt: '2026-02-01T00:00:00Z',
    });
    await createUser({
      name: 'Ira Sen',
      email: 'ira@example.com',
      phone: undefined,
      createdAt: '2026-03-01T00:00:00Z',
    });

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Users fetched');
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 3, totalPages: 1 });
    expect(emails(res)).toEqual(['ira@example.com', 'asha@example.com', 'admin@example.com']);
    expect(res.body.data.users[1]).toEqual({
      id: complete.id,
      email: 'asha@example.com',
      name: 'Asha Rao',
      avatarUrl: null,
      phone: '9812345678',
      role: 'user',
      themePreference: 'system',
      lastLoginAt: null,
      createdAt: '2026-02-01T00:00:00.000Z',
      profileComplete: true,
    });
    expect(res.body.data.users[0].profileComplete).toBe(false);
    expect(res.body.data.users[0]).not.toHaveProperty('googleId');
  });

  it.each([
    ['name', 'asha r'],
    ['email', 'ASHA@'],
    ['phone', '98123'],
  ])('searches by %s', async (_label, q) => {
    await createUser({ name: 'Asha Rao', email: 'asha@example.com', phone: '9812345678' });
    await createUser({ name: 'Ira Sen', email: 'ira@example.com', phone: '9700000000' });

    const res = await agent.get(BASE).query({ q });

    expect(emails(res)).toEqual(['asha@example.com']);
  });

  it('filters by role, combines with q, and paginates', async () => {
    await createUser({ email: 'one@example.com' });
    await createUser({ email: 'two@example.com' });

    const admins = await agent.get(BASE).query({ role: 'admin' });
    const users = await agent.get(BASE).query({ role: 'user', q: 'two@' });
    const paged = await agent.get(BASE).query({ page: 2, limit: 2 });

    expect(emails(admins)).toEqual(['admin@example.com']);
    expect(emails(users)).toEqual(['two@example.com']);
    expect(paged.body.data.users).toHaveLength(1);
    expect(paged.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('treats regex characters in q literally', async () => {
    const res = await agent.get(BASE).query({ q: '.*' });

    expect(res.status).toBe(200);
    expect(res.body.data.users).toEqual([]);
  });

  it.each([[{ role: 'owner' }], [{ q: 'a' }], [{ page: 0 }]])(
    'rejects the query %j',
    async (query) => {
      const res = await agent.get(BASE).query(query);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    },
  );
});

describe('GET /api/v1/admin/users/:id', () => {
  it('returns the user with their bookings, newest first, and nobody else’s', async () => {
    const customer = await createUser({ name: 'Asha Rao' });
    const tour = await createTour();
    const older = await createBooking({ user: customer, tour, createdAt: '2026-10-01T10:00:00Z' });
    const newer = await createBooking({
      user: customer,
      tour,
      status: 'completed',
      createdAt: '2026-10-02T10:00:00Z',
    });
    await createBooking({ tour });

    const res = await agent.get(`${BASE}/${customer.id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User fetched');
    expect(res.body.data.user).toMatchObject({
      id: customer.id,
      name: 'Asha Rao',
      email: customer.email,
      role: 'user',
      profileComplete: true,
    });
    expect(res.body.data.bookings.map(({ bookingNumber }) => bookingNumber)).toEqual([
      newer.bookingNumber,
      older.bookingNumber,
    ]);
    expect(res.body.data.bookings[0]).toMatchObject({
      status: 'completed',
      startDate: '2026-12-01',
      tour: { id: tour.id, slug: tour.slug },
      reporting: { location: 'Dabolim Airport' },
    });
  });

  it('a user with no bookings has an empty list', async () => {
    const res = await agent.get(`${BASE}/${admin.id}`);

    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.bookings).toEqual([]);
  });

  it('unknown id → 404, malformed id → 400', async () => {
    const unknown = await agent.get(`${BASE}/${UNKNOWN_ID}`);
    const malformed = await agent.get(`${BASE}/nope`);

    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ success: false, message: 'User not found', code: 'NOT_FOUND' });
    expect(malformed.status).toBe(400);
    expect(malformed.body.code).toBe('VALIDATION_ERROR');
  });
});
