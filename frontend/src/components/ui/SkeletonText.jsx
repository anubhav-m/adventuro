import { cn } from '../../lib/cn.js';
import { Skeleton } from './Skeleton.jsx';

const WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'];

// Lines of copy that are still loading, under a `heading` bar when asked for.
export function SkeletonText({ lines = 3, heading = false, className }) {
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {heading && <Skeleton className="mb-2 h-8 w-48" />}
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', WIDTHS[index % WIDTHS.length])} />
      ))}
    </div>
  );
}
