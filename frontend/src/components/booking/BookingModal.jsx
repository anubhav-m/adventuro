import { useSearchParams } from 'react-router';
import { useTour } from '../../hooks/queries/useTour.js';
import { BOOKING_PARAMS } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { BookingForm } from './BookingForm.jsx';

// The form for the tour named in the URL, once the tour has loaded.
function BookingContent({ slug, tierId }) {
  const tour = useTour(slug);
  return (
    <QueryBoundary query={tour} skeleton={<Skeleton className="h-80" />}>
      {(data) => <BookingForm key={data.id} tour={data} tierId={tierId} />}
    </QueryBoundary>
  );
}

// Lives in the page layout and opens over any page whose URL has `?book=<tour slug>`, which is
// what every Book link adds. Closing takes the booking params back out of the URL.
export function BookingModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get(BOOKING_PARAMS.TOUR);

  const close = () => {
    const next = new URLSearchParams(searchParams);
    for (const param of Object.values(BOOKING_PARAMS)) next.delete(param);
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  return (
    <Modal open={Boolean(slug)} onClose={close} title="Book this trip">
      <BookingContent slug={slug} tierId={searchParams.get(BOOKING_PARAMS.TIER)} />
    </Modal>
  );
}
