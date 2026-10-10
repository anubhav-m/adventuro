import { AUTH_COOKIE_NAME } from '../config/constants.js';
import { env } from '../config/env.js';

const UNIT_MS = Object.freeze({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 });

export const durationToMs = (duration) => Number.parseInt(duration, 10) * UNIT_MS[duration.at(-1)];

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookie = (res, token) =>
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: durationToMs(env.JWT_EXPIRES_IN),
  });

export const clearAuthCookie = (res) => res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
