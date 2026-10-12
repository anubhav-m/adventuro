import '@testing-library/jest-dom/vitest';
import { act, cleanup, configure } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { installMatchMedia, resetMatchMedia } from './matchMedia.js';
import { server } from './server.js';

// The first run after a build or an install is several times slower on Windows (cold file
// cache, antivirus), and the first test of a file pays for its imports. Waits are generous so
// that a slow machine does not read as a failing test.
configure({ asyncUtilTimeout: 15_000 });

installMatchMedia();
// jsdom does not implement scrolling; the router's scroll restoration calls it.
window.scrollTo = () => {};
// jsdom has no layout, so nothing is ever resized. The charts only need the observer to exist;
// with no size they draw nothing, and tests read each chart's figures from its data table.
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  // Toasts live in a module-level store, so they would otherwise leak into the next test.
  act(() => {
    for (const { id } of toast.getToasts()) toast.dismiss(id);
  });
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
  resetMatchMedia();
  delete document.documentElement.dataset.theme;
});

afterAll(() => server.close());
