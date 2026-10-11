import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { useCreateBooking } from '../../hooks/mutations/useCreateBooking.js';
import { useMe } from '../../hooks/queries/useMe.js';
import { getBookingDefaults, getStartDateBounds } from '../../lib/bookingDefaults.js';
import { getVerticalMeta, ROUTES } from '../../lib/constants.js';
import { getFieldError } from '../../lib/errors.js';
import { formatDuration } from '../../lib/format.js';
import { withNext } from '../../lib/next.js';
import { bookingSchema } from '../../lib/schemas.js';
import { bookingIntent } from '../../lib/storage.js';
import { TierSelector } from '../tours/TierSelector.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { InlineError } from '../ui/InlineError.jsx';
import { Input } from '../ui/Input.jsx';
import { PriceSummary } from './PriceSummary.jsx';
import { RecommendedGear } from './RecommendedGear.jsx';
import { TravelerStepper } from './TravelerStepper.jsx';

// Booking needs a signed-in user with a complete profile. Anyone else is sent to get one.
const getGate = (user) => {
  if (!user) return ROUTES.SIGN_IN;
  return user.profileComplete ? null : ROUTES.ONBOARDING;
};

// Package, travelers and start date for one tour. `tierId` is the package the Book link named.
// A visitor who has to sign in first leaves their choices behind as the booking intent, and
// finds them here again on the way back.
export function BookingForm({ tour, tierId: linkedTierId }) {
  const { pathname, search } = useLocation();
  const me = useMe();
  const createBooking = useCreateBooking();
  const [gate, setGate] = useState(null);
  const [defaultValues] = useState(() =>
    getBookingDefaults(tour, { intent: bookingIntent.restore(), tierId: linkedTierId }),
  );
  const { register, handleSubmit, setValue, control, formState } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues,
  });
  const [tierId, travelers] = useWatch({ control, name: ['tierId', 'travelers'] });

  // The intent is restored once: it has been read into the form by now.
  useEffect(() => {
    bookingIntent.clear();
  }, []);

  if (gate) return <Navigate to={gate} />;
  if (createBooking.isSuccess) {
    return <Navigate to={ROUTES.booking(createBooking.data.bookingNumber)} replace />;
  }

  const { icon: VerticalIcon } = getVerticalMeta(tour.vertical.key);
  const { error } = createBooking;
  const startDateError = formState.errors.startDate?.message ?? getFieldError(error, 'startDate');

  const submit = (values) => {
    const gatePath = getGate(me.data);
    if (gatePath) {
      bookingIntent.save({ tourSlug: tour.slug, ...values });
      setGate(withNext(gatePath, `${pathname}${search}`));
    } else {
      createBooking.mutate({ tourId: tour.id, ...values });
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      data-vertical={tour.vertical.key}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-start gap-2">
        <Badge tone="accent" icon={VerticalIcon}>
          {tour.vertical.name}
        </Badge>
        <p className="text-h4 leading-tight font-extrabold">{tour.title}</p>
        <p className="text-sm font-medium text-text-muted">
          {formatDuration(tour.durationDays)} · {tour.destination}, {tour.state}
        </p>
      </div>
      <TierSelector tiers={tour.tiers} value={tierId} onChange={(id) => setValue('tierId', id)} />
      <TravelerStepper value={travelers} onChange={(count) => setValue('travelers', count)} />
      <Field
        label="Start date"
        hint="Any day from tomorrow, up to a year ahead."
        error={startDateError}
      >
        {(fieldProps) => (
          <Input type="date" {...getStartDateBounds()} {...fieldProps} {...register('startDate')} />
        )}
      </Field>
      <RecommendedGear tourSlug={tour.slug} />
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-col gap-4 border-t border-border bg-surface-raised px-5 py-4 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
        <PriceSummary tier={tour.tiers.find((tier) => tier.id === tierId)} travelers={travelers} />
        {error && !startDateError && <InlineError error={error} />}
        <Button type="submit" loading={createBooking.isPending} disabled={me.isPending}>
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
