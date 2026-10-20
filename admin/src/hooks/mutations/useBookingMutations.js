import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadTicket, updateBookingStatus } from '../../api/bookings.api.js';
import { queryKeys } from '../../api/queryKeys.js';
import { saveBlob } from '../../lib/download.js';

// The changed booking goes straight into its detail query. Every view that lists bookings is
// read again: the bookings lists, a user's bookings and the dashboard's counts and values.
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingNumber, status }) => updateBookingStatus(bookingNumber, status),
    onSuccess: (booking) => {
      queryClient.setQueryData(queryKeys.bookings.detail(booking.bookingNumber), booking);
      return Promise.all(
        [[...queryKeys.bookings.all, 'list'], queryKeys.users.all, queryKeys.dashboard.all].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
};

// Fetches the ticket PDF and hands it to the browser as a file.
export const useDownloadTicket = (bookingNumber) =>
  useMutation({
    mutationFn: async () =>
      saveBlob(await downloadTicket(bookingNumber), `Adventuro-${bookingNumber}.pdf`),
  });
