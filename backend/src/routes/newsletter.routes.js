import { Router } from 'express';
import { subscribeToNewsletter } from '../controllers/newsletter.controller.js';
import { newsletterLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { subscribeBody } from '../validators/newsletter.validator.js';

export const newsletterRouter = Router();

newsletterRouter.post(
  '/',
  newsletterLimiter,
  validate({ body: subscribeBody }),
  subscribeToNewsletter,
);
