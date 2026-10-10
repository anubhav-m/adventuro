import { getDashboard } from '../../services/admin/dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await getDashboard(req.validated.query);
    return sendSuccess(res, { message: 'Dashboard fetched', data: dashboard });
  } catch (err) {
    next(err);
  }
};
