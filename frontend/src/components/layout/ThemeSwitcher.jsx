import { useTheme } from '../../hooks/useTheme.js';
import { THEME_OPTIONS } from '../../lib/constants.js';
import { Dropdown } from '../ui/Dropdown.jsx';
import { IconButton } from '../ui/IconButton.jsx';

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();
  const current = THEME_OPTIONS.find((option) => option.value === preference);

  const items = THEME_OPTIONS.map(({ value, label, icon }) => ({
    key: value,
    label,
    icon,
    selected: value === preference,
    onSelect: () => setPreference(value),
  }));

  return (
    <Dropdown
      label="Theme"
      items={items}
      trigger={(triggerProps) => (
        <IconButton icon={current.icon} label={`Theme: ${current.label}`} {...triggerProps} />
      )}
    />
  );
}
