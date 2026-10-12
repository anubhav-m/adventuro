import { Card } from '../ui/Card.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

const STAT_COUNT = 5;
const CHART_COUNT = 2;

// The dashboard while its figures load: the stat cards and the first charts, in outline.
export function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: STAT_COUNT }, (_, index) => (
          <Card key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: CHART_COUNT }, (_, index) => (
          <Card key={index} className="flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    </>
  );
}
