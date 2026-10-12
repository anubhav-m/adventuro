import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';

// With a `label` it announces itself; without one it is decoration beside visible text.
export function Spinner({ label, size = 18, className }) {
  const icon = (
    <LoaderCircle
      size={size}
      strokeWidth={1.75}
      aria-hidden="true"
      className={cn('animate-spin', className)}
    />
  );
  if (!label) return icon;
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-text-muted">
      {icon}
      <span>{label}</span>
    </span>
  );
}
