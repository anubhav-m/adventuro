import { useParams } from 'react-router';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { TourDetail } from '../components/tours/TourDetail.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useTour } from '../hooks/queries/useTour.js';
import { NotFoundPage } from './NotFoundPage.jsx';

// No such tour, or a slug the API will not even look up.
const isMissing = (error) => error?.status === 404 || error?.code === 'VALIDATION_ERROR';

export function TourPage() {
  const { slug } = useParams();
  const tour = useTour(slug);

  if (isMissing(tour.error)) return <NotFoundPage />;

  return (
    <QueryBoundary
      query={tour}
      skeleton={<Skeleton className="h-96" />}
      stateClassName="mx-auto max-w-content px-(--space-gutter) pt-12"
    >
      {(data) => <TourDetail key={data.id} tour={data} />}
    </QueryBoundary>
  );
}
