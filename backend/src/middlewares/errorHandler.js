import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { clearAuthCookie } from '../utils/cookies.js';

const DUPLICATE_KEY_CODE = 11000;
const JWT_ERROR_NAMES = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
const BODY_PARSE_FAILED = 'entity.parse.failed';
const BODY_TOO_LARGE = 'entity.too.large';

const validationError = (message, errors) => ({
  statusCode: 400,
  code: ERROR_CODES.VALIDATION_ERROR,
  message,
  errors,
});

const zodIssueToErrors = (issue) => {
  const basePath = issue.path.join('.');
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({
      field: basePath ? `${basePath}.${key}` : key,
      message: 'Unknown field',
    }));
  }
  return [{ field: basePath, message: issue.message }];
};

const mongooseValidationErrors = (err) =>
  Object.values(err.errors).map((fieldError) => ({
    field: fieldError.path,
    message: fieldError.name === 'CastError' ? 'Invalid value' : fieldError.message,
  }));

const normalize = (err) => {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, errors: err.errors };
  }
  if (err instanceof ZodError) {
    return validationError('Validation failed', err.issues.flatMap(zodIssueToErrors));
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return validationError('Validation failed', mongooseValidationErrors(err));
  }
  if (err instanceof mongoose.Error.CastError) {
    return validationError('Validation failed', [{ field: err.path, message: 'Invalid value' }]);
  }
  if (err.code === DUPLICATE_KEY_CODE) {
    const isPhone = Object.keys(err.keyPattern ?? {}).includes('phone');
    return isPhone
      ? { statusCode: 409, code: ERROR_CODES.PHONE_TAKEN, message: 'Phone number already in use' }
      : { statusCode: 409, code: ERROR_CODES.DUPLICATE, message: 'Resource already exists' };
  }
  if (JWT_ERROR_NAMES.includes(err.name)) {
    return {
      statusCode: 401,
      code: ERROR_CODES.UNAUTHENTICATED,
      message: 'Authentication required',
      clearSession: true,
    };
  }
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return { statusCode: 413, code: ERROR_CODES.FILE_TOO_LARGE, message: 'File is too large' };
  }
  if (err.type === BODY_PARSE_FAILED) return validationError('Malformed JSON body');
  if (err.type === BODY_TOO_LARGE) return validationError('Request body is too large');
  return null;
};

// Express identifies error middleware by its four-argument signature.
export const errorHandler = (err, _req, res, _next) => {
  const known = normalize(err);

  if (!known) {
    logger.error({ err }, 'Unhandled error');
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      code: ERROR_CODES.INTERNAL_ERROR,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  const { statusCode, code, message, errors, clearSession } = known;
  if (clearSession) clearAuthCookie(res);
  return res.status(statusCode).json({ success: false, message, code, ...(errors && { errors }) });
};
