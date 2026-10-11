import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice, getIstDateOnly } from './format.js';

describe('formatPrice', () => {
  it.each([
    [14999, '₹14,999'],
    [0, '₹0'],
    [999, '₹999'],
    [125000, '₹1,25,000'],
    [10000000, '₹1,00,00,000'],
  ])('formats %i as %s', (amount, text) => {
    expect(formatPrice(amount)).toBe(text);
  });
});

describe('formatDate', () => {
  it('formats a date-only string', () => {
    expect(formatDate('2026-09-15')).toBe('15 Sep 2026');
    expect(formatDate('2027-01-01')).toBe('1 Jan 2027');
  });

  it('shows a timestamp on its IST calendar day', () => {
    // 19:00 UTC is 00:30 the next day in India.
    expect(formatDate('2026-09-15T19:00:00.000Z')).toBe('16 Sep 2026');
    expect(formatDate('2026-09-15T18:29:00.000Z')).toBe('15 Sep 2026');
    expect(formatDate(new Date('2026-12-31T20:00:00.000Z'))).toBe('1 Jan 2027');
  });

  it('returns an empty string for something that is not a date', () => {
    expect(formatDate('not a date')).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('getIstDateOnly', () => {
  // 18:30 UTC is midnight in India.
  const justBeforeIstMidnight = new Date('2026-10-11T18:29:59.000Z');
  const istMidnight = new Date('2026-10-11T18:30:00.000Z');

  it('returns the IST calendar date, not the UTC one', () => {
    expect(getIstDateOnly(0, justBeforeIstMidnight)).toBe('2026-10-11');
    expect(getIstDateOnly(0, istMidnight)).toBe('2026-10-12');
  });

  it('offsets by whole days, across month and year ends', () => {
    expect(getIstDateOnly(1, justBeforeIstMidnight)).toBe('2026-10-12');
    expect(getIstDateOnly(365, justBeforeIstMidnight)).toBe('2027-10-11');
    expect(getIstDateOnly(1, new Date('2026-12-31T06:00:00.000Z'))).toBe('2027-01-01');
  });

  it('defaults to today', () => {
    expect(getIstDateOnly()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
