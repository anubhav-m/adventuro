import { ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router';
import { BookingActions } from '../components/bookings/BookingActions.jsx';
import { BookingDetails } from '../components/bookings/BookingDetails.jsx';
import { DocumentLoader } from '../components/layout/DocumentLoader.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useBooking } from '../hooks/queries/useBookings.js';
import { ROUTES } from '../lib/constants.js';

export function BookingDetailPage() {
  const { bookingNumber } = useParams();
  const booking = useBooking(bookingNumber);

  return (
    <DocumentLoader query={booking} title={bookingNumber}>
      {(data) => (
        <>
          <PageHeader
            title={data.bookingNumber}
            description={`${data.snapshot.tourTitle} · ${data.contact.name}`}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" icon={ArrowLeft} to={ROUTES.BOOKINGS}>
                  All bookings
                </Button>
                <BookingActions booking={data} />
              </div>
            }
          />
          <BookingDetails booking={data} />
        </>
      )}
    </DocumentLoader>
  );
}
