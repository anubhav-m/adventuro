import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/cn.js';

// A small photo for a table row, or a plain plate when there is none. It is decoration: the
// row's name says what it shows.
export function Thumbnail({ image, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex aspect-[3/2] w-12 shrink-0 items-center justify-center overflow-hidden rounded-plate border border-border bg-surface-sunken text-text-subtle',
        className,
      )}
    >
      {image ? (
        <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageOff size={14} strokeWidth={1.75} />
      )}
    </span>
  );
}
