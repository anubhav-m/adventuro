import { Router } from 'express';
import { updateMe } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateMeBody } from '../validators/user.validator.js';

export const userRouter = Router();

userRouter.patch('/me', requireAuth, validate({ body: updateMeBody }), updateMe);
