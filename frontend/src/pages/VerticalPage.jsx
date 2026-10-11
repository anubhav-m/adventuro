import { Compass } from 'lucide-react';
import { useParams } from 'react-router';
import { SuggestedGear } from '../components/gear/SuggestedGear.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { TourGrid } from '../components/tours/TourGrid.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SectionHeader } from '../components/ui/SectionHeader.jsx';
import { VerticalHero } from '../components/verticals/VerticalHero.jsx';
import { useVertical } from '../hooks/queries/useVertical.js';
import { useVerticals } from '../hooks/queries/useVerticals.js';
import { BRAND, getVerticalMeta } from '../lib/constants.js';
import { NotFoundPage } from './NotFoundPage.jsx';

const SKELETON_COUNT = 3;

// The verticals are a fixed set, so a key outside it is a missing page and nothing is fetched.
// The hero never waits: it is the vertical's field with its name from our own list at once,
// filled in from the verticals the home page already loaded, then from the vertical itself.
export function VerticalPage() {
  const { verticalKey } = useParams();
  const meta = getVerticalMeta(verticalKey);
  const known = Boolean(meta);
  const query = useVertical(verticalKey, { enabled: known });
  const listed = useVerticals({ enabled: false }).data?.find(({ key }) => key === verticalKey);

  if (!known) return <NotFoundPage />;

  const vertical = query.data?.vertical ?? listed ?? meta;

  return (
    <div data-vertical={verticalKey}>
      <title>{`${vertical.name} · ${BRAND.NAME}`}</title>
      <VerticalHero vertical={vertical} />
      <section
        aria-labelledby="expeditions"
        className="mx-auto max-w-content px-(--space-gutter) pt-12"
      >
        <SectionHeader
          id="expeditions"
          title="Curated expeditions"
          lead="Each one is built around a single thing worth the trip."
        />
        <div className="mt-10">
          <QueryBoundary
            query={query}
            isEmpty={({ tours }) => tours.length === 0}
            skeleton={<TourGrid loading={SKELETON_COUNT} />}
            empty={
              <EmptyState
                icon={Compass}
                title="New expeditions are being planned."
                description="There are no trips here just yet. Check back soon."
              />
            }
          >
            {({ tours }) => <TourGrid tours={tours} verticalKey={verticalKey} />}
          </QueryBoundary>
        </div>
      </section>
      {query.isSuccess && (
        <SuggestedGear
          title="Suggested gear"
          lead={`What ${vertical.name} trips call for.`}
          scope={{ vertical: verticalKey }}
          withCategories
        />
      )}
    </div>
  );
}
