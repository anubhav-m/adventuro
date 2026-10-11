import { Card } from '../ui/Card.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

const ROWS = 4;

// The bookings list while it loads: one row per booking, a number and a tour under it.
export function BookingListSkeleton() {
  return (
    <Card flush className="divide-y divide-border">
      {Array.from({ length: ROWS }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton pill className="h-7 w-24" />
        </div>
      ))}
    </Card>
  );
}
