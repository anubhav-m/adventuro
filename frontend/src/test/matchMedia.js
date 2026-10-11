// jsdom has no matchMedia. This stand-in lets a test set and change the system colour scheme.
let systemIsDark = false;
const listeners = new Set();

export const installMatchMedia = () => {
  window.matchMedia = (query) => ({
    media: query,
    get matches() {
      return query.includes('prefers-color-scheme: dark') && systemIsDark;
    },
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  });
};

export const setSystemDark = (isDark) => {
  systemIsDark = isDark;
  for (const listener of listeners) listener({ matches: isDark });
};

export const resetMatchMedia = () => {
  systemIsDark = false;
  listeners.clear();
};
