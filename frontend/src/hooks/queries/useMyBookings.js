import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listMyBookings } from '../../api/bookings.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// Resolves to { bookings, meta }, newest first. The previous page stays while the next loads.
export const useMyBookings = (params) =>
  useQuery({
    queryKey: queryKeys.bookings.mine(params),
    queryFn: ({ signal }) => listMyBookings(params, { signal }),
    placeholderData: keepPreviousData,
  });
