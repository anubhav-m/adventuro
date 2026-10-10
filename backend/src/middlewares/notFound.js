import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

export const notFound = (_req, _res, next) =>
  next(new AppError(404, ERROR_CODES.ROUTE_NOT_FOUND, 'Route not found'));
