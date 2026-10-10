import mongoose from 'mongoose';
import { ERROR_CODES, TAXONOMY_TYPE } from '../../config/constants.js';
import { Gear } from '../../models/Gear.js';
import { GearClick } from '../../models/GearClick.js';
import { Taxonomy } from '../../models/Taxonomy.js';
import { Tour } from '../../models/Tour.js';
import { AppError } from '../../utils/AppError.js';
import { containsRegex } from '../../utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { serialize } from '../../utils/serialize.js';
import { slugFrom } from '../../utils/slugify.js';
import { GEAR_SORTS } from '../gear.service.js';
import { deleteImages, deleteOrphanedImages, imagePaths } from '../storage.service.js';

const LIST_FIELDS =
  'name slug images mrp salePrice category isActive clickCount createdAt updatedAt';
const TAXONOMY_FIELDS = 'type name slug';
const TOUR_FIELDS = 'title slug';
const DETAIL_POPULATE = [
  { path: 'category', select: TAXONOMY_FIELDS },
  { path: 'climates', select: TAXONOMY_FIELDS },
  { path: 'tags', select: TAXONOMY_FIELDS },
  { path: 'tours', select: TOUR_FIELDS },
];

// Query parameter → gear path it filters on.
const REFERENCE_FILTERS = Object.freeze({
  category: 'category',
  climate: 'climates',
  tag: 'tags',
  tour: 'tours',
});

// Gear field → the taxonomy type its ids must have.
const TAXONOMY_FIELD_TYPES = Object.freeze({
  category: TAXONOMY_TYPE.CATEGORY,
  climates: TAXONOMY_TYPE.CLIMATE,
  tags: TAXONOMY_TYPE.TAG,
});

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, 'Gear not found');

const idsIn = (data, field) => [data[field] ?? []].flat();

const buildListFilter = (query) => {
  const filter = {};
  if (query.q) filter.name = containsRegex(query.q);
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  Object.entries(REFERENCE_FILTERS).forEach(([param, path]) => {
    if (query[param]) filter[path] = query[param];
  });
  return filter;
};

export const listGear = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildListFilter(query);

  const [gear, total] = await Promise.all([
    Gear.find(filter)
      .select(LIST_FIELDS)
      .populate('category', TAXONOMY_FIELDS)
      .sort(GEAR_SORTS[query.sort])
      .skip(skip)
      .limit(limit)
      .lean(),
    Gear.countDocuments(filter),
  ]);
  return { gear: serialize(gear), meta: buildPaginationMeta({ page, limit, total }) };
};

export const getGear = async (id) => {
  const gear = await Gear.findById(id).populate(DETAIL_POPULATE).lean();
  if (!gear) throw notFound();
  return serialize(gear);
};

// Every taxonomy id must exist with the type its field expects, and every tour must exist.
const assertReferences = async (data) => {
  const taxonomyIds = Object.keys(TAXONOMY_FIELD_TYPES).flatMap((field) => idsIn(data, field));
  const tourIds = idsIn(data, 'tours');
  const [taxonomies, tourCount] = await Promise.all([
    Taxonomy.find({ _id: mongoose.trusted({ $in: taxonomyIds }) })
      .select('type')
      .lean(),
    Tour.countDocuments({ _id: mongoose.trusted({ $in: tourIds }) }),
  ]);

  const typeById = new Map(taxonomies.map(({ _id, type }) => [String(_id), type]));
  const errors = Object.entries(TAXONOMY_FIELD_TYPES)
    .filter(([field, type]) => idsIn(data, field).some((id) => typeById.get(id) !== type))
    .map(([field, type]) => ({ field, message: `Must reference an existing ${type}` }));
  if (tourCount !== tourIds.length) {
    errors.push({ field: 'tours', message: 'Must reference existing tours' });
  }
  if (errors.length > 0) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', errors);
  }
};

export const createGear = async (data) => {
  await assertReferences(data);
  const gear = await Gear.create({ ...data, slug: slugFrom(data.slug, data.name) });
  return getGear(gear.id);
};

export const updateGear = async (id, changes) => {
  const gear = await Gear.findById(id);
  if (!gear) throw notFound();
  await assertReferences(changes);
  const previousPaths = imagePaths(gear.images);

  gear.set(changes);
  await gear.save();
  await deleteOrphanedImages(previousPaths, gear.images);
  return getGear(id);
};

export const deleteGear = async (id) => {
  const gear = await Gear.findByIdAndDelete(id).select('images').lean();
  if (!gear) throw notFound();

  await Promise.all([
    GearClick.deleteMany({ gear: gear._id }),
    deleteImages(imagePaths(gear.images)),
  ]);
};
