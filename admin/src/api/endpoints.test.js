import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { api, server, success } from '../test/server.js';
import { getMe, signInWithGoogle, signOut, updateMe } from './auth.api.js';
import { downloadTicket, getBooking, listBookings, updateBookingStatus } from './bookings.api.js';
import { getDashboard } from './dashboard.api.js';
import { createGear, deleteGear, getGear, listGear, updateGear } from './gear.api.js';
import { listSubscribers } from './newsletter.api.js';
import { queryKeys } from './queryKeys.js';
import {
  createTaxonomy,
  deleteTaxonomy,
  listTaxonomies,
  updateTaxonomy,
} from './taxonomies.api.js';
import { createTour, deleteTour, getTour, listTours, updateTour } from './tours.api.js';
import { deleteUpload, uploadImage } from './uploads.api.js';
import { getUser, listUsers } from './users.api.js';
import { getVertical, listVerticals, updateVertical } from './verticals.api.js';

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
  it('auth: sign in, me, sign out, update the theme', async () => {
    const user = { id: 'u1', role: 'admin' };
    const signIn = stub('post', '/auth/google', { user });
    stub('get', '/auth/me', { user });
    stub('post', '/auth/logout');
    const update = stub('patch', '/users/me', { user });

    await expect(signInWithGoogle('google-id-token')).resolves.toEqual(user);
    expect(signIn.body).toEqual({ credential: 'google-id-token' });
    await expect(getMe()).resolves.toEqual(user);
    await expect(signOut()).resolves.toEqual({});
    await expect(updateMe({ themePreference: 'dark' })).resolves.toEqual(user);
    expect(update.body).toEqual({ themePreference: 'dark' });
  });

  it('dashboard: asks for the range', async () => {
    const seen = stub('get', '/admin/dashboard', { totals: { users: 3 } });

    await expect(getDashboard({ from: '2026-10-01', to: '2026-10-12' })).resolves.toEqual({
      totals: { users: 3 },
    });
    expect(seen.search).toBe('?from=2026-10-01&to=2026-10-12');
  });

  it('verticals: list, detail, update', async () => {
    const vertical = { id: 'v1', key: 'tidetrail' };
    stub('get', '/admin/verticals', { verticals: [vertical] });
    stub('get', '/admin/verticals/v1', { vertical });
    const update = stub('patch', '/admin/verticals/v1', { vertical });

    await expect(listVerticals()).resolves.toEqual([vertical]);
    await expect(getVertical('v1')).resolves.toEqual(vertical);
    await expect(updateVertical('v1', { subtitle: 'Coast' })).resolves.toEqual(vertical);
    expect(update.body).toEqual({ subtitle: 'Coast' });
  });

  it('tours: list with filters, detail, create, update, delete', async () => {
    const tour = { id: 't1', title: 'Goa Coastal Escape' };
    const list = stub('get', '/admin/tours', { tours: [tour] }, { meta: META });
    stub('get', '/admin/tours/t1', { tour });
    const create = stub('post', '/admin/tours', { tour }, { status: 201 });
    const update = stub('patch', '/admin/tours/t1', { tour });
    stub('delete', '/admin/tours/t1');

    await expect(listTours({ vertical: 'tidetrail', isPublished: '', page: 2 })).resolves.toEqual({
      tours: [tour],
      meta: META,
    });
    expect(list.search).toBe('?vertical=tidetrail&page=2');
    await expect(getTour('t1')).resolves.toEqual(tour);
    await expect(createTour({ title: 'Goa Coastal Escape' })).resolves.toEqual(tour);
    expect(create.body).toEqual({ title: 'Goa Coastal Escape' });
    await expect(updateTour('t1', { isPublished: false })).resolves.toEqual(tour);
    expect(update.body).toEqual({ isPublished: false });
    await expect(deleteTour('t1')).resolves.toEqual({});
  });

  it('gear: list with filters, detail, create, update, delete', async () => {
    const gear = { id: 'g1', name: 'Dry Bag' };
    const list = stub('get', '/admin/gear', { gear: [gear] }, { meta: META });
    stub('get', '/admin/gear/g1', { gear });
    const create = stub('post', '/admin/gear', { gear }, { status: 201 });
    const update = stub('patch', '/admin/gear/g1', { gear });
    stub('delete', '/admin/gear/g1');

    await expect(listGear({ q: 'bag', sort: 'popular' })).resolves.toEqual({
      gear: [gear],
      meta: META,
    });
    expect(list.search).toBe('?q=bag&sort=popular');
    await expect(getGear('g1')).resolves.toEqual(gear);
    await expect(createGear({ name: 'Dry Bag' })).resolves.toEqual(gear);
    expect(create.body).toEqual({ name: 'Dry Bag' });
    await expect(updateGear('g1', { isActive: false })).resolves.toEqual(gear);
    expect(update.body).toEqual({ isActive: false });
    await expect(deleteGear('g1')).resolves.toEqual({});
  });

  it('taxonomies: list by type, create, rename, delete', async () => {
    const taxonomy = { id: 'x1', type: 'tag', name: 'Waterproof' };
    const list = stub('get', '/admin/taxonomies', { taxonomies: [taxonomy] });
    const create = stub('post', '/admin/taxonomies', { taxonomy }, { status: 201 });
    const update = stub('patch', '/admin/taxonomies/x1', { taxonomy });
    stub('delete', '/admin/taxonomies/x1');

    await expect(listTaxonomies('tag')).resolves.toEqual([taxonomy]);
    expect(list.search).toBe('?type=tag');
    await listTaxonomies();
    expect(list.search).toBe('');
    await expect(createTaxonomy({ type: 'tag', name: 'Waterproof' })).resolves.toEqual(taxonomy);
    expect(create.body).toEqual({ type: 'tag', name: 'Waterproof' });
    await expect(updateTaxonomy('x1', { name: 'Rainproof' })).resolves.toEqual(taxonomy);
    expect(update.body).toEqual({ name: 'Rainproof' });
    await expect(deleteTaxonomy('x1')).resolves.toEqual({});
  });

  it('uploads: sends the file as a multipart form, and removes an unsaved upload by path', async () => {
    const image = { url: 'https://cdn.example.com/tours/a.png', path: 'tours/a.png' };
    const file = new File(['pixels'], 'cover.png', { type: 'image/png' });
    // jsdom's FormData is not the one Node's fetch encodes, so the request is read at fetch.
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ success: true, message: 'OK', data: { image } }));

    const uploaded = await uploadImage(file, 'tours');
    const [url, init] = fetchSpy.mock.calls[0];
    fetchSpy.mockRestore();

    expect(uploaded).toEqual(image);
    expect(`${url.pathname}${url.search}`).toBe('/api/v1/admin/uploads?folder=tours');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('image')).toBe(file);
    expect(init.headers).not.toHaveProperty('Content-Type');

    const remove = stub('delete', '/admin/uploads');
    await expect(deleteUpload('tours/a.png')).resolves.toEqual({});
    expect(remove.body).toEqual({ path: 'tours/a.png' });
  });

  it('bookings: list with filters, detail, status change', async () => {
    const booking = { bookingNumber: BOOKING_NUMBER, status: 'completed' };
    const list = stub('get', '/admin/bookings', { bookings: [booking] }, { meta: META });
    stub('get', `/admin/bookings/${BOOKING_NUMBER}`, { booking });
    const update = stub('patch', `/admin/bookings/${BOOKING_NUMBER}/status`, { booking });

    await expect(listBookings({ status: 'confirmed', q: '98765' })).resolves.toEqual({
      bookings: [booking],
      meta: META,
    });
    expect(list.search).toBe('?status=confirmed&q=98765');
    await expect(getBooking(BOOKING_NUMBER)).resolves.toEqual(booking);
    await expect(updateBookingStatus(BOOKING_NUMBER, 'completed')).resolves.toEqual(booking);
    expect(update.body).toEqual({ status: 'completed' });
  });

  it('bookings: downloads the ticket as a blob', async () => {
    server.use(
      http.get(
        api(`/bookings/${BOOKING_NUMBER}/ticket`),
        () => new Response('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } }),
      ),
    );

    const blob = await downloadTicket(BOOKING_NUMBER);
    expect(await blob.text()).toBe('%PDF-1.7');
  });

  it('users: list with filters, detail with bookings', async () => {
    const user = { id: 'u2', email: 'asha@example.com' };
    const list = stub('get', '/admin/users', { users: [user] }, { meta: META });
    stub('get', '/admin/users/u2', { user, bookings: [] });

    await expect(listUsers({ role: 'user', page: 1 })).resolves.toEqual({
      users: [user],
      meta: META,
    });
    expect(list.search).toBe('?role=user&page=1');
    await expect(getUser('u2')).resolves.toEqual({ user, bookings: [] });
  });

  it('newsletter: list a page of subscribers', async () => {
    const subscribers = [{ id: 's1', email: 'reader@example.com' }];
    const list = stub('get', '/admin/newsletter', { subscribers }, { meta: META });

    await expect(listSubscribers({ page: 3, limit: 50 })).resolves.toEqual({
      subscribers,
      meta: META,
    });
    expect(list.search).toBe('?page=3&limit=50');
  });
});

describe('queryKeys', () => {
  it('nests every list and detail key under its resource, so one prefix invalidates them', () => {
    for (const resource of ['tours', 'gear', 'bookings', 'users']) {
      const keys = queryKeys[resource];
      expect(keys.list({ page: 1 }).slice(0, 1)).toEqual(keys.all);
      expect(keys.detail('x').slice(0, 1)).toEqual(keys.all);
    }
    expect(queryKeys.verticals.detail('v1').slice(0, 1)).toEqual(queryKeys.verticals.all);
    expect(queryKeys.newsletter.list({ page: 1 }).slice(0, 1)).toEqual(queryKeys.newsletter.all);
  });

  it('keys the dashboard by its range and taxonomies by their type', () => {
    expect(queryKeys.dashboard({ from: 'a', to: 'b' })).toEqual([
      'dashboard',
      { from: 'a', to: 'b' },
    ]);
    expect(queryKeys.taxonomies.list('tag')).toEqual(['taxonomies', 'tag']);
    expect(queryKeys.taxonomies.list()).toEqual(['taxonomies', 'all']);
    expect(queryKeys.me).toEqual(['me']);
  });
});
