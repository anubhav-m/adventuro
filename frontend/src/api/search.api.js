import { request } from './client.js';

export const search = (q, { signal } = {}) => request('/search', { params: { q }, signal });
