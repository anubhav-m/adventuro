import { z } from 'zod';
import { BOOKING_NUMBER_REGEX, LIMITS } from '../config/constants.js';
import { dateOnly, objectId, pagination } from './common.js';

export const createBookingBody = z
  .object({
    tourId: objectId,
    tierId: objectId,
    travelers: z.number().int().min(LIMITS.TRAVELERS_MIN).max(LIMITS.TRAVELERS_MAX),
    startDate: dateOnly,
  })
  .strict();

export const listMyBookingsQuery = pagination;

export const bookingNumberParams = z.object({
  bookingNumber: z.string().regex(BOOKING_NUMBER_REGEX, 'Invalid booking number'),
});
