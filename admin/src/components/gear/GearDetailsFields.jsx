import { Controller, useFormContext } from 'react-hook-form';
import { useAutoSlug } from '../../hooks/useAutoSlug.js';
import { LIMITS, UPLOAD_FOLDER } from '../../lib/constants.js';
import { FormSection } from '../forms/FormSection.jsx';
import { ImageGallery } from '../forms/ImageGallery.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';

// What the item is: its name, slug, descriptions and images. The first image leads its card.
export function GearDetailsFields({ isNew, session }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const { sourceField, slugField, slugHint } = useAutoSlug({ source: 'name', isNew });

  return (
    <FormSection title="Details">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          {(controlProps) => (
            <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...sourceField} />
          )}
        </Field>
        <Field label="Slug" error={errors.slug?.message} hint={slugHint}>
          {(controlProps) => <Input {...controlProps} maxLength={LIMITS.SLUG_MAX} {...slugField} />}
        </Field>
      </div>
      <Field label="Short description" error={errors.shortDescription?.message}>
        {(controlProps) => (
          <Input
            {...controlProps}
            maxLength={LIMITS.SHORT_TEXT_MAX}
            {...register('shortDescription')}
          />
        )}
      </Field>
      <Field label="Description" error={errors.description?.message}>
        {(controlProps) => (
          <Textarea
            {...controlProps}
            rows={6}
            maxLength={LIMITS.LONG_TEXT_MAX}
            {...register('description')}
          />
        )}
      </Field>
      <Controller
        name="images"
        control={control}
        render={({ field, fieldState }) => (
          <ImageGallery
            label="Images"
            value={field.value}
            onChange={field.onChange}
            folder={UPLOAD_FOLDER.GEAR}
            session={session}
            max={LIMITS.GEAR_IMAGES_MAX}
            error={fieldState.error?.message}
          />
        )}
      />
    </FormSection>
  );
}
