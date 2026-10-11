import { useState } from 'react';
import { cn } from '../../lib/cn.js';

// A photo as a plate. Give it a ratio or size with `className`. It is a flat block until the
// photo has loaded, and shows `fallback` when there is no photo or it fails to load.
export function Photo({ image, alt, fallback, lazy = true, className }) {
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const url = image?.url;
  const showPhoto = Boolean(url) && failedUrl !== url;

  return (
    <div className={cn('overflow-hidden rounded-plate bg-surface-raised', className)}>
      {showPhoto ? (
        <img
          src={url}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          onLoad={() => setLoadedUrl(url)}
          onError={() => setFailedUrl(url)}
          className={cn(
            'size-full object-cover transition-opacity duration-(--duration-base) ease-out',
            loadedUrl === url ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
