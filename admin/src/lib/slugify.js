import { LIMITS } from './constants.js';

// The server's own rule, so the slug an admin sees is the one that would be generated.
// "Goa: Coast & Café" → "goa-coast-and-cafe"
export const slugify = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, LIMITS.SLUG_MAX)
    .replace(/^-+|-+$/g, '');
