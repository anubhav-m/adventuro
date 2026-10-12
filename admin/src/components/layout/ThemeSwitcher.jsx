import { useTheme } from '../../hooks/useTheme.js';
import { THEME_OPTIONS } from '../../lib/constants.js';
import { Segmented } from '../ui/Segmented.jsx';

// System / Light / Dark. The choice is applied at once and saved to the admin's account.
export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();
  return (
    <Segmented
      label="Theme"
      options={THEME_OPTIONS}
      value={preference}
      onChange={setPreference}
      iconOnly
    />
  );
}
