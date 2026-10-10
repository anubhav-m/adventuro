import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { ERROR_CODES, IMAGE_EXTENSIONS, LIMITS, UPLOAD_FIELD } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

const SIZE_LIMIT_CODE = 'LIMIT_FILE_SIZE';

const parseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITS.UPLOAD_BYTES, files: 1 },
}).single(UPLOAD_FIELD);

// The size limit goes to the error handler (413). Any other parse failure (wrong field
// name, extra files, a broken multipart body) is the client's mistake, so it is a 400.
const receiveFile = (req, res, next) =>
  parseUpload(req, res, (err) => {
    if (!err || err.code === SIZE_LIMIT_CODE) return next(err);
    return next(
      new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid upload', [
        { field: UPLOAD_FIELD, message: 'Send exactly one file in this field' },
      ]),
    );
  });

// The type comes from the file's own bytes; the client's filename and MIME type are ignored.
const sniffImage = async (req, _res, next) => {
  try {
    const detected = req.file && (await fileTypeFromBuffer(req.file.buffer));
    const ext = IMAGE_EXTENSIONS[detected?.mime];
    if (!ext) {
      throw new AppError(
        400,
        ERROR_CODES.INVALID_FILE,
        'Only JPEG, PNG or WebP images are allowed',
      );
    }
    req.image = { buffer: req.file.buffer, ext, mime: detected.mime };
    next();
  } catch (err) {
    next(err);
  }
};

export const receiveImage = [receiveFile, sniffImage];
