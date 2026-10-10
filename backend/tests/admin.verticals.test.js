import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { Vertical } from '../src/models/Vertical.js';
import { authAgent } from './helpers/authAgent.js';
import { createUser, createVertical } from './helpers/factories.js';
import { bucket, removedPaths, resetBucket, storedImage } from './helpers/supabaseMock.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const BASE = '/api/v1/admin/verticals';
const UNKNOWN_ID = '64b7f0c2a1b2c3d4e5f60718';

let agent;

beforeEach(async () => {
  resetBucket();
  agent = authAgent(await createUser({ role: 'admin' }));
});

describe('GET /api/v1/admin/verticals', () => {
  it('lists verticals by order', async () => {
    await createVertical({ key: 'peakpulse', code: 'PP', name: 'PeakPulse', order: 3 });
    const first = await createVertical();

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Verticals fetched');
    expect(res.body.data.verticals.map(({ key }) => key)).toEqual(['tidetrail', 'peakpulse']);
    expect(res.body.data.verticals[0]).toEqual({
      id: first.id,
      key: 'tidetrail',
      code: 'TT',
      name: 'TideTrail',
      subtitle: 'Ocean Blue & Coastal Thrills',
      description: 'Beaches, islands and coastal escapes.',
      heroImage: null,
      order: 1,
    });
  });
});

describe('GET /api/v1/admin/verticals/:id', () => {
  it('returns one vertical', async () => {
    const vertical = await createVertical();

    const res = await agent.get(`${BASE}/${vertical.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vertical).toMatchObject({ id: vertical.id, key: 'tidetrail', code: 'TT' });
  });

  it('unknown id → 404, malformed id → 400', async () => {
    expect((await agent.get(`${BASE}/${UNKNOWN_ID}`)).body.code).toBe('NOT_FOUND');
    const res = await agent.get(`${BASE}/not-an-id`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/v1/admin/verticals/:id', () => {
  it('updates subtitle, description and hero image', async () => {
    const vertical = await createVertical();
    const heroImage = storedImage('verticals');

    const res = await agent
      .patch(`${BASE}/${vertical.id}`)
      .send({ subtitle: '  Salt and sun  ', description: 'New copy', heroImage });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Vertical updated');
    expect(res.body.data.vertical).toMatchObject({
      id: vertical.id,
      key: 'tidetrail',
      subtitle: 'Salt and sun',
      description: 'New copy',
      heroImage,
    });
    expect(bucket.remove).not.toHaveBeenCalled();
    const saved = await Vertical.findById(vertical.id).lean();
    expect(saved.heroImage).toEqual(heroImage);
  });

  it('reaches the public vertical endpoint', async () => {
    const vertical = await createVertical();

    await agent.patch(`${BASE}/${vertical.id}`).send({ subtitle: 'Fresh subtitle' });

    const res = await request(app).get('/api/v1/verticals/tidetrail');
    expect(res.body.data.vertical.subtitle).toBe('Fresh subtitle');
  });

  it('deletes the old hero image from storage when it is replaced', async () => {
    const oldImage = storedImage('verticals');
    const vertical = await createVertical({ heroImage: oldImage });

    await agent.patch(`${BASE}/${vertical.id}`).send({ heroImage: storedImage('verticals') });

    expect(removedPaths()).toEqual([oldImage.path]);
  });

  it('deletes the old hero image when it is cleared with null', async () => {
    const oldImage = storedImage('verticals');
    const vertical = await createVertical({ heroImage: oldImage });

    const res = await agent.patch(`${BASE}/${vertical.id}`).send({ heroImage: null });

    expect(res.body.data.vertical.heroImage).toBeNull();
    expect(removedPaths()).toEqual([oldImage.path]);
  });

  it('keeps the hero image when it is resent unchanged or not sent at all', async () => {
    const heroImage = storedImage('verticals');
    const vertical = await createVertical({ heroImage });

    await agent.patch(`${BASE}/${vertical.id}`).send({ heroImage });
    await agent.patch(`${BASE}/${vertical.id}`).send({ subtitle: 'Only text' });

    expect(bucket.remove).not.toHaveBeenCalled();
    expect((await Vertical.findById(vertical.id).lean()).heroImage).toEqual(heroImage);
  });

  it.each(['key', 'code', 'name', 'order'])('cannot change %s (strict 400)', async (field) => {
    const vertical = await createVertical();

    const res = await agent
      .patch(`${BASE}/${vertical.id}`)
      .send({ subtitle: 'ok', [field]: field === 'order' ? 9 : 'XX' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ field, message: 'Unknown field' }]);
    const saved = await Vertical.findById(vertical.id).lean();
    expect(saved).toMatchObject({ key: 'tidetrail', code: 'TT', name: 'TideTrail', order: 1 });
    expect(saved.subtitle).toBe('Ocean Blue & Coastal Thrills');
  });

  it('rejects an empty body, an http image url and a forged image path', async () => {
    const vertical = await createVertical();
    const target = `${BASE}/${vertical.id}`;

    expect((await agent.patch(target).send({})).status).toBe(400);

    const http = await agent
      .patch(target)
      .send({ heroImage: { url: 'http://cdn.example.com/a.png', path: null } });
    expect(http.body.errors).toEqual([{ field: 'heroImage.url', message: expect.any(String) }]);

    const forged = await agent.patch(target).send({
      heroImage: { url: 'https://cdn.example.com/a.png', path: '../other-bucket/secret.png' },
    });
    expect(forged.body.errors).toEqual([
      { field: 'heroImage.path', message: 'Invalid image path' },
    ]);
  });

  it('unknown id → 404', async () => {
    const res = await agent.patch(`${BASE}/${UNKNOWN_ID}`).send({ subtitle: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('verticals cannot be created or deleted', () => {
  it('POST /admin/verticals → 404 ROUTE_NOT_FOUND', async () => {
    const res = await agent.post(BASE).send({ key: 'newvertical', code: 'NV', name: 'New' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('DELETE /admin/verticals/:id → 404 ROUTE_NOT_FOUND and the vertical survives', async () => {
    const vertical = await createVertical();

    const res = await agent.delete(`${BASE}/${vertical.id}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
    expect(await Vertical.countDocuments()).toBe(1);
  });
});
