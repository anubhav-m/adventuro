import { useParams } from 'react-router';
import { BandSkeleton } from '../components/layout/BandSkeleton.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { TourDetail } from '../components/tours/TourDetail.jsx';
import { TourHero } from '../components/tours/TourHero.jsx';
import { SkeletonText } from '../components/ui/SkeletonText.jsx';
import { useTour } from '../hooks/queries/useTour.js';
import { useTourPreview } from '../hooks/queries/useTourPreview.js';
import { BRAND } from '../lib/constants.js';
import { NotFoundPage } from './NotFoundPage.jsx';

// No such tour, or a slug the API will not even look up.
const isMissing = (error) => error?.status === 404 || error?.code === 'VALIDATION_ERROR';

// The hero does not wait for the tour when the visitor comes from a listing: it opens from the
// card they pressed, and the rest of the page follows under it.
export function TourPage() {
  const { slug } = useParams();
  const tour = useTour(slug);
  const preview = useTourPreview(slug);

  if (isMissing(tour.error)) return <NotFoundPage />;

  const shown = tour.data ?? preview;

  return (
    <article data-vertical={shown?.vertical.key}>
      {shown && (
        <>
          <title>{`${shown.title} · ${BRAND.NAME}`}</title>
          <TourHero tour={shown} />
        </>
      )}
      <QueryBoundary
        query={tour}
        skeleton={
          <>
            {!shown && <BandSkeleton />}
            <SkeletonText heading lines={4} className="max-w-prose" />
          </>
        }
        stateClassName="mx-auto max-w-content px-(--space-gutter) pt-12"
      >
        {(data) => <TourDetail key={data.id} tour={data} />}
      </QueryBoundary>
    </article>
  );
}
