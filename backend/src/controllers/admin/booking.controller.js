import {
  getBooking,
  listBookings,
  updateBookingStatus,
} from '../../services/admin/booking.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminBookings = async (req, res, next) => {
  try {
    const { bookings, meta } = await listBookings(req.validated.query);
    return sendSuccess(res, { message: 'Bookings fetched', data: { bookings }, meta });
  } catch (err) {
    next(err);
  }
};

export const getAdminBooking = async (req, res, next) => {
  try {
    const booking = await getBooking(req.validated.params.bookingNumber);
    return sendSuccess(res, { message: 'Booking fetched', data: { booking } });
  } catch (err) {
    next(err);
  }
};

export const patchAdminBookingStatus = async (req, res, next) => {
  try {
    const { params, body } = req.validated;
    const booking = await updateBookingStatus(params.bookingNumber, body.status);
    return sendSuccess(res, { message: 'Booking status updated', data: { booking } });
  } catch (err) {
    next(err);
  }
};
