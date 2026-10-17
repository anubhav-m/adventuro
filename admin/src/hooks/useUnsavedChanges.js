import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';

// While `isDirty`, leaving the page asks first: a move inside the app is held by the router's
// blocker (render <UnsavedChangesDialog blocker={blocker} />), and closing or reloading the tab
// gets the browser's own prompt. Changing only the search params (a tab) is not leaving.
// Call `allowNavigation()` just before navigating away on purpose, after a save.
export const useUnsavedChanges = (isDirty) => {
  const allowed = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !allowed.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const allowNavigation = useCallback(() => {
    allowed.current = true;
  }, []);

  return { blocker, allowNavigation };
};
