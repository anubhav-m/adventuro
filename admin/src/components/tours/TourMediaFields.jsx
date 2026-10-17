import { Controller, useFormContext } from 'react-hook-form';
import { LIMITS, UPLOAD_FOLDER } from '../../lib/constants.js';
import { ImageGallery } from '../forms/ImageGallery.jsx';
import { ImageUploader } from '../forms/ImageUploader.jsx';

// The Media tab: the cover image and the gallery. `session` is the page's upload session.
export function TourMediaFields({ session }) {
  const { control } = useFormContext();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Controller
        name="coverImage"
        control={control}
        render={({ field, fieldState }) => (
          <ImageUploader
            label="Cover image"
            value={field.value}
            onChange={field.onChange}
            folder={UPLOAD_FOLDER.TOURS}
            session={session}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="gallery"
        control={control}
        render={({ field, fieldState }) => (
          <ImageGallery
            label="Gallery"
            value={field.value}
            onChange={field.onChange}
            folder={UPLOAD_FOLDER.TOURS}
            session={session}
            max={LIMITS.GALLERY_MAX}
            error={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
}
