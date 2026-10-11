import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { api, server, success } from '../test/server.js';
import { getMe, signInWithGoogle, signOut } from './auth.api.js';
import { createBooking, downloadTicket, getBooking, listMyBookings } from './bookings.api.js';
import { gearGoUrl, listGear } from './gear.api.js';
import { subscribe } from './newsletter.api.js';
import { queryKeys } from './queryKeys.js';
import { search } from './search.api.js';
import { listTaxonomies } from './taxonomies.api.js';
import { getTour, listTours } from './tours.api.js';
import { updateMe } from './users.api.js';
import { getVertical, listVerticals } from './verticals.api.js';

const BOOKING_NUMBER = 'ADV-TT-2026-000001';
const META = { page: 1, limit: 12, total: 1, totalPages: 1 };

// Answers one endpoint and records what was sent to it.
const stub = (method, path, data, options) => {
  const seen = {};
  server.use(
    http[method](api(path), async ({ request }) => {
      seen.search = new URL(request.url).search;
      const text = await request.text();
      seen.body = text ? JSON.parse(text) : undefined;
      return success(data, options);
    }),
  );
  return seen;
};

describe('api modules', () => {
  it('auth: sign in, me, sign out', async () => {
    const user = { id: 'u1', profileComplete: false };
    const signIn = stub('post', '/auth/google', { user });
    stub('get', '/auth/me', { user });
    stub('post', '/auth/logout');

    await expect(signInWithGoogle('google-id-token')).resolves.toEqual(user);
    expect(signIn.body).toEqual({ credential: 'google-id-token' });
    await expect(getMe()).resolves.toEqual(user);
    await expect(signOut()).resolves.toEqual({});
  });

  it('users: update profile', async () => {
    const user = { id: 'u1', themePreference: 'dark' };
    const seen = stub('patch', '/users/me', { user });

    await expect(updateMe({ themePreference: 'dark' })).resolves.toEqual(user);
    expect(seen.body).toEqual({ themePreference: 'dark' });
  });

  it('verticals: list and detail', async () => {
    stub('get', '/verticals', { verticals: [{ key: 'tidetrail' }] });
    stub('get', '/verticals/tidetrail', { vertical: { key: 'tidetrail' }, tours: [] });

    await expect(listVerticals()).resolves.toEqual([{ key: 'tidetrail' }]);
    await expect(getVertical('tidetrail')).resolves.toEqual({
      vertical: { key: 'tidetrail' },
      tours: [],
    });
  });

  it('tours: list with filters and detail', async () => {
    const list = stub('get', '/tours', { tours: [] }, { meta: META });
    stub('get', '/tours/goa-coastal-escape', { tour: { slug: 'goa-coastal-escape' } });

    await expect(listTours({ vertical: 'tidetrail', page: 1 })).resolves.toEqual({
      tours: [],
      meta: META,
    });
    expect(list.search).toBe('?vertical=tidetrail&page=1');
    await expect(getTour('goa-coastal-escape')).resolves.toEqual({ slug: 'goa-coastal-escape' });
  });

  it('gear: list with filters, and the affiliate link', async () => {
    const list = stub('get', '/gear', { gear: [] }, { meta: META });

    await expect(listGear({ category: 'backpacks', sort: 'price_asc' })).resolves.toEqual({
      gear: [],
      meta: META,
    });
    expect(list.search).toBe('?category=backpacks&sort=price_asc');
    expect(gearGoUrl('64b7f0c2a1d3e4f5a6b7c8d9')).toBe('/api/v1/gear/64b7f0c2a1d3e4f5a6b7c8d9/go');
  });

  it('taxonomies: list by type', async () => {
    const seen = stub('get', '/taxonomies', { taxonomies: [{ slug: 'caps' }] });

    await expect(listTaxonomies('category')).resolves.toEqual([{ slug: 'caps' }]);
    expect(seen.search).toBe('?type=category');
  });

  it('bookings: create, mine, detail, ticket', async () => {
    const booking = { bookingNumber: BOOKING_NUMBER };
    const input = { tourId: 't1', tierId: 'r1', travelers: 2, startDate: '2026-11-01' };
    const create = stub('post', '/bookings', { booking }, { status: 201 });
    const mine = stub('get', '/bookings/me', { bookings: [booking] }, { meta: META });
    stub('get', `/bookings/${BOOKING_NUMBER}`, { booking });
    stub('get', `/bookings/${BOOKING_NUMBER}/ticket`);

    await expect(createBooking({ ...input, totalAmount: 1 })).resolves.toEqual(booking);
    expect(create.body).toEqual(input);
    await expect(listMyBookings({ page: 1 })).resolves.toEqual({ bookings: [booking], meta: META });
    expect(mine.search).toBe('?page=1');
    await expect(getBooking(BOOKING_NUMBER)).resolves.toEqual(booking);
    await expect(downloadTicket(BOOKING_NUMBER)).resolves.toBeInstanceOf(Blob);
  });

  it('search and newsletter', async () => {
    const found = stub('get', '/search', { tours: [], gear: [] });
    const subscribed = stub('post', '/newsletter');

    await expect(search('goa')).resolves.toEqual({ tours: [], gear: [] });
    expect(found.search).toBe('?q=goa');
    await expect(subscribe('reader@example.com')).resolves.toEqual({});
    expect(subscribed.body).toEqual({ email: 'reader@example.com' });
  });
});

describe('queryKeys', () => {
  it('nests every key under its domain so a domain can be invalidated at once', () => {
    expect(queryKeys.me).toEqual(['me']);
    expect(queryKeys.verticals.detail('tidetrail')).toEqual(['verticals', 'tidetrail']);
    expect(queryKeys.tours.list({ page: 1 })).toEqual(['tours', 'list', { page: 1 }]);
    expect(queryKeys.tours.detail('goa')).toEqual(['tours', 'detail', 'goa']);
    expect(queryKeys.gear.list({ q: 'bag' })).toEqual(['gear', 'list', { q: 'bag' }]);
    expect(queryKeys.taxonomies.list('category')).toEqual(['taxonomies', 'category']);
    expect(queryKeys.taxonomies.list()).toEqual(['taxonomies', 'all']);
    expect(queryKeys.bookings.mine({ page: 2 })).toEqual(['bookings', 'mine', { page: 2 }]);
    expect(queryKeys.bookings.detail(BOOKING_NUMBER)).toEqual([
      'bookings',
      'detail',
      BOOKING_NUMBER,
    ]);
    expect(queryKeys.search('goa')).toEqual(['search', 'goa']);
    for (const domain of ['verticals', 'tours', 'gear', 'taxonomies', 'bookings']) {
      expect(queryKeys[domain].all).toEqual([domain]);
    }
  });
});
