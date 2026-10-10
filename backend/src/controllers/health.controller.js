import { sendSuccess } from '../utils/response.js';

export const getHealth = async (_req, res, next) => {
  try {
    return sendSuccess(res, { message: 'OK', data: { uptime: Math.round(process.uptime()) } });
  } catch (err) {
    next(err);
  }
};
