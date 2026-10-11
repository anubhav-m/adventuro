// The survey marks adrift behind every page (`ParticleField`): where they start and how they
// move. Lengths are CSS pixels and times are seconds.

const AREA_PER_MARK = 16000;
const MAX_MARKS = 90;
// A mark may sit this far off screen before it comes round to the opposite edge.
const MARGIN = 12;
// How fast the nearest mark rises while the page is still.
const DRIFT = 14;
// How much of the page's scroll speed the nearest mark picks up.
const SCROLL_PULL = 0.35;
const MAX_SCROLL_SPEED = 5000;
// The marks take about this long to catch up with the scroll, and to settle after it.
const SETTLE_TIME = 0.3;
const NEAR_DEPTH = 0.72;
const BRAND_EVERY = 9;

export const MARK_TONE = { FAR: 'far', NEAR: 'near', BRAND: 'brand' };

const toneOf = (index, depth) => {
  if (index % BRAND_EVERY === 0) return MARK_TONE.BRAND;
  return depth > NEAR_DEPTH ? MARK_TONE.NEAR : MARK_TONE.FAR;
};

// `depth` runs from 0.2 (far: small and slow) to 1 (near). The nearest marks are crosses.
export const createMarks = (width, height, random = Math.random) => {
  const count = Math.min(MAX_MARKS, Math.round((width * height) / AREA_PER_MARK));
  return Array.from({ length: count }, (_, index) => {
    const depth = 0.2 + random() * 0.8;
    return {
      x: random() * width,
      y: random() * height,
      depth,
      sway: (random() - 0.5) * 6,
      cross: depth > NEAR_DEPTH,
      tone: toneOf(index, depth),
    };
  });
};

const wrap = (value, size) => {
  const span = size + MARGIN * 2;
  return ((((value + MARGIN) % span) + span) % span) - MARGIN;
};

// The speed the marks carry from the scroll: it eases toward the page's own scroll speed and
// back to rest, so they keep gliding for a moment after the page stops.
export const easeScrollSpeed = (current, pageSpeed, dt) => {
  const target = Math.max(-MAX_SCROLL_SPEED, Math.min(MAX_SCROLL_SPEED, pageSpeed));
  return current + (target - current) * (1 - Math.exp(-dt / SETTLE_TIME));
};

// Moves the marks on by `dt`, in place. They rise on their own, and faster the faster the page
// scrolls down; scrolling up carries them back down.
export const stepMarks = (marks, { width, height, dt, scrollSpeed }) => {
  const rise = (DRIFT + scrollSpeed * SCROLL_PULL) * dt;
  for (const mark of marks) {
    mark.x = wrap(mark.x + mark.sway * mark.depth * dt, width);
    mark.y = wrap(mark.y - rise * mark.depth, height);
  }
};
