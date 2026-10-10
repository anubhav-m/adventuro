import { Taxonomy } from '../models/Taxonomy.js';
import { serialize } from '../utils/serialize.js';

export const listTaxonomies = async ({ type }) => {
  const taxonomies = await Taxonomy.find(type ? { type } : {})
    .select('type name slug')
    .sort({ type: 1, name: 1 })
    .lean();
  return serialize(taxonomies);
};
