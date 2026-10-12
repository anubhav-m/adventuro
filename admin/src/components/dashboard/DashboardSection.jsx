import { useId } from 'react';
import { cn } from '../../lib/cn.js';

// A titled block of the dashboard that is not a chart: a heading over a table.
export function DashboardSection({ title, className, children }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={cn('flex min-w-0 flex-col gap-3', className)}>
      <h2 id={titleId} className="text-body font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  );
}
