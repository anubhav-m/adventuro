import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

// { preference: 'system' | 'light' | 'dark', resolved: 'light' | 'dark', setPreference }
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
};
