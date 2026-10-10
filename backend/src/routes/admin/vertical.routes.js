import { Router } from 'express';
import {
  getAdminVertical,
  getAdminVerticals,
  patchAdminVertical,
} from '../../controllers/admin/vertical.controller.js';
import { validate } from '../../middlewares/validate.js';
import { updateVerticalBody } from '../../validators/admin/vertical.validator.js';
import { idParams } from '../../validators/common.js';

export const adminVerticalRouter = Router();

adminVerticalRouter.get('/', getAdminVerticals);
adminVerticalRouter.get('/:id', validate({ params: idParams }), getAdminVertical);
adminVerticalRouter.patch(
  '/:id',
  validate({ params: idParams, body: updateVerticalBody }),
  patchAdminVertical,
);
