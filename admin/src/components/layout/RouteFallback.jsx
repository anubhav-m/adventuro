import { SkeletonText } from '../ui/SkeletonText.jsx';

// Shown while the first route's code is loading.
export function RouteFallback() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-prose p-6 pt-16">
      <span role="status" className="sr-only">
        Loading
      </span>
      <SkeletonText heading lines={4} />
    </div>
  );
}
