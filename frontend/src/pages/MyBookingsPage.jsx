import { ArrowRight, Ticket } from 'lucide-react';
import { BookingList } from '../components/booking/BookingList.jsx';
import { BookingListSkeleton } from '../components/booking/BookingListSkeleton.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { useMyBookings } from '../hooks/queries/useMyBookings.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { BRAND, ROUTES } from '../lib/constants.js';

const PAGE_SIZE = 10;
const FILTER_DEFAULTS = Object.freeze({ page: '1' });

// Rendered inside RequireAuth and RequireCompleteProfile. The page number lives in the URL.
export function MyBookingsPage() {
  const { filters, setFilters } = useUrlFilters(FILTER_DEFAULTS);
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const bookings = useMyBookings({ page, limit: PAGE_SIZE });

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-(--space-gutter) pt-12">
      <title>{`My bookings · ${BRAND.NAME}`}</title>
      <header className="flex flex-col gap-3">
        <h1 className="type-display text-h1">My bookings</h1>
        <p className="type-lead text-text-muted">Every trip you have booked, newest first.</p>
      </header>
      <QueryBoundary
        query={bookings}
        isEmpty={(data) => data.bookings.length === 0}
        skeleton={<BookingListSkeleton />}
        empty={
          <EmptyState
            icon={Ticket}
            title="No trips booked yet."
            description="Pick a kind of trip and your first booking will show up here, with its ticket."
            action={
              <Button to={ROUTES.ADVENTURES} iconRight={ArrowRight}>
                Explore trips
              </Button>
            }
          />
        }
      >
        {(data) => (
          <>
            <BookingList bookings={data.bookings} stale={bookings.isPlaceholderData} />
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(next) => setFilters({ page: next })}
            />
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
