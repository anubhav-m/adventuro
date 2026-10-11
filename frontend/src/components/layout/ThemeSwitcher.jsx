import { useTheme } from '../../hooks/useTheme.js';
import { THEME, THEME_OPTIONS } from '../../lib/constants.js';
import { IconButton } from '../ui/IconButton.jsx';

// One button that flips between light and dark. It starts from whatever is showing, so a
// visitor still on `system` leaves it with the first press; the account page can go back.
export function ThemeSwitcher() {
  const { resolved, setPreference } = useTheme();
  const next = resolved === THEME.DARK ? THEME.LIGHT : THEME.DARK;
  const { icon: Icon } = THEME_OPTIONS.find((option) => option.value === resolved);

  return (
    <IconButton label={`Switch to ${next} theme`} onClick={() => setPreference(next)}>
      <Icon
        key={resolved}
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
        className="animate-turn-in"
      />
    </IconButton>
  );
}
