import { useState } from 'react';
import { cn } from '../../lib/cn.js';

// A person's photo, or their initial on a flat field when there is no photo or it fails to load.
export function Avatar({ name, src, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showPhoto = Boolean(src) && failedSrc !== src;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-accent text-sm font-extrabold text-on-accent uppercase',
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        (name.trim()[0] ?? '?')
      )}
    </span>
  );
}
