import { useMutation } from '@tanstack/react-query';
import { downloadTicket } from '../../api/bookings.api.js';
import { saveBlob } from '../../lib/download.js';

// Fetches the ticket PDF and hands it to the browser as a file.
export const useDownloadTicket = (bookingNumber) =>
  useMutation({
    mutationFn: async () =>
      saveBlob(await downloadTicket(bookingNumber), `Adventuro-${bookingNumber}.pdf`),
  });
