import { useVertical } from '../../hooks/queries/useVertical.js';
import { GRAND_INDIA_TOUR_KEY, VERTICALS } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { GrandIndiaBanner } from './GrandIndiaBanner.jsx';

const { name: SECTION_NAME } = VERTICALS.find(({ key }) => key === GRAND_INDIA_TOUR_KEY);

// Loading and error states stay on the neutral ground; the ink field appears with the content.
// The section is named from our own list so it has a name before the content arrives.
export function GrandIndiaFeature() {
  const query = useVertical(GRAND_INDIA_TOUR_KEY);

  return (
    <section aria-label={SECTION_NAME} className="pt-(--space-section)">
      <QueryBoundary
        query={query}
        skeleton={<Skeleton className="h-96" />}
        stateClassName="mx-auto max-w-content px-(--space-gutter)"
      >
        {({ vertical, tours }) => <GrandIndiaBanner vertical={vertical} tours={tours} />}
      </QueryBoundary>
    </section>
  );
}
