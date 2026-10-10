import { Router } from 'express';
import { getTaxonomies } from '../controllers/taxonomy.controller.js';
import { validate } from '../middlewares/validate.js';
import { listTaxonomiesQuery } from '../validators/taxonomy.validator.js';

export const taxonomyRouter = Router();

taxonomyRouter.get('/', validate({ query: listTaxonomiesQuery }), getTaxonomies);
