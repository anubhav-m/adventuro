import { cn } from '../../lib/cn.js';

// A section's heading, an optional italic lead under it, and an optional action on the right.
// Pass `id` and point the section's aria-labelledby at it.
export function SectionHeader({ id, title, lead, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="max-w-prose">
        <h2 id={id} className="type-display text-h2">
          {title}
        </h2>
        {lead && <p className="type-lead mt-3 text-text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
