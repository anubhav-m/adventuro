import { useFormContext } from 'react-hook-form';
import { LIMITS } from '../../lib/constants.js';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';

// The Reporting tab. Tickets read these live, so a change reaches bookings already made.
export function TourReportingFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-[1fr_12rem]">
      <p className="text-sm text-text-muted sm:col-span-2">
        Shown on every ticket for this tour, including tickets already issued.
      </p>
      <Field label="Location" error={errors.reporting?.location?.message}>
        {(controlProps) => (
          <Input
            {...controlProps}
            maxLength={LIMITS.SHORT_TEXT_MAX}
            {...register('reporting.location')}
          />
        )}
      </Field>
      <Field
        label="Reporting time"
        hint="24-hour time in India."
        error={errors.reporting?.time?.message}
      >
        {(controlProps) => <Input {...controlProps} type="time" {...register('reporting.time')} />}
      </Field>
      <Field label="Address" error={errors.reporting?.address?.message} className="sm:col-span-2">
        {(controlProps) => (
          <Input
            {...controlProps}
            maxLength={LIMITS.SHORT_TEXT_MAX}
            {...register('reporting.address')}
          />
        )}
      </Field>
    </div>
  );
}
