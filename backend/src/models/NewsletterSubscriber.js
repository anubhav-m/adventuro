import { Schema, model } from 'mongoose';
import { LIMITS } from '../config/constants.js';
import { toJSONOptions } from './schemaHelpers.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: LIMITS.EMAIL_MAX,
      match: [EMAIL_REGEX, 'Invalid email'],
    },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

export const NewsletterSubscriber = model('NewsletterSubscriber', newsletterSubscriberSchema);
