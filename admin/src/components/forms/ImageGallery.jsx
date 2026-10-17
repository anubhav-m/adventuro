import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useListKeys } from '../../hooks/useListKeys.js';
import { moveItem, removeAt } from '../../lib/list.js';
import { FieldError } from '../ui/Field.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { ImageUploader } from './ImageUploader.jsx';

const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1 };

// An ordered set of images: `value` is [{ url, path }] and `onChange` receives the next one.
// Each image moves with its buttons, or with the arrow keys while it has focus; focus follows
// the image and the new position is announced. New images are added at the end, up to `max`.
export function ImageGallery({ label, value, onChange, folder, session, max, error }) {
  const { keys, add, remove, move } = useListKeys(value.length);
  const items = useRef(new Map());
  const focusKey = useRef(null);
  const [announcement, setAnnouncement] = useState('');
  const labelId = useId();
  const hintId = useId();

  useEffect(() => {
    if (focusKey.current === null) return;
    items.current.get(focusKey.current)?.focus();
    focusKey.current = null;
  });

  const moveImage = (from, to) => {
    if (to < 0 || to >= value.length) return;
    focusKey.current = keys[from];
    move(from, to);
    onChange(moveItem(value, from, to));
    setAnnouncement(`Image moved to position ${to + 1} of ${value.length}.`);
  };

  const removeImage = (index) => {
    session.release(value[index]);
    remove(index);
    onChange(removeAt(value, index));
    setAnnouncement(`Image removed. ${value.length - 1} left.`);
  };

  const handleKeyDown = (event, index) => {
    const step = KEY_STEPS[event.key];
    if (!step || event.target !== event.currentTarget) return;
    event.preventDefault();
    moveImage(index, index + step);
  };

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span id={labelId} className="text-sm font-bold">
          {label}
        </span>
        <p id={hintId} className="text-xs text-text-muted">
          {value.length > 1
            ? `${value.length} of ${max}. Focus an image and press the left or right arrow key to move it.`
            : `${value.length} of ${max}.`}
        </p>
      </div>
      {value.length > 0 && (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {value.map((image, index) => {
            const name = `image ${index + 1}`;
            return (
              <li
                key={keys[index]}
                ref={(node) => {
                  if (node) items.current.set(keys[index], node);
                  else items.current.delete(keys[index]);
                }}
                tabIndex={0}
                aria-label={`Image ${index + 1} of ${value.length}`}
                aria-describedby={hintId}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className="flex flex-col gap-1.5 rounded-plate border border-border bg-surface p-1.5 focus-visible:border-text"
              >
                <img
                  src={image.url}
                  alt=""
                  className="aspect-[3/2] w-full rounded-plate bg-surface-sunken object-cover"
                />
                <div className="flex justify-between">
                  <div className="flex">
                    <IconButton
                      icon={ArrowLeft}
                      label={`Move ${name} earlier`}
                      disabled={index === 0}
                      onClick={() => moveImage(index, index - 1)}
                    />
                    <IconButton
                      icon={ArrowRight}
                      label={`Move ${name} later`}
                      disabled={index === value.length - 1}
                      onClick={() => moveImage(index, index + 1)}
                    />
                  </div>
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    label={`Remove ${name}`}
                    onClick={() => removeImage(index)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {value.length < max && (
        <ImageUploader
          label={`Add to ${label.toLowerCase()}`}
          uploadLabel="Add image"
          value={null}
          folder={folder}
          session={session}
          onChange={(image) => {
            add();
            onChange([...value, image]);
          }}
        />
      )}
      {error && <FieldError>{error}</FieldError>}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
