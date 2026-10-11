import { request } from './client.js';

export const updateMe = async (changes) => {
  const { user } = await request('/users/me', { method: 'PATCH', body: changes });
  return user;
};
