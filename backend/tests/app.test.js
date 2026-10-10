import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { app } from '../src/app.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { validate } from '../src/middlewares/validate.js';
import { sendSuccess } from '../src/utils/response.js';
import { objectId, pagination } from '../src/validators/common.js';

describe('GET /api/v1/health', () => {
  it('returns the success envelope with uptime', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'OK',
      data: { uptime: expect.any(Number) },
    });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers.ratelimit).toBeDefined();
  });
});

describe('CORS allowlist', () => {
  it('allows credentials for an allowlisted origin', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sends no allow-origin header for other origins', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('notFound', () => {
  it.each([
    ['get', '/api/v1/nope'],
    ['post', '/api/v1/health'],
    ['get', '/'],
  ])('%s %s → 404 ROUTE_NOT_FOUND envelope', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    });
  });
});

describe('body parsing', () => {
  it('malformed JSON → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Malformed JSON body',
      code: 'VALIDATION_ERROR',
    });
  });

  it('a body over 100kb → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .send({ blob: 'x'.repeat(110 * 1024) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('validate middleware', () => {
  const echo = (req, res) => sendSuccess(res, { message: 'Validated', data: req.validated });
  const testApp = express();
  testApp.use(express.json());
  testApp.post(
    '/items/:id',
    validate({
      params: z.object({ id: objectId }),
      query: pagination,
      body: z.object({ name: z.string().trim().min(1), count: z.number().int() }).strict(),
    }),
    echo,
  );
  testApp.get('/only-query', validate({ query: pagination }), echo);
  testApp.post('/only-body', validate({ body: z.object({ name: z.string() }).strict() }), echo);
  testApp.use(errorHandler);

  const id = '64b7f0c2a1d3e4f5a6b7c8d9';

  it('populates req.validated with parsed body, coerced query and params', async () => {
    const res = await request(testApp)
      .post(`/items/${id}?page=2&limit=5`)
      .send({ name: '  Tent ', count: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      params: { id },
      query: { page: 2, limit: 5 },
      body: { name: 'Tent', count: 3 },
    });
  });

  it('applies query defaults and only validates the sources it was given', async () => {
    const res = await request(testApp).get('/only-query');
    expect(res.body.data).toEqual({ query: { page: 1, limit: 12 } });
  });

  it('rejects unknown body keys (mass-assignment protection)', async () => {
    const res = await request(testApp)
      .post(`/items/${id}`)
      .send({ name: 'Tent', count: 1, role: 'admin', totalAmount: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors).toEqual([
      { field: 'role', message: 'Unknown field' },
      { field: 'totalAmount', message: 'Unknown field' },
    ]);
  });

  it('reports every failing field across body, query and params', async () => {
    const res = await request(testApp).post('/items/not-an-id?limit=500').send({ count: 1.5 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.map(({ field }) => field).sort()).toEqual([
      'count',
      'id',
      'limit',
      'name',
    ]);
  });

  it('treats a missing body as an empty object', async () => {
    const res = await request(testApp).post('/only-body');
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'name', message: expect.any(String) }]);
  });
});
