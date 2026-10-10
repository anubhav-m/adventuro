import { Router } from 'express';
import { getGear, goToGear } from '../controllers/gear.controller.js';
import { optionalAuth } from '../middlewares/auth.js';
import { goLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { gearIdParams, listGearQuery } from '../validators/gear.validator.js';

export const gearRouter = Router();

gearRouter.get('/', validate({ query: listGearQuery }), getGear);
gearRouter.get('/:id/go', goLimiter, optionalAuth, validate({ params: gearIdParams }), goToGear);
