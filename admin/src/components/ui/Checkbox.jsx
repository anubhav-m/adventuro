import { cn } from '../../lib/cn.js';

// A native checkbox with its label beside it. `onChange` receives the new checked state.
export function Checkbox({ label, checked, onChange, className, ...rest }) {
  return (
    <label
      className={cn(
        'flex min-h-10 cursor-pointer items-center gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-45',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
