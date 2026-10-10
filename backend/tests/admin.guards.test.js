import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { authAgent } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const ID = '64b7f0c2a1b2c3d4e5f60718';

const ADMIN_ROUTES = [
  ['post', '/uploads?folder=tours'],
  ['delete', '/uploads'],
  ['get', '/verticals'],
  ['get', `/verticals/${ID}`],
  ['patch', `/verticals/${ID}`],
  ['get', '/tours'],
  ['post', '/tours'],
  ['get', `/tours/${ID}`],
  ['patch', `/tours/${ID}`],
  ['delete', `/tours/${ID}`],
  ['get', '/gear'],
  ['post', '/gear'],
  ['get', `/gear/${ID}`],
  ['patch', `/gear/${ID}`],
  ['delete', `/gear/${ID}`],
  ['get', '/taxonomies'],
  ['post', '/taxonomies'],
  ['patch', `/taxonomies/${ID}`],
  ['delete', `/taxonomies/${ID}`],
];

const url = (path) => `/api/v1/admin${path}`;

describe('admin route guards', () => {
  it.each(ADMIN_ROUTES)('%s %s → 401 when signed out', async (method, path) => {
    const res = await request(app)[method](url(path));

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHENTICATED',
    });
  });

  it.each(ADMIN_ROUTES)('%s %s → 403 for a normal user', async (method, path) => {
    const user = await createUser();

    const res = await authAgent(user)[method](url(path));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: 'Admin access required',
      code: 'FORBIDDEN',
    });
  });

  it('guards unknown admin paths too, so they reveal nothing to non-admins', async () => {
    const user = await createUser();

    expect((await request(app).get(url('/nope'))).status).toBe(401);
    expect((await authAgent(user).get(url('/nope'))).status).toBe(403);
  });

  it('an admin reaching an unknown admin path gets 404 ROUTE_NOT_FOUND', async () => {
    const admin = await createUser({ role: 'admin' });

    const res = await authAgent(admin).get(url('/nope'));

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('a demoted admin loses access on the very next request', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = authAgent(admin);
    expect((await agent.get(url('/verticals'))).status).toBe(200);

    admin.role = 'user';
    await admin.save();

    expect((await agent.get(url('/verticals'))).status).toBe(403);
  });
});
