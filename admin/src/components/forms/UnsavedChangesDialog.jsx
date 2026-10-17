import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

// Asks before leaving a form with changes that are not saved. `blocker` comes from
// useUnsavedChanges.
export function UnsavedChangesDialog({ blocker }) {
  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      confirmLabel="Leave"
      cancelLabel="Keep editing"
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    >
      <p>The changes you made on this page will be lost.</p>
    </ConfirmDialog>
  );
}
