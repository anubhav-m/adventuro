import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { RATE_LIMITS } from '../src/config/constants.js';

describe('POST /api/v1/auth/google rate limit', () => {
  it('returns 429 RATE_LIMITED once the auth limit is used up', async () => {
    const attempt = () => request(app).post('/api/v1/auth/google').send({});

    for (let i = 0; i < RATE_LIMITS.AUTH.limit; i += 1) {
      const res = await attempt();
      expect(res.status).toBe(400);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMITED',
    });

    const otherRoute = await request(app).get('/api/v1/auth/me');
    expect(otherRoute.status).toBe(401);
  });
});
