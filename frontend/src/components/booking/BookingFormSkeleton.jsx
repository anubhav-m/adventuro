import { Skeleton } from '../ui/Skeleton.jsx';

const FIELDS = ['package', 'travelers', 'start date'];

// The booking form while its tour loads: the three choices, the total and Confirm.
export function BookingFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {FIELDS.map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12" />
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton pill className="h-13 w-48" />
      </div>
    </div>
  );
}
