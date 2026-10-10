import { Router } from 'express';
import { getAdminUser, getAdminUsers } from '../../controllers/admin/user.controller.js';
import { validate } from '../../middlewares/validate.js';
import { listAdminUsersQuery } from '../../validators/admin/user.validator.js';
import { idParams } from '../../validators/common.js';

export const adminUserRouter = Router();

adminUserRouter.get('/', validate({ query: listAdminUsersQuery }), getAdminUsers);
adminUserRouter.get('/:id', validate({ params: idParams }), getAdminUser);
