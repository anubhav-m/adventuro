import { Router } from 'express';
import { createUpload, deleteUpload } from '../../controllers/admin/upload.controller.js';
import { receiveImage } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { deleteUploadBody, uploadQuery } from '../../validators/admin/upload.validator.js';

export const adminUploadRouter = Router();

adminUploadRouter.post('/', validate({ query: uploadQuery }), receiveImage, createUpload);
adminUploadRouter.delete('/', validate({ body: deleteUploadBody }), deleteUpload);
