import { ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router';
import { Ticket } from '../components/booking/Ticket.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useBooking } from '../hooks/queries/useBooking.js';
import { BRAND, ROUTES } from '../lib/constants.js';
import { NotFoundPage } from './NotFoundPage.jsx';

// No such booking for this user, or a number the API will not even look up.
const isMissing = (error) => error?.status === 404 || error?.code === 'VALIDATION_ERROR';

// Rendered inside RequireAuth.
export function TicketPage() {
  const { bookingNumber } = useParams();
  const booking = useBooking(bookingNumber);

  if (isMissing(booking.error)) return <NotFoundPage />;

  return (
    <div className="mx-auto flex max-w-content flex-col items-start gap-6 px-(--space-gutter) pt-12">
      <title>{`Ticket ${bookingNumber} · ${BRAND.NAME}`}</title>
      <Button to={ROUTES.MY_BOOKINGS} variant="ghost" size="sm" icon={ArrowLeft} className="-ml-5">
        My bookings
      </Button>
      <div className="w-full">
        <QueryBoundary query={booking} skeleton={<Skeleton className="h-96" />}>
          {(data) => <Ticket booking={data} />}
        </QueryBoundary>
      </div>
    </div>
  );
}
