import { cn } from '../../lib/cn.js';
import { Skeleton } from '../ui/Skeleton.jsx';

const GROUPS = ['category', 'climate'];
const CHIP_WIDTHS = ['w-32', 'w-28', 'w-24', 'w-20', 'w-24', 'w-28'];

// The filter chips while the lists behind them load: a label and a row of pills per group.
export function GearFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-wrap gap-2">
            {CHIP_WIDTHS.map((width, index) => (
              <Skeleton key={index} pill className={cn('h-9', width)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
