import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';
import { formatDate } from '../../lib/format.js';
import { Price } from '../ui/Price.jsx';
import { BookingStatusBadge } from './BookingStatusBadge.jsx';

// One set of columns for the header and every row, from the tablet layout up.
const COLUMNS =
  'md:grid md:grid-cols-[12rem_minmax(0,1fr)_7.5rem_5.5rem_7rem_7rem] md:items-center md:gap-4 md:px-4';

const HEADINGS = [
  ['Booking'],
  ['Tour'],
  ['Start date'],
  ['Travelers', 'md:text-right'],
  ['Total', 'md:text-right'],
  ['Status'],
];

// A value with its name. The name shows on phones, where a booking is a stacked block; from the
// tablet layout up the header row names the column and the name is for screen readers only.
function Cell({ label, className, children }) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <span className="text-xs font-medium text-text-muted md:sr-only">{label}</span>
      {children}
    </div>
  );
}

// The user's bookings, newest first. Each row opens its ticket; `stale` dims the list while
// another page loads.
export function BookingList({ bookings, stale = false }) {
  return (
    <div className="overflow-hidden rounded-plate border border-border bg-surface">
      <div
        aria-hidden="true"
        className={cn('hidden bg-surface-sunken py-3 text-sm font-bold', COLUMNS)}
      >
        {HEADINGS.map(([heading, className]) => (
          <span key={heading} className={className}>
            {heading}
          </span>
        ))}
      </div>
      <ul
        aria-label="Bookings"
        aria-busy={stale || undefined}
        className={cn(
          'transition-opacity duration-(--duration-base) ease-out',
          stale && 'opacity-60',
        )}
      >
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className={cn(
              'relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 border-t border-border p-4 transition-colors duration-(--duration-fast) ease-out hover:bg-surface-raised max-md:first:border-t-0',
              COLUMNS,
            )}
          >
            <Cell label="Booking" className="max-md:order-1">
              <Link
                to={ROUTES.booking(booking.bookingNumber)}
                className="font-extrabold whitespace-nowrap tabular-nums underline underline-offset-4 after:absolute after:inset-0"
              >
                {booking.bookingNumber}
              </Link>
            </Cell>
            <Cell label="Tour" className="max-md:order-3 max-md:col-span-2">
              <span className="font-bold">{booking.snapshot.tourTitle}</span>
            </Cell>
            <Cell label="Start date" className="tabular-nums max-md:order-4">
              {formatDate(booking.startDate)}
            </Cell>
            <Cell label="Travelers" className="tabular-nums max-md:order-5 md:text-right">
              {booking.travelers}
            </Cell>
            <Cell label="Total" className="max-md:order-6 max-md:col-span-2 md:items-end">
              <Price amount={booking.totalAmount} />
            </Cell>
            <Cell label="Status" className="items-start max-md:order-2 max-md:items-end">
              <BookingStatusBadge status={booking.status} />
            </Cell>
          </li>
        ))}
      </ul>
    </div>
  );
}
