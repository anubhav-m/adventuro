import { Router } from 'express';
import {
  deleteAdminGear,
  getAdminGear,
  getAdminGearList,
  patchAdminGear,
  postAdminGear,
} from '../../controllers/admin/gear.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  createGearBody,
  listAdminGearQuery,
  updateGearBody,
} from '../../validators/admin/gear.validator.js';
import { idParams } from '../../validators/common.js';

export const adminGearRouter = Router();

adminGearRouter.get('/', validate({ query: listAdminGearQuery }), getAdminGearList);
adminGearRouter.post('/', validate({ body: createGearBody }), postAdminGear);
adminGearRouter.get('/:id', validate({ params: idParams }), getAdminGear);
adminGearRouter.patch('/:id', validate({ params: idParams, body: updateGearBody }), patchAdminGear);
adminGearRouter.delete('/:id', validate({ params: idParams }), deleteAdminGear);
