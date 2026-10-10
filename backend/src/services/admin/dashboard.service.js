import mongoose from 'mongoose';
import { BOOKING_STATUS, ERROR_CODES, LIMITS, TIMEZONE } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { Gear } from '../../models/Gear.js';
import { GearClick } from '../../models/GearClick.js';
import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { User } from '../../models/User.js';
import { Vertical } from '../../models/Vertical.js';
import { AppError } from '../../utils/AppError.js';
import {
  addDays,
  countDaysInclusive,
  formatDateOnly,
  getIstToday,
  istDayRange,
  listDateOnlyRange,
  parseDateOnly,
} from '../../utils/dates.js';
import { serialize } from '../../utils/serialize.js';
import { NEWEST_FIRST, toBookingResponse } from '../booking.service.js';
import { findAdminBookings } from './booking.service.js';

const VALUE_STATUSES = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED];

const IST_DAY = { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: TIMEZONE } };
const COUNT = { $sum: 1 };
// Booking value counts confirmed and completed bookings only; cancelled ones add nothing.
const VALUE = { $sum: { $cond: [{ $in: ['$status', VALUE_STATUSES] }, '$totalAmount', 0] } };
const NO_BOOKINGS = Object.freeze({ bookings: 0, value: 0 });

const rangeError = (field, message) =>
  new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', [{ field, message }]);

// Both bounds are IST calendar days, inclusive. A missing `to` is today; a missing `from`
// is the default window ending at `to`.
const resolveRange = ({ from, to }, now) => {
  const end = to ? parseDateOnly(to) : getIstToday(now);
  const start = from ? parseDateOnly(from) : addDays(end, 1 - LIMITS.DASHBOARD_DEFAULT_DAYS);
  const days = countDaysInclusive(start, end);
  if (days < 1) throw rangeError('from', 'from must not be after to');
  if (days > LIMITS.DASHBOARD_MAX_DAYS) {
    throw rangeError('to', `The range must not exceed ${LIMITS.DASHBOARD_MAX_DAYS} days`);
  }
  return { start, end, days };
};

const groupBookings = (createdAt, _id) =>
  Booking.aggregate([
    { $match: { createdAt } },
    { $group: { _id, bookings: COUNT, value: VALUE } },
  ]);

// The title is the one snapshotted on the tour's latest booking in the range.
const topTours = (createdAt) =>
  Booking.aggregate([
    { $match: { createdAt } },
    { $sort: { createdAt: 1, _id: 1 } },
    {
      $group: {
        _id: '$tour',
        title: { $last: '$snapshot.tourTitle' },
        bookings: COUNT,
        value: VALUE,
      },
    },
    { $sort: { bookings: -1, value: -1, _id: 1 } },
    { $limit: LIMITS.DASHBOARD_TOP_ITEMS },
  ]);

const topGear = (createdAt) =>
  GearClick.aggregate([
    { $match: { createdAt } },
    { $group: { _id: '$gear', clicks: COUNT } },
    { $sort: { clicks: -1, _id: 1 } },
    { $limit: LIMITS.DASHBOARD_TOP_ITEMS },
    {
      $lookup: {
        from: Gear.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'gear',
      },
    },
    { $unwind: '$gear' },
    { $project: { name: '$gear.name', slug: '$gear.slug', clicks: 1 } },
  ]);

const newUsersPerDay = (createdAt) =>
  User.aggregate([{ $match: { createdAt } }, { $group: { _id: IST_DAY, count: COUNT } }]);

const recentBookings = (createdAt) =>
  findAdminBookings({ createdAt: mongoose.trusted(createdAt) })
    .sort(NEWEST_FIRST)
    .limit(LIMITS.DASHBOARD_RECENT_BOOKINGS)
    .lean();

// One entry per day of the range, in order, with `empty` for days that have no data.
const fillDays = (dates, rows, empty) => {
  const byDate = new Map(rows.map(({ _id, ...figures }) => [_id, figures]));
  return dates.map((date) => ({ date, ...(byDate.get(date) ?? empty) }));
};

const sumOf = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

export const getDashboard = async (query, now = new Date()) => {
  const { start, end, days } = resolveRange(query, now);
  const createdAt = istDayRange({ from: start, to: end });
  const dates = listDateOnlyRange(start, end);

  const [
    users,
    newsletterSubscribers,
    verticals,
    userDays,
    bookingDays,
    statusRows,
    verticalRows,
    tourRows,
    gearRows,
    recent,
  ] = await Promise.all([
    User.countDocuments(),
    NewsletterSubscriber.countDocuments(),
    Vertical.find().select('key name code').sort({ order: 1 }).lean(),
    newUsersPerDay(createdAt),
    groupBookings(createdAt, IST_DAY),
    groupBookings(createdAt, '$status'),
    groupBookings(createdAt, '$vertical'),
    topTours(createdAt),
    topGear(createdAt),
    recentBookings(createdAt),
  ]);

  const statusCounts = new Map(statusRows.map(({ _id, bookings }) => [_id, bookings]));
  const verticalFigures = new Map(
    verticalRows.map(({ _id, ...figures }) => [String(_id), figures]),
  );

  return {
    range: { from: formatDateOnly(start), to: formatDateOnly(end), days },
    totals: {
      users,
      newUsers: sumOf(userDays, 'count'),
      bookings: sumOf(statusRows, 'bookings'),
      bookingValue: sumOf(statusRows, 'value'),
      newsletterSubscribers,
    },
    newUsersPerDay: fillDays(dates, userDays, { count: 0 }),
    bookingsPerDay: fillDays(dates, bookingDays, NO_BOOKINGS),
    bookingsByStatus: Object.fromEntries(
      Object.values(BOOKING_STATUS).map((status) => [status, statusCounts.get(status) ?? 0]),
    ),
    bookingsByVertical: verticals.map((vertical) => ({
      vertical: serialize(vertical),
      ...(verticalFigures.get(String(vertical._id)) ?? NO_BOOKINGS),
    })),
    topTours: tourRows.map(({ _id, ...tour }) => ({ tourId: String(_id), ...tour })),
    topGear: gearRows.map(({ _id, ...gear }) => ({ gearId: String(_id), ...gear })),
    recentBookings: recent.map(toBookingResponse),
  };
};
