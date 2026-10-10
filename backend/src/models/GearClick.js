import { Schema, model } from 'mongoose';
import { toJSONOptions } from './schemaHelpers.js';

const gearClickSchema = new Schema(
  {
    gear: { type: Schema.Types.ObjectId, ref: 'Gear', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: toJSONOptions() },
);

export const GearClick = model('GearClick', gearClickSchema);
