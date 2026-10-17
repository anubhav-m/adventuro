import { CircleAlert } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { getErrorMessage } from '../../lib/errors.js';

// A one-line error beside the action that failed. Takes the error itself, never a message;
// `subject` picks a code's wording for one kind of item (see lib/errors.js).
export function InlineError({ error, subject, className }) {
  return (
    <p role="alert" className={cn('flex items-start gap-1.5 text-sm font-medium', className)}>
      <CircleAlert
        size={18}
        strokeWidth={1.75}
        aria-hidden="true"
        className="mt-px shrink-0 text-danger"
      />
      <span className="text-danger">{getErrorMessage(error, { subject })}</span>
    </p>
  );
}
