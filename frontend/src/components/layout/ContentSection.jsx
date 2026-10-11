import { useId } from 'react';

// One titled part of a reading page (About, the policies): the heading on the left from the
// desktop layout up, the copy beside it at reading width.
export function ContentSection({ title, children }) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-x-10 gap-y-4 border-t border-border pt-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
    >
      <h2 id={headingId} className="text-h3 leading-tight font-extrabold">
        {title}
      </h2>
      <div className="flex max-w-prose flex-col gap-4">{children}</div>
    </section>
  );
}
