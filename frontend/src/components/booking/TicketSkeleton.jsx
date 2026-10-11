import { Card } from '../ui/Card.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { SkeletonText } from '../ui/SkeletonText.jsx';

// The ticket while its booking loads: the vertical's band, the booking number, the details.
export function TicketSkeleton() {
  return (
    <Card flush className="overflow-hidden">
      <Skeleton className="h-11" />
      <div className="flex flex-col gap-8 p-5 sm:p-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full max-w-96" />
          <Skeleton pill className="h-7 w-24" />
        </div>
        <SkeletonText heading lines={2} className="max-w-prose" />
        <SkeletonText lines={4} className="max-w-prose" />
      </div>
    </Card>
  );
}
