import { useState } from 'react';
import { cn } from '../../lib/cn.js';

const ROUTE =
  'M250 62C330 62 250 196 420 140C560 96 560 84 700 76C800 70 900 60 1010 -8C1120 60 1150 180 1400 170';

// The dashed route through the sky above the five bands, ending in a ring. It is drawn on the
// same sheet as the terrain (1440 × 250), so it sits on the bands' 14rem fields (`bottom-56`).
// It is out of sight until `drawn`, then draws itself.
export function RouteLine({ verticalKey, drawn, className }) {
  // The drawing animation is taken off once it has run: Chromium stops painting an element
  // that still carries a finished clip-path animation when the window is resized.
  const [finished, setFinished] = useState(false);

  return (
    <svg
      data-vertical={verticalKey}
      viewBox="0 0 1440 250"
      aria-hidden="true"
      onAnimationEnd={() => setFinished(true)}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-56 aspect-[1440/250] overflow-visible fill-none stroke-accent-text',
        !drawn && 'motion-safe:invisible',
        drawn && !finished && 'animate-draw-in',
        className,
      )}
    >
      <path d={ROUTE} strokeWidth="5" strokeDasharray="14 10" />
      <circle cx="1400" cy="170" r="9" strokeWidth="5" className="fill-bg" />
    </svg>
  );
}
