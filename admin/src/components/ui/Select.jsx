import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Select({ options, placeholder, className, ...rest }) {
  return (
    <span className={cn('relative block', className)}>
      <select
        className="h-10 w-full appearance-none rounded-field border border-border-strong bg-surface-raised pr-9 pl-3 text-sm text-text focus:border-text aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-45"
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </span>
  );
}
