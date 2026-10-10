import { LIMITS } from '../config/constants.js';

const toBoundedInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

export const parsePagination = ({ page, limit } = {}) => {
  const safePage = toBoundedInt(page, 1, Number.MAX_SAFE_INTEGER);
  const safeLimit = toBoundedInt(limit, LIMITS.PAGE_LIMIT_DEFAULT, LIMITS.PAGE_LIMIT_MAX);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
