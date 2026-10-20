import { CircleCheck, CircleX, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDownloadTicket } from '../../hooks/mutations/useBookingMutations.js';
import { BOOKING_STATUS_ACTIONS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Button } from '../ui/Button.jsx';
import { BookingStatusDialog } from './BookingStatusDialog.jsx';

const STATUS_BUTTONS = {
  completed: { label: 'Mark completed', icon: CircleCheck, variant: 'secondary' },
  cancelled: { label: 'Cancel booking', icon: CircleX, variant: 'danger' },
};

// The booking page's actions: the ticket, and the status changes its status allows (only a
// confirmed booking has any). Each change asks first.
export function BookingActions({ booking }) {
  const [changingTo, setChangingTo] = useState(null);
  const ticket = useDownloadTicket(booking.bookingNumber);

  const download = () =>
    ticket.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) });

  return (
    <div className="flex flex-wrap gap-2">
      {BOOKING_STATUS_ACTIONS[booking.status].map((status) => {
        const { label, ...button } = STATUS_BUTTONS[status];
        return (
          <Button key={status} {...button} onClick={() => setChangingTo(status)}>
            {label}
          </Button>
        );
      })}
      <Button icon={Download} loading={ticket.isPending} onClick={download}>
        Download ticket PDF
      </Button>
      {changingTo && (
        <BookingStatusDialog
          booking={booking}
          status={changingTo}
          onClose={() => setChangingTo(null)}
        />
      )}
    </div>
  );
}
