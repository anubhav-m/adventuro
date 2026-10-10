import mongoose from 'mongoose';
import { ERROR_CODES, GEAR_SORT, LIMITS, TAXONOMY_TYPE } from '../config/constants.js';
import { Gear } from '../models/Gear.js';
import { GearClick } from '../models/GearClick.js';
import { Taxonomy } from '../models/Taxonomy.js';
import { Vertical } from '../models/Vertical.js';
import { AppError } from '../utils/AppError.js';
import { containsRegex } from '../utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { findPublishedTourIds } from './tour.service.js';

const CARD_FIELDS = 'name slug shortDescription images mrp salePrice category climates tags';
const TAXONOMY_FIELDS = 'name slug';
const TAXONOMY_PATHS = ['category', 'climates', 'tags'];
const SEARCH_RESULT_FIELDS = 'name slug images mrp salePrice';

export const GEAR_SORTS = Object.freeze({
  [GEAR_SORT.NEWEST]: { createdAt: -1, _id: -1 },
  [GEAR_SORT.PRICE_ASC]: { salePrice: 1, _id: 1 },
  [GEAR_SORT.PRICE_DESC]: { salePrice: -1, _id: 1 },
  [GEAR_SORT.POPULAR]: { clickCount: -1, _id: 1 },
});

// Each condition builder resolves to null when its filter value matches nothing,
// which makes the whole listing empty.
const taxonomyCondition = async (path, type, slug) => {
  const taxonomy = await Taxonomy.findOne({ type, slug }).select('_id').lean();
  return taxonomy ? { [path]: taxonomy._id } : null;
};

const tourCondition = async (slug) => {
  const [tourId] = await findPublishedTourIds({ slug });
  return tourId ? { tours: tourId } : null;
};

const verticalCondition = async (key) => {
  const vertical = await Vertical.findOne({ key }).select('_id').lean();
  if (!vertical) return null;
  const tourIds = await findPublishedTourIds({ vertical: vertical._id });
  return tourIds.length > 0 ? { tours: mongoose.trusted({ $in: tourIds }) } : null;
};

const buildListFilter = async ({ q, category, climate, tag, tour, vertical }) => {
  const lookups = [
    category && taxonomyCondition('category', TAXONOMY_TYPE.CATEGORY, category),
    climate && taxonomyCondition('climates', TAXONOMY_TYPE.CLIMATE, climate),
    tag && taxonomyCondition('tags', TAXONOMY_TYPE.TAG, tag),
    tour && tourCondition(tour),
    vertical && verticalCondition(vertical),
  ].filter(Boolean);

  const conditions = await Promise.all(lookups);
  if (conditions.includes(null)) return null;
  return {
    $and: [{ isActive: true }, ...(q ? [{ name: containsRegex(q) }] : []), ...conditions],
  };
};

export const listActiveGear = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildListFilter(query);
  if (!filter) return { gear: [], meta: buildPaginationMeta({ page, limit, total: 0 }) };

  const [gear, total] = await Promise.all([
    Gear.find(filter)
      .select(CARD_FIELDS)
      .populate(TAXONOMY_PATHS.map((path) => ({ path, select: TAXONOMY_FIELDS })))
      .sort(GEAR_SORTS[query.sort])
      .skip(skip)
      .limit(limit)
      .lean(),
    Gear.countDocuments(filter),
  ]);
  return { gear: serialize(gear), meta: buildPaginationMeta({ page, limit, total }) };
};

export const searchActiveGear = async (q) => {
  const gear = await Gear.find({ isActive: true, name: containsRegex(q) })
    .select(SEARCH_RESULT_FIELDS)
    .sort({ name: 1, _id: 1 })
    .limit(LIMITS.SEARCH_RESULTS_MAX)
    .lean();
  return serialize(gear);
};

// Counts the click and returns the stored affiliate URL. The redirect target only ever
// comes from this lookup, never from the request.
export const recordGearClick = async (gearId, userId) => {
  const gear = await Gear.findOneAndUpdate(
    { _id: gearId, isActive: true },
    { $inc: { clickCount: 1 } },
    { timestamps: false },
  )
    .select('affiliateUrl')
    .lean();
  if (!gear) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Gear not found');

  await GearClick.create({ gear: gear._id, user: userId ?? null });
  return gear.affiliateUrl;
};
