import { Router } from 'express';
import { getVerticalByKey, getVerticals } from '../controllers/vertical.controller.js';
import { validate } from '../middlewares/validate.js';
import { verticalKeyParams } from '../validators/vertical.validator.js';

export const verticalRouter = Router();

verticalRouter.get('/', getVerticals);
verticalRouter.get('/:key', validate({ params: verticalKeyParams }), getVerticalByKey);
