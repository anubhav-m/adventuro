import { toast } from 'sonner';
import { useDeleteGear } from '../../hooks/mutations/useGearMutations.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

// Asks before deleting `gear`. Mount it only while it is open, so each opening starts afresh.
export function GearDeleteDialog({ gear, onClose }) {
  const deleteGear = useDeleteGear();

  return (
    <ConfirmDialog
      open
      title={`Delete ${gear.name}?`}
      confirmLabel="Delete"
      loading={deleteGear.isPending}
      error={deleteGear.error}
      onConfirm={() =>
        deleteGear.mutate(gear.id, {
          onSuccess: () => {
            toast.success(`${gear.name} deleted.`);
            onClose();
          },
        })
      }
      onCancel={onClose}
    >
      <p>The item, its images and its click history are removed for good.</p>
    </ConfirmDialog>
  );
}
