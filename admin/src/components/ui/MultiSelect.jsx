import { ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { Checkbox } from './Checkbox.jsx';
import { Input } from './Input.jsx';

// Choose any number of `options` ({ value, label }). `value` is the array of chosen values and
// `onChange` receives the next one. The button opens a list of checkboxes, with a box to narrow
// it down when `searchable`; what is chosen shows underneath as removable chips.
// Spread a Field's control props onto it: <Field label="Tags">{(c) => <MultiSelect {...c} />}</Field>
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Choose',
  searchable = false,
  className,
  ...control
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePress = (event) => {
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  const chosen = options.filter((option) => value.includes(option.value));
  const needle = term.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;

  const toggle = (optionValue, isChosen) =>
    onChange(isChosen ? [...value, optionValue] : value.filter((item) => item !== optionValue));

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !open) return;
    event.stopPropagation();
    setOpen(false);
    buttonRef.current.focus();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-field border border-border-strong bg-surface-raised px-3 text-left text-sm text-text focus:border-text aria-invalid:border-danger"
        {...control}
      >
        <span className={cn(chosen.length === 0 && 'text-text-subtle')}>
          {chosen.length === 0 ? placeholder : `${chosen.length} selected`}
        </span>
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className="text-text-muted" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 left-0 z-30 mt-1 flex max-h-72 flex-col gap-1 rounded-panel border border-border bg-surface-raised p-2 shadow-raised"
        >
          {searchable && (
            <Input
              type="search"
              aria-label="Filter options"
              placeholder="Type to filter"
              autoComplete="off"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          )}
          <ul className="overflow-y-auto px-1">
            {visible.map((option) => (
              <li key={option.value}>
                <Checkbox
                  label={option.label}
                  checked={value.includes(option.value)}
                  onChange={(isChosen) => toggle(option.value, isChosen)}
                />
              </li>
            ))}
          </ul>
          {visible.length === 0 && <p className="px-1 py-2 text-sm text-text-muted">No matches.</p>}
        </div>
      )}
      {chosen.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((option) => (
            <li
              key={option.value}
              className="inline-flex h-7 items-center gap-1 rounded-pill border border-border bg-surface-raised pr-1 pl-2.5 text-xs font-bold"
            >
              {option.label}
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                onClick={() => toggle(option.value, false)}
                className="flex size-5 items-center justify-center rounded-pill hover:bg-surface-sunken"
              >
                <X size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
