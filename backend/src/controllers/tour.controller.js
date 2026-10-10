import { getPublishedTourBySlug, listPublishedTours } from '../services/tour.service.js';
import { sendSuccess } from '../utils/response.js';

export const getTours = async (req, res, next) => {
  try {
    const { tours, meta } = await listPublishedTours(req.validated.query);
    return sendSuccess(res, { message: 'Tours fetched', data: { tours }, meta });
  } catch (err) {
    next(err);
  }
};

export const getTourBySlug = async (req, res, next) => {
  try {
    const tour = await getPublishedTourBySlug(req.validated.params.slug);
    return sendSuccess(res, { message: 'Tour fetched', data: { tour } });
  } catch (err) {
    next(err);
  }
};
