import { ArrowLeft, MapPinOff } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { BRAND, ROUTES } from '../lib/constants.js';
import { ERROR_MESSAGES } from '../lib/errors.js';

export function NotFoundPage() {
  return (
    <section className="mx-auto grid max-w-content items-center gap-10 px-(--space-gutter) pt-(--space-section) md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <title>{`Page not found · ${BRAND.NAME}`}</title>
      <div className="flex flex-col items-start gap-5">
        <h1 className="type-display text-h1">This trail isn’t on the map.</h1>
        <p className="type-lead text-text-muted">{ERROR_MESSAGES.ROUTE_NOT_FOUND}</p>
        <p className="max-w-prose text-text-muted">
          The page may have moved, or the link may be mistyped. Head back and pick a route from
          there.
        </p>
        <Button to={ROUTES.HOME} icon={ArrowLeft} className="mt-2">
          Back to home
        </Button>
      </div>
      <div
        aria-hidden="true"
        className="flex aspect-4/3 items-center justify-center rounded-plate bg-accent bg-(image:--pattern-accent) text-on-accent"
      >
        <span className="flex size-24 items-center justify-center rounded-pill bg-on-accent text-accent">
          <MapPinOff size={48} strokeWidth={1.75} />
        </span>
      </div>
    </section>
  );
}
