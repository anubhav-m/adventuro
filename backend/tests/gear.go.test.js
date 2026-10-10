import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { Gear } from '../src/models/Gear.js';
import { GearClick } from '../src/models/GearClick.js';
import { authAgent, sessionCookie } from './helpers/authAgent.js';
import { createGear, createUser } from './helpers/factories.js';

const goPath = (id) => `/api/v1/gear/${id}/go`;
const AFFILIATE_URL = 'https://shop.example.com/p/trail-pack?tag=adventuro-21&ref=a%20b';

describe('GET /api/v1/gear/:id/go', () => {
  it('redirects a guest to the stored affiliate URL and logs the click', async () => {
    const gear = await createGear({ affiliateUrl: AFFILIATE_URL, clickCount: 3 });

    const res = await request(app).get(goPath(gear.id));

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(AFFILIATE_URL);

    const clicks = await GearClick.find();
    expect(clicks).toHaveLength(1);
    expect(String(clicks[0].gear)).toBe(gear.id);
    expect(clicks[0].user).toBeNull();
    expect(clicks[0].createdAt).toBeInstanceOf(Date);

    const stored = await Gear.findById(gear.id);
    expect(stored.clickCount).toBe(4);
    expect(stored.updatedAt).toEqual(gear.updatedAt);
  });

  it('attaches the user when signed in', async () => {
    const user = await createUser();
    const gear = await createGear();

    const res = await authAgent(user).get(goPath(gear.id));

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(gear.affiliateUrl);
    const [click] = await GearClick.find();
    expect(String(click.user)).toBe(user.id);
  });

  it('treats an invalid session as a guest and still redirects', async () => {
    const gear = await createGear();

    const res = await request(app)
      .get(goPath(gear.id))
      .set('Cookie', sessionCookie('not-a-real-token'));

    expect(res.status).toBe(302);
    expect(res.headers['set-cookie']).toBeUndefined();
    const [click] = await GearClick.find();
    expect(click.user).toBeNull();
  });

  it('counts every click', async () => {
    const gear = await createGear();
    await Promise.all(Array.from({ length: 5 }, () => request(app).get(goPath(gear.id))));

    expect((await Gear.findById(gear.id)).clickCount).toBe(5);
    expect(await GearClick.countDocuments({ gear: gear._id })).toBe(5);
  });

  it('cannot be steered to an arbitrary URL', async () => {
    const gear = await createGear({ affiliateUrl: AFFILIATE_URL });

    const res = await request(app).get(goPath(gear.id)).query({
      url: 'https://evil.example',
      affiliateUrl: 'https://evil.example',
      redirect: 'https://evil.example',
      next: '//evil.example',
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(AFFILIATE_URL);
  });

  it('inactive gear → 404 envelope, no click logged', async () => {
    const gear = await createGear({ isActive: false });

    const res = await request(app).get(goPath(gear.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Gear not found', code: 'NOT_FOUND' });
    expect(res.headers.location).toBeUndefined();
    expect(await GearClick.countDocuments()).toBe(0);
    expect((await Gear.findById(gear.id)).clickCount).toBe(0);
  });

  it('unknown gear → 404 NOT_FOUND', async () => {
    const res = await request(app).get(goPath(new mongoose.Types.ObjectId()));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(await GearClick.countDocuments()).toBe(0);
  });

  it.each(['123', 'not-an-object-id', 'z'.repeat(24), 'https%3A%2F%2Fevil.example'])(
    'invalid id %j → 400 VALIDATION_ERROR',
    async (id) => {
      const res = await request(app).get(goPath(id));
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
      expect(res.body.errors).toEqual([{ field: 'id', message: 'Invalid id' }]);
      expect(res.headers.location).toBeUndefined();
    },
  );
});
