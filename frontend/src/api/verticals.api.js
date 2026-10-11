import { request } from './client.js';

export const listVerticals = async ({ signal } = {}) => {
  const { verticals } = await request('/verticals', { signal });
  return verticals;
};

export const getVertical = (key, { signal } = {}) =>
  request(`/verticals/${encodeURIComponent(key)}`, { signal });
