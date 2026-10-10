import { listSubscribers } from '../../services/admin/newsletter.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAdminNewsletter = async (req, res, next) => {
  try {
    const { subscribers, meta } = await listSubscribers(req.validated.query);
    return sendSuccess(res, { message: 'Subscribers fetched', data: { subscribers }, meta });
  } catch (err) {
    next(err);
  }
};
