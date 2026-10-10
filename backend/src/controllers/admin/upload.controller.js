import { deleteImages, uploadImage } from '../../services/storage.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createUpload = async (req, res, next) => {
  try {
    const { buffer, ...type } = req.image;
    const image = await uploadImage(buffer, req.validated.query.folder, type);
    return sendSuccess(res, { status: 201, message: 'Image uploaded', data: { image } });
  } catch (err) {
    next(err);
  }
};

export const deleteUpload = async (req, res, next) => {
  try {
    await deleteImages([req.validated.body.path]);
    return sendSuccess(res, { message: 'Image removed' });
  } catch (err) {
    next(err);
  }
};
