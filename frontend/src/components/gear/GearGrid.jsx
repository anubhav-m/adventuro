import { cn } from '../../lib/cn.js';
import { Skeleton } from '../ui/Skeleton.jsx';
import { GearCard } from './GearCard.jsx';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';

// The gear cards, or with `loading` that many placeholder cards in the same grid. `stale` dims
// a list that is being replaced by the one a changed filter asked for.
export function GearGrid({ gear, loading, stale = false }) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: loading }, (_, index) => (
          <Skeleton key={index} className="aspect-3/5" />
        ))}
      </div>
    );
  }

  return (
    <ul
      aria-busy={stale || undefined}
      className={cn(
        GRID,
        'transition-opacity duration-(--duration-base) ease-out',
        stale && 'opacity-45',
      )}
    >
      {gear.map((item) => (
        <li key={item.id}>
          <GearCard gear={item} />
        </li>
      ))}
    </ul>
  );
}
