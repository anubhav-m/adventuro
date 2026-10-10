import { Counter } from '../models/Counter.js';

export const nextSequence = async (key) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return counter.seq;
};
