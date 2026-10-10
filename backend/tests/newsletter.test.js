import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { RATE_LIMITS } from '../src/config/constants.js';
import { NewsletterSubscriber } from '../src/models/NewsletterSubscriber.js';

const PATH = '/api/v1/newsletter';

// The newsletter limiter allows 5 requests an hour per IP, so every request gets its own
// client address (the app trusts one proxy hop) unless a test is exercising the limit.
let clientCount = 0;
const nextClientIp = () => {
  clientCount += 1;
  return `10.0.0.${clientCount}`;
};

const subscribe = (body, ip = nextClientIp()) =>
  request(app).post(PATH).set('X-Forwarded-For', ip).send(body);

describe('POST /api/v1/newsletter', () => {
  it('subscribes a new email → 200', async () => {
    const res = await subscribe({ email: 'asha@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Subscribed to the newsletter' });
    const subscribers = await NewsletterSubscriber.find();
    expect(subscribers.map(({ email }) => email)).toEqual(['asha@example.com']);
  });

  it('returns an identical response for an email that is already subscribed', async () => {
    const first = await subscribe({ email: 'asha@example.com' });
    const repeat = await subscribe({ email: 'asha@example.com' });

    expect(repeat.status).toBe(first.status);
    expect(repeat.body).toEqual(first.body);
    expect(await NewsletterSubscriber.countDocuments()).toBe(1);
  });

  it('stores the email trimmed and lowercased, and matches repeats case-insensitively', async () => {
    const first = await subscribe({ email: '  Asha.Rao@Example.COM ' });
    const repeat = await subscribe({ email: 'asha.rao@example.com' });

    expect(first.status).toBe(200);
    expect(repeat.body).toEqual(first.body);
    const subscribers = await NewsletterSubscriber.find();
    expect(subscribers.map(({ email }) => email)).toEqual(['asha.rao@example.com']);
  });

  it('keeps the original subscription date on a repeat', async () => {
    await subscribe({ email: 'asha@example.com' });
    const original = await NewsletterSubscriber.findOne();
    await subscribe({ email: 'asha@example.com' });

    expect((await NewsletterSubscriber.findOne()).createdAt).toEqual(original.createdAt);
  });

  it.each([
    ['not an email', { email: 'not-an-email' }, 'email'],
    ['no domain', { email: 'asha@' }, 'email'],
    ['empty', { email: '' }, 'email'],
    ['too long', { email: `${'a'.repeat(250)}@example.com` }, 'email'],
    ['not a string', { email: 42 }, 'email'],
    ['an operator object', { email: { $ne: '' } }, 'email'],
    ['missing', {}, 'email'],
  ])('email that is %s → 400 VALIDATION_ERROR', async (_label, body, field) => {
    const res = await subscribe(body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
    expect(await NewsletterSubscriber.countDocuments()).toBe(0);
  });

  it('rejects unknown fields → 400', async () => {
    const res = await subscribe({ email: 'asha@example.com', createdAt: '2020-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'createdAt', message: 'Unknown field' }]);
    expect(await NewsletterSubscriber.countDocuments()).toBe(0);
  });

  it('returns 429 RATE_LIMITED once one client uses up the limit', async () => {
    const ip = nextClientIp();
    for (let i = 0; i < RATE_LIMITS.NEWSLETTER.limit; i += 1) {
      const res = await subscribe({ email: `reader${i}@example.com` }, ip);
      expect(res.status).toBe(200);
    }

    const blocked = await subscribe({ email: 'late@example.com' }, ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMITED',
    });
    expect(await NewsletterSubscriber.exists({ email: 'late@example.com' })).toBeNull();

    const otherClient = await subscribe({ email: 'late@example.com' });
    expect(otherClient.status).toBe(200);
  });
});
