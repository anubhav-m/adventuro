import { Toaster } from 'sonner';
import { useTheme } from '../../hooks/useTheme.js';

const TOAST_CLASS_NAMES = {
  toast:
    'flex w-full items-center gap-3 rounded-panel border border-border bg-surface-raised p-4 font-body text-sm font-semibold text-text shadow-raised',
  success: '[&_[data-icon]]:text-success',
  error: '[&_[data-icon]]:text-danger',
};

export function AppToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-center"
      toastOptions={{ unstyled: true, classNames: TOAST_CLASS_NAMES }}
    />
  );
}
