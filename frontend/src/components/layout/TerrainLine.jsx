import { cn } from '../../lib/cn.js';

// The coast-to-peak ground profile: sea level, a dune, a city block, a peak, a still lake.
const PROFILE =
  'M0 44C120 44 200 34 288 34C346 34 376 14 428 14C480 14 512 34 576 34V26H864V34C900 34 950 2 1000 2C1060 2 1100 46 1152 46C1380 46 1410 40 1440 40V64H0Z';

// The drawn seam where an ink field meets the ground above it. It takes the accent of the
// region it sits in, so inside `data-vertical` it is that vertical's ink.
export function TerrainLine({ className }) {
  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('block h-8 w-full fill-accent sm:h-16', className)}
    >
      <path d={PROFILE} />
    </svg>
  );
}
