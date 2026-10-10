import { getVerticalWithTours, listVerticals } from '../services/vertical.service.js';
import { sendSuccess } from '../utils/response.js';

export const getVerticals = async (_req, res, next) => {
  try {
    const verticals = await listVerticals();
    return sendSuccess(res, { message: 'Verticals fetched', data: { verticals } });
  } catch (err) {
    next(err);
  }
};

export const getVerticalByKey = async (req, res, next) => {
  try {
    const data = await getVerticalWithTours(req.validated.params.key);
    return sendSuccess(res, { message: 'Vertical fetched', data });
  } catch (err) {
    next(err);
  }
};
