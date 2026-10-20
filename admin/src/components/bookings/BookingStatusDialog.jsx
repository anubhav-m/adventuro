import { toast } from 'sonner';
import { useUpdateBookingStatus } from '../../hooks/mutations/useBookingMutations.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

// What each change says before it is made and once it is done.
const CHANGES = {
  completed: {
    title: (number) => `Mark ${number} completed?`,
    confirmLabel: 'Mark completed',
    tone: 'primary',
    body: 'Do this once the trip has taken place. A completed booking can’t be changed again.',
    done: (number) => `${number} is marked completed.`,
  },
  cancelled: {
    title: (number) => `Cancel ${number}?`,
    confirmLabel: 'Cancel booking',
    tone: 'danger',
    body: 'The customer’s ticket will show it as cancelled. A cancelled booking can’t be changed again.',
    done: (number) => `${number} is cancelled.`,
  },
};

// Asks before moving `booking` to `status` ('completed' or 'cancelled'). A refused change
// (INVALID_STATUS_TRANSITION, say) shows inside the dialog in our words.
// Mount it only while it is open, so each opening starts afresh.
export function BookingStatusDialog({ booking, status, onClose }) {
  const updateStatus = useUpdateBookingStatus();
  const change = CHANGES[status];
  const number = booking.bookingNumber;

  const confirm = () =>
    updateStatus.mutate(
      { bookingNumber: number, status },
      {
        onSuccess: () => {
          toast.success(change.done(number));
          onClose();
        },
      },
    );

  return (
    <ConfirmDialog
      open
      title={change.title(number)}
      confirmLabel={change.confirmLabel}
      cancelLabel="Keep as it is"
      tone={change.tone}
      loading={updateStatus.isPending}
      error={updateStatus.error}
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p>
        {booking.contact.name} · {booking.snapshot.tourTitle}
      </p>
      <p>{change.body}</p>
    </ConfirmDialog>
  );
}
