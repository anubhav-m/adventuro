import { Schema, model } from 'mongoose';
import { LIMITS, SLUG_REGEX } from '../config/constants.js';
import { imageSchema, integerValidator, isHttpsUrl, toJSONOptions } from './schemaHelpers.js';

const price = { type: Number, required: true, min: 1, validate: integerValidator };
const taxonomyRef = { type: Schema.Types.ObjectId, ref: 'Taxonomy' };

const gearSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: LIMITS.SHORT_TEXT_MAX },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: LIMITS.SLUG_MAX,
      match: [SLUG_REGEX, 'Invalid slug'],
    },
    shortDescription: { type: String, trim: true, maxlength: LIMITS.SHORT_TEXT_MAX, default: '' },
    description: { type: String, trim: true, maxlength: LIMITS.LONG_TEXT_MAX, default: '' },
    images: { type: [imageSchema], default: [] },
    mrp: price,
    salePrice: price,
    affiliateUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: LIMITS.URL_MAX,
      validate: { validator: isHttpsUrl, message: 'Affiliate URL must be https' },
    },
    category: { ...taxonomyRef, required: true },
    climates: { type: [taxonomyRef], default: [] },
    tags: { type: [taxonomyRef], default: [] },
    tours: { type: [{ type: Schema.Types.ObjectId, ref: 'Tour' }], default: [] },
    isActive: { type: Boolean, default: true },
    clickCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

gearSchema.index({ isActive: 1, category: 1 });
gearSchema.index({ tours: 1 });

gearSchema.pre('validate', function checkSalePrice() {
  if (this.salePrice > this.mrp) {
    this.invalidate('salePrice', 'Sale price must not exceed MRP');
  }
});

export const Gear = model('Gear', gearSchema);
