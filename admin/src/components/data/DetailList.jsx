import { cn } from '../../lib/cn.js';

// Facts about one thing, as label / value pairs. `items`: [{ label, value }], where a value
// is text or an element; an empty value reads "Not set".
export function DetailList({ items, className }) {
  return (
    <dl
      className={cn('grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]', className)}
    >
      {items.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="font-bold text-text-muted">{label}</dt>
          <dd className="min-w-0 break-words">
            {value === undefined || value === null || value === '' ? (
              <span className="text-text-subtle">Not set</span>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
