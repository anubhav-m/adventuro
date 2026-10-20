import { afterEach, beforeEach, vi } from 'vitest';

// jsdom has no object URLs and cannot save files. Call this at the top of a test file: every
// file the app saves is recorded as { filename, blob } in the returned list instead.
export const captureDownloads = () => {
  const downloads = [];
  const blobs = new Map();

  beforeEach(() => {
    downloads.length = 0;
    let next = 0;
    URL.createObjectURL = vi.fn((blob) => {
      next += 1;
      const url = `blob:download-${next}`;
      blobs.set(url, blob);
      return url;
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function save() {
      downloads.push({ filename: this.download, blob: blobs.get(this.href) });
    });
  });

  afterEach(() => {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
    blobs.clear();
    vi.restoreAllMocks();
  });

  return downloads;
};
