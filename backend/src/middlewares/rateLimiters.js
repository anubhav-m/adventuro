import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { ERROR_CODES, RATE_LIMITS } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

const createLimiter = ({ windowMs, limit }, options = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError(429, ERROR_CODES.RATE_LIMITED, 'Too many requests')),
    ...options,
  });

export const globalLimiter = createLimiter(RATE_LIMITS.GLOBAL);
export const authLimiter = createLimiter(RATE_LIMITS.AUTH);
export const newsletterLimiter = createLimiter(RATE_LIMITS.NEWSLETTER);
export const searchLimiter = createLimiter(RATE_LIMITS.SEARCH);
export const goLimiter = createLimiter(RATE_LIMITS.GO);

// Mounted after requireAuth, so bookings are limited per user rather than per IP.
export const bookingLimiter = createLimiter(RATE_LIMITS.BOOKING, {
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
});
