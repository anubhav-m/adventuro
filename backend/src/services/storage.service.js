import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { supabase } from '../config/supabase.js';

const CACHE_SECONDS = '31536000';

const bucket = () => supabase.storage.from(env.SUPABASE_BUCKET);

// The object name is always generated here; the client's filename is never used.
export const uploadImage = async (buffer, folder, { ext, mime }) => {
  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await bucket().upload(path, buffer, {
    contentType: mime,
    cacheControl: CACHE_SECONDS,
    upsert: false,
  });
  if (error) throw new Error('Image upload failed', { cause: error });

  const { data } = bucket().getPublicUrl(path);
  return { url: data.publicUrl, path };
};

// Cleanup is best effort: a storage failure is logged and never fails the request.
export const deleteImages = async (paths) => {
  const targets = paths.filter(Boolean);
  if (targets.length === 0) return;
  try {
    const { error } = await bucket().remove(targets);
    if (error) logger.warn({ err: error, paths: targets }, 'Image cleanup failed');
  } catch (err) {
    logger.warn({ err, paths: targets }, 'Image cleanup failed');
  }
};

export const imagePaths = (images) => images.map((image) => image?.path).filter(Boolean);

export const deleteOrphanedImages = (previousPaths, currentImages) => {
  const kept = new Set(imagePaths(currentImages));
  return deleteImages(previousPaths.filter((path) => !kept.has(path)));
};
