import { beforeEach, describe, expect, it } from 'vitest';
import { NewsletterSubscriber } from '../src/models/NewsletterSubscriber.js';
import { authAgent } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

const BASE = '/api/v1/admin/newsletter';

let agent;

beforeEach(async () => {
  agent = authAgent(await createUser({ role: 'admin' }));
});

describe('GET /api/v1/admin/newsletter', () => {
  it('lists subscribers newest first', async () => {
    const first = await NewsletterSubscriber.create({
      email: 'first@example.com',
      createdAt: '2026-10-01T10:00:00Z',
    });
    await NewsletterSubscriber.create({
      email: 'second@example.com',
      createdAt: '2026-10-02T10:00:00Z',
    });

    const res = await agent.get(BASE);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Subscribers fetched',
      data: {
        subscribers: [
          {
            id: expect.any(String),
            email: 'second@example.com',
            createdAt: '2026-10-02T10:00:00.000Z',
          },
          { id: first.id, email: 'first@example.com', createdAt: '2026-10-01T10:00:00.000Z' },
        ],
      },
      meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
    });
  });

  it('paginates, and an empty list is a 200', async () => {
    const empty = await agent.get(BASE);
    expect(empty.body.data.subscribers).toEqual([]);
    expect(empty.body.meta).toEqual({ page: 1, limit: 12, total: 0, totalPages: 0 });

    await NewsletterSubscriber.create([1, 2, 3].map((n) => ({ email: `reader${n}@example.com` })));
    const paged = await agent.get(BASE).query({ page: 2, limit: 2 });

    expect(paged.body.data.subscribers).toHaveLength(1);
    expect(paged.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects a limit above the maximum', async () => {
    const res = await agent.get(BASE).query({ limit: 51 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
