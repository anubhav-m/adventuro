import {
  createBookingForUser,
  getBookingForUser,
  listBookingsForUser,
} from '../services/booking.service.js';
import { createTicketDocument } from '../services/ticket.service.js';
import { sendSuccess } from '../utils/response.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingForUser(req.user, req.validated.body);
    return sendSuccess(res, { status: 201, message: 'Booking confirmed', data: { booking } });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { bookings, meta } = await listBookingsForUser(req.user, req.validated.query);
    return sendSuccess(res, { message: 'Bookings fetched', data: { bookings }, meta });
  } catch (err) {
    next(err);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const booking = await getBookingForUser(req.validated.params.bookingNumber, req.user);
    return sendSuccess(res, { message: 'Booking fetched', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// The booking lookup (ownership check) and the document build both finish before any
// header is written, so a failure still reaches the error handler as a JSON envelope.
export const downloadTicket = async (req, res, next) => {
  try {
    const booking = await getBookingForUser(req.validated.params.bookingNumber, req.user);
    const ticket = createTicketDocument(booking);
    res.status(200).attachment(`Adventuro-${booking.bookingNumber}.pdf`);
    return ticket.pipe(res);
  } catch (err) {
    next(err);
  }
};
