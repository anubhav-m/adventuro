import { describe, expect, it } from 'vitest';
import {
  countDaysInclusive,
  formatCompactPrice,
  formatDate,
  formatDateTime,
  formatDay,
  formatNumber,
  formatPrice,
  getIstDateOnly,
  isDateOnly,
  shiftDateOnly,
} from './format.js';

describe('prices and numbers', () => {
  it.each([
    [14999, '₹14,999'],
    [0, '₹0'],
    [125000, '₹1,25,000'],
    [10000000, '₹1,00,00,000'],
  ])('formats %i rupees as %s', (amount, text) => {
    expect(formatPrice(amount)).toBe(text);
  });

  it('shortens a price for a chart axis', () => {
    expect(formatCompactPrice(0)).toBe('₹0');
    expect(formatCompactPrice(150000)).toBe('₹1.5L');
    expect(formatCompactPrice(25000)).toBe('₹25K');
  });

  it('groups a count the Indian way', () => {
    expect(formatNumber(7)).toBe('7');
    expect(formatNumber(1234567)).toBe('12,34,567');
  });
});

describe('dates', () => {
  it('formats a date-only string', () => {
    expect(formatDate('2026-09-15')).toBe('15 Sep 2026');
    expect(formatDay('2026-09-15')).toBe('15 Sep');
  });

  it('shows a timestamp on its IST calendar day and clock', () => {
    // 19:00 UTC is 00:30 the next day in India.
    expect(formatDate('2026-09-15T19:00:00.000Z')).toBe('16 Sep 2026');
    expect(formatDateTime('2026-09-15T19:00:00.000Z')).toBe('16 Sep 2026, 12:30 AM');
    expect(formatDateTime(new Date('2026-10-12T12:35:00.000Z'))).toBe('12 Oct 2026, 6:05 PM');
  });

  it('returns an empty string for something that is not a date', () => {
    expect(formatDate('not a date')).toBe('');
    expect(formatDay(undefined)).toBe('');
    expect(formatDateTime('nope')).toBe('');
  });
});

describe('date-only arithmetic', () => {
  // 18:30 UTC is midnight in India.
  const justBeforeIstMidnight = new Date('2026-10-11T18:29:59.000Z');

  it('reads today as the IST calendar date, not the UTC one', () => {
    expect(getIstDateOnly(0, justBeforeIstMidnight)).toBe('2026-10-11');
    expect(getIstDateOnly(0, new Date('2026-10-11T18:30:00.000Z'))).toBe('2026-10-12');
    expect(getIstDateOnly(1, justBeforeIstMidnight)).toBe('2026-10-12');
    expect(getIstDateOnly()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('shifts a date by whole days across month and year ends', () => {
    expect(shiftDateOnly('2026-09-15', -14)).toBe('2026-09-01');
    expect(shiftDateOnly('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDateOnly('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('counts the days of a range, both ends included', () => {
    expect(countDaysInclusive('2026-10-12', '2026-10-12')).toBe(1);
    expect(countDaysInclusive('2026-09-13', '2026-10-12')).toBe(30);
    expect(countDaysInclusive('2026-10-12', '2026-10-10')).toBe(-1);
  });

  it('accepts only real calendar dates written YYYY-MM-DD', () => {
    expect(isDateOnly('2026-02-28')).toBe(true);
    expect(isDateOnly('2026-02-31')).toBe(false);
    expect(isDateOnly('2026-2-3')).toBe(false);
    expect(isDateOnly('')).toBe(false);
    expect(isDateOnly(undefined)).toBe(false);
  });
});
