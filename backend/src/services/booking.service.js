import {
  BOOKING_NUMBER_PREFIX,
  BOOKING_SEQUENCE_DIGITS,
  ERROR_CODES,
  ROLES,
} from '../config/constants.js';
import { Booking } from '../models/Booking.js';
import { Tour } from '../models/Tour.js';
import { AppError } from '../utils/AppError.js';
import { formatDateOnly, getIstToday, isBookableStartDate, parseDateOnly } from '../utils/dates.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { nextSequence } from './counter.service.js';

const BOOKING_FIELDS =
  'bookingNumber tour vertical snapshot travelers startDate totalAmount contact status statusUpdatedAt createdAt';
const TOUR_FIELDS = 'slug reporting';
const VERTICAL_FIELDS = 'key name code';
export const NEWEST_FIRST = { createdAt: -1, _id: -1 };

// `tour` and `vertical` are populated lean documents. Reporting details are read from the
// tour on every request, so admin edits reach existing bookings and tickets.
export const toBookingResponse = ({ tour, startDate, ...booking }) =>
  serialize({
    ...booking,
    startDate: formatDateOnly(startDate),
    tour: tour && { _id: tour._id, slug: tour.slug },
    reporting: tour?.reporting ?? null,
  });

export const findBookings = (filter) =>
  Booking.find(filter)
    .select(BOOKING_FIELDS)
    .populate('tour', TOUR_FIELDS)
    .populate('vertical', VERTICAL_FIELDS);

// An unknown tour, an unpublished tour and a missing tier are indistinguishable to the client.
const findBookableTour = async (tourId, tierId) => {
  const tour = await Tour.findOne({ _id: tourId, isPublished: true })
    .select(`title durationDays tiers vertical ${TOUR_FIELDS}`)
    .populate('vertical', VERTICAL_FIELDS)
    .lean();
  const tier = tour?.tiers.find(({ _id }) => String(_id) === tierId);
  if (!tier) {
    throw new AppError(409, ERROR_CODES.TOUR_UNAVAILABLE, 'This tour is not available for booking');
  }
  return { tour, tier };
};

const parseBookableStartDate = (value, now) => {
  const startDate = parseDateOnly(value);
  if (!isBookableStartDate(startDate, now)) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', [
      { field: 'startDate', message: 'Start date must be between tomorrow and 365 days ahead' },
    ]);
  }
  return startDate;
};

// The sequence runs per vertical per year, with the year taken from the IST calendar.
const nextBookingNumber = async (verticalCode, now) => {
  const year = getIstToday(now).getUTCFullYear();
  const sequence = await nextSequence(`booking-${verticalCode}-${year}`);
  const padded = String(sequence).padStart(BOOKING_SEQUENCE_DIGITS, '0');
  return `${BOOKING_NUMBER_PREFIX}-${verticalCode}-${year}-${padded}`;
};

export const createBookingForUser = async (user, { tourId, tierId, travelers, startDate }) => {
  const now = new Date();
  const { tour, tier } = await findBookableTour(tourId, tierId);
  const { vertical } = tour;
  const bookableStartDate = parseBookableStartDate(startDate, now);

  const booking = await Booking.create({
    bookingNumber: await nextBookingNumber(vertical.code, now),
    user: user.id,
    tour: tour._id,
    vertical: vertical._id,
    snapshot: {
      tourTitle: tour.title,
      verticalName: vertical.name,
      verticalCode: vertical.code,
      tierName: tier.name,
      pricePerPerson: tier.pricePerPerson,
      durationDays: tour.durationDays,
    },
    travelers,
    startDate: bookableStartDate,
    totalAmount: tier.pricePerPerson * travelers,
    contact: { name: user.name, phone: user.phone, email: user.email },
  });

  return getBookingForUser(booking.bookingNumber, user);
};

export const listBookingsForUser = async (user, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: user.id };
  const [bookings, total] = await Promise.all([
    findBookings(filter).sort(NEWEST_FIRST).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);
  return {
    bookings: bookings.map(toBookingResponse),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

// Admins can read any booking. Everyone else is scoped to their own, so another user's
// booking number answers exactly like one that does not exist.
export const getBookingForUser = async (bookingNumber, user) => {
  const scope = user.role === ROLES.ADMIN ? {} : { user: user.id };
  const [booking] = await findBookings({ bookingNumber, ...scope })
    .limit(1)
    .lean();
  if (!booking) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Booking not found');
  return toBookingResponse(booking);
};
