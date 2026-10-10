import { Router } from 'express';
import {
  deleteAdminTaxonomy,
  getAdminTaxonomies,
  patchAdminTaxonomy,
  postAdminTaxonomy,
} from '../../controllers/admin/taxonomy.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  createTaxonomyBody,
  updateTaxonomyBody,
} from '../../validators/admin/taxonomy.validator.js';
import { idParams } from '../../validators/common.js';
import { listTaxonomiesQuery } from '../../validators/taxonomy.validator.js';

export const adminTaxonomyRouter = Router();

adminTaxonomyRouter.get('/', validate({ query: listTaxonomiesQuery }), getAdminTaxonomies);
adminTaxonomyRouter.post('/', validate({ body: createTaxonomyBody }), postAdminTaxonomy);
adminTaxonomyRouter.patch(
  '/:id',
  validate({ params: idParams, body: updateTaxonomyBody }),
  patchAdminTaxonomy,
);
adminTaxonomyRouter.delete('/:id', validate({ params: idParams }), deleteAdminTaxonomy);
