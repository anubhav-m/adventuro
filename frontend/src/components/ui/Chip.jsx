import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';

const BASE =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-bold whitespace-nowrap transition-colors duration-(--duration-base) ease-out';

const UNSELECTED = 'border-border-strong text-text hover:border-text';

// Inside a `data-vertical` region a selected chip takes that vertical's ink; elsewhere it inverts.
// On the light sheet the ink chip keeps a dark edge (DESIGN.md, the Light Field Rule).
const SELECTED =
  'border-text bg-text text-bg in-data-vertical:bg-accent in-data-vertical:text-on-accent dark:in-data-vertical:border-accent';

// A link with `to`, a toggle button with `onClick`, and plain text otherwise.
export function Chip({ selected = false, icon: Icon, to, onClick, className, children, ...rest }) {
  const classes = cn(BASE, selected ? SELECTED : UNSELECTED, className);
  const content = (
    <>
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </>
  );

  if (to !== undefined) {
    return (
      <Link to={to} className={classes} aria-current={selected ? 'true' : undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={classes} aria-pressed={selected} onClick={onClick} {...rest}>
        {content}
      </button>
    );
  }
  return (
    <span className={classes} {...rest}>
      {content}
    </span>
  );
}
