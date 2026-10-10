import { Schema, model } from 'mongoose';
import { toJSONOptions } from './schemaHelpers.js';

const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions() },
);

export const Counter = model('Counter', counterSchema);
