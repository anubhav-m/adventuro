import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusable = (panel) => [...panel.querySelectorAll(FOCUSABLE)];

// A dialog on desktop and a bottom sheet on phones. Traps focus while open, closes on Escape
// or a click on the overlay, and hands focus back to whatever opened it.
export function Modal({ open, onClose, title, footer, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const panel = panelRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    (getFocusable(panel)[0] ?? panel).focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusable(panelRef.current);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-overlay sm:items-center sm:p-6"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex max-h-[90dvh] w-full animate-rise-in flex-col rounded-t-panel bg-surface-raised shadow-overlay sm:max-w-140 sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3">
          <h2 id={titleId} className="pt-2 text-h3 leading-tight font-extrabold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2" />
        </header>
        <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        {footer && (
          <footer className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
