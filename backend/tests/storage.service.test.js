import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../src/config/logger.js';
import {
  deleteImages,
  deleteOrphanedImages,
  imagePaths,
  uploadImage,
} from '../src/services/storage.service.js';
import { bucket, publicUrl, resetBucket, supabaseModule } from './helpers/supabaseMock.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const PNG_TYPE = { ext: 'png', mime: 'image/png' };

beforeEach(() => {
  resetBucket();
  vi.restoreAllMocks();
});

describe('uploadImage', () => {
  it('uploads to the configured bucket under a fresh uuid each time', async () => {
    const buffer = Buffer.from('bytes');

    const first = await uploadImage(buffer, 'tours', PNG_TYPE);
    const second = await uploadImage(buffer, 'tours', PNG_TYPE);

    expect(supabaseModule.supabase.storage.from).toHaveBeenCalledWith('test-bucket');
    expect(first.path).toMatch(/^tours\/[a-f0-9-]{36}\.png$/);
    expect(first.url).toBe(publicUrl(first.path));
    expect(second.path).not.toBe(first.path);
  });

  it('throws when storage rejects the upload, keeping the cause', async () => {
    const storageError = new Error('quota exceeded');
    bucket.upload.mockResolvedValue({ data: null, error: storageError });

    await expect(uploadImage(Buffer.from('x'), 'gear', PNG_TYPE)).rejects.toMatchObject({
      message: 'Image upload failed',
      cause: storageError,
    });
    expect(bucket.getPublicUrl).not.toHaveBeenCalled();
  });
});

describe('deleteImages', () => {
  it('removes the given paths in one call', async () => {
    await deleteImages(['tours/a.png', 'gear/b.webp']);

    expect(bucket.remove).toHaveBeenCalledTimes(1);
    expect(bucket.remove).toHaveBeenCalledWith(['tours/a.png', 'gear/b.webp']);
  });

  it('ignores empty, null and undefined paths', async () => {
    await deleteImages(['tours/a.png', '', null, undefined]);

    expect(bucket.remove).toHaveBeenCalledWith(['tours/a.png']);
  });

  it('does not call storage when there is nothing to delete', async () => {
    await deleteImages([]);
    await deleteImages([null, undefined, '']);

    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('logs and resolves when storage returns an error', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const storageError = new Error('not found');
    bucket.remove.mockResolvedValue({ data: null, error: storageError });

    await expect(deleteImages(['tours/a.png'])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      { err: storageError, paths: ['tours/a.png'] },
      'Image cleanup failed',
    );
  });

  it('logs and resolves when the storage call itself throws', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    bucket.remove.mockRejectedValue(new Error('network down'));

    await expect(deleteImages(['tours/a.png'])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('imagePaths / deleteOrphanedImages', () => {
  it('collects the paths of images that have one', () => {
    const images = [
      { url: 'https://a.example/1', path: 'tours/1.png' },
      null,
      { url: 'https://picsum.photos/1', path: null },
      { url: 'https://a.example/2', path: 'tours/2.png' },
    ];

    expect(imagePaths(images)).toEqual(['tours/1.png', 'tours/2.png']);
  });

  it('deletes only the previous paths that are no longer referenced', async () => {
    await deleteOrphanedImages(
      ['tours/kept.png', 'tours/dropped.png'],
      [{ path: 'tours/kept.png' }, { path: 'tours/new.png' }, null],
    );

    expect(bucket.remove).toHaveBeenCalledWith(['tours/dropped.png']);
  });

  it('deletes nothing when every previous image is still referenced', async () => {
    await deleteOrphanedImages(['tours/kept.png'], [{ path: 'tours/kept.png' }]);

    expect(bucket.remove).not.toHaveBeenCalled();
  });
});
