import { cn } from '../../lib/cn.js';

export function Textarea({ rows = 4, className, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full rounded-field border border-border-strong bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-text aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...rest}
    />
  );
}
