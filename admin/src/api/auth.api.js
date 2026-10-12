import { request } from './client.js';

export const signInWithGoogle = async (credential) => {
  const { user } = await request('/auth/google', { method: 'POST', body: { credential } });
  return user;
};

export const getMe = async ({ signal } = {}) => {
  const { user } = await request('/auth/me', { signal });
  return user;
};

export const signOut = () => request('/auth/logout', { method: 'POST' });

// The signed-in admin's own profile. This app only ever changes its theme preference.
export const updateMe = async (changes) => {
  const { user } = await request('/users/me', { method: 'PATCH', body: changes });
  return user;
};
