import { cn } from '../../lib/cn.js';

// A single choice among a few options ({ value, label, icon? }), shown side by side in one pill.
// With `iconOnly` each option shows its icon and keeps its label as its name.
export function Segmented({ label, options, value, onChange, iconOnly = false, className }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex h-10 items-center gap-0.5 rounded-pill border border-border-strong p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={iconOnly ? option.label : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-full items-center justify-center gap-1.5 rounded-pill text-sm font-bold whitespace-nowrap transition-colors duration-(--duration-fast) ease-out',
              iconOnly ? 'aspect-square' : 'px-3.5',
              selected ? 'bg-text text-bg' : 'text-text hover:bg-surface-raised',
            )}
          >
            {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
            {!iconOnly && option.label}
          </button>
        );
      })}
    </div>
  );
}
