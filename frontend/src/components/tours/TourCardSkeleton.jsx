import { Card } from '../ui/Card.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SkeletonText } from '../ui/SkeletonText.jsx';

// A tour card that is still loading: its photo, state, title, tagline, price and buttons.
export function TourCardSkeleton() {
  return (
    <Card flush className="flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-4/3" />
      <div className="flex flex-col gap-4 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-4/5" />
        <SkeletonText lines={2} />
        <div className="flex items-center justify-between gap-3 pt-3">
          <Skeleton className="h-7 w-28" />
          <Skeleton pill className="h-11 w-36" />
        </div>
      </div>
    </Card>
  );
}
