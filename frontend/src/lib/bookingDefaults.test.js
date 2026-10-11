import { describe, expect, it } from 'vitest';
import { GOA_TOUR } from '../test/fixtures.js';
import { getBookingDefaults, getStartDateBounds } from './bookingDefaults.js';
import { getIstDateOnly } from './format.js';

const intent = (changes) => ({
  tourSlug: GOA_TOUR.slug,
  tierId: 'tier-2',
  travelers: 3,
  startDate: getIstDateOnly(10),
  ...changes,
});

describe('getStartDateBounds', () => {
  it('runs from tomorrow to 365 days ahead, on the IST calendar', () => {
    expect(getStartDateBounds()).toEqual({ min: getIstDateOnly(1), max: getIstDateOnly(365) });
  });
});

describe('getBookingDefaults', () => {
  it('starts on the first package, one traveler and no date', () => {
    expect(getBookingDefaults(GOA_TOUR)).toEqual({ tierId: 'tier-1', travelers: 1, startDate: '' });
  });

  it('starts on the package the link named, when the tour has it', () => {
    expect(getBookingDefaults(GOA_TOUR, { tierId: 'tier-3' }).tierId).toBe('tier-3');
    expect(getBookingDefaults(GOA_TOUR, { tierId: 'tier-gone' }).tierId).toBe('tier-1');
  });

  it('prefers a saved intent for the same tour over the link', () => {
    expect(getBookingDefaults(GOA_TOUR, { intent: intent(), tierId: 'tier-3' })).toEqual({
      tierId: 'tier-2',
      travelers: 3,
      startDate: getIstDateOnly(10),
    });
  });

  it('ignores an intent for another tour', () => {
    expect(getBookingDefaults(GOA_TOUR, { intent: intent({ tourSlug: 'other' }) })).toEqual({
      tierId: 'tier-1',
      travelers: 1,
      startDate: '',
    });
  });

  it('drops whatever in the intent is no longer bookable', () => {
    const stale = intent({ tierId: 'tier-gone', travelers: 99, startDate: getIstDateOnly(0) });

    expect(getBookingDefaults(GOA_TOUR, { intent: stale, tierId: 'tier-3' })).toEqual({
      tierId: 'tier-3',
      travelers: 20,
      startDate: '',
    });
    expect(getBookingDefaults(GOA_TOUR, { intent: intent({ travelers: 0 }) }).travelers).toBe(1);
  });
});
