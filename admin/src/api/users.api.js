import { request } from './client.js';

export const listUsers = (params, { signal } = {}) => request('/admin/users', { params, signal });

// Resolves to { user, bookings }: the user and their 50 most recent bookings.
export const getUser = (id, { signal } = {}) => request(`/admin/users/${id}`, { signal });
