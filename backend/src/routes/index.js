import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
