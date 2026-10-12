import { cn } from '../../lib/cn.js';

// An on/off setting that applies as it is pressed (Published, Active). `onChange` receives the
// new state. The label is the control's name and sits beside it; `hideLabel` keeps only the name,
// for a switch in a table row whose column already says what it is.
export function Switch({
  label,
  checked,
  onChange,
  hideLabel = false,
  disabled = false,
  className,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group inline-flex min-h-10 items-center gap-2.5 rounded-pill text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-10 shrink-0 items-center rounded-pill border-(length:--border-ink) border-border-strong p-0.5 transition-colors duration-(--duration-fast) ease-out group-aria-checked:border-text group-aria-checked:bg-text"
      >
        <span className="size-4 rounded-pill bg-border-strong transition-[translate,background-color] duration-(--duration-fast) ease-out group-aria-checked:translate-x-4 group-aria-checked:bg-bg" />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  );
}
