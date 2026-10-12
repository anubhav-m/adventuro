import { CircleAlert } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../lib/cn.js';

// Labels one control and wires its error or hint to it:
// <Field label="Phone" error={message}>{(control) => <Input {...control} />}</Field>
export function Field({ label, error, hint, hideLabel = false, className, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = (error && errorId) || (hint && hintId) || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-bold', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium">
          <CircleAlert
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="mt-px shrink-0 text-danger"
          />
          <span className="text-danger">{error}</span>
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs font-medium text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
