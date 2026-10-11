import { ROUTES } from './constants.js';

const NEXT_PARAM = 'next';
// An in-app path only: one leading slash, so `//host` and `/\host` cannot send anyone off-site.
const IN_APP_PATH = /^\/(?![/\\])/;

export const safeNext = (value) =>
  typeof value === 'string' && IN_APP_PATH.test(value) ? value : null;

export const readNext = (searchParams) => safeNext(searchParams.get(NEXT_PARAM));

export const withNext = (path, next) =>
  next ? `${path}?${new URLSearchParams({ [NEXT_PARAM]: next })}` : path;

// Where a signed-in user belongs: onboarding until the profile is complete, then `next` or home.
export const getSignedInPath = (user, next) =>
  user.profileComplete ? (next ?? ROUTES.HOME) : withNext(ROUTES.ONBOARDING, next);
