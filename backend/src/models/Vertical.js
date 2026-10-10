import { Schema, model } from 'mongoose';
import { LIMITS, VERTICAL_CODES, VERTICAL_KEYS } from '../config/constants.js';
import { imageSchema, toJSONOptions } from './schemaHelpers.js';

const verticalSchema = new Schema(
  {
    key: { type: String, required: true, enum: VERTICAL_KEYS, unique: true },
    code: { type: String, required: true, enum: VERTICAL_CODES, unique: true },
    name: { type: String, required: true, trim: true, maxlength: LIMITS.NAME_MAX },
    subtitle: { type: String, trim: true, maxlength: LIMITS.SHORT_TEXT_MAX, default: '' },
    description: { type: String, trim: true, maxlength: LIMITS.LONG_TEXT_MAX, default: '' },
    heroImage: { type: imageSchema, default: null },
    order: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

export const Vertical = model('Vertical', verticalSchema);
