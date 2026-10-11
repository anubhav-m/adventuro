import { cn } from '../../lib/cn.js';
import { Chip } from './Chip.jsx';

// Single-choice filter chips. Choosing the selected chip again clears it (`onChange(null)`).
export function ChipGroup({ label, options, value, onChange, className }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            icon={option.icon}
            selected={selected}
            onClick={() => onChange(selected ? null : option.value)}
          >
            {option.label}
          </Chip>
        );
      })}
    </div>
  );
}
