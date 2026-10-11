import { request } from './client.js';

export const subscribe = (email) => request('/newsletter', { method: 'POST', body: { email } });
