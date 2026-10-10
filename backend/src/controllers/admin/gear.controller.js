import {
  createGear,
  deleteGear,
  getGear,
  listGear,
  updateGear,
} from '../../services/admin/gear.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminGearList = async (req, res, next) => {
  try {
    const { gear, meta } = await listGear(req.validated.query);
    return sendSuccess(res, { message: 'Gear fetched', data: { gear }, meta });
  } catch (err) {
    next(err);
  }
};

export const getAdminGear = async (req, res, next) => {
  try {
    const gear = await getGear(req.validated.params.id);
    return sendSuccess(res, { message: 'Gear fetched', data: { gear } });
  } catch (err) {
    next(err);
  }
};

export const postAdminGear = async (req, res, next) => {
  try {
    const gear = await createGear(req.validated.body);
    return sendSuccess(res, { status: 201, message: 'Gear created', data: { gear } });
  } catch (err) {
    next(err);
  }
};

export const patchAdminGear = async (req, res, next) => {
  try {
    const gear = await updateGear(req.validated.params.id, req.validated.body);
    return sendSuccess(res, { message: 'Gear updated', data: { gear } });
  } catch (err) {
    next(err);
  }
};

export const deleteAdminGear = async (req, res, next) => {
  try {
    await deleteGear(req.validated.params.id);
    return sendSuccess(res, { message: 'Gear deleted' });
  } catch (err) {
    next(err);
  }
};
