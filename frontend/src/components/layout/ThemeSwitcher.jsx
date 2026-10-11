import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';
import { THEME } from '../../lib/constants.js';
import { Dropdown } from '../ui/Dropdown.jsx';
import { IconButton } from '../ui/IconButton.jsx';

const OPTIONS = [
  { value: THEME.SYSTEM, label: 'System', icon: Monitor },
  { value: THEME.LIGHT, label: 'Light', icon: Sun },
  { value: THEME.DARK, label: 'Dark', icon: Moon },
];

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();
  const current = OPTIONS.find((option) => option.value === preference);

  const items = OPTIONS.map(({ value, label, icon }) => ({
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
