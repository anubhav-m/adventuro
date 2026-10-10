import { Router } from 'express';
import { getTourBySlug, getTours } from '../controllers/tour.controller.js';
import { validate } from '../middlewares/validate.js';
import { listToursQuery, tourSlugParams } from '../validators/tour.validator.js';

export const tourRouter = Router();

tourRouter.get('/', validate({ query: listToursQuery }), getTours);
tourRouter.get('/:slug', validate({ params: tourSlugParams }), getTourBySlug);
