import { Router } from 'express';
import { getAdminNewsletter } from '../../controllers/admin/newsletter.controller.js';
import { validate } from '../../middlewares/validate.js';
import { pagination } from '../../validators/common.js';

export const adminNewsletterRouter = Router();

adminNewsletterRouter.get('/', validate({ query: pagination }), getAdminNewsletter);
