import { cn } from '../../lib/cn.js';

export function Input({ type = 'text', className, ...rest }) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full rounded-field border border-border-strong bg-surface-raised px-3 text-sm text-text placeholder:text-text-subtle focus:border-text aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...rest}
    />
  );
}
