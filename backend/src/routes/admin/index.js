import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import { adminBookingRouter } from './booking.routes.js';
import { adminDashboardRouter } from './dashboard.routes.js';
import { adminGearRouter } from './gear.routes.js';
import { adminNewsletterRouter } from './newsletter.routes.js';
import { adminTaxonomyRouter } from './taxonomy.routes.js';
import { adminTourRouter } from './tour.routes.js';
import { adminUploadRouter } from './upload.routes.js';
import { adminUserRouter } from './user.routes.js';
import { adminVerticalRouter } from './vertical.routes.js';

export const adminRouter = Router();

// The only place admin access is enforced: every router mounted below inherits it.
adminRouter.use(requireAuth, requireAdmin);

adminRouter.use('/dashboard', adminDashboardRouter);
adminRouter.use('/uploads', adminUploadRouter);
adminRouter.use('/verticals', adminVerticalRouter);
adminRouter.use('/tours', adminTourRouter);
adminRouter.use('/gear', adminGearRouter);
adminRouter.use('/taxonomies', adminTaxonomyRouter);
adminRouter.use('/bookings', adminBookingRouter);
adminRouter.use('/users', adminUserRouter);
adminRouter.use('/newsletter', adminNewsletterRouter);
