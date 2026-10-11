import { ArrowDown, CalendarDays, Gauge, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import {
  BOOKING_SECTION_ID,
  DIFFICULTY_LABELS,
  getVerticalMeta,
  ROUTES,
} from '../../lib/constants.js';
import { formatDuration } from '../../lib/format.js';
import { FieldBand } from '../layout/FieldBand.jsx';
import { TerrainLine } from '../layout/TerrainLine.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

// The tour on its vertical's field. Rendered inside the page's `data-vertical` wrapper.
export function TourHero({ tour }) {
  const { vertical } = tour;
  const { icon: VerticalIcon } = getVerticalMeta(vertical.key);
  const facts = [
    { icon: MapPin, text: `${tour.destination}, ${tour.state}` },
    { icon: CalendarDays, text: formatDuration(tour.durationDays) },
    { icon: Gauge, text: DIFFICULTY_LABELS[tour.difficulty] ?? tour.difficulty },
  ];

  return (
    <header>
      <FieldBand image={tour.coverImage} alt={tour.title} lazy={false}>
        <h1 className="type-display text-h1">{tour.title}</h1>
        {tour.tagline && <p className="type-lead">{tour.tagline}</p>}
        <ul aria-label="At a glance" className="flex flex-wrap gap-2">
          {facts.map(({ icon, text }) => (
            <li key={text}>
              <Badge tone="outline" icon={icon}>
                {text}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button variant="on-accent" to={`#${BOOKING_SECTION_ID}`} iconRight={ArrowDown}>
            View packages
          </Button>
          <Link
            to={ROUTES.vertical(vertical.key)}
            className="inline-flex min-h-11 items-center gap-2 font-bold underline underline-offset-4"
          >
            <VerticalIcon size={18} strokeWidth={1.75} aria-hidden="true" />
            {vertical.name}
          </Link>
        </div>
      </FieldBand>
      <TerrainLine className="-mt-px rotate-180" />
    </header>
  );
}
