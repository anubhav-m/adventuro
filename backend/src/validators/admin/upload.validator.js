import { z } from 'zod';
import { UPLOAD_FOLDERS } from '../../config/constants.js';
import { imagePath } from '../common.js';

export const uploadQuery = z.object({ folder: z.enum(UPLOAD_FOLDERS) });

export const deleteUploadBody = z.object({ path: imagePath }).strict();
