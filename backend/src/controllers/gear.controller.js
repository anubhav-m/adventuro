import { listActiveGear, recordGearClick } from '../services/gear.service.js';
import { sendSuccess } from '../utils/response.js';

export const getGear = async (req, res, next) => {
  try {
    const { gear, meta } = await listActiveGear(req.validated.query);
    return sendSuccess(res, { message: 'Gear fetched', data: { gear }, meta });
  } catch (err) {
    next(err);
  }
};

export const goToGear = async (req, res, next) => {
  try {
    const affiliateUrl = await recordGearClick(req.validated.params.id, req.user?.id);
    return res.redirect(302, affiliateUrl);
  } catch (err) {
    next(err);
  }
};
