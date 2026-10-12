import { afterEach, describe, expect, it, vi } from 'vitest';
import { localStore } from './storage.js';

describe('localStore', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads back what it wrote', () => {
    expect(localStore.set('adventuro.theme', 'dark')).toBe(true);
    expect(localStore.get('adventuro.theme')).toBe('dark');
    expect(localStore.get('missing')).toBeNull();
  });

  it('degrades to a no-op when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(localStore.get('adventuro.theme')).toBeNull();
    expect(localStore.set('adventuro.theme', 'dark')).toBe(false);
  });
});
