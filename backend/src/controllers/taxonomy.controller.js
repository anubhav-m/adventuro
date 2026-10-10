import { listTaxonomies } from '../services/taxonomy.service.js';
import { sendSuccess } from '../utils/response.js';

export const getTaxonomies = async (req, res, next) => {
  try {
    const taxonomies = await listTaxonomies(req.validated.query);
    return sendSuccess(res, { message: 'Taxonomies fetched', data: { taxonomies } });
  } catch (err) {
    next(err);
  }
};
