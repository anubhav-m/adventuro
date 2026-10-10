import { Router } from 'express';
import {
  getAdminBooking,
  getAdminBookings,
  patchAdminBookingStatus,
} from '../../controllers/admin/booking.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  listAdminBookingsQuery,
  updateBookingStatusBody,
} from '../../validators/admin/booking.validator.js';
import { bookingNumberParams } from '../../validators/booking.validator.js';

export const adminBookingRouter = Router();

adminBookingRouter.get('/', validate({ query: listAdminBookingsQuery }), getAdminBookings);
adminBookingRouter.get(
  '/:bookingNumber',
  validate({ params: bookingNumberParams }),
  getAdminBooking,
);
adminBookingRouter.patch(
  '/:bookingNumber/status',
  validate({ params: bookingNumberParams, body: updateBookingStatusBody }),
  patchAdminBookingStatus,
);
