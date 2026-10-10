import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { authRouter } from './auth.routes.js';
import { gearRouter } from './gear.routes.js';
import { newsletterRouter } from './newsletter.routes.js';
import { searchRouter } from './search.routes.js';
import { taxonomyRouter } from './taxonomy.routes.js';
import { tourRouter } from './tour.routes.js';
import { userRouter } from './user.routes.js';
import { verticalRouter } from './vertical.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/verticals', verticalRouter);
apiRouter.use('/tours', tourRouter);
apiRouter.use('/gear', gearRouter);
apiRouter.use('/taxonomies', taxonomyRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/newsletter', newsletterRouter);
