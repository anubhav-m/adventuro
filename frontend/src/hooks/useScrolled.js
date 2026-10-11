import { useSyncExternalStore } from 'react';

const subscribe = (onChange) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};

const getSnapshot = () => window.scrollY > 0;

// True once the page has scrolled away from the top.
export const useScrolled = () => useSyncExternalStore(subscribe, getSnapshot);
