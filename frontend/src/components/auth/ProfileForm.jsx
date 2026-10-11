import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useUpdateProfile } from '../../hooks/mutations/useUpdateProfile.js';
import { ERROR_MESSAGES, getFieldError } from '../../lib/errors.js';
import { profileSchema } from '../../lib/schemas.js';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { InlineError } from '../ui/InlineError.jsx';
import { Input } from '../ui/Input.jsx';

const PHONE_DIGITS = 10;

// Name and phone, for onboarding and the account page. Saving updates the session in place.
export function ProfileForm({ user, submitLabel }) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name ?? '', phone: user.phone ?? '' },
  });

  const { error } = updateProfile;
  const serverErrors = {
    name: getFieldError(error, 'name'),
    phone:
      error?.code === 'PHONE_TAKEN' ? ERROR_MESSAGES.PHONE_TAKEN : getFieldError(error, 'phone'),
  };
  const isFieldError = Boolean(serverErrors.name ?? serverErrors.phone);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
      className="flex max-w-md flex-col gap-5"
    >
      <Field label="Full name" error={errors.name?.message ?? serverErrors.name}>
        {(control) => <Input autoComplete="name" {...control} {...register('name')} />}
      </Field>
      <Field
        label="Mobile number"
        hint="10 digits, without +91. We use it only for your bookings."
        error={errors.phone?.message ?? serverErrors.phone}
      >
        {(control) => (
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={PHONE_DIGITS}
            {...control}
            {...register('phone')}
          />
        )}
      </Field>
      {error && !isFieldError && <InlineError error={error} />}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={updateProfile.isPending}>
          {submitLabel}
        </Button>
        {updateProfile.isSuccess && (
          <p role="status" className="text-sm font-bold text-success">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
