import { useEffect, useRef, useState } from 'react';

// The block counts as on screen once it is a little way past the bottom edge.
const ROOT_MARGIN = '0px 0px -8% 0px';

const canObserve = () => typeof IntersectionObserver !== 'undefined';

// On screen, or above it: a block the page has scrolled past stays as it is. Only one that has
// dropped back below the screen goes out of sight, so it can rise in again on the way down.
const isReached = (entry) => entry.isIntersecting || entry.boundingClientRect.top < 0;

// `[ref, revealed]`: `revealed` is true while the element is on screen or above it, and false
// while it is still below. Where the browser cannot observe that, it is always true.
export function useReveal() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(() => !canObserve());

  useEffect(() => {
    if (!canObserve()) return undefined;
    const observer = new IntersectionObserver((entries) => setRevealed(isReached(entries.at(-1))), {
      rootMargin: ROOT_MARGIN,
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, revealed];
}
