import { Compass } from 'lucide-react';
import { useParams } from 'react-router';
import { SuggestedGear } from '../components/gear/SuggestedGear.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { TourGrid } from '../components/tours/TourGrid.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SectionHeader } from '../components/ui/SectionHeader.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { VerticalHero } from '../components/verticals/VerticalHero.jsx';
import { useVertical } from '../hooks/queries/useVertical.js';
import { BRAND, getVerticalMeta } from '../lib/constants.js';
import { NotFoundPage } from './NotFoundPage.jsx';

const CONTENT = 'mx-auto max-w-content px-(--space-gutter)';

// The verticals are a fixed set, so a key outside it is a missing page and nothing is fetched.
export function VerticalPage() {
  const { verticalKey } = useParams();
  const known = Boolean(getVerticalMeta(verticalKey));
  const query = useVertical(verticalKey, { enabled: known });

  if (!known) return <NotFoundPage />;

  return (
    <div data-vertical={verticalKey}>
      <QueryBoundary
        query={query}
        skeleton={<Skeleton className="h-96" />}
        stateClassName={`${CONTENT} pt-12`}
      >
        {({ vertical, tours }) => (
          <>
            <title>{`${vertical.name} · ${BRAND.NAME}`}</title>
            <VerticalHero vertical={vertical} />
            <section aria-labelledby="expeditions" className={`${CONTENT} pt-12`}>
              <SectionHeader
                id="expeditions"
                title="Curated expeditions"
                lead="Each one is built around a single thing worth the trip."
              />
              <div className="mt-10">
                {tours.length > 0 ? (
                  <TourGrid tours={tours} verticalKey={verticalKey} />
                ) : (
                  <EmptyState
                    icon={Compass}
                    title="New expeditions are being planned."
                    description="There are no trips here just yet. Check back soon."
                  />
                )}
              </div>
            </section>
            <SuggestedGear
              title="Suggested gear"
              lead={`What ${vertical.name} trips call for.`}
              scope={{ vertical: verticalKey }}
              withCategories
            />
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
