import { request } from './client.js';

export const listTaxonomies = async (type, { signal } = {}) => {
  const { taxonomies } = await request('/admin/taxonomies', { params: { type }, signal });
  return taxonomies;
};

export const createTaxonomy = async ({ type, name, slug }) => {
  const { taxonomy } = await request('/admin/taxonomies', {
    method: 'POST',
    body: { type, name, slug },
  });
  return taxonomy;
};

export const updateTaxonomy = async (id, changes) => {
  const { taxonomy } = await request(`/admin/taxonomies/${id}`, { method: 'PATCH', body: changes });
  return taxonomy;
};

export const deleteTaxonomy = (id) => request(`/admin/taxonomies/${id}`, { method: 'DELETE' });
