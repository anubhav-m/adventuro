import {
  createTaxonomy,
  deleteTaxonomy,
  updateTaxonomy,
} from '../../services/admin/taxonomy.service.js';
import { listTaxonomies } from '../../services/taxonomy.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminTaxonomies = async (req, res, next) => {
  try {
    const taxonomies = await listTaxonomies(req.validated.query);
    return sendSuccess(res, { message: 'Taxonomies fetched', data: { taxonomies } });
  } catch (err) {
    next(err);
  }
};

export const postAdminTaxonomy = async (req, res, next) => {
  try {
    const taxonomy = await createTaxonomy(req.validated.body);
    return sendSuccess(res, { status: 201, message: 'Taxonomy created', data: { taxonomy } });
  } catch (err) {
    next(err);
  }
};

export const patchAdminTaxonomy = async (req, res, next) => {
  try {
    const taxonomy = await updateTaxonomy(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: 'Taxonomy updated', data: { taxonomy } });
  } catch (err) {
    next(err);
  }
};

export const deleteAdminTaxonomy = async (req, res, next) => {
  try {
    await deleteTaxonomy(req.validated.params.id);
    return sendSuccess(res, { message: 'Taxonomy deleted' });
  } catch (err) {
    next(err);
  }
};
