import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import { adminGearRouter } from './gear.routes.js';
import { adminTaxonomyRouter } from './taxonomy.routes.js';
import { adminTourRouter } from './tour.routes.js';
import { adminUploadRouter } from './upload.routes.js';
import { adminVerticalRouter } from './vertical.routes.js';

export const adminRouter = Router();

// The only place admin access is enforced: every router mounted below inherits it.
adminRouter.use(requireAuth, requireAdmin);

adminRouter.use('/uploads', adminUploadRouter);
adminRouter.use('/verticals', adminVerticalRouter);
adminRouter.use('/tours', adminTourRouter);
adminRouter.use('/gear', adminGearRouter);
adminRouter.use('/taxonomies', adminTaxonomyRouter);
