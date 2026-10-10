import request from 'supertest';
import { app } from '../../src/app.js';
import { AUTH_COOKIE_NAME } from '../../src/config/constants.js';
import { signSessionToken } from '../../src/services/auth.service.js';

export const sessionCookie = (token) => `${AUTH_COOKIE_NAME}=${token}`;

// Returns a Supertest agent that sends a valid session cookie for `user` on every request.
export const authAgent = (user, targetApp = app) => {
  const agent = request.agent(targetApp);
  agent.set('Cookie', sessionCookie(signSessionToken(user.id)));
  return agent;
};
