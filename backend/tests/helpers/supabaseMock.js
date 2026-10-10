import { randomUUID } from 'node:crypto';
import { vi } from 'vitest';

const PUBLIC_BASE = 'https://test-project.supabase.co/storage/v1/object/public/test-bucket';

// Stand-in for the Supabase storage bucket. Use it in a test file with:
//   vi.mock('../src/config/supabase.js', async () =>
//     (await import('./helpers/supabaseMock.js')).supabaseModule);
export const bucket = { upload: vi.fn(), remove: vi.fn(), getPublicUrl: vi.fn() };

export const supabaseModule = { supabase: { storage: { from: vi.fn(() => bucket) } } };

export const publicUrl = (path) => `${PUBLIC_BASE}/${path}`;

export const resetBucket = () => {
  bucket.upload.mockReset().mockResolvedValue({ data: {}, error: null });
  bucket.remove.mockReset().mockResolvedValue({ data: [], error: null });
  bucket.getPublicUrl
    .mockReset()
    .mockImplementation((path) => ({ data: { publicUrl: publicUrl(path) } }));
};

// An image as the upload endpoint would have returned it.
export const storedImage = (folder, ext = 'webp') => {
  const path = `${folder}/${randomUUID()}.${ext}`;
  return { url: publicUrl(path), path };
};

// Every path passed to bucket.remove across all calls.
export const removedPaths = () => bucket.remove.mock.calls.flatMap(([paths]) => paths);
