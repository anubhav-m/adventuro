import '@testing-library/jest-dom/vitest';
import { act, cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { installMatchMedia, resetMatchMedia } from './matchMedia.js';
import { server } from './server.js';

installMatchMedia();
// jsdom does not implement scrolling; the router's scroll restoration calls both.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  // Toasts live in a module-level store, so they would otherwise leak into the next test.
  act(() => {
    for (const { id } of toast.getToasts()) toast.dismiss(id);
  });
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetMatchMedia();
  delete document.documentElement.dataset.theme;
});

afterAll(() => server.close());
