import { request, requestBlob } from './client.js';

const bookingPath = (bookingNumber) => `/bookings/${encodeURIComponent(bookingNumber)}`;

export const createBooking = async ({ tourId, tierId, travelers, startDate }) => {
  const { booking } = await request('/bookings', {
    method: 'POST',
    body: { tourId, tierId, travelers, startDate },
  });
  return booking;
};

export const listMyBookings = (params, { signal } = {}) =>
  request('/bookings/me', { params, signal });

export const getBooking = async (bookingNumber, { signal } = {}) => {
  const { booking } = await request(bookingPath(bookingNumber), { signal });
  return booking;
};

export const downloadTicket = (bookingNumber) =>
  requestBlob(`${bookingPath(bookingNumber)}/ticket`);
