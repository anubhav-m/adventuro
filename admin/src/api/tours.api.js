import { request } from './client.js';

export const listTours = (params, { signal } = {}) => request('/admin/tours', { params, signal });

export const getTour = async (id, { signal } = {}) => {
  const { tour } = await request(`/admin/tours/${id}`, { signal });
  return tour;
};

export const createTour = async (body) => {
  const { tour } = await request('/admin/tours', { method: 'POST', body });
  return tour;
};

export const updateTour = async (id, changes) => {
  const { tour } = await request(`/admin/tours/${id}`, { method: 'PATCH', body: changes });
  return tour;
};

export const deleteTour = (id) => request(`/admin/tours/${id}`, { method: 'DELETE' });
