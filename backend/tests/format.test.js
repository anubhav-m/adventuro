import { describe, expect, it } from 'vitest';
import {
  formatCalendarDate,
  formatClockTime,
  formatIstDateTime,
  formatRupees,
  pluralize,
} from '../src/utils/format.js';

describe('format utils', () => {
  it.each([
    [1, '₹1'],
    [14999, '₹14,999'],
    [1499900, '₹14,99,900'],
    [199999980, '₹19,99,99,980'],
  ])('formatRupees(%i) → %s (Indian digit grouping)', (amount, expected) => {
    expect(formatRupees(amount)).toBe(expected);
  });

  it.each([
    ['2026-12-01', 'Tue, 1 Dec 2026'],
    ['2028-02-29', 'Tue, 29 Feb 2028'],
    ['2027-01-01', 'Fri, 1 Jan 2027'],
  ])('formatCalendarDate(%s) → %s, whatever the server timezone', (dateOnly, expected) => {
    expect(formatCalendarDate(dateOnly)).toBe(expected);
  });

  it.each([
    ['00:00', '12:00 am'],
    ['06:15', '6:15 am'],
    ['12:00', '12:00 pm'],
    ['23:05', '11:05 pm'],
  ])('formatClockTime(%s) → %s', (time, expected) => {
    expect(formatClockTime(time)).toBe(expected);
  });

  it('formatIstDateTime shows the IST clock, including across the date line', () => {
    expect(formatIstDateTime(new Date('2026-10-11T09:15:00.000Z'))).toBe('11 Oct 2026, 2:45 pm');
    expect(formatIstDateTime(new Date('2026-12-31T18:30:00.000Z'))).toBe('1 Jan 2027, 12:00 am');
  });

  it('pluralize', () => {
    expect(pluralize(1, 'traveler')).toBe('1 traveler');
    expect(pluralize(2, 'traveler')).toBe('2 travelers');
    expect(pluralize(21, 'day')).toBe('21 days');
  });
});
