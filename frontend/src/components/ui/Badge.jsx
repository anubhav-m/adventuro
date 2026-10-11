import { cn } from '../../lib/cn.js';

const TONES = {
  neutral: 'border border-border bg-surface-raised text-text',
  // For a badge laid over a photo: a solid plate, never a translucent one.
  solid: 'bg-bg text-text',
  // For a badge on a vertical's field: it takes the field's own text colour.
  outline: 'border border-current',
  accent: 'bg-accent-tint text-accent-text',
  info: 'bg-info-tint text-info',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
};

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-pill px-2.5 text-xs font-bold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </span>
  );
}
