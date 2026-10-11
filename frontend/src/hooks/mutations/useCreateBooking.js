import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '../../api/bookings.api.js';
import { queryKeys } from '../../api/queryKeys.js';

// The new booking is the ticket page's data, and it changes every page of the user's list.
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKeys.bookings.detail(booking.bookingNumber), booking);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
    },
  });
};
