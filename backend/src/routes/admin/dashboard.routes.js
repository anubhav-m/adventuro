import { Router } from 'express';
import { getAdminDashboard } from '../../controllers/admin/dashboard.controller.js';
import { validate } from '../../middlewares/validate.js';
import { dashboardQuery } from '../../validators/admin/dashboard.validator.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', validate({ query: dashboardQuery }), getAdminDashboard);
