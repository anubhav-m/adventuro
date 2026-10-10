import { Router } from 'express';
import {
  deleteAdminTour,
  getAdminTour,
  getAdminTours,
  patchAdminTour,
  postAdminTour,
} from '../../controllers/admin/tour.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  createTourBody,
  listAdminToursQuery,
  updateTourBody,
} from '../../validators/admin/tour.validator.js';
import { idParams } from '../../validators/common.js';

export const adminTourRouter = Router();

adminTourRouter.get('/', validate({ query: listAdminToursQuery }), getAdminTours);
adminTourRouter.post('/', validate({ body: createTourBody }), postAdminTour);
adminTourRouter.get('/:id', validate({ params: idParams }), getAdminTour);
adminTourRouter.patch('/:id', validate({ params: idParams, body: updateTourBody }), patchAdminTour);
adminTourRouter.delete('/:id', validate({ params: idParams }), deleteAdminTour);
