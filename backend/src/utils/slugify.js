import { LIMITS } from '../config/constants.js';

export const slugify = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, LIMITS.SLUG_MAX)
    .replace(/^-+|-+$/g, '');
