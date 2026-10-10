import {
  createTour,
  deleteTour,
  getTour,
  listTours,
  updateTour,
} from '../../services/admin/tour.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminTours = async (req, res, next) => {
  try {
    const { tours, meta } = await listTours(req.validated.query);
    return sendSuccess(res, { message: 'Tours fetched', data: { tours }, meta });
  } catch (err) {
    next(err);
  }
};

export const getAdminTour = async (req, res, next) => {
  try {
    const tour = await getTour(req.validated.params.id);
    return sendSuccess(res, { message: 'Tour fetched', data: { tour } });
  } catch (err) {
    next(err);
  }
};

export const postAdminTour = async (req, res, next) => {
  try {
    const tour = await createTour(req.validated.body);
    return sendSuccess(res, { status: 201, message: 'Tour created', data: { tour } });
  } catch (err) {
    next(err);
  }
};

export const patchAdminTour = async (req, res, next) => {
  try {
    const tour = await updateTour(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: 'Tour updated', data: { tour } });
  } catch (err) {
    next(err);
  }
};

export const deleteAdminTour = async (req, res, next) => {
  try {
    await deleteTour(req.validated.params.id);
    return sendSuccess(res, { message: 'Tour deleted' });
  } catch (err) {
    next(err);
  }
};
