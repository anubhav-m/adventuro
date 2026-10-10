import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { ERROR_CODES, LIMITS, ROLES } from '../config/constants.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const JWT_ALGORITHM = 'HS256';

const googleClient = new OAuth2Client();

const invalidGoogleToken = () =>
  new AppError(401, ERROR_CODES.INVALID_GOOGLE_TOKEN, 'Google credential was rejected');

// The only place that talks to Google. Its errors can embed the raw token, so they are never logged.
const fetchGooglePayload = async (credential) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch {
    throw invalidGoogleToken();
  }
};

export const verifyGoogleCredential = async (credential) => {
  const payload = await fetchGooglePayload(credential);
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw invalidGoogleToken();
  }
  return {
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: (payload.name ?? '').trim().slice(0, LIMITS.NAME_MAX),
    avatarUrl: payload.picture ?? null,
  };
};

const roleForEmail = (email) => (env.ADMIN_EMAILS.includes(email) ? ROLES.ADMIN : ROLES.USER);

export const signInWithGoogle = async (credential) => {
  const { googleId, email, name, avatarUrl } = await verifyGoogleCredential(credential);
  return User.findOneAndUpdate(
    { googleId },
    {
      $set: { email, role: roleForEmail(email), lastLoginAt: new Date() },
      $setOnInsert: { name, avatarUrl },
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
};

export const signSessionToken = (userId) =>
  jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN,
  });

export const verifySessionToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
