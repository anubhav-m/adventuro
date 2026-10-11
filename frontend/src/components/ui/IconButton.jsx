import { cn } from '../../lib/cn.js';

const BASE =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-pill border-(length:--border-ink) text-text transition-colors duration-(--duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-45';

const VARIANTS = {
  ghost: 'border-transparent not-disabled:hover:bg-surface-raised',
  outline: 'border-text not-disabled:hover:bg-text not-disabled:hover:text-bg',
};

// `label` is required: it is the button's only accessible name.
export function IconButton({ icon: Icon, label, variant = 'ghost', className, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(BASE, VARIANTS[variant], className)}
      {...rest}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
