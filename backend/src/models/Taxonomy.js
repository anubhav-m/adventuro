import { Schema, model } from 'mongoose';
import { LIMITS, SLUG_REGEX, TAXONOMY_TYPE } from '../config/constants.js';
import { toJSONOptions } from './schemaHelpers.js';

const taxonomySchema = new Schema(
  {
    type: { type: String, required: true, enum: Object.values(TAXONOMY_TYPE) },
    name: { type: String, required: true, trim: true, maxlength: LIMITS.NAME_MAX },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: LIMITS.SLUG_MAX,
      match: [SLUG_REGEX, 'Invalid slug'],
    },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

taxonomySchema.index({ type: 1, slug: 1 }, { unique: true });

export const Taxonomy = model('Taxonomy', taxonomySchema);
