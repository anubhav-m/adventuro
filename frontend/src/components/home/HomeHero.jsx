import { ArrowDown } from 'lucide-react';
import { ADVENTURES_SECTION_ID, BRAND, ROUTES } from '../../lib/constants.js';
import { Button } from '../ui/Button.jsx';

// The client's own figures. They are a plain row, not metric cards.
const STATS = [
  { figure: '5 verticals', note: 'Unlimited stories' },
  { figure: '28+ states', note: 'Countless destinations' },
  { figure: '100% curated', note: 'Expert-led trips' },
  { figure: 'Memories', note: 'That last forever' },
];

export function HomeHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-content px-(--space-gutter) pt-8 sm:pt-12"
    >
      <h1 id="hero-heading" className="type-hero">
        {BRAND.NAME}
      </h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div className="flex flex-col gap-8">
          <p className="type-lead">{BRAND.HERO_TAGLINE}</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-4">
            {STATS.map(({ figure, note }) => (
              <li key={figure}>
                <span className="block text-body-lg font-extrabold">{figure}</span>
                <span className="text-sm font-medium text-text-muted">{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-6">
          <p className="text-body-lg font-medium text-text-muted">
            <strong className="font-extrabold text-text">{BRAND.LINE}</strong> Five ways to travel
            and one grand route across all of them, each trip built around the thing its place is
            known for.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button to={`#${ADVENTURES_SECTION_ID}`} iconRight={ArrowDown}>
              Book Now
            </Button>
            <Button to={ROUTES.GEAR} variant="secondary">
              Explore Gear Store
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
