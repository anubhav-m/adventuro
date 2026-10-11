import { useQuery } from '@tanstack/react-query';
import { getBooking } from '../../api/bookings.api.js';
import { queryKeys } from '../../api/queryKeys.js';

export const useBooking = (bookingNumber) =>
  useQuery({
    queryKey: queryKeys.bookings.detail(bookingNumber),
    queryFn: ({ signal }) => getBooking(bookingNumber, { signal }),
  });
