import { Schema, model } from 'mongoose';
import { LIMITS, PHONE_REGEX, ROLES, THEME } from '../config/constants.js';
import { toJSONOptions } from './schemaHelpers.js';

const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: LIMITS.EMAIL_MAX,
    },
    name: { type: String, trim: true, maxlength: LIMITS.NAME_MAX, default: '' },
    avatarUrl: { type: String, trim: true, maxlength: LIMITS.URL_MAX, default: null },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [PHONE_REGEX, 'Invalid phone number'],
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    themePreference: { type: String, enum: Object.values(THEME), default: THEME.SYSTEM },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: toJSONOptions(['googleId']) },
);

userSchema.virtual('profileComplete').get(function profileComplete() {
  return Boolean(this.name && this.phone);
});

export const User = model('User', userSchema);
