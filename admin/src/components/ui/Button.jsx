import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { Spinner } from './Spinner.jsx';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border-(length:--border-ink) font-extrabold whitespace-nowrap transition-[color,background-color,border-color,scale] duration-(--duration-fast) ease-out motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45';

const VARIANTS = {
  primary:
    'border-primary bg-primary text-on-primary not-disabled:hover:border-primary-hover not-disabled:hover:bg-primary-hover',
  secondary:
    'border-text bg-transparent text-text not-disabled:hover:bg-text not-disabled:hover:text-bg',
  ghost: 'border-transparent bg-transparent text-text not-disabled:hover:bg-surface-raised',
  danger: 'border-danger bg-transparent text-danger not-disabled:hover:bg-danger-tint',
};

const SIZES = {
  md: 'h-10 px-5 text-sm',
  sm: 'h-9 px-4 text-sm',
};

const ICON_SIZE = 16;

// Renders a router link with `to`, an anchor with `href`, and a button otherwise.
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  type = 'button',
  to,
  href,
  className,
  children,
  ...rest
}) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);
  const content = (
    <>
      {loading && <Spinner size={ICON_SIZE} />}
      {!loading && Icon && <Icon size={ICON_SIZE} strokeWidth={1.75} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight size={ICON_SIZE} strokeWidth={1.75} aria-hidden="true" />}
    </>
  );

  if (to !== undefined) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
