import { useId } from 'react';
import { cn } from '../../lib/cn.js';

// One titled part of the tour page's body. Extra props (an `id`, a `ref`) go to the section.
export function TourSection({ title, className, children, ...rest }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-5', className)} {...rest}>
      <h2 id={headingId} className="text-h3 leading-tight font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  );
}
