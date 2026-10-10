import { beforeEach, describe, expect, it } from 'vitest';
import { apiRouter } from '../src/routes/index.js';
import { authAgent } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

const API = '/api/v1';
// Express does not keep a mounted router's path, only a matcher for it, so the prefix is
// found by probing with these names. A router mounted under a name missing from this list
// fails the walk below rather than being skipped.
const MOUNT_NAMES = [
  'auth',
  'users',
  'verticals',
  'tours',
  'gear',
  'taxonomies',
  'search',
  'bookings',
  'newsletter',
  'admin',
  'dashboard',
  'uploads',
];
const PARAM_VALUES = {
  id: '64b7f0c2a1b2c3d4e5f60718',
  bookingNumber: 'ADV-TT-2026-000001',
  key: 'tidetrail',
  slug: 'goa-coastal-escape',
};
const BODY_METHODS = ['post', 'patch', 'put'];
// Routes that never read a JSON body, so there is nothing for a strict schema to check.
const NO_JSON_BODY = ['POST /auth/logout', 'POST /admin/uploads'];

const mountPathOf = (layer) => {
  const name = MOUNT_NAMES.find((candidate) => layer.matchers[0](`/${candidate}/x`));
  if (!name) throw new Error('A router is mounted under a path this test does not know');
  return `/${name}`;
};

// Walks the router stack and returns every route as { method, path }.
const collectRoutes = (router, prefix = '') =>
  router.stack.flatMap((layer) => {
    if (layer.route) {
      return Object.keys(layer.route.methods).map((method) => ({
        method,
        path: `${prefix}${layer.route.path}`.replace(/\/$/, ''),
      }));
    }
    if (layer.name === 'router') {
      return collectRoutes(layer.handle, `${prefix}${mountPathOf(layer)}`);
    }
    return [];
  });

const label = ({ method, path }) => `${method.toUpperCase()} ${path}`;

const concretePath = (path) =>
  path.replace(/:(\w+)/g, (_match, name) => {
    if (!PARAM_VALUES[name]) throw new Error(`No sample value for the :${name} parameter`);
    return PARAM_VALUES[name];
  });

const ROUTES = collectRoutes(apiRouter);
const BODY_ROUTES = ROUTES.filter(({ method }) => BODY_METHODS.includes(method));
const STRICT_ROUTES = BODY_ROUTES.filter((route) => !NO_JSON_BODY.includes(label(route)));

describe('route contract', () => {
  let agent;

  beforeEach(async () => {
    agent = authAgent(await createUser({ role: 'admin' }));
  });

  it('finds every mounted route', () => {
    const labels = ROUTES.map(label);

    expect(labels).toHaveLength(44);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(
      expect.arrayContaining([
        'GET /health',
        'POST /auth/google',
        'PATCH /users/me',
        'GET /gear/:id/go',
        'POST /bookings',
        'GET /bookings/:bookingNumber/ticket',
        'POST /newsletter',
        'GET /admin/dashboard',
        'PATCH /admin/tours/:id',
        'PATCH /admin/bookings/:bookingNumber/status',
        'GET /admin/users/:id',
        'GET /admin/newsletter',
      ]),
    );
  });

  it('the exemptions are real routes', () => {
    expect(BODY_ROUTES.map(label)).toEqual(expect.arrayContaining(NO_JSON_BODY));
    expect(ROUTES.filter(({ method }) => method === 'put')).toEqual([]);
  });

  it.each(STRICT_ROUTES.map((route) => [label(route), route]))(
    '%s rejects a body with an unknown key',
    async (_label, { method, path }) => {
      const res = await agent[method](`${API}${concretePath(path)}`).send({ __unknown: true });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toContainEqual({ field: '__unknown', message: 'Unknown field' });
    },
  );

  it('covers every POST and PATCH route that takes a JSON body', () => {
    expect(STRICT_ROUTES.map(label).sort()).toEqual([
      'PATCH /admin/bookings/:bookingNumber/status',
      'PATCH /admin/gear/:id',
      'PATCH /admin/taxonomies/:id',
      'PATCH /admin/tours/:id',
      'PATCH /admin/verticals/:id',
      'PATCH /users/me',
      'POST /admin/gear',
      'POST /admin/taxonomies',
      'POST /admin/tours',
      'POST /auth/google',
      'POST /bookings',
      'POST /newsletter',
    ]);
  });
});
