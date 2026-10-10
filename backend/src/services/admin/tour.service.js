import { ERROR_CODES } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { Gear } from '../../models/Gear.js';
import { Tour } from '../../models/Tour.js';
import { Vertical } from '../../models/Vertical.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { serialize } from '../../utils/serialize.js';
import { slugFrom } from '../../utils/slugify.js';
import { deleteImages, deleteOrphanedImages, imagePaths } from '../storage.service.js';
import { VERTICAL_SUMMARY_FIELDS, textSearchConditions } from '../tour.service.js';

const LIST_FIELDS =
  'title slug state destination durationDays difficulty coverImage startingPrice isPublished vertical createdAt updatedAt';
const NEWEST_FIRST = { createdAt: -1, _id: -1 };

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, 'Tour not found');

const tourImages = (tour) => [tour.coverImage, ...tour.gallery];

const assertVerticalExists = async (verticalId) => {
  if (await Vertical.exists({ _id: verticalId })) return;
  throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', [
    { field: 'vertical', message: 'Vertical does not exist' },
  ]);
};

// Resolves to null when the vertical filter names a vertical that does not exist.
const buildListFilter = async ({ vertical, q, isPublished }) => {
  const filter = {};
  if (vertical) {
    const match = await Vertical.findOne({ key: vertical }).select('_id').lean();
    if (!match) return null;
    filter.vertical = match._id;
  }
  if (isPublished !== undefined) filter.isPublished = isPublished;
  if (q) filter.$or = textSearchConditions(q);
  return filter;
};

export const listTours = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildListFilter(query);
  if (!filter) return { tours: [], meta: buildPaginationMeta({ page, limit, total: 0 }) };

  const [tours, total] = await Promise.all([
    Tour.find(filter)
      .select(LIST_FIELDS)
      .populate('vertical', VERTICAL_SUMMARY_FIELDS)
      .sort(NEWEST_FIRST)
      .skip(skip)
      .limit(limit)
      .lean(),
    Tour.countDocuments(filter),
  ]);
  return { tours: serialize(tours), meta: buildPaginationMeta({ page, limit, total }) };
};

export const getTour = async (id) => {
  const tour = await Tour.findById(id).populate('vertical', VERTICAL_SUMMARY_FIELDS).lean();
  if (!tour) throw notFound();
  return serialize(tour);
};

export const createTour = async (data) => {
  await assertVerticalExists(data.vertical);
  const tour = await Tour.create({ ...data, slug: slugFrom(data.slug, data.title) });
  return getTour(tour.id);
};

// A tier sent with the id of an existing tier keeps it, so a booking form opened before
// the edit still submits a valid tierId. Any other tier gets a fresh id.
const withTierIds = (tiers, existingTiers) => {
  const reusable = new Set(existingTiers.map(({ id }) => id));
  return tiers.map(({ id, ...tier }) => (id && reusable.delete(id) ? { _id: id, ...tier } : tier));
};

export const updateTour = async (id, { tiers, ...changes }) => {
  const tour = await Tour.findById(id);
  if (!tour) throw notFound();
  if (changes.vertical) await assertVerticalExists(changes.vertical);
  const previousPaths = imagePaths(tourImages(tour));

  tour.set(changes);
  if (tiers) tour.set('tiers', withTierIds(tiers, tour.tiers));
  await tour.save();
  await deleteOrphanedImages(previousPaths, tourImages(tour));
  return getTour(id);
};

export const deleteTour = async (id) => {
  if (await Booking.exists({ tour: id })) {
    throw new AppError(409, ERROR_CODES.RESOURCE_IN_USE, 'Tour has bookings');
  }
  const tour = await Tour.findByIdAndDelete(id).select('coverImage gallery').lean();
  if (!tour) throw notFound();

  await Promise.all([
    Gear.updateMany({ tours: tour._id }, { $pull: { tours: tour._id } }),
    deleteImages(imagePaths(tourImages(tour))),
  ]);
};
