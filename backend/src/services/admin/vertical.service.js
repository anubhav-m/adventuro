import { ERROR_CODES } from '../../config/constants.js';
import { Vertical } from '../../models/Vertical.js';
import { AppError } from '../../utils/AppError.js';
import { deleteOrphanedImages, imagePaths } from '../storage.service.js';

const findVertical = async (id) => {
  const vertical = await Vertical.findById(id);
  if (!vertical) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Vertical not found');
  return vertical;
};

export const getVertical = async (id) => (await findVertical(id)).toJSON();

export const updateVertical = async (id, changes) => {
  const vertical = await findVertical(id);
  const previousPaths = imagePaths([vertical.heroImage]);

  vertical.set(changes);
  await vertical.save();
  await deleteOrphanedImages(previousPaths, [vertical.heroImage]);
  return vertical.toJSON();
};
