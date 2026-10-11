import { afterEach, describe, expect, it, vi } from 'vitest';
import { localStore, sessionStore } from './storage.js';

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
