import { toast } from 'sonner';
import { useDeleteTour, useUpdateTour } from '../../hooks/mutations/useTourMutations.js';
import { ERROR_SUBJECT, getErrorMessage } from '../../lib/errors.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

// Asks before deleting `tour`. A tour with bookings cannot be deleted (RESOURCE_IN_USE): the
// dialog then offers to unpublish it instead, which hides it and keeps its bookings.
// Mount it only while it is open, so each opening starts afresh.
export function TourDeleteDialog({ tour, onClose }) {
  const deleteTour = useDeleteTour();
  const unpublish = useUpdateTour();
  const hasBookings = deleteTour.error?.code === 'RESOURCE_IN_USE';

  const confirmDelete = () =>
    deleteTour.mutate(tour.id, {
      onSuccess: () => {
        toast.success(`${tour.title} deleted.`);
        onClose();
      },
    });

  const confirmUnpublish = () =>
    unpublish.mutate(
      { id: tour.id, changes: { isPublished: false } },
      {
        onSuccess: () => {
          toast.success(`${tour.title} is now a draft. Its bookings are kept.`);
          onClose();
        },
      },
    );

  if (!hasBookings) {
    return (
      <ConfirmDialog
        open
        title={`Delete ${tour.title}?`}
        confirmLabel="Delete"
        loading={deleteTour.isPending}
        error={deleteTour.error}
        onConfirm={confirmDelete}
        onCancel={onClose}
      >
        <p>The tour and its images are removed for good. Gear linked to it stays in the store.</p>
      </ConfirmDialog>
    );
  }

  if (!tour.isPublished) {
    return (
      <ConfirmDialog
        open
        title={`${tour.title} can’t be deleted`}
        tone="primary"
        confirmLabel="OK"
        onConfirm={onClose}
        onCancel={onClose}
      >
        <p>{getErrorMessage(deleteTour.error, { subject: ERROR_SUBJECT.TOUR })}</p>
        <p>It is already a draft, so customers can’t see it.</p>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      open
      title={`Unpublish ${tour.title} instead?`}
      tone="primary"
      confirmLabel="Unpublish instead"
      loading={unpublish.isPending}
      error={unpublish.error}
      onConfirm={confirmUnpublish}
      onCancel={onClose}
    >
      <p>{getErrorMessage(deleteTour.error, { subject: ERROR_SUBJECT.TOUR })}</p>
      <p>Unpublishing hides it from customers. Its bookings and tickets stay as they are.</p>
    </ConfirmDialog>
  );
}
