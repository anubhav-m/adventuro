import { ArrowRight } from 'lucide-react';
import { useTaxonomies } from '../../hooks/queries/useTaxonomies.js';
import { ROUTES, TAXONOMY_TYPE } from '../../lib/constants.js';
import { GearCategoryCard } from '../gear/GearCategoryCard.jsx';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Reveal } from '../ui/Reveal.jsx';
import { SectionHeader } from '../ui/SectionHeader.jsx';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4';
// No skeleton on the home page: the grid's room is held, and the cards rise in one by one.
const room = <div className="h-152 lg:h-68" />;

export function GearCategories() {
  const categories = useTaxonomies(TAXONOMY_TYPE.CATEGORY);

  return (
    <section
      aria-labelledby="gear-heading"
      className="mx-auto max-w-content px-(--space-gutter) pt-(--space-section)"
    >
      <SectionHeader
        id="gear-heading"
        title="Gear for every terrain"
        lead="What each trip needs, sorted by what it does."
        action={
          <Button to={ROUTES.GEAR} variant="secondary" size="sm" iconRight={ArrowRight}>
            Shop all gear
          </Button>
        }
      />
      <div className="mt-10">
        <QueryBoundary
          query={categories}
          skeleton={room}
          empty={<EmptyState title="Gear categories are on their way." />}
        >
          {(list) => (
            <Reveal as="ul" stagger className={GRID}>
              {list.map((category) => (
                <li key={category.id}>
                  <GearCategoryCard category={category} />
                </li>
              ))}
            </Reveal>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}
