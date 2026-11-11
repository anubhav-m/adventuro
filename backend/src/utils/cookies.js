import {
  ADMIN_APP,
  ADMIN_AUTH_COOKIE_NAME,
  APP_HEADER,
  AUTH_COOKIE_NAME,
} from '../config/constants.js';
import { env } from '../config/env.js';

const UNIT_MS = Object.freeze({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 });

export const durationToMs = (duration) => Number.parseInt(duration, 10) * UNIT_MS[duration.at(-1)];

// The session cookie of the app that sent the request.
export const authCookieName = (req) =>
  req.get(APP_HEADER) === ADMIN_APP ? ADMIN_AUTH_COOKIE_NAME : AUTH_COOKIE_NAME;

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookie = (req, res, token) =>
  res.cookie(authCookieName(req), token, {
    ...baseCookieOptions(),
    maxAge: durationToMs(env.JWT_EXPIRES_IN),
  });

export const clearAuthCookie = (req, res) =>
  res.clearCookie(authCookieName(req), baseCookieOptions());
