import { cn } from '../../lib/cn.js';
import { Input } from './Input.jsx';

// A whole-rupee amount, with the ₹ sign inside the field. Spread a Field's control props on it.
export function MoneyInput({ className, ...rest }) {
  return (
    <span className={cn('relative block', className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-text-muted"
      >
        ₹
      </span>
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        className="pl-7 tabular-nums"
        {...rest}
      />
    </span>
  );
}
