import { Card } from '../ui/Card.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

// A gear card that is still loading: its photo, category, name, price and Buy.
export function GearCardSkeleton() {
  return (
    <Card flush className="flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-24" />
        <Skeleton pill className="mt-2 h-11" />
      </div>
    </Card>
  );
}
