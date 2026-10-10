import { ERROR_CODES, LIMITS } from '../../config/constants.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { containsRegex } from '../../utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { serialize } from '../../utils/serialize.js';
import { NEWEST_FIRST, findBookings, toBookingResponse } from '../booking.service.js';

const USER_FIELDS = 'email name avatarUrl phone role themePreference lastLoginAt createdAt';
const SEARCH_PATHS = ['name', 'email', 'phone'];

// Lean results skip the model's virtuals, so `profileComplete` is derived here.
const toUserResponse = (user) => ({
  ...serialize(user),
  profileComplete: Boolean(user.name && user.phone),
});

const buildListFilter = ({ q, role }) => {
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    const pattern = containsRegex(q);
    filter.$or = SEARCH_PATHS.map((path) => ({ [path]: pattern }));
  }
  return filter;
};

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildListFilter(query);

  const [users, total] = await Promise.all([
    User.find(filter).select(USER_FIELDS).sort(NEWEST_FIRST).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { users: users.map(toUserResponse), meta: buildPaginationMeta({ page, limit, total }) };
};

// Returns the user's most recent bookings, capped at the maximum page size.
export const getUserWithBookings = async (id) => {
  const [user, bookings] = await Promise.all([
    User.findById(id).select(USER_FIELDS).lean(),
    findBookings({ user: id }).sort(NEWEST_FIRST).limit(LIMITS.PAGE_LIMIT_MAX).lean(),
  ]);
  if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
  return { user: toUserResponse(user), bookings: bookings.map(toBookingResponse) };
};
