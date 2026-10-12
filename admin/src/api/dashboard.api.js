import { request } from './client.js';

// `from` and `to` are 'YYYY-MM-DD' IST calendar days, both inclusive.
export const getDashboard = ({ from, to }, { signal } = {}) =>
  request('/admin/dashboard', { params: { from, to }, signal });
