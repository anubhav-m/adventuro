import { describe, expect, it } from 'vitest';
import { DASHBOARD_FILTER_DEFAULTS, resolveDashboardRange } from './dashboardRange.js';
import { FIELD_MESSAGES } from './schemas.js';

// 12 Oct 2026, 11:30 in India.
const NOW = new Date('2026-10-12T06:00:00.000Z');

const resolve = (filters) =>
  resolveDashboardRange({ ...DASHBOARD_FILTER_DEFAULTS, ...filters }, NOW);
const custom = (from, to) => resolve({ range: 'custom', from, to });

describe('resolveDashboardRange', () => {
  it('defaults to the last 30 days, ending today in India', () => {
    expect(resolve({})).toEqual({ from: '2026-09-13', to: '2026-10-12', errors: {} });
  });

  it.each([
    ['7', '2026-10-06'],
    ['30', '2026-09-13'],
    ['90', '2026-07-15'],
  ])('counts the %s-day preset back from today, today included', (range, from) => {
    expect(resolve({ range })).toEqual({ from, to: '2026-10-12', errors: {} });
  });

  it('uses the IST date when the UTC date is still the day before', () => {
    const lateEvening = new Date('2026-10-12T19:00:00.000Z');
    expect(
      resolveDashboardRange({ ...DASHBOARD_FILTER_DEFAULTS, range: '7' }, lateEvening),
    ).toEqual({ from: '2026-10-07', to: '2026-10-13', errors: {} });
  });

  it('falls back to the default preset for a range value it does not know', () => {
    expect(resolve({ range: 'forever' })).toEqual(resolve({}));
  });

  it('ignores from and to unless the range is custom', () => {
    expect(resolve({ range: '7', from: '2020-01-01', to: '2020-01-02' }).from).toBe('2026-10-06');
  });

  it('uses a custom range as written', () => {
    expect(custom('2026-08-01', '2026-08-31')).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
      errors: {},
    });
    expect(custom('2026-08-01', '2026-08-01').errors).toEqual({});
  });

  it('rejects a start after the end', () => {
    expect(custom('2026-09-02', '2026-09-01').errors).toEqual({ from: FIELD_MESSAGES.from });
  });

  it('allows 366 days and rejects 367', () => {
    expect(custom('2025-10-12', '2026-10-12').errors).toEqual({});
    expect(custom('2025-10-11', '2026-10-12').errors).toEqual({ to: FIELD_MESSAGES.to });
  });

  it('asks for a date that is missing or is not a real one', () => {
    expect(custom('', '').errors).toEqual({ from: 'Pick a start date.', to: 'Pick an end date.' });
    expect(custom('2026-02-31', '2026-03-05').errors).toEqual({ from: 'Pick a start date.' });
    expect(custom('2026-03-01', 'soon').errors).toEqual({ to: 'Pick an end date.' });
  });
});
