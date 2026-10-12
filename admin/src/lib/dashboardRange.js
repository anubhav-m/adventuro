import { CUSTOM_RANGE, DASHBOARD_RANGES } from './constants.js';
import { getIstDateOnly, shiftDateOnly } from './format.js';
import { dateRangeSchema } from './schemas.js';

const [DEFAULT_RANGE] = DASHBOARD_RANGES;

// The dashboard's URL params and the value each has when it is absent.
export const DASHBOARD_FILTER_DEFAULTS = Object.freeze({
  range: DEFAULT_RANGE.value,
  from: '',
  to: '',
});

// The last `days` IST calendar days, ending today.
const presetRange = (days, now) => {
  const to = getIstDateOnly(0, now);
  return { from: shiftDateOnly(to, 1 - days), to };
};

// Turns the URL's filters into the range to ask the API for: { from, to, errors }.
// A preset is counted back from today. A custom range is used as written; `errors` then maps
// 'from' / 'to' to our message when it cannot be asked for, and is empty otherwise.
// An unknown `range` value falls back to the default preset.
export const resolveDashboardRange = (filters, now = new Date()) => {
  if (filters.range !== CUSTOM_RANGE) {
    const preset = DASHBOARD_RANGES.find(({ value }) => value === filters.range) ?? DEFAULT_RANGE;
    return { ...presetRange(preset.days, now), errors: {} };
  }
  const { from, to } = filters;
  const result = dateRangeSchema.safeParse({ from, to });
  const errors = Object.fromEntries(
    (result.error?.issues ?? []).map(({ path, message }) => [path[0], message]).reverse(),
  );
  return { from, to, errors };
};
