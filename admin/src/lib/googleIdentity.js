import { ApiError, NETWORK_ERROR } from '../api/ApiError.js';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let identityPromise = null;
let credentialHandler = null;

const loadScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new ApiError({ code: NETWORK_ERROR }));
    };
    document.head.append(script);
  });

const initialize = async () => {
  if (!window.google?.accounts?.id) await loadScript();
  const identity = window.google.accounts.id;
  identity.initialize({
    client_id: CLIENT_ID,
    callback: ({ credential }) => credentialHandler?.(credential),
  });
  return identity;
};

// Loads and initialises Google Identity Services once per page. A failed load can be retried.
export const loadGoogleIdentity = async () => {
  identityPromise ??= initialize();
  try {
    return await identityPromise;
  } catch (error) {
    identityPromise = null;
    throw error;
  }
};

// The mounted sign-in button receives the ID token Google hands back.
export const setCredentialHandler = (handler) => {
  credentialHandler = handler;
};
