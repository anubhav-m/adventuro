import { Controller, useFormContext } from 'react-hook-form';
import { useVerticals } from '../../hooks/queries/useVerticals.js';
import { useAutoSlug } from '../../hooks/useAutoSlug.js';
import { DIFFICULTY_OPTIONS, LIMITS } from '../../lib/constants.js';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Switch } from '../ui/Switch.jsx';
import { Textarea } from '../ui/Textarea.jsx';

// The Basics tab. The slug follows the title on a new tour (see useAutoSlug).
export function TourBasicsFields({ isNew }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const verticals = useVerticals();
  const { sourceField, slugField, slugHint } = useAutoSlug({ source: 'title', isNew });
  const verticalOptions = (verticals.data ?? []).map(({ id, name }) => ({
    value: id,
    label: name,
  }));

  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {/* Controlled, so the saved vertical shows once the options arrive. */}
      <Controller
        name="vertical"
        control={control}
        render={({ field, fieldState }) => (
          <Field label="Vertical" error={fieldState.error?.message}>
            {(controlProps) => (
              <Select
                {...controlProps}
                {...field}
                options={verticalOptions}
                placeholder={verticals.isPending ? 'Loading…' : 'Choose a vertical'}
              />
            )}
          </Field>
        )}
      />
      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1 sm:pt-6">
            <Switch label="Published" checked={field.value} onChange={field.onChange} />
            <p className="text-xs text-text-muted">
              Customers can see the tour once this is saved.
            </p>
          </div>
        )}
      />
      <Field label="Title" error={errors.title?.message}>
        {(controlProps) => (
          <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...sourceField} />
        )}
      </Field>
      <Field label="Slug" error={errors.slug?.message} hint={slugHint}>
        {(controlProps) => <Input {...controlProps} maxLength={LIMITS.SLUG_MAX} {...slugField} />}
      </Field>
      <Field label="State" error={errors.state?.message}>
        {(controlProps) => (
          <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...register('state')} />
        )}
      </Field>
      <Field label="Destination" error={errors.destination?.message}>
        {(controlProps) => (
          <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...register('destination')} />
        )}
      </Field>
      <Field label="Duration in days" error={errors.durationDays?.message}>
        {(controlProps) => (
          <Input
            {...controlProps}
            type="number"
            inputMode="numeric"
            min={1}
            max={LIMITS.DURATION_DAYS_MAX}
            {...register('durationDays', { valueAsNumber: true })}
          />
        )}
      </Field>
      <Field label="Difficulty" error={errors.difficulty?.message}>
        {(controlProps) => (
          <Select
            {...controlProps}
            options={DIFFICULTY_OPTIONS}
            placeholder="Choose a difficulty"
            {...register('difficulty')}
          />
        )}
      </Field>
      <Field label="Tagline" error={errors.tagline?.message} className="sm:col-span-2">
        {(controlProps) => (
          <Input {...controlProps} maxLength={LIMITS.SHORT_TEXT_MAX} {...register('tagline')} />
        )}
      </Field>
      <Field label="Overview" error={errors.overview?.message} className="sm:col-span-2">
        {(controlProps) => (
          <Textarea
            {...controlProps}
            rows={6}
            maxLength={LIMITS.LONG_TEXT_MAX}
            {...register('overview')}
          />
        )}
      </Field>
    </div>
  );
}
