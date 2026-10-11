import { cn } from '../../lib/cn.js';

// One piece of a loading view, in the shape of what it stands for: a line, a photo, a pill.
// It pulses quietly. Size it with classes: <Skeleton className="h-6 w-40" />. `pill` rounds it
// like a button or a chip.
export function Skeleton({ pill = false, className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-surface-raised',
        pill ? 'rounded-pill' : 'rounded-plate',
        className,
      )}
    />
  );
}
