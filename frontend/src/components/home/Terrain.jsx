import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useReveal } from '../../hooks/useReveal.js';
import { GRAND_INDIA_TOUR_KEY, ROUTES } from '../../lib/constants.js';
import { TERRAIN_ORDER } from '../verticals/terrain.js';
import { VerticalCard } from '../verticals/VerticalCard.jsx';
import { RouteLine } from './RouteLine.jsx';

// The terrain sheet: five vertical bands side by side from 1280px, stacked rows below that,
// with Grand India Tour as the route across them. Each time it scrolls onto the screen the
// bands rise into place one after another and the route draws itself across them.
export function Terrain({ verticals }) {
  const [bandsRef, revealed] = useReveal();

  const byKey = new Map(verticals.map((vertical) => [vertical.key, vertical]));
  const bands = TERRAIN_ORDER.map((key) => byKey.get(key)).filter(Boolean);
  const grand = byKey.get(GRAND_INDIA_TOUR_KEY);

  return (
    <div className="relative xl:mt-6">
      {grand && (
        <>
          <Link
            to={ROUTES.vertical(grand.key)}
            data-vertical={grand.key}
            className="group flex min-h-16 items-center justify-between gap-3 bg-accent px-(--space-gutter) text-sm font-extrabold text-on-accent xl:absolute xl:top-6 xl:left-(--space-gutter) xl:z-10 xl:min-h-11 xl:rounded-pill xl:border-(length:--border-ink) xl:border-text xl:px-5 dark:xl:border-accent"
          >
            {grand.name}, one route through all five
            <ArrowRight
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:translate-x-1"
            />
          </Link>
          {/* Keyed by its state, so the line starts over and draws itself on every reveal. */}
          <RouteLine
            key={revealed ? 'drawn' : 'waiting'}
            verticalKey={grand.key}
            drawn={revealed}
            className="max-xl:hidden"
          />
        </>
      )}
      <ul
        ref={bandsRef}
        data-reveal="stagger"
        data-revealed={revealed || undefined}
        className="grid xl:grid-cols-5 xl:items-end"
      >
        {bands.map((vertical, index) => (
          <li key={vertical.key}>
            <VerticalCard vertical={vertical} groundKey={(bands[index - 1] ?? grand)?.key} />
          </li>
        ))}
      </ul>
    </div>
  );
}
