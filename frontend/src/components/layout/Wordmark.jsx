import { BRAND } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

const SIZES = {
  // Steps down on narrow phones so the navbar fits beside its controls from 360px up.
  nav: 'text-body-lg min-[420px]:text-h4 sm:text-h3',
  display: 'text-h3',
};

// The typographic logo. It is one component so a real logo can replace it in one place.
export function Wordmark({ size = 'display', className }) {
  return (
    <span className={cn('type-display tracking-[0.02em] uppercase', SIZES[size], className)}>
      {BRAND.NAME}
    </span>
  );
}
