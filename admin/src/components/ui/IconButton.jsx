import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';

const BASE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-pill border-(length:--border-ink) text-text transition-[color,background-color,border-color,scale] duration-(--duration-fast) ease-out motion-safe:active:scale-90 disabled:cursor-not-allowed disabled:opacity-45';

const VARIANTS = {
  ghost: 'border-transparent not-disabled:hover:bg-surface-raised',
  outline: 'border-text not-disabled:hover:bg-text not-disabled:hover:text-bg',
  danger: 'border-transparent text-danger not-disabled:hover:bg-danger-tint',
};

// `label` is required: it is the control's only accessible name. It is a router link with `to`
// and a button otherwise.
export function IconButton({ icon: Icon, label, variant = 'ghost', to, className, ...rest }) {
  const classes = cn(BASE, VARIANTS[variant], className);
  const icon = <Icon size={18} strokeWidth={1.75} aria-hidden="true" />;

  if (to !== undefined) {
    return (
      <Link to={to} aria-label={label} className={classes} {...rest}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} className={classes} {...rest}>
      {icon}
    </button>
  );
}
