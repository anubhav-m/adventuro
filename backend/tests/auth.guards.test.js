import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  optionalAuth,
  requireAdmin,
  requireAuth,
  requireCompleteProfile,
} from '../src/middlewares/auth.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { User } from '../src/models/User.js';
import { sendSuccess } from '../src/utils/response.js';
import { authAgent, sessionCookie } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';

const ok = (req, res) =>
  sendSuccess(res, { message: 'OK', data: { userId: req.user?.id ?? null } });

const guardRouter = Router();
guardRouter.get('/admin', requireAuth, requireAdmin, ok);
guardRouter.get('/complete', requireAuth, requireCompleteProfile, ok);
guardRouter.get('/optional', optionalAuth, ok);
guardRouter.get('/admin-unguarded', requireAdmin, ok);
guardRouter.get('/complete-unguarded', requireCompleteProfile, ok);

const testApp = express();
testApp.use(cookieParser());
testApp.use(guardRouter);
testApp.use(errorHandler);

const agentFor = (user) => authAgent(user, testApp);

describe('requireAdmin', () => {
  it('lets an admin through', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await agentFor(admin).get('/admin');
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(admin.id);
  });

  it('normal user → 403 FORBIDDEN', async () => {
    const res = await agentFor(await createUser()).get('/admin');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: 'Admin access required',
      code: 'FORBIDDEN',
    });
  });

  it('a demoted admin loses access on the very next request', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = agentFor(admin);
    await User.findByIdAndUpdate(admin.id, { role: 'user' });
    const res = await agent.get('/admin');
    expect(res.status).toBe(403);
  });

  it('signed out → 401 before the role check', async () => {
    const res = await request(testApp).get('/admin');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('fails closed when mounted without requireAuth', async () => {
    const res = await agentFor(await createUser({ role: 'admin' })).get('/admin-unguarded');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});

describe('requireCompleteProfile', () => {
  it('lets a user with name and phone through', async () => {
    const res = await agentFor(await createUser()).get('/complete');
    expect(res.status).toBe(200);
  });

  it.each([
    ['no phone', { phone: undefined }],
    ['no name', { name: '' }],
  ])('user with %s → 403 PROFILE_INCOMPLETE', async (_label, overrides) => {
    const res = await agentFor(await createUser(overrides)).get('/complete');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: 'Complete your profile to continue',
      code: 'PROFILE_INCOMPLETE',
    });
  });

  it('signed out → 401 before the profile check', async () => {
    const res = await request(testApp).get('/complete');
    expect(res.status).toBe(401);
  });

  it('fails closed when mounted without requireAuth', async () => {
    const res = await agentFor(await createUser()).get('/complete-unguarded');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PROFILE_INCOMPLETE');
  });
});

describe('optionalAuth', () => {
  it('sets req.user for a valid session', async () => {
    const user = await createUser();
    const res = await agentFor(user).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(user.id);
  });

  it('continues as a guest without a cookie', async () => {
    const res = await request(testApp).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeNull();
  });

  it('continues as a guest with an invalid token and leaves the cookie alone', async () => {
    const res = await request(testApp).get('/optional').set('Cookie', sessionCookie('not-a-jwt'));
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeNull();
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('continues as a guest when the user no longer exists', async () => {
    const user = await createUser();
    const agent = agentFor(user);
    await User.deleteOne({ _id: user._id });
    const res = await agent.get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeNull();
  });
});
