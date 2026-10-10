import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { RATE_LIMITS } from '../src/config/constants.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import {
  authLimiter,
  bookingLimiter,
  globalLimiter,
  goLimiter,
  newsletterLimiter,
  searchLimiter,
} from '../src/middlewares/rateLimiters.js';
import { sendSuccess } from '../src/utils/response.js';

const buildApp = (limiter, { withUser = false } = {}) => {
  const app = express();
  if (withUser) {
    app.use((req, _res, next) => {
      const id = req.get('x-test-user');
      if (id) req.user = { id };
      next();
    });
  }
  app.get('/', limiter, (_req, res) => sendSuccess(res, { message: 'OK' }));
  app.use(errorHandler);
  return app;
};

const hit = async (app, times, headers = {}) => {
  const responses = [];
  for (let i = 0; i < times; i += 1) {
    responses.push(await request(app).get('/').set(headers));
  }
  return responses;
};

describe('rate limiters', () => {
  it('defines the limits from the security checklist', () => {
    expect(RATE_LIMITS).toEqual({
      GLOBAL: { windowMs: 900_000, limit: 300 },
      AUTH: { windowMs: 900_000, limit: 20 },
      BOOKING: { windowMs: 3_600_000, limit: 10 },
      NEWSLETTER: { windowMs: 3_600_000, limit: 5 },
      SEARCH: { windowMs: 60_000, limit: 60 },
      GO: { windowMs: 60_000, limit: 60 },
    });
  });

  it.each([
    ['newsletter', newsletterLimiter, RATE_LIMITS.NEWSLETTER.limit],
    ['auth', authLimiter, RATE_LIMITS.AUTH.limit],
    ['search', searchLimiter, RATE_LIMITS.SEARCH.limit],
    ['go', goLimiter, RATE_LIMITS.GO.limit],
    ['global', globalLimiter, RATE_LIMITS.GLOBAL.limit],
  ])(
    '%s limiter returns the RATE_LIMITED envelope past its limit',
    async (_name, limiter, limit) => {
      const app = buildApp(limiter);
      const allowed = await hit(app, limit);
      expect(allowed.every(({ status }) => status === 200)).toBe(true);

      const [blocked] = await hit(app, 1);
      expect(blocked.status).toBe(429);
      expect(blocked.body).toEqual({
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMITED',
      });
    },
  );

  it('booking limiter counts per user, not per IP', async () => {
    const app = buildApp(bookingLimiter, { withUser: true });
    const { limit } = RATE_LIMITS.BOOKING;

    await hit(app, limit, { 'x-test-user': 'user-a' });
    const [blockedA] = await hit(app, 1, { 'x-test-user': 'user-a' });
    const [allowedB] = await hit(app, 1, { 'x-test-user': 'user-b' });

    expect(blockedA.status).toBe(429);
    expect(blockedA.body.code).toBe('RATE_LIMITED');
    expect(allowedB.status).toBe(200);
  });

  it('booking limiter falls back to the IP when there is no user', async () => {
    const app = buildApp(bookingLimiter);
    const responses = await hit(app, RATE_LIMITS.BOOKING.limit + 1);
    expect(responses.at(-1).status).toBe(429);
  });
});
