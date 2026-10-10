import mongoose from 'mongoose';
import { AUTH_COOKIE_NAME, ERROR_CODES, ROLES } from '../config/constants.js';
import { User } from '../models/User.js';
import { verifySessionToken } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

// The user is loaded on every request so role changes and deletions apply immediately.
const loadSessionUser = async (req) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return null;
  const { sub } = verifySessionToken(token);
  return mongoose.isValidObjectId(sub) ? User.findById(String(sub)) : null;
};

export const requireAuth = async (req, _res, next) => {
  try {
    const user = await loadSessionUser(req);
    if (!user) {
      throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Authentication required');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const user = await loadSessionUser(req);
    if (user) req.user = user;
  } catch {
    // An invalid session is treated as signed out.
  }
  next();
};

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role === ROLES.ADMIN) return next();
  return next(new AppError(403, ERROR_CODES.FORBIDDEN, 'Admin access required'));
};

export const requireCompleteProfile = (req, _res, next) => {
  if (req.user?.profileComplete) return next();
  return next(
    new AppError(403, ERROR_CODES.PROFILE_INCOMPLETE, 'Complete your profile to continue'),
  );
};
