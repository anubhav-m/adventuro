import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { IconButton } from './IconButton.jsx';

const MAX_WITHOUT_GAPS = 5;

const PAGE =
  'size-10 items-center justify-center rounded-pill border-(length:--border-ink) text-sm font-bold tabular-nums transition-colors duration-(--duration-fast) ease-out';

// First and last page, the current page and its neighbours, and a gap where pages are skipped.
const getSlots = (page, totalPages) => {
  if (totalPages <= MAX_WITHOUT_GAPS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const middle = [page - 1, page, page + 1].filter((value) => value > 1 && value < totalPages);
  return [
    1,
    ...(middle[0] > 2 ? ['gap-before'] : []),
    ...middle,
    ...(middle.at(-1) < totalPages - 1 ? ['gap-after'] : []),
    totalPages,
  ];
};

export function Pagination({ page, totalPages, onPageChange, className }) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <IconButton
        icon={ChevronLeft}
        label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <ol className="flex items-center gap-1">
        {getSlots(page, totalPages).map((slot) => {
          if (typeof slot === 'string') {
            return (
              <li key={slot} aria-hidden="true" className="w-6 text-center text-text-subtle">
                …
              </li>
            );
          }
          const isCurrent = slot === page;
          const isNeighbour = Math.abs(slot - page) === 1 && slot !== 1 && slot !== totalPages;
          return (
            <li key={slot} className={cn(isNeighbour ? 'hidden sm:block' : 'block')}>
              <button
                type="button"
                aria-label={`Page ${slot}`}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageChange(slot)}
                className={cn(
                  PAGE,
                  'inline-flex',
                  isCurrent
                    ? 'border-text bg-text text-bg'
                    : 'border-transparent text-text hover:bg-surface-raised',
                )}
              >
                {slot}
              </button>
            </li>
          );
        })}
      </ol>
      <IconButton
        icon={ChevronRight}
        label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}
