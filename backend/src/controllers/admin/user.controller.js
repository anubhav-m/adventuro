import { getUserWithBookings, listUsers } from '../../services/admin/user.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminUsers = async (req, res, next) => {
  try {
    const { users, meta } = await listUsers(req.validated.query);
    return sendSuccess(res, { message: 'Users fetched', data: { users }, meta });
  } catch (err) {
    next(err);
  }
};

export const getAdminUser = async (req, res, next) => {
  try {
    const { user, bookings } = await getUserWithBookings(req.validated.params.id);
    return sendSuccess(res, { message: 'User fetched', data: { user, bookings } });
  } catch (err) {
    next(err);
  }
};
