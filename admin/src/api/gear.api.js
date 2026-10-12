import { request } from './client.js';

export const listGear = (params, { signal } = {}) => request('/admin/gear', { params, signal });

export const getGear = async (id, { signal } = {}) => {
  const { gear } = await request(`/admin/gear/${id}`, { signal });
  return gear;
};

export const createGear = async (body) => {
  const { gear } = await request('/admin/gear', { method: 'POST', body });
  return gear;
};

export const updateGear = async (id, changes) => {
  const { gear } = await request(`/admin/gear/${id}`, { method: 'PATCH', body: changes });
  return gear;
};

export const deleteGear = (id) => request(`/admin/gear/${id}`, { method: 'DELETE' });
