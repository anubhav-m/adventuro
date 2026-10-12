import { request } from './client.js';

export const listSubscribers = (params, { signal } = {}) =>
  request('/admin/newsletter', { params, signal });
