import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { authAgent } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

const PATH = '/api/v1/users/me';

const createIncompleteUser = () => createUser({ name: '', phone: undefined });

describe('PATCH /api/v1/users/me', () => {
  it('signed out → 401 UNAUTHENTICATED', async () => {
    const res = await request(app).patch(PATH).send({ name: 'Asha' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHENTICATED',
    });
  });

  it('updates name, phone and theme and returns the user', async () => {
    const user = await createIncompleteUser();
    const res = await authAgent(user)
      .patch(PATH)
      .send({ name: '  Asha Rao ', phone: '9876543210', themePreference: 'dark' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Profile updated',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: 'Asha Rao',
          phone: '9876543210',
          themePreference: 'dark',
          profileComplete: true,
        },
      },
    });
    expect(res.body.data.user).not.toHaveProperty('googleId');

    const stored = await User.findById(user.id);
    expect(stored).toMatchObject({
      name: 'Asha Rao',
      phone: '9876543210',
      themePreference: 'dark',
    });
  });

  it('updates one field and leaves the others alone', async () => {
    const user = await createUser({ name: 'Asha', phone: '9876543210' });
    const res = await authAgent(user).patch(PATH).send({ themePreference: 'light' });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      name: 'Asha',
      phone: '9876543210',
      themePreference: 'light',
    });
  });

  it('profileComplete flips to true only once both name and phone are set', async () => {
    const user = await createIncompleteUser();
    const agent = authAgent(user);

    const named = await agent.patch(PATH).send({ name: 'Asha' });
    expect(named.body.data.user.profileComplete).toBe(false);

    const complete = await agent.patch(PATH).send({ phone: '9876543210' });
    expect(complete.body.data.user.profileComplete).toBe(true);
  });

  it('lets a user re-submit their own phone number', async () => {
    const user = await createUser({ phone: '9876543210' });
    const res = await authAgent(user).patch(PATH).send({ phone: '9876543210' });
    expect(res.status).toBe(200);
  });

  it.each([
    ['too short', '98765'],
    ['starts with 5', '5876543210'],
    ['has a +91 prefix', '+919876543210'],
    ['not a string', 9876543210],
  ])('invalid phone (%s) → 400 VALIDATION_ERROR', async (_label, phone) => {
    const user = await createIncompleteUser();
    const res = await authAgent(user).patch(PATH).send({ phone });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors).toEqual([{ field: 'phone', message: expect.any(String) }]);
    expect((await User.findById(user.id)).phone).toBeUndefined();
  });

  it.each([
    ['blank name', { name: '   ' }, 'name'],
    ['overlong name', { name: 'x'.repeat(121) }, 'name'],
    ['unknown theme', { themePreference: 'sepia' }, 'themePreference'],
    ['empty body', {}, ''],
  ])('%s → 400 VALIDATION_ERROR', async (_label, body, field) => {
    const user = await createUser();
    const res = await authAgent(user).patch(PATH).send(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
  });

  it('phone used by another user → 409 PHONE_TAKEN', async () => {
    await createUser({ phone: '9876543210' });
    const user = await createIncompleteUser();
    const res = await authAgent(user).patch(PATH).send({ name: 'Asha', phone: '9876543210' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Phone number already in use',
      code: 'PHONE_TAKEN',
    });
    expect((await User.findById(user.id)).name).toBe('');
  });

  it.each([
    ['role', 'admin'],
    ['email', 'other@example.com'],
    ['googleId', 'google-hijack'],
    ['profileComplete', true],
  ])('rejects an attempt to set %s → 400', async (field, value) => {
    const user = await createUser();
    const res = await authAgent(user)
      .patch(PATH)
      .send({ name: 'Asha', [field]: value });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ field, message: 'Unknown field' }]);

    const stored = await User.findById(user.id);
    expect(stored).toMatchObject({
      role: 'user',
      email: user.email,
      googleId: user.googleId,
      name: user.name,
    });
  });
});
