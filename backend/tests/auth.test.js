import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { signSessionToken } from '../src/services/auth.service.js';
import { authAgent, sessionCookie } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

// A mutable copy of the frozen env, so single tests can switch NODE_ENV or ADMIN_EMAILS.
vi.mock('../src/config/env.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, env: { ...actual.env } };
});

const originalEnv = { ...env };

const googlePayload = (overrides = {}) => ({
  sub: 'google-sub-1',
  email: 'traveler@example.com',
  email_verified: true,
  name: 'Asha Traveler',
  picture: 'https://lh3.googleusercontent.com/a/photo',
  ...overrides,
});

const mockGoogle = (payload) => verifyIdToken.mockResolvedValue({ getPayload: () => payload });

const signIn = (credential = 'google-id-token') =>
  request(app).post('/api/v1/auth/google').send({ credential });

const unauthenticated = {
  success: false,
  message: 'Authentication required',
  code: 'UNAUTHENTICATED',
};

const expectClearedCookie = (res) => {
  const [cookie] = res.headers['set-cookie'];
  expect(cookie).toMatch(/^adv_session=;/);
  expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
};

beforeEach(() => {
  verifyIdToken.mockReset();
});

afterEach(() => {
  Object.assign(env, originalEnv);
});

// This file must stay under RATE_LIMITS.AUTH.limit (20) sign-in requests; the limit itself is
// covered in auth.limiter.test.js.
describe('POST /api/v1/auth/google', () => {
  it('creates the user, sets the session cookie and returns the user', async () => {
    mockGoogle(googlePayload());
    const res = await signIn('google-id-token');

    expect(res.status).toBe(200);
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'test-client-id.apps.googleusercontent.com',
    });

    const user = await User.findOne({ googleId: 'google-sub-1' });
    expect(res.body).toEqual({
      success: true,
      message: 'Signed in',
      data: {
        user: {
          id: user.id,
          email: 'traveler@example.com',
          name: 'Asha Traveler',
          avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
          role: 'user',
          themePreference: 'system',
          profileComplete: false,
          lastLoginAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });

    const [cookie] = res.headers['set-cookie'];
    expect(cookie).toMatch(/^adv_session=[\w-]+\.[\w-]+\.[\w-]+;/);
    expect(cookie).toMatch(/Max-Age=604800;/);
    expect(cookie).toMatch(/Path=\/;/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).not.toMatch(/Secure/);
  });

  it('issues an HS256 token for the user that restores the session', async () => {
    mockGoogle(googlePayload());
    const agent = request.agent(app);
    const signedIn = await agent.post('/api/v1/auth/google').send({ credential: 'token' });

    const token = signedIn.headers['set-cookie'][0].split(';')[0].split('=')[1];
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.sub).toBe(signedIn.body.data.user.id);
    expect(decoded.payload.exp - decoded.payload.iat).toBe(7 * 24 * 60 * 60);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.id).toBe(signedIn.body.data.user.id);
  });

  it('marks the cookie Secure in production', async () => {
    env.NODE_ENV = 'production';
    mockGoogle(googlePayload());
    const res = await signIn();
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/; Secure/);
  });

  it('keeps an edited name and avatar on later sign-ins and refreshes lastLoginAt', async () => {
    mockGoogle(googlePayload());
    const first = await signIn();
    const { id } = first.body.data.user;
    await User.findByIdAndUpdate(id, {
      name: 'Edited Name',
      phone: '9876543210',
      lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    mockGoogle(googlePayload({ name: 'Google Name Changed', picture: 'https://example.com/new' }));
    const second = await signIn();

    expect(second.body.data.user).toMatchObject({
      id,
      name: 'Edited Name',
      phone: '9876543210',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
      profileComplete: true,
    });
    expect(new Date(second.body.data.user.lastLoginAt).getFullYear()).toBeGreaterThanOrEqual(2026);
    expect(second.body.data.user.lastLoginAt).not.toBe('2026-01-01T00:00:00.000Z');
    expect(await User.countDocuments()).toBe(1);
  });

  it('makes an ADMIN_EMAILS account admin and demotes it once removed from the list', async () => {
    mockGoogle(googlePayload({ email: 'Admin@Example.com' }));
    const promoted = await signIn();
    expect(promoted.body.data.user).toMatchObject({ email: 'admin@example.com', role: 'admin' });

    env.ADMIN_EMAILS = [];
    const demoted = await signIn();
    expect(demoted.body.data.user.role).toBe('user');
    expect((await User.findOne({ email: 'admin@example.com' })).role).toBe('user');
  });

  it('stores an empty name when Google sends none and trims an overlong one', async () => {
    mockGoogle(googlePayload({ name: undefined, picture: undefined }));
    const unnamed = await signIn();
    expect(unnamed.body.data.user).toMatchObject({ name: '', avatarUrl: null });

    mockGoogle(
      googlePayload({ sub: 'google-sub-2', email: 'b@example.com', name: 'x'.repeat(300) }),
    );
    const longNamed = await signIn();
    expect(longNamed.body.data.user.name).toHaveLength(120);
  });

  it.each([
    ['an unverified email', googlePayload({ email_verified: false })],
    ['a non-boolean email_verified', googlePayload({ email_verified: 'true' })],
    ['no email', googlePayload({ email: undefined })],
    ['no subject', googlePayload({ sub: undefined })],
    ['an empty payload', undefined],
  ])('rejects a credential with %s → 401 INVALID_GOOGLE_TOKEN', async (_label, payload) => {
    mockGoogle(payload);
    const res = await signIn();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Google credential was rejected',
      code: 'INVALID_GOOGLE_TOKEN',
    });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(await User.countDocuments()).toBe(0);
  });

  it('verifier throws → 401 INVALID_GOOGLE_TOKEN without leaking the reason', async () => {
    verifyIdToken.mockRejectedValue(new Error('Wrong number of segments in token: junk'));
    const res = await signIn('junk');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: 'Google credential was rejected',
      code: 'INVALID_GOOGLE_TOKEN',
    });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it.each([
    ['missing credential', {}, 'credential'],
    ['empty credential', { credential: '  ' }, 'credential'],
    ['non-string credential', { credential: { $ne: null } }, 'credential'],
    ['unknown key', { credential: 'token', role: 'admin' }, 'role'],
  ])('%s → 400 VALIDATION_ERROR', async (_label, body, field) => {
    const res = await request(app).post('/api/v1/auth/google').send(body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors.map((error) => error.field)).toEqual([field]);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/auth/me', () => {
  const getMe = (token) => request(app).get('/api/v1/auth/me').set('Cookie', sessionCookie(token));

  it('no cookie → 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthenticated);
  });

  it('valid session → 200 with the user and no googleId', async () => {
    const user = await createUser({ themePreference: 'dark' });
    const res = await authAgent(user).get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Session restored',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: 'user',
          themePreference: 'dark',
          profileComplete: true,
        },
      },
    });
    expect(res.body.data.user).not.toHaveProperty('googleId');
    expect(res.body.data.user).not.toHaveProperty('_id');
    expect(res.body.data.user).not.toHaveProperty('__v');
  });

  it('picks up a role change without a new sign-in', async () => {
    const user = await createUser();
    const agent = authAgent(user);
    await User.findByIdAndUpdate(user.id, { role: 'admin' });
    const res = await agent.get('/api/v1/auth/me');
    expect(res.body.data.user.role).toBe('admin');
  });

  it.each([
    ['tampered signature', (user) => `${signSessionToken(user.id)}x`],
    ['garbage value', () => 'not-a-jwt'],
    [
      'expired token',
      (user) => jwt.sign({ sub: user.id }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: -60 }),
    ],
    [
      'wrong algorithm',
      (user) => jwt.sign({ sub: user.id }, env.JWT_SECRET, { algorithm: 'HS512' }),
    ],
    [
      'unsigned alg=none token',
      (user) =>
        `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
          JSON.stringify({ sub: user.id }),
        ).toString('base64url')}.`,
    ],
    [
      'token signed with another secret',
      (user) => jwt.sign({ sub: user.id }, 'another-secret-that-is-32-chars-long!!'),
    ],
  ])('%s → 401 UNAUTHENTICATED and the cookie is cleared', async (_label, buildToken) => {
    const user = await createUser();
    const res = await getMe(buildToken(user));
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthenticated);
    expectClearedCookie(res);
  });

  it('deleted user → 401 UNAUTHENTICATED', async () => {
    const user = await createUser();
    const agent = authAgent(user);
    await User.deleteOne({ _id: user._id });
    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthenticated);
  });

  it.each([
    ['a subject that is not an id', { sub: 'nope' }],
    ['no subject', {}],
  ])('validly signed token with %s → 401 UNAUTHENTICATED', async (_label, payload) => {
    const res = await getMe(jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256' }));
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthenticated);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the cookie for a signed-in user', async () => {
    const user = await createUser();
    const res = await authAgent(user).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Signed out' });
    expectClearedCookie(res);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
  });

  it('succeeds without a session', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Signed out' });
    expectClearedCookie(res);
  });
});
