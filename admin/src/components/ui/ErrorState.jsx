import { CircleAlert, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Button } from './Button.jsx';

// Takes the error itself, never a message: the text always comes from lib/errors.js.
export function ErrorState({ error, onRetry, className }) {
  return (
    <div role="alert" className={cn('flex max-w-prose flex-col items-start gap-3 py-8', className)}>
      <CircleAlert size={32} strokeWidth={1.75} aria-hidden="true" className="text-danger" />
      <p className="text-body font-medium">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => onRetry()}>
          Try again
        </Button>
      )}
    </div>
  );
}
