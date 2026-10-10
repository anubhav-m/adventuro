import { Schema } from 'mongoose';
import { LIMITS } from '../config/constants.js';

export const toJSONOptions = (hiddenFields = []) => ({
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    if (ret._id !== undefined) ret.id = String(ret._id);
    delete ret._id;
    hiddenFields.forEach((field) => delete ret[field]);
    return ret;
  },
});

export const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be a whole number',
};

export const isHttpsUrl = (value) => URL.parse(value)?.protocol === 'https:';

export const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: LIMITS.URL_MAX },
    path: { type: String, default: null },
  },
  { _id: false },
);
