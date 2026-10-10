import { Schema, model } from 'mongoose';
import { DIFFICULTY, LIMITS, SLUG_REGEX, TIME_REGEX } from '../config/constants.js';
import { imageSchema, integerValidator, toJSONOptions } from './schemaHelpers.js';

const shortText = { type: String, trim: true, maxlength: LIMITS.SHORT_TEXT_MAX };
const longText = { type: String, trim: true, maxlength: LIMITS.LONG_TEXT_MAX };

const tierSchema = new Schema(
  {
    name: { ...shortText, required: true, maxlength: LIMITS.NAME_MAX },
    description: { ...shortText, default: '' },
    pricePerPerson: { type: Number, required: true, min: 1, validate: integerValidator },
  },
  { toJSON: toJSONOptions() },
);

const itineraryDaySchema = new Schema(
  {
    day: { type: Number, required: true, min: 1, validate: integerValidator },
    title: { ...shortText, required: true },
    description: { ...longText, default: '' },
  },
  { _id: false },
);

const signatureActivitySchema = new Schema(
  {
    title: { ...shortText, required: true },
    description: { ...longText, required: true },
  },
  { _id: false },
);

const reportingSchema = new Schema(
  {
    location: { ...shortText, required: true },
    address: { ...shortText, default: '' },
    time: { type: String, required: true, match: [TIME_REGEX, 'Time must be HH:mm'] },
  },
  { _id: false },
);

const hasValidTierCount = (tiers) =>
  tiers.length >= LIMITS.TIERS_MIN && tiers.length <= LIMITS.TIERS_MAX;

const hasUniqueTierNames = (tiers) =>
  new Set(tiers.map(({ name }) => String(name).trim().toLowerCase())).size === tiers.length;

const hasSequentialDays = (days) => days.every(({ day }, index) => day === index + 1);

const minTierPrice = (tiers) => Math.min(...tiers.map(({ pricePerPerson }) => pricePerPerson));

const tourSchema = new Schema(
  {
    vertical: { type: Schema.Types.ObjectId, ref: 'Vertical', required: true },
    title: { ...shortText, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: LIMITS.SLUG_MAX,
      match: [SLUG_REGEX, 'Invalid slug'],
    },
    state: { ...shortText, required: true },
    destination: { ...shortText, required: true },
    tagline: { ...shortText, default: '' },
    overview: { ...longText, required: true },
    durationDays: { type: Number, required: true, min: 1, validate: integerValidator },
    difficulty: { type: String, required: true, enum: Object.values(DIFFICULTY) },
    coverImage: { type: imageSchema, default: null },
    gallery: { type: [imageSchema], default: [] },
    topActivities: { type: [shortText], default: [] },
    signatureActivity: { type: signatureActivitySchema, required: true },
    itinerary: {
      type: [itineraryDaySchema],
      default: [],
      validate: {
        validator: hasSequentialDays,
        message: 'Itinerary days must be sequential starting from 1',
      },
    },
    inclusions: { type: [shortText], default: [] },
    exclusions: { type: [shortText], default: [] },
    tiers: {
      type: [tierSchema],
      validate: [
        {
          validator: hasValidTierCount,
          message: `A tour needs ${LIMITS.TIERS_MIN}–${LIMITS.TIERS_MAX} tiers`,
        },
        { validator: hasUniqueTierNames, message: 'Tier names must be unique' },
      ],
    },
    reporting: { type: reportingSchema, required: true },
    startingPrice: { type: Number, min: 1 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

tourSchema.index({ vertical: 1, isPublished: 1 });
tourSchema.index({ state: 1 });

tourSchema.pre('save', function syncStartingPrice() {
  this.startingPrice = minTierPrice(this.tiers);
});

// Covers updates that replace the whole tiers array (directly or via $set), which is how
// services write tiers. Validators are forced on so tier and itinerary rules hold on updates.
tourSchema.pre('findOneAndUpdate', function syncStartingPriceOnUpdate() {
  this.setOptions({ runValidators: true });
  const update = this.getUpdate();
  const tiers = update?.$set?.tiers ?? update?.tiers;
  if (Array.isArray(tiers) && tiers.length > 0) {
    this.set('startingPrice', minTierPrice(tiers));
  }
});

export const Tour = model('Tour', tourSchema);
