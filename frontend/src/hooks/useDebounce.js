import { useEffect, useState } from 'react';

// The latest `value`, once it has stopped changing for `delayMs`.
export const useDebounce = (value, delayMs) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
