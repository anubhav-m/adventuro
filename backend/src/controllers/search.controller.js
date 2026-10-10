import { searchCatalog } from '../services/search.service.js';
import { sendSuccess } from '../utils/response.js';

export const search = async (req, res, next) => {
  try {
    const data = await searchCatalog(req.validated.query.q);
    return sendSuccess(res, { message: 'Search results fetched', data });
  } catch (err) {
    next(err);
  }
};
