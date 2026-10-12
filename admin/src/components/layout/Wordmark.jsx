import { cn } from '../../lib/cn.js';
import { BRAND } from '../../lib/constants.js';
import { Badge } from '../ui/Badge.jsx';

// The typographic logo with the app's tag. It is one component so a real logo can replace it.
export function Wordmark({ className }) {
  return (
    <span className={cn('flex flex-col items-start gap-1.5', className)}>
      <span className="type-display text-h3 tracking-[0.02em] uppercase">{BRAND.NAME}</span>
      <Badge>Admin</Badge>
    </span>
  );
}
