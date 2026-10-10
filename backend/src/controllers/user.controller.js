import { updateProfile } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export const updateMe = async (req, res, next) => {
  try {
    const user = await updateProfile(req.user, req.validated.body);
    return sendSuccess(res, { message: 'Profile updated', data: { user } });
  } catch (err) {
    next(err);
  }
};
