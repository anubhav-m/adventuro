import mongoose from 'mongoose';

// `.lean()` results skip the models' toJSON transforms, so this applies the same contract:
// `_id` becomes a string `id` and `__v` is dropped, at every nesting level.
export const serialize = (value) => {
  if (Array.isArray(value)) return value.map(serialize);
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;

  const { _id, __v, ...rest } = value;
  const fields = Object.fromEntries(
    Object.entries(rest).map(([key, nested]) => [key, serialize(nested)]),
  );
  return _id === undefined ? fields : { id: String(_id), ...fields };
};
