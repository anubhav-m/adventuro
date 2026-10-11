import { Skeleton } from '../ui/Skeleton.jsx';
import { SkeletonText } from '../ui/SkeletonText.jsx';

// A field band that is still loading, in the band's own layout: a title, copy and a button on
// the left and the photo plate on the right.
export function BandSkeleton() {
  return (
    <div className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-4/5" />
        <SkeletonText />
        <Skeleton pill className="h-13 w-44" />
      </div>
      <Skeleton className="aspect-video w-full" />
    </div>
  );
}
