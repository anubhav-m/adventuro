import { Button } from './Button.jsx';
import { InlineError } from './InlineError.jsx';
import { Modal } from './Modal.jsx';

// The one way to ask before a destructive or irreversible action. The title names the item
// ("Delete Goa Coastal Escape?"), and the confirm button says what will happen ("Delete").
// While `loading` the dialog stays open and cannot be dismissed; `error` shows inside it.
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  error,
  onConfirm,
  onCancel,
  children,
}) {
  const close = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        <>
          <Button variant="ghost" disabled={loading} onClick={close}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-text-muted">
        {children}
        {error && <InlineError error={error} />}
      </div>
    </Modal>
  );
}
