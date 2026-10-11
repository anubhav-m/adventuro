import { afterEach, describe, expect, it, vi } from 'vitest';
import { bookingIntent, localStore, sessionStore } from './storage.js';

describe.each([
  ['localStore', localStore, () => window.localStorage],
  ['sessionStore', sessionStore, () => window.sessionStorage],
])('%s', (_name, store, getStorage) => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets, gets and removes a value', () => {
    expect(store.get('key')).toBeNull();
    expect(store.set('key', 'value')).toBe(true);
    expect(getStorage().getItem('key')).toBe('value');
    expect(store.get('key')).toBe('value');
    expect(store.remove('key')).toBe(true);
    expect(store.get('key')).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const blocked = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    expect(store.get('key')).toBeNull();
    expect(store.set('key', 'value')).toBe(false);
    expect(store.remove('key')).toBe(false);
  });
});

describe('bookingIntent', () => {
  const INTENT = {
    tourSlug: 'goa-coastal-escape',
    tierId: '6acb6f4b2fce015e85723270',
    travelers: 3,
    startDate: '2026-12-24',
  };
  const KEY = 'adventuro.bookingIntent';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has nothing to restore until an intent is saved', () => {
    expect(bookingIntent.restore()).toBeNull();
  });

  it('saves to sessionStorage, restores the same selections and clears them', () => {
    expect(bookingIntent.save(INTENT)).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(JSON.parse(window.sessionStorage.getItem(KEY))).toEqual(INTENT);
    expect(bookingIntent.restore()).toEqual(INTENT);
    expect(bookingIntent.restore()).toEqual(INTENT);

    expect(bookingIntent.clear()).toBe(true);
    expect(bookingIntent.restore()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('stores only the four selections', () => {
    bookingIntent.save({ ...INTENT, total: 44997, user: 'someone' });
    expect(bookingIntent.restore()).toEqual(INTENT);
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['JSON null', 'null'],
    ['a list', '[]'],
    ['a missing field', JSON.stringify({ ...INTENT, tierId: undefined })],
    ['a fractional traveler count', JSON.stringify({ ...INTENT, travelers: 2.5 })],
    ['travelers as text', JSON.stringify({ ...INTENT, travelers: '3' })],
    ['a start date that is not text', JSON.stringify({ ...INTENT, startDate: 20261224 })],
  ])('restores nothing from %s', (_label, stored) => {
    window.sessionStorage.setItem(KEY, stored);
    expect(bookingIntent.restore()).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const blocked = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    expect(bookingIntent.save(INTENT)).toBe(false);
    expect(bookingIntent.restore()).toBeNull();
    expect(bookingIntent.clear()).toBe(false);
  });
});
