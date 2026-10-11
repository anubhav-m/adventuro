import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';
import { TERRAIN } from './terrain.js';

// A vertical on the home page: not a card but a band of the terrain, a field of its ink under
// its own skyline. `groundKey` is the vertical whose field lies above it when the bands stack.
export function VerticalCard({ vertical, groundKey }) {
  const { viewBox, wide, stacked, path } = TERRAIN[vertical.key];

  return (
    <Link
      to={ROUTES.vertical(vertical.key)}
      data-vertical={vertical.key}
      className="group relative flex flex-col focus-visible:z-10 motion-safe:transition-transform motion-safe:duration-(--duration-slow) motion-safe:ease-out motion-safe:xl:hover:-translate-y-2 motion-safe:xl:focus-visible:-translate-y-2"
    >
      <span data-vertical={groundKey} className={cn('block', groundKey && 'max-xl:bg-accent')}>
        <svg
          data-vertical={vertical.key}
          viewBox={viewBox}
          preserveAspectRatio="none"
          aria-hidden="true"
          className={cn('block w-full fill-accent', wide, stacked)}
        >
          <path d={path} />
        </svg>
      </span>
      {/* The strip under the band keeps its field unbroken while it is lifted. */}
      <span className="relative -mt-px flex min-h-36 flex-col justify-end bg-accent text-on-accent after:absolute after:inset-x-0 after:top-full after:h-2 after:bg-accent xl:h-56">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-(image:--pattern-accent) [clip-path:inset(0_0_55%_0)] group-hover:[clip-path:inset(0)] group-focus-visible:[clip-path:inset(0)] motion-safe:transition-[clip-path] motion-safe:duration-(--duration-slow) motion-safe:ease-out"
        />
        <span className="relative flex items-end justify-between gap-3 bg-accent px-(--space-gutter) py-5 xl:px-6">
          <span>
            <span className="type-display block text-h3">{vertical.name}</span>
            <span className="mt-2 block text-sm font-bold">{vertical.subtitle}</span>
          </span>
          <ArrowRight
            size={24}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:translate-x-1.5"
          />
        </span>
      </span>
    </Link>
  );
}
