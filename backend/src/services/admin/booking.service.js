import mongoose from 'mongoose';
import { BOOKING_STATUS_TRANSITIONS, ERROR_CODES } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { Vertical } from '../../models/Vertical.js';
import { AppError } from '../../utils/AppError.js';
import { istDayRange, parseDateOnly } from '../../utils/dates.js';
import { containsRegex } from '../../utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { NEWEST_FIRST, findBookings, toBookingResponse } from '../booking.service.js';

const SEARCH_PATHS = ['bookingNumber', 'contact.name', 'contact.phone', 'contact.email'];

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, 'Booking not found');

// The admin booking is the customer booking object plus the id of the user who made it.
export const findAdminBookings = (filter) => findBookings(filter).select('user');

// Resolves to null when the vertical filter names a vertical that does not exist.
const buildListFilter = async ({ status, vertical, tour, from, to, q }) => {
  const filter = {};
  if (vertical) {
    const match = await Vertical.findOne({ key: vertical }).select('_id').lean();
    if (!match) return null;
    filter.vertical = match._id;
  }
  if (status) filter.status = status;
  if (tour) filter.tour = tour;
  if (from || to) {
    const range = istDayRange({ from: from && parseDateOnly(from), to: to && parseDateOnly(to) });
    filter.createdAt = mongoose.trusted(range);
  }
  if (q) {
    const pattern = containsRegex(q);
    filter.$or = SEARCH_PATHS.map((path) => ({ [path]: pattern }));
  }
  return filter;
};

export const listBookings = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildListFilter(query);
  if (!filter) return { bookings: [], meta: buildPaginationMeta({ page, limit, total: 0 }) };

  const [bookings, total] = await Promise.all([
    findAdminBookings(filter).sort(NEWEST_FIRST).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  return {
    bookings: bookings.map(toBookingResponse),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const getBooking = async (bookingNumber) => {
  const [booking] = await findAdminBookings({ bookingNumber }).limit(1).lean();
  if (!booking) throw notFound();
  return toBookingResponse(booking);
};

export const updateBookingStatus = async (bookingNumber, status) => {
  const current = await Booking.findOne({ bookingNumber }).select('status').lean();
  if (!current) throw notFound();

  // The current status is part of the filter, so two admins racing cannot both apply a change.
  const updated =
    BOOKING_STATUS_TRANSITIONS[current.status].includes(status) &&
    (await Booking.findOneAndUpdate(
      { bookingNumber, status: current.status },
      { $set: { status, statusUpdatedAt: new Date() } },
    )
      .select('_id')
      .lean());
  if (!updated) {
    throw new AppError(
      409,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `A ${current.status} booking cannot be changed to ${status}`,
    );
  }
  return getBooking(bookingNumber);
};
