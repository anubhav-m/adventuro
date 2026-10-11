import { useCallback, useRef } from 'react';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ThemeSync } from './ThemeSync.jsx';

// The app's theme provider: ThemeProvider, with the choice saved to the signed-in user.
export function SessionThemeProvider({ children }) {
  const saveRef = useRef(null);
  const handleChange = useCallback((next) => saveRef.current?.(next), []);

  return (
    <ThemeProvider onChange={handleChange}>
      <ThemeSync saveRef={saveRef} />
      {children}
    </ThemeProvider>
  );
}
