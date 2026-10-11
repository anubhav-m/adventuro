import { useEffect, useRef } from 'react';
import { createMarks, easeScrollSpeed, MARK_TONE, stepMarks } from '../../lib/particles.js';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MAX_PIXEL_RATIO = 2;
// A frame after a pause (a hidden tab) counts as this long at most, so the marks do not leap.
const MAX_FRAME = 0.05;

const TONE_TOKENS = {
  [MARK_TONE.FAR]: '--color-border',
  [MARK_TONE.NEAR]: '--color-border-strong',
  [MARK_TONE.BRAND]: '--color-brand',
};

const readPalette = (element) => {
  const styles = getComputedStyle(element);
  return Object.fromEntries(
    Object.entries(TONE_TOKENS).map(([tone, token]) => [tone, styles.getPropertyValue(token)]),
  );
};

const drawMark = (context, { x, y, depth, cross }) => {
  if (cross) {
    const arm = 2 + depth * 2;
    context.fillRect(x - arm, y - 0.5, arm * 2, 1);
    context.fillRect(x - 0.5, y - arm, 1, arm * 2);
    return;
  }
  context.beginPath();
  context.arc(x, y, 0.6 + depth * 1.2, 0, Math.PI * 2);
  context.fill();
};

// Survey marks adrift on the ground behind every page: flat dots and crosses in the border
// inks, a few in route orange. They rise slowly and pick up speed from the scroll. Ink fields,
// cards and photos are solid, so the marks only show on the bare ground between them. With
// reduced motion they are drawn once and stay still.
export function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let palette = readPalette(canvas);
    let marks = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let lastScrollY = window.scrollY;
    let scrollSpeed = 0;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const mark of marks) {
        context.fillStyle = palette[mark.tone];
        drawMark(context, mark);
      }
    };

    const tick = (time) => {
      const dt = Math.min((time - lastTime) / 1000, MAX_FRAME);
      lastTime = time;
      if (dt > 0) {
        scrollSpeed = easeScrollSpeed(scrollSpeed, (window.scrollY - lastScrollY) / dt, dt);
        lastScrollY = window.scrollY;
        stepMarks(marks, { width, height, dt, scrollSpeed });
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      draw();
      if (reducedMotion.matches) return;
      lastTime = performance.now();
      lastScrollY = window.scrollY;
      scrollSpeed = 0;
      frame = requestAnimationFrame(tick);
    };

    // A phone's address bar changes the height on every scroll, so only a new width lays the
    // marks out again.
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
      if (canvas.clientWidth !== width) {
        marks = createMarks(canvas.clientWidth, canvas.clientHeight);
      }
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    // The theme lands on `<html>` after this effect, and the inks change with it.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette(canvas);
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    reducedMotion.addEventListener('change', start);
    resize();
    start();

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      themeObserver.disconnect();
      reducedMotion.removeEventListener('change', start);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
