import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ThemeContext } from '../hooks/useTheme.js';
import { STORAGE_KEYS, THEME } from '../lib/constants.js';
import { localStore } from '../lib/storage.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const isPreference = (value) => Object.values(THEME).includes(value);

const readStoredPreference = () => {
  const stored = localStore.get(STORAGE_KEYS.THEME);
  return isPreference(stored) ? stored : THEME.SYSTEM;
};

const subscribeToSystem = (onChange) => {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

const getSystemIsDark = () => window.matchMedia(DARK_QUERY).matches;

// `onChange(next, previous)` is where a signed-in session saves the choice to the server.
// `setPreference(value, { notify: false })` applies a value without calling it, which is how
// a server value is applied on sign-in and how a failed save is rolled back.
export function ThemeProvider({ onChange, children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const systemIsDark = useSyncExternalStore(subscribeToSystem, getSystemIsDark);
  const systemTheme = systemIsDark ? THEME.DARK : THEME.LIGHT;
  const resolved = preference === THEME.SYSTEM ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setPreference = useCallback(
    (next, { notify = true } = {}) => {
      if (!isPreference(next) || next === preference) return;
      setPreferenceState(next);
      localStore.set(STORAGE_KEYS.THEME, next);
      if (notify) onChange?.(next, preference);
    },
    [preference, onChange],
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
