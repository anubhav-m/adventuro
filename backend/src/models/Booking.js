import { Schema, model } from 'mongoose';
import { BOOKING_STATUS, LIMITS, PHONE_REGEX, VERTICAL_CODES } from '../config/constants.js';
import { formatDateOnly, parseDateOnly } from '../utils/dates.js';
import { integerValidator, toJSONOptions } from './schemaHelpers.js';

const isUtcMidnight = (date) => parseDateOnly(formatDateOnly(date))?.getTime() === date.getTime();

const snapshotSchema = new Schema(
  {
    tourTitle: { type: String, required: true },
    verticalName: { type: String, required: true },
    verticalCode: { type: String, required: true, enum: VERTICAL_CODES },
    tierName: { type: String, required: true },
    pricePerPerson: { type: Number, required: true, min: 1, validate: integerValidator },
    durationDays: { type: Number, required: true, min: 1, validate: integerValidator },
  },
  { _id: false },
);

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: [PHONE_REGEX, 'Invalid phone number'] },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    vertical: { type: Schema.Types.ObjectId, ref: 'Vertical', required: true },
    snapshot: { type: snapshotSchema, required: true },
    travelers: {
      type: Number,
      required: true,
      min: LIMITS.TRAVELERS_MIN,
      max: LIMITS.TRAVELERS_MAX,
      validate: integerValidator,
    },
    startDate: {
      type: Date,
      required: true,
      validate: { validator: isUtcMidnight, message: 'Start date must be a calendar date' },
    },
    totalAmount: { type: Number, required: true, min: 1, validate: integerValidator },
    contact: { type: contactSchema, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
    },
    statusUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ vertical: 1 });

export const Booking = model('Booking', bookingSchema);
