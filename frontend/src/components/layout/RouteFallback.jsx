import { BandSkeleton } from './BandSkeleton.jsx';

// Shown while the first route's code is loading.
export function RouteFallback() {
  return (
    <div aria-busy="true" className="mx-auto max-w-content px-(--space-gutter) pt-20">
      <span role="status" className="sr-only">
        Loading
      </span>
      <BandSkeleton />
    </div>
  );
}
