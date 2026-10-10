import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAgent } from './helpers/authAgent.js';
import { createUser } from './helpers/factories.js';
import { bucket, publicUrl, resetBucket, storedImage } from './helpers/supabaseMock.js';

vi.mock(
  '../src/config/supabase.js',
  async () => (await import('./helpers/supabaseMock.js')).supabaseModule,
);

const BASE = '/api/v1/admin/uploads';
const UUID_PATH = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
  Buffer.alloc(32),
]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(32)]);

let admin;

const upload = (file, { folder = 'tours', filename = 'photo.png', field = 'image' } = {}) =>
  authAgent(admin).post(BASE).query({ folder }).attach(field, file, filename);

const remove = (body) => authAgent(admin).delete(BASE).send(body);

beforeEach(async () => {
  resetBucket();
  admin = await createUser({ role: 'admin' });
});

describe('POST /api/v1/admin/uploads', () => {
  it('stores a valid png under {folder}/{uuid}.png and returns its url and path', async () => {
    const res = await upload(PNG, { filename: '../../My Holiday Photo.PNG' });

    expect(res.status).toBe(201);
    const { path } = res.body.data.image;
    const [folder, file] = path.split('/');
    const [name, ext] = file.split('.');
    expect(folder).toBe('tours');
    expect(name).toMatch(UUID_PATH);
    expect(ext).toBe('png');
    expect(res.body).toEqual({
      success: true,
      message: 'Image uploaded',
      data: { image: { url: publicUrl(path), path } },
    });

    expect(bucket.upload).toHaveBeenCalledTimes(1);
    const [storedPath, storedBuffer, options] = bucket.upload.mock.calls[0];
    expect(storedPath).toBe(path);
    expect(storedBuffer.equals(PNG)).toBe(true);
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });
  });

  it.each([
    ['jpeg', JPEG, 'jpg', 'image/jpeg'],
    ['webp', WEBP, 'webp', 'image/webp'],
  ])('accepts %s and names it by its real type', async (_label, file, ext, mime) => {
    const res = await upload(file, { folder: 'gear', filename: 'wrong-name.png' });

    expect(res.status).toBe(201);
    expect(res.body.data.image.path).toMatch(new RegExp(`^gear/[a-f0-9-]{36}\\.${ext}$`));
    expect(bucket.upload.mock.calls[0][2].contentType).toBe(mime);
  });

  it.each(['tours', 'gear', 'verticals'])('accepts the %s folder', async (folder) => {
    const res = await upload(PNG, { folder });

    expect(res.status).toBe(201);
    expect(res.body.data.image.path.startsWith(`${folder}/`)).toBe(true);
  });

  it('rejects a text file named .png with 400 INVALID_FILE', async () => {
    const res = await upload(Buffer.from('just some text, not an image'), {
      filename: 'photo.png',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Only JPEG, PNG or WebP images are allowed',
      code: 'INVALID_FILE',
    });
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it('rejects a real image of a type that is not allowed (gif)', async () => {
    const res = await upload(GIF, { filename: 'photo.png' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_FILE');
  });

  it('rejects a request with no file', async () => {
    const res = await authAgent(admin).post(BASE).query({ folder: 'tours' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_FILE');
  });

  it('rejects a 6 MB file with 413 FILE_TOO_LARGE', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);

    const res = await upload(big);

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      success: false,
      message: 'File is too large',
      code: 'FILE_TOO_LARGE',
    });
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it.each(['users', '../tours', 'tours/nested', ''])(
    'rejects folder "%s" with 400',
    async (folder) => {
      const res = await upload(PNG, { folder });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toEqual([{ field: 'folder', message: expect.any(String) }]);
      expect(bucket.upload).not.toHaveBeenCalled();
    },
  );

  it('rejects a missing folder with 400', async () => {
    const res = await authAgent(admin).post(BASE).attach('image', PNG, 'photo.png');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a file sent under another field name with 400', async () => {
    const res = await upload(PNG, { field: 'avatar' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ field: 'image', message: expect.any(String) }]);
  });

  it('answers 500 INTERNAL_ERROR without storage details when storage fails', async () => {
    bucket.upload.mockResolvedValue({ data: null, error: new Error('bucket secret-internal') });

    const res = await upload(PNG);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });
  });
});

describe('DELETE /api/v1/admin/uploads', () => {
  it('removes the object at a valid path', async () => {
    const { path } = storedImage('gear', 'png');

    const res = await remove({ path });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Image removed' });
    expect(bucket.remove).toHaveBeenCalledWith([path]);
  });

  it.each([
    ['a parent-directory segment', 'tours/../secrets/00000000-0000-4000-8000-000000000000.png'],
    ['a leading ../', '../tours/00000000-0000-4000-8000-000000000000.png'],
    ['a foreign prefix', 'avatars/00000000-0000-4000-8000-000000000000.png'],
    ['no folder', '00000000-0000-4000-8000-000000000000.png'],
    ['an absolute path', '/tours/00000000-0000-4000-8000-000000000000.png'],
    ['a nested folder', 'tours/deep/00000000-0000-4000-8000-000000000000.png'],
    ['an extension that is not an image', 'tours/00000000-0000-4000-8000-000000000000.exe'],
    ['a name that was not generated here', 'tours/cover.png'],
  ])('rejects %s with 400 and deletes nothing', async (_label, path) => {
    const res = await remove({ path });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ field: 'path', message: 'Invalid image path' }]);
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('rejects a missing path and unknown keys', async () => {
    const { path } = storedImage('tours');

    expect((await remove({})).status).toBe(400);
    const res = await remove({ path, bucket: 'other' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'bucket', message: 'Unknown field' }]);
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('still succeeds when storage reports an error (cleanup is best effort)', async () => {
    bucket.remove.mockResolvedValue({ data: null, error: new Error('gone') });

    const res = await remove({ path: storedImage('tours').path });

    expect(res.status).toBe(200);
  });
});
