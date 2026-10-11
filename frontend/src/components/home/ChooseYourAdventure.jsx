import { useVerticals } from '../../hooks/queries/useVerticals.js';
import { ADVENTURES_SECTION_ID } from '../../lib/constants.js';
import { TERRAIN_ORDER } from '../verticals/terrain.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { SectionHeader } from '../ui/SectionHeader.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { Terrain } from './Terrain.jsx';

const CONTENT = 'mx-auto max-w-content px-(--space-gutter)';

const skeleton = (
  <div className="grid gap-2 xl:grid-cols-5">
    {TERRAIN_ORDER.map((key) => (
      <Skeleton key={key} className="h-36 xl:h-80" />
    ))}
  </div>
);

// The terrain runs full-bleed; its heading and its loading and error states keep to the content.
export function ChooseYourAdventure() {
  const verticals = useVerticals();

  return (
    <section
      id={ADVENTURES_SECTION_ID}
      aria-labelledby="adventures-heading"
      className="scroll-mt-20 pt-(--space-section)"
    >
      <SectionHeader
        id="adventures-heading"
        title="Choose your adventure"
        lead="Five ways to travel, and one route across all of them."
        className={CONTENT}
      />
      <div className="mt-10">
        <QueryBoundary query={verticals} skeleton={skeleton} stateClassName={CONTENT}>
          {(list) => <Terrain verticals={list} />}
        </QueryBoundary>
      </div>
    </section>
  );
}
