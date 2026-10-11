import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSubscribe } from '../../hooks/mutations/useSubscribe.js';
import { getErrorMessage, getFieldError } from '../../lib/errors.js';
import { newsletterSchema } from '../../lib/schemas.js';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';

// The same words whether the email is new or already subscribed.
const SUCCESS_MESSAGE = "You're on the list!";

export function NewsletterForm() {
  const subscribe = useSubscribe();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(newsletterSchema), defaultValues: { email: '' } });

  const onSubmit = ({ email }) =>
    subscribe.mutate(email, {
      onSuccess: () => {
        reset();
        toast.success(SUCCESS_MESSAGE);
      },
    });

  const serverFieldError = getFieldError(subscribe.error, 'email');
  const fieldError = errors.email?.message ?? serverFieldError;
  const formError = subscribe.isError ? getErrorMessage(subscribe.error) : undefined;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-md">
      <Field label="New trips and gear, by email" error={fieldError ?? formError}>
        {(control) => (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...control}
              {...register('email')}
            />
            <Button type="submit" size="sm" loading={subscribe.isPending} className="sm:h-12">
              Subscribe
            </Button>
          </div>
        )}
      </Field>
    </form>
  );
}
