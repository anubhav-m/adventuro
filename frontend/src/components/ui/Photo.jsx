import { useState } from 'react';
import { cn } from '../../lib/cn.js';

// A photo as a plate. Give it a ratio or size with `className`. It is a flat block until the
// photo has loaded, and shows `fallback` when there is no photo or it fails to load.
// `zoom` grows the photo a little while its `group` (the card around it) is hovered, and
// `parallax` lets it drift inside the plate as the page scrolls.
export function Photo({
  image,
  alt,
  fallback,
  lazy = true,
  zoom = false,
  parallax = false,
  className,
}) {
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
            'size-full object-cover transition-[opacity,scale] ease-out',
            zoom
              ? 'duration-(--duration-slow) motion-safe:group-hover:scale-105'
              : 'duration-(--duration-base)',
            parallax && 'parallax-photo',
            loadedUrl === url ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
