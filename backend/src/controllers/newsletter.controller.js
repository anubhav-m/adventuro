import { subscribe } from '../services/newsletter.service.js';
import { sendSuccess } from '../utils/response.js';

export const subscribeToNewsletter = async (req, res, next) => {
  try {
    await subscribe(req.validated.body.email);
    return sendSuccess(res, { message: 'Subscribed to the newsletter' });
  } catch (err) {
    next(err);
  }
};
