import { useVerticals } from '../../hooks/queries/useVerticals.js';
import { ADVENTURES_SECTION_ID } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { SectionHeader } from '../ui/SectionHeader.jsx';
import { Terrain } from './Terrain.jsx';

const CONTENT = 'mx-auto max-w-content px-(--space-gutter)';

// The home page shows no skeletons: a section holds its room while it loads, and its content
// rises in, piece after piece, when it arrives.
const room = <div className="h-256 xl:h-120" />;

// The terrain runs full-bleed; its heading and its loading and error states keep to the content.
// A link to the section lands on its heading, just under the navbar, not on the space above it:
// that leaves room for the whole terrain on one screen.
export function ChooseYourAdventure() {
  const verticals = useVerticals();

  return (
    <section
      id={ADVENTURES_SECTION_ID}
      aria-labelledby="adventures-heading"
      className="scroll-mt-[calc(6.5rem-var(--space-section))] pt-(--space-section)"
    >
      <SectionHeader
        id="adventures-heading"
        title="Choose your adventure"
        lead="Five ways to travel, and one route across all of them."
        className={CONTENT}
      />
      <div className="mt-10">
        <QueryBoundary query={verticals} skeleton={room} stateClassName={CONTENT}>
          {(list) => <Terrain verticals={list} />}
        </QueryBoundary>
      </div>
    </section>
  );
}
