import { ERROR_CODES, LIMITS } from '../config/constants.js';
import { AppError } from './AppError.js';

export const slugify = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, LIMITS.SLUG_MAX)
    .replace(/^-+|-+$/g, '');

// Uses the slug the admin supplied, otherwise derives one from the title or name.
export const slugFrom = (provided, source) => {
  const value = provided ?? slugify(source);
  if (!value) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', [
      { field: 'slug', message: 'A slug could not be generated, provide one' },
    ]);
  }
  return value;
};
