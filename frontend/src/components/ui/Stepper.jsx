import { Minus, Plus } from 'lucide-react';
import { IconButton } from './IconButton.jsx';

// A whole number between `min` and `max`. `label` names what is being counted, e.g. "travelers".
export function Stepper({ label, value, min, max, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-3">
      <IconButton
        icon={Minus}
        variant="outline"
        label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      />
      <output
        aria-live="polite"
        className="min-w-8 text-center text-h4 font-extrabold tabular-nums"
      >
        {value}
      </output>
      <IconButton
        icon={Plus}
        variant="outline"
        label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      />
    </div>
  );
}
