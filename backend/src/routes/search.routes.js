import { Router } from 'express';
import { search } from '../controllers/search.controller.js';
import { searchLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { searchQuery } from '../validators/search.validator.js';

export const searchRouter = Router();

searchRouter.get('/', searchLimiter, validate({ query: searchQuery }), search);
