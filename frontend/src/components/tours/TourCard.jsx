import { bookingLink, DIFFICULTY_LABELS, getVerticalMeta, ROUTES } from '../../lib/constants.js';
import { formatDuration } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { Photo } from '../ui/Photo.jsx';
import { Price } from '../ui/Price.jsx';

const MAX_ACTIVITIES = 3;

// A tour in its vertical's listing. `verticalKey` picks the icon of the plate that stands in
// for a missing cover photo; the colours come from the `data-vertical` region around the card.
export function TourCard({ tour, verticalKey }) {
  const { icon: Icon } = getVerticalMeta(verticalKey);
  const activities = tour.topActivities.slice(0, MAX_ACTIVITIES);

  return (
    <Card as="article" flush interactive className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Photo
          image={tour.coverImage}
          alt={tour.title}
          className="aspect-4/3 rounded-none"
          fallback={
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center bg-accent bg-(image:--pattern-accent)"
            >
              <span className="flex size-16 items-center justify-center rounded-pill bg-on-accent text-accent">
                <Icon size={32} strokeWidth={1.75} />
              </span>
            </div>
          }
        />
        <Badge tone="solid" className="absolute top-3 left-3">
          {formatDuration(tour.durationDays)} ·{' '}
          {DIFFICULTY_LABELS[tour.difficulty] ?? tour.difficulty}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-sm font-bold text-accent-text">{tour.state}</p>
        <h3 className="text-h3 leading-tight font-extrabold">{tour.title}</h3>
        {tour.tagline && <p className="font-serif text-body-lg italic">{tour.tagline}</p>}
        {activities.length > 0 && (
          <ul aria-label="Top activities" className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <li key={activity}>
                <Badge>{activity}</Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <Price amount={tour.startingPrice} prefix="from" className="text-h4" />
          <div className="flex gap-2">
            <Button
              to={ROUTES.tour(tour.slug)}
              variant="secondary"
              size="sm"
              aria-label={`Explore ${tour.title}`}
            >
              Explore
            </Button>
            <Button
              to={bookingLink(tour.slug)}
              preventScrollReset
              size="sm"
              aria-label={`Book ${tour.title}`}
            >
              Book
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
