import mongoose from 'mongoose';
import { ERROR_CODES } from '../../config/constants.js';
import { Gear } from '../../models/Gear.js';
import { Taxonomy } from '../../models/Taxonomy.js';
import { AppError } from '../../utils/AppError.js';
import { exactRegex } from '../../utils/escapeRegex.js';
import { slugFrom } from '../../utils/slugify.js';

const toResponse = ({ id, type, name, slug }) => ({ id, type, name, slug });

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, 'Taxonomy not found');

// Names are unique per type, ignoring case. The { type, slug } index covers slugs.
const assertNameAvailable = async (type, name, excludeId) => {
  const filter = { type, name: exactRegex(name) };
  if (excludeId) filter._id = mongoose.trusted({ $ne: excludeId });
  if (await Taxonomy.exists(filter)) {
    throw new AppError(409, ERROR_CODES.DUPLICATE, 'A taxonomy with this name already exists');
  }
};

export const createTaxonomy = async ({ type, name, slug }) => {
  await assertNameAvailable(type, name);
  const taxonomy = await Taxonomy.create({ type, name, slug: slugFrom(slug, name) });
  return toResponse(taxonomy);
};

// Renaming keeps the slug (it is used in gear-store URLs) unless a new one is sent.
export const updateTaxonomy = async (id, changes) => {
  const taxonomy = await Taxonomy.findById(id);
  if (!taxonomy) throw notFound();
  if (changes.name) await assertNameAvailable(taxonomy.type, changes.name, taxonomy._id);

  taxonomy.set(changes);
  await taxonomy.save();
  return toResponse(taxonomy);
};

export const deleteTaxonomy = async (id) => {
  const inUse = await Gear.exists({ $or: [{ category: id }, { climates: id }, { tags: id }] });
  if (inUse) {
    throw new AppError(409, ERROR_CODES.RESOURCE_IN_USE, 'Taxonomy is used by gear');
  }
  const taxonomy = await Taxonomy.findByIdAndDelete(id).select('_id').lean();
  if (!taxonomy) throw notFound();
};
