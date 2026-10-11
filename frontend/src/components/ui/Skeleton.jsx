import { cn } from '../../lib/cn.js';

// A flat placeholder block. Size it with classes: <Skeleton className="h-6 w-40" />
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('rounded-plate bg-surface-raised', className)} />;
}
