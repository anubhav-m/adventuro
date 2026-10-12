import { cn } from '../../lib/cn.js';
import { VERTICAL_INKS } from '../../lib/constants.js';

// How a vertical shows in the admin app: a small square of its ink beside its name.
// On the light sheet the square keeps a dark edge (DESIGN.md, the Light Field Rule).
export function VerticalChip({ vertical, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 border border-text dark:border-transparent"
        style={{ backgroundColor: VERTICAL_INKS[vertical.key] }}
      />
      {vertical.name}
    </span>
  );
}
