import { ExternalLink } from 'lucide-react';
import { gearGoUrl } from '../../api/gear.api.js';
import { useGearList } from '../../hooks/queries/useGearList.js';
import { formatPrice } from '../../lib/format.js';
import { QueryBoundary } from '../QueryBoundary.jsx';

const LIMIT = 4;

// Gear for the trip being booked, as links only. It is never part of the booking or its total.
export function RecommendedGear({ tourSlug }) {
  const gear = useGearList({ tour: tourSlug, limit: LIMIT });

  return (
    <section aria-labelledby="recommended-gear" className="flex flex-col gap-2">
      <h3 id="recommended-gear" className="text-sm font-bold">
        Recommended gear
      </h3>
      <QueryBoundary
        query={gear}
        isEmpty={(data) => data.gear.length === 0}
        empty={<p className="text-sm text-text-muted">No gear picked for this trip yet.</p>}
      >
        {(data) => (
          <>
            <ul className="flex flex-col">
              {data.gear.map((item) => (
                <li key={item.id}>
                  <a
                    href={gearGoUrl(item.id)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    aria-label={`${item.name}, ${formatPrice(item.salePrice)} (opens in a new tab)`}
                    className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ExternalLink
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-text-muted"
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold tabular-nums">{formatPrice(item.salePrice)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs font-medium text-text-muted">
              Sold by other stores through affiliate links, and not part of this booking or its
              total.
            </p>
          </>
        )}
      </QueryBoundary>
    </section>
  );
}
