import { API_BASE_URL, request } from './client.js';

export const listGear = (filters, { signal } = {}) => request('/gear', { params: filters, signal });

// The href of every "Buy" link: the backend logs the click and redirects to the affiliate.
export const gearGoUrl = (id) => `${API_BASE_URL}/gear/${encodeURIComponent(id)}/go`;
