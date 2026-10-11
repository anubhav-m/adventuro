import { Download } from 'lucide-react';
import { Link } from 'react-router';
import { useDownloadTicket } from '../../hooks/mutations/useDownloadTicket.js';
import { BRAND, getVerticalMeta, ROUTES } from '../../lib/constants.js';
import { formatDate, formatDuration, formatPrice } from '../../lib/format.js';
import { ReportingDetails } from '../tours/ReportingDetails.jsx';
import { Button } from '../ui/Button.jsx';
import { InlineError } from '../ui/InlineError.jsx';
import { Price } from '../ui/Price.jsx';
import { BookingStatusBadge } from './BookingStatusBadge.jsx';

const TERM = 'text-sm font-bold text-text-muted';
const VALUE = 'font-bold';

// What the traveler carries on the day: one plate, split by a dashed rule into the trip and a
// stub. Tier and price are the booking's own snapshot; reporting details are the tour's
// current ones.
export function Ticket({ booking }) {
  const { bookingNumber, snapshot, contact, reporting, travelers } = booking;
  const download = useDownloadTicket(bookingNumber);
  const VerticalIcon = getVerticalMeta(booking.vertical?.key)?.icon;
  const facts = [
    ['Package', snapshot.tierName],
    ['Travelers', travelers],
    ['Start date', formatDate(booking.startDate)],
    ['Duration', formatDuration(snapshot.durationDays)],
  ];

  return (
    <article
      data-vertical={booking.vertical?.key}
      className="overflow-hidden rounded-plate border border-border bg-surface"
    >
      <p className="flex items-center justify-between gap-4 bg-accent px-5 py-3 text-sm font-extrabold text-on-accent sm:px-8">
        <span className="flex items-center gap-2">
          {VerticalIcon && <VerticalIcon size={18} strokeWidth={1.75} aria-hidden="true" />}
          {snapshot.verticalName}
        </span>
        <span>{BRAND.NAME} ticket</span>
      </p>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8 p-5 sm:p-8">
          <div className="flex flex-col items-start gap-3">
            <p className={TERM}>Booking number</p>
            <h1 className="text-h3 leading-tight font-extrabold break-all tabular-nums sm:text-h2">
              {bookingNumber}
            </h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          {reporting ? (
            <ReportingDetails reporting={reporting} />
          ) : (
            <p className="text-text-muted">
              Reporting details for this trip are not available right now.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-4">
              <dt className={TERM}>Tour</dt>
              <dd className="text-h4 leading-tight font-extrabold">
                {booking.tour ? (
                  <Link
                    to={ROUTES.tour(booking.tour.slug)}
                    className="underline underline-offset-4"
                  >
                    {snapshot.tourTitle}
                  </Link>
                ) : (
                  snapshot.tourTitle
                )}
              </dd>
            </div>
            {facts.map(([term, value]) => (
              <div key={term}>
                <dt className={TERM}>{term}</dt>
                <dd className={`${VALUE} tabular-nums`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-6 border-t border-dashed border-border-strong p-5 sm:p-8 lg:border-t-0 lg:border-l">
          <dl className="flex flex-col gap-5">
            <div>
              <dt className={TERM}>Total</dt>
              <dd>
                <Price amount={booking.totalAmount} className="text-h3" />
              </dd>
              <dd className="text-sm text-text-muted tabular-nums">
                {formatPrice(snapshot.pricePerPerson)} × {travelers}
              </dd>
            </div>
            <div>
              <dt className={TERM}>Traveler contact</dt>
              <dd className={VALUE}>{contact.name}</dd>
              <dd className="tabular-nums">+91 {contact.phone}</dd>
              <dd className="break-all text-text-muted">{contact.email}</dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-col gap-3">
            <Button icon={Download} loading={download.isPending} onClick={() => download.mutate()}>
              Download PDF
            </Button>
            {download.error && <InlineError error={download.error} />}
          </div>
        </div>
      </div>
    </article>
  );
}
