import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { GRAND_INDIA_TOUR_KEY, ROUTES } from '../../lib/constants.js';
import { TERRAIN_ORDER } from '../verticals/terrain.js';
import { VerticalCard } from '../verticals/VerticalCard.jsx';
import { RouteLine } from './RouteLine.jsx';

const STAGGER_MS = 60;

// The bands rise into place once per visit, not every time the home page is opened again.
let hasPlayed = false;

// The terrain sheet: five vertical bands side by side from 1280px, stacked rows below that,
// with Grand India Tour as the route across them.
export function Terrain({ verticals }) {
  const [animate] = useState(() => !hasPlayed);
  useEffect(() => {
    hasPlayed = true;
  }, []);

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
            className="flex min-h-16 items-center justify-between gap-3 bg-accent px-(--space-gutter) text-sm font-extrabold text-on-accent xl:absolute xl:top-6 xl:left-(--space-gutter) xl:z-10 xl:min-h-11 xl:rounded-pill xl:border-(length:--border-ink) xl:border-text xl:px-5 dark:xl:border-accent"
          >
            {grand.name}, one route through all five
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          </Link>
          <RouteLine verticalKey={grand.key} animate={animate} className="max-xl:hidden" />
        </>
      )}
      <ul className="grid xl:grid-cols-5 xl:items-end">
        {bands.map((vertical, index) => (
          <li
            key={vertical.key}
            className={cn(animate && 'animate-rise-in')}
            style={animate ? { animationDelay: `${index * STAGGER_MS}ms` } : undefined}
          >
            <VerticalCard vertical={vertical} groundKey={(bands[index - 1] ?? grand)?.key} />
          </li>
        ))}
      </ul>
    </div>
  );
}
