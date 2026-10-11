import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

const PAGE_KEY = 'page';

// A list's filters, kept in the URL's search params so the list can be shared and the back
// button steps through it. `defaults` maps each filter to the value it has when it is absent
// from the URL; pass a module-level constant. Every value is a string.
export const useUrlFilters = (defaults) => {
  const [searchParams, setSearchParams] = useSearchParams();
  // The router moves the URL before React renders it, so a second change made in that gap would
  // be built on the params of the last render and undo the first. Each change builds on this.
  const latestParams = useRef(searchParams);
  useEffect(() => {
    latestParams.current = searchParams;
  }, [searchParams]);

  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback]),
      ),
    [defaults, searchParams],
  );

  // Changing a filter returns to the first page and keeps the scroll position; turning the page
  // scrolls back to the top. `replace` keeps typing out of the history.
  const setFilters = useCallback(
    (changes, { replace = false } = {}) => {
      const turnsPage = Object.hasOwn(changes, PAGE_KEY);
      const next = new URLSearchParams(latestParams.current);
      if (!turnsPage) next.delete(PAGE_KEY);
      for (const [key, value] of Object.entries(changes)) {
        const text = String(value ?? '');
        if (text === '' || text === defaults[key]) next.delete(key);
        else next.set(key, text);
      }
      latestParams.current = next;
      setSearchParams(next, { replace, preventScrollReset: !turnsPage });
    },
    [defaults, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    latestParams.current = new URLSearchParams();
    setSearchParams(latestParams.current, { preventScrollReset: true });
  }, [setSearchParams]);

  return { filters, setFilters, clearFilters };
};
