import { request } from './client.js';

export const listVerticals = async ({ signal } = {}) => {
  const { verticals } = await request('/admin/verticals', { signal });
  return verticals;
};

export const getVertical = async (id, { signal } = {}) => {
  const { vertical } = await request(`/admin/verticals/${id}`, { signal });
  return vertical;
};

export const updateVertical = async (id, changes) => {
  const { vertical } = await request(`/admin/verticals/${id}`, { method: 'PATCH', body: changes });
  return vertical;
};
