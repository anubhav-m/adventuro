import { cn } from '../../lib/cn.js';
import { formatPrice } from '../../lib/format.js';

// `mrp` adds the struck-through list price when it is higher. `prefix` is e.g. "from".
export function Price({ amount, mrp, prefix, className }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2 tabular-nums', className)}>
      {prefix && <span className="text-xs font-medium text-text-muted">{prefix}</span>}
      <span className="font-extrabold">{formatPrice(amount)}</span>
      {mrp > amount && (
        <s className="text-sm font-medium text-text-subtle">
          <span className="sr-only">MRP </span>
          {formatPrice(mrp)}
        </s>
      )}
    </span>
  );
}
