import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { IconButton } from './IconButton.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusable = (panel) => [...panel.querySelectorAll(FOCUSABLE)];

// Where the panel sits: `center` is a dialog on desktop and a bottom sheet on phones; `left` is
// a drawer the height of the screen, for the navigation on narrow screens.
const PLACEMENTS = {
  center: {
    overlay: 'items-end justify-center sm:items-center sm:p-6',
    panel: 'max-h-[90dvh] animate-rise-in rounded-t-panel sm:max-w-140 sm:rounded-panel',
  },
  left: {
    overlay: 'justify-start',
    panel: 'h-full max-w-72 animate-slide-in border-r border-border',
  },
};

// Traps focus while open, closes on Escape or a click on the overlay, and hands focus back to
// whatever opened it.
export function Modal({ open, onClose, title, footer, placement = 'center', children }) {
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
      className={cn(
        'fixed inset-0 z-50 flex animate-fade-in bg-overlay',
        PLACEMENTS[placement].overlay,
      )}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full flex-col bg-surface-raised shadow-overlay',
          PLACEMENTS[placement].panel,
        )}
      >
        <header className="flex items-start justify-between gap-4 p-5 pb-3">
          <h2 id={titleId} className="pt-1.5 text-h4 leading-tight font-extrabold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2" />
        </header>
        <div className="overflow-y-auto px-5 pb-5 text-sm">{children}</div>
        {footer && (
          <footer className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
