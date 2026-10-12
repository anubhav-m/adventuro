import { CUSTOM_RANGE, DASHBOARD_RANGES } from '../../lib/constants.js';
import { getIstDateOnly } from '../../lib/format.js';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Segmented } from '../ui/Segmented.jsx';

// The dashboard's range: a preset counted back from today, or two dates of the admin's own.
// `filters` are the URL's params, `range` what they resolve to ({ from, to, errors }), and
// `onChange` writes params. Choosing Custom starts from the range that was showing.
export function DateRangePicker({ filters, range, onChange }) {
  const isCustom = filters.range === CUSTOM_RANGE;
  const today = getIstDateOnly();

  const choose = (value) =>
    onChange(
      value === CUSTOM_RANGE
        ? { range: value, from: range.from, to: range.to }
        : { range: value, from: '', to: '' },
    );

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Segmented
        label="Date range"
        options={DASHBOARD_RANGES}
        value={isCustom ? CUSTOM_RANGE : filters.range}
        onChange={choose}
      />
      {isCustom && (
        <>
          <Field label="From" hideLabel error={range.errors.from} className="w-40">
            {(control) => (
              <Input
                {...control}
                type="date"
                max={today}
                value={filters.from}
                onChange={(event) => onChange({ from: event.target.value })}
              />
            )}
          </Field>
          <Field label="To" hideLabel error={range.errors.to} className="w-40">
            {(control) => (
              <Input
                {...control}
                type="date"
                max={today}
                value={filters.to}
                onChange={(event) => onChange({ to: event.target.value })}
              />
            )}
          </Field>
        </>
      )}
    </div>
  );
}
