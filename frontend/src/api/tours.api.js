import { request } from './client.js';

export const listTours = (filters, { signal } = {}) =>
  request('/tours', { params: filters, signal });

export const getTour = async (slug, { signal } = {}) => {
  const { tour } = await request(`/tours/${encodeURIComponent(slug)}`, { signal });
  return tour;
};
