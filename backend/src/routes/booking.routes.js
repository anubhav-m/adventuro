import { Router } from 'express';
import {
  createBooking,
  downloadTicket,
  getBooking,
  getMyBookings,
} from '../controllers/booking.controller.js';
import { requireAuth, requireCompleteProfile } from '../middlewares/auth.js';
import { bookingLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import {
  bookingNumberParams,
  createBookingBody,
  listMyBookingsQuery,
} from '../validators/booking.validator.js';

export const bookingRouter = Router();

bookingRouter.use(requireAuth);

bookingRouter.post(
  '/',
  requireCompleteProfile,
  bookingLimiter,
  validate({ body: createBookingBody }),
  createBooking,
);
bookingRouter.get('/me', validate({ query: listMyBookingsQuery }), getMyBookings);
bookingRouter.get('/:bookingNumber', validate({ params: bookingNumberParams }), getBooking);
bookingRouter.get(
  '/:bookingNumber/ticket',
  validate({ params: bookingNumberParams }),
  downloadTicket,
);
