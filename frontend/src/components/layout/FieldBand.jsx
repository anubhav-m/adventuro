import { cn } from '../../lib/cn.js';
import { Photo } from '../ui/Photo.jsx';
import { Reveal } from '../ui/Reveal.jsx';

// A full-bleed field of the current vertical's ink: copy on the left and its photo as a plate
// on the right. Without a photo, the vertical's pattern takes that space. The copy and then
// the plate rise in when the band comes on screen.
export function FieldBand({ image, alt, lazy, plateClassName, children }) {
  return (
    <div className="bg-accent text-on-accent">
      <Reveal
        stagger
        className="mx-auto grid max-w-content items-center gap-10 px-(--space-gutter) py-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-16"
      >
        <div className="flex flex-col items-start gap-5">{children}</div>
        <Photo
          image={image}
          alt={alt}
          lazy={lazy}
          parallax
          className={cn(
            'aspect-video w-full border-(length:--border-ink) border-on-accent',
            plateClassName,
          )}
          fallback={
            <div aria-hidden="true" className="size-full bg-accent bg-(image:--pattern-accent)" />
          }
        />
      </Reveal>
    </div>
  );
}
