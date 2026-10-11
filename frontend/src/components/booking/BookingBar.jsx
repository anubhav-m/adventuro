import { bookingLink } from '../../lib/constants.js';
import { Button } from '../ui/Button.jsx';
import { Price } from '../ui/Price.jsx';

// The tour page's Book action below the desktop layout: a bar that stays at the bottom of the
// screen with the chosen package's price, for as long as the tour is on screen.
export function BookingBar({ tourSlug, tier }) {
  return (
    <div className="sticky bottom-0 z-10 mt-12 border-t border-border bg-surface-raised lg:hidden">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-(--space-gutter) py-3">
        <p className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-text-muted">
            {tier.name}, per person
          </span>
          <Price amount={tier.pricePerPerson} className="text-h4" />
        </p>
        <Button to={bookingLink(tourSlug, tier.id)} preventScrollReset size="sm">
          Book this trip
        </Button>
      </div>
    </div>
  );
}
