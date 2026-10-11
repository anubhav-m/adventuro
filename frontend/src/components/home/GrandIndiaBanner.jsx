import { ArrowRight } from 'lucide-react';
import { ROUTES } from '../../lib/constants.js';
import { TerrainLine } from '../layout/TerrainLine.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

const PLATE = 'aspect-video w-full rounded-plate border-(length:--border-ink) border-on-accent';

// The flagship vertical as one field of its ink. Its newest tour supplies the signature
// experiences and the itinerary link; with no tour yet, the link goes to the vertical page.
export function GrandIndiaBanner({ vertical, tours }) {
  const [tour] = tours;
  const highlights = tour?.topActivities ?? [];

  return (
    <div data-vertical={vertical.key}>
      <TerrainLine />
      <div className="bg-accent text-on-accent">
        <div className="mx-auto grid max-w-content items-center gap-10 px-(--space-gutter) py-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-16">
          <div className="flex flex-col items-start gap-5">
            <h2 className="type-display text-h1">{vertical.name}</h2>
            <p className="type-lead">{vertical.subtitle}</p>
            <p className="max-w-prose font-medium">{vertical.description}</p>
            {highlights.length > 0 && (
              <ul aria-label="Signature experiences" className="flex flex-wrap gap-2">
                {highlights.map((highlight) => (
                  <li key={highlight}>
                    <Badge tone="outline">{highlight}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="on-accent"
              to={tour ? ROUTES.tour(tour.slug) : ROUTES.vertical(vertical.key)}
              iconRight={ArrowRight}
              className="mt-2"
            >
              View Itinerary
            </Button>
          </div>
          {vertical.heroImage ? (
            <img
              src={vertical.heroImage.url}
              alt={vertical.name}
              loading="lazy"
              className={`${PLATE} object-cover lg:aspect-4/3`}
            />
          ) : (
            <div aria-hidden="true" className={`${PLATE} bg-(image:--pattern-accent)`} />
          )}
        </div>
      </div>
    </div>
  );
}
