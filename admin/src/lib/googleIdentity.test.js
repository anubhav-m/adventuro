import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SCRIPT_SELECTOR = 'script[src="https://accounts.google.com/gsi/client"]';
const scripts = () => [...document.head.querySelectorAll(SCRIPT_SELECTOR)];

// Stands in for Google's script arriving: it defines the global, then the tag reports its load.
const arrive = (script) => {
  const identity = { initialize: vi.fn(), renderButton: vi.fn() };
  window.google = { accounts: { id: identity } };
  script.onload();
  return identity;
};

describe('loadGoogleIdentity', () => {
  let googleIdentity;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id.apps.googleusercontent.com');
    googleIdentity = await import('./googleIdentity.js');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.google;
    for (const script of scripts()) script.remove();
  });

  it('adds the script once, initialises once and gives every caller the same instance', async () => {
    const first = googleIdentity.loadGoogleIdentity();
    const second = googleIdentity.loadGoogleIdentity();
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].async).toBe(true);

    const identity = arrive(scripts()[0]);
    expect(await first).toBe(identity);
    expect(await second).toBe(identity);
    expect(await googleIdentity.loadGoogleIdentity()).toBe(identity);
    expect(scripts()).toHaveLength(1);
    expect(identity.initialize).toHaveBeenCalledTimes(1);
    expect(identity.initialize.mock.calls[0][0].client_id).toBe(
      'client-id.apps.googleusercontent.com',
    );
  });

  it('uses Google when it is already on the page, without adding the script again', async () => {
    const identity = { initialize: vi.fn() };
    window.google = { accounts: { id: identity } };

    expect(await googleIdentity.loadGoogleIdentity()).toBe(identity);
    expect(scripts()).toHaveLength(0);
  });

  it('hands the ID token to the current handler, and to nobody once it is removed', async () => {
    const loading = googleIdentity.loadGoogleIdentity();
    const identity = arrive(scripts()[0]);
    await loading;
    const { callback } = identity.initialize.mock.calls[0][0];

    const handler = vi.fn();
    googleIdentity.setCredentialHandler(handler);
    callback({ credential: 'id-token' });
    expect(handler).toHaveBeenCalledWith('id-token');

    googleIdentity.setCredentialHandler(null);
    expect(() => callback({ credential: 'another-token' })).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fails as a network error when the script cannot load, and can be tried again', async () => {
    const failed = googleIdentity.loadGoogleIdentity();
    scripts()[0].onerror();

    const error = await failed.catch((reason) => reason);
    expect(error.name).toBe('ApiError');
    expect(error.isNetworkError).toBe(true);
    expect(scripts()).toHaveLength(0);

    const retried = googleIdentity.loadGoogleIdentity();
    expect(scripts()).toHaveLength(1);
    const identity = arrive(scripts()[0]);
    expect(await retried).toBe(identity);
  });
});
