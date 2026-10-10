import { ERROR_CODES, LIMITS } from '../config/constants.js';
import { Tour } from '../models/Tour.js';
import { Vertical } from '../models/Vertical.js';
import { AppError } from '../utils/AppError.js';
import { containsRegex, exactRegex } from '../utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';

const CARD_FIELDS =
  'title slug state destination tagline durationDays difficulty coverImage topActivities startingPrice';
const DETAIL_HIDDEN_FIELDS = '-isPublished -createdAt -updatedAt';
export const VERTICAL_SUMMARY_FIELDS = 'key name code';
const SEARCH_RESULT_FIELDS = 'title slug state destination coverImage startingPrice';
const TEXT_SEARCH_PATHS = ['title', 'state', 'destination'];
const NEWEST_FIRST = { createdAt: -1, _id: -1 };

export const textSearchConditions = (q) => {
  const pattern = containsRegex(q);
  return TEXT_SEARCH_PATHS.map((path) => ({ [path]: pattern }));
};

// Resolves to null when the vertical filter names a vertical that does not exist.
const buildListFilter = async ({ vertical, state, difficulty, q }) => {
  const filter = { isPublished: true };
  if (vertical) {
    const match = await Vertical.findOne({ key: vertical }).select('_id').lean();
    if (!match) return null;
    filter.vertical = match._id;
  }
  if (state) filter.state = exactRegex(state);
  if (difficulty) filter.difficulty = difficulty;
  if (q) filter.$or = textSearchConditions(q);
  return filter;
};

export const listPublishedTours = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildListFilter(query);
  if (!filter) return { tours: [], meta: buildPaginationMeta({ page, limit, total: 0 }) };

  const [tours, total] = await Promise.all([
    Tour.find(filter)
      .select(`${CARD_FIELDS} vertical`)
      .populate('vertical', VERTICAL_SUMMARY_FIELDS)
      .sort(NEWEST_FIRST)
      .skip(skip)
      .limit(limit)
      .lean(),
    Tour.countDocuments(filter),
  ]);
  return { tours: serialize(tours), meta: buildPaginationMeta({ page, limit, total }) };
};

export const getPublishedTourBySlug = async (slug) => {
  const tour = await Tour.findOne({ slug, isPublished: true })
    .select(DETAIL_HIDDEN_FIELDS)
    .populate('vertical', VERTICAL_SUMMARY_FIELDS)
    .lean();
  if (!tour) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Tour not found');
  return serialize(tour);
};

export const listTourCardsForVertical = async (verticalId) => {
  const tours = await Tour.find({ vertical: verticalId, isPublished: true })
    .select(CARD_FIELDS)
    .sort(NEWEST_FIRST)
    .limit(LIMITS.PAGE_LIMIT_MAX)
    .lean();
  return serialize(tours);
};

export const findPublishedTourIds = async (filter) => {
  const tours = await Tour.find({ ...filter, isPublished: true })
    .select('_id')
    .lean();
  return tours.map(({ _id }) => _id);
};

export const searchPublishedTours = async (q) => {
  const tours = await Tour.find({ isPublished: true, $or: textSearchConditions(q) })
    .select(SEARCH_RESULT_FIELDS)
    .sort({ title: 1, _id: 1 })
    .limit(LIMITS.SEARCH_RESULTS_MAX)
    .lean();
  return serialize(tours);
};
