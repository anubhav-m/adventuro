import { cn } from '../../lib/cn.js';

const BASE =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-pill border-(length:--border-ink) text-text transition-[color,background-color,border-color,scale] duration-(--duration-fast) ease-out motion-safe:active:scale-90 disabled:cursor-not-allowed disabled:opacity-45';

const VARIANTS = {
  ghost: 'border-transparent not-disabled:hover:bg-surface-raised',
  outline: 'border-text not-disabled:hover:bg-text not-disabled:hover:text-bg',
};

// `label` is required: it is the button's only accessible name. `children` replaces the icon,
// for a button that shows something else in the same round target (an avatar).
export function IconButton({ icon: Icon, label, variant = 'ghost', className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(BASE, VARIANTS[variant], className)}
      {...rest}
    >
      {children ?? <Icon size={20} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}
