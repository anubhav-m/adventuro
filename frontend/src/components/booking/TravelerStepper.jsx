import { LIMITS } from '../../lib/constants.js';
import { Stepper } from '../ui/Stepper.jsx';

// How many people are travelling on this booking.
export function TravelerStepper({ value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold">Travelers</p>
        <p className="text-xs font-medium text-text-muted">
          Up to {LIMITS.TRAVELERS_MAX} on one booking.
        </p>
      </div>
      <Stepper
        label="travelers"
        value={value}
        min={LIMITS.TRAVELERS_MIN}
        max={LIMITS.TRAVELERS_MAX}
        onChange={onChange}
      />
    </div>
  );
}
