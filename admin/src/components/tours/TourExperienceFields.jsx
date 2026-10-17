import { Controller, useFormContext } from 'react-hook-form';
import { LIMITS } from '../../lib/constants.js';
import { StringListEditor } from '../forms/StringListEditor.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';

// The Experience tab. Every tour has a signature activity: travel is experienced, not visited.
export function TourExperienceFields() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-bold">Signature activity</legend>
        <p className="text-sm text-text-muted">
          The one moment the trip is built around, like parasailing in Goa or an ATV ride over the
          dunes. Every tour needs one.
        </p>
        <Field label="Activity" error={errors.signatureActivity?.title?.message}>
          {(controlProps) => (
            <Input
              {...controlProps}
              maxLength={LIMITS.SHORT_TEXT_MAX}
              {...register('signatureActivity.title')}
            />
          )}
        </Field>
        <Field label="What happens" error={errors.signatureActivity?.description?.message}>
          {(controlProps) => (
            <Textarea
              {...controlProps}
              maxLength={LIMITS.LONG_TEXT_MAX}
              {...register('signatureActivity.description')}
            />
          )}
        </Field>
      </fieldset>
      <Controller
        name="topActivities"
        control={control}
        render={({ field, fieldState }) => (
          <StringListEditor
            label="Top activities"
            itemLabel="Activity"
            addLabel="Add activity"
            placeholder="Sunset kayaking"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error}
          />
        )}
      />
    </div>
  );
}
