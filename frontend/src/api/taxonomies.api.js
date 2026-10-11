import { request } from './client.js';

export const listTaxonomies = async (type, { signal } = {}) => {
  const { taxonomies } = await request('/taxonomies', { params: { type }, signal });
  return taxonomies;
};
