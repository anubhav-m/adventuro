import { getVertical, updateVertical } from '../../services/admin/vertical.service.js';
import { listVerticals } from '../../services/vertical.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminVerticals = async (_req, res, next) => {
  try {
    const verticals = await listVerticals();
    return sendSuccess(res, { message: 'Verticals fetched', data: { verticals } });
  } catch (err) {
    next(err);
  }
};

export const getAdminVertical = async (req, res, next) => {
  try {
    const vertical = await getVertical(req.validated.params.id);
    return sendSuccess(res, { message: 'Vertical fetched', data: { vertical } });
  } catch (err) {
    next(err);
  }
};

export const patchAdminVertical = async (req, res, next) => {
  try {
    const vertical = await updateVertical(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: 'Vertical updated', data: { vertical } });
  } catch (err) {
    next(err);
  }
};
