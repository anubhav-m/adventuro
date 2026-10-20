import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getBooking, listBookings } from '../../api/bookings.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// One page of the bookings list. The page on screen stays while the next one loads.
export const useBookings = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: ({ signal }) => listBookings(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useBooking = (bookingNumber) =>
  useQuery({
    queryKey: queryKeys.bookings.detail(bookingNumber),
    queryFn: ({ signal }) => getBooking(bookingNumber, { signal }),
  });
