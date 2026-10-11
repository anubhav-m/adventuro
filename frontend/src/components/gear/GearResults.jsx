import { SearchX } from 'lucide-react';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Pagination } from '../ui/Pagination.jsx';
import { GearGrid } from './GearGrid.jsx';

const countLabel = (total) => `${total} ${total === 1 ? 'item' : 'items'}`;

// The store's list for the current filters: a count, the grid and its pages.
export function GearResults({ query, pageSize, onPageChange, onClear }) {
  return (
    <section aria-label="Gear" className="flex flex-col gap-6">
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.gear.length === 0}
        skeleton={<GearGrid loading={pageSize} />}
        empty={
          <EmptyState
            icon={SearchX}
            title="No gear matches these filters."
            description="Try a different search, or clear the filters to see everything."
            action={
              <Button variant="secondary" size="sm" onClick={onClear}>
                Clear filters
              </Button>
            }
          />
        }
      >
        {({ gear, meta }) => (
          <>
            <p role="status" className="text-sm font-bold text-text-muted tabular-nums">
              {countLabel(meta.total)}
            </p>
            <GearGrid gear={gear} stale={query.isPlaceholderData} />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={onPageChange}
              className="mt-4"
            />
          </>
        )}
      </QueryBoundary>
    </section>
  );
}
