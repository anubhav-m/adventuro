import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { serialize } from '../../utils/serialize.js';

export const listSubscribers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const [subscribers, total] = await Promise.all([
    NewsletterSubscriber.find()
      .select('email createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NewsletterSubscriber.countDocuments(),
  ]);
  return { subscribers: serialize(subscribers), meta: buildPaginationMeta({ page, limit, total }) };
};
