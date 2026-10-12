import { request, requestBlob } from './client.js';

const bookingPath = (bookingNumber) => `/admin/bookings/${encodeURIComponent(bookingNumber)}`;

export const listBookings = (params, { signal } = {}) =>
  request('/admin/bookings', { params, signal });

export const getBooking = async (bookingNumber, { signal } = {}) => {
  const { booking } = await request(bookingPath(bookingNumber), { signal });
  return booking;
};

export const updateBookingStatus = async (bookingNumber, status) => {
  const { booking } = await request(`${bookingPath(bookingNumber)}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return booking;
};

// The ticket comes from the customer endpoint, which serves any booking to an admin.
export const downloadTicket = (bookingNumber) =>
  requestBlob(`/bookings/${encodeURIComponent(bookingNumber)}/ticket`);
