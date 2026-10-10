import { ERROR_CODES } from '../config/constants.js';
import { Vertical } from '../models/Vertical.js';
import { AppError } from '../utils/AppError.js';
import { serialize } from '../utils/serialize.js';
import { listTourCardsForVertical } from './tour.service.js';

const VERTICAL_FIELDS = 'key code name subtitle description heroImage order';

export const listVerticals = async () => {
  const verticals = await Vertical.find().select(VERTICAL_FIELDS).sort({ order: 1 }).lean();
  return serialize(verticals);
};

export const getVerticalWithTours = async (key) => {
  const vertical = await Vertical.findOne({ key }).select(VERTICAL_FIELDS).lean();
  if (!vertical) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Vertical not found');
  const tours = await listTourCardsForVertical(vertical._id);
  return { vertical: serialize(vertical), tours };
};
