import { bookingPath } from '../../lib/constants.js';
import { formatDate, formatPrice } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { TextLink } from '../ui/TextLink.jsx';
import { VerticalChip } from '../ui/VerticalChip.jsx';
import { BookingStatusBadge } from './BookingStatusBadge.jsx';

const NOWRAP = 'whitespace-nowrap tabular-nums';

const BOOKING_COLUMN = {
  key: 'bookingNumber',
  header: 'Booking',
  className: NOWRAP,
  render: (booking) => (
    <TextLink to={bookingPath(booking.bookingNumber)}>{booking.bookingNumber}</TextLink>
  ),
};

const CUSTOMER_COLUMN = {
  key: 'customer',
  header: 'Customer',
  className: 'whitespace-nowrap',
  render: (booking) => booking.contact.name,
};

const TRIP_COLUMNS = [
  {
    key: 'tour',
    header: 'Tour',
    className: 'min-w-52',
    render: (booking) => (
      <span className="flex flex-col gap-0.5">
        {booking.snapshot.tourTitle}
        <VerticalChip vertical={booking.vertical} className="text-xs text-text-muted" />
      </span>
    ),
  },
  {
    key: 'tier',
    header: 'Package',
    className: 'whitespace-nowrap',
    render: (booking) => booking.snapshot.tierName,
  },
  { key: 'travelers', header: 'Travelers', align: 'right' },
  {
    key: 'startDate',
    header: 'Start date',
    className: NOWRAP,
    render: (booking) => formatDate(booking.startDate),
  },
  {
    key: 'totalAmount',
    header: 'Total',
    align: 'right',
    className: 'whitespace-nowrap',
    render: (booking) => formatPrice(booking.totalAmount),
  },
  {
    key: 'status',
    header: 'Status',
    render: (booking) => <BookingStatusBadge status={booking.status} />,
  },
  {
    key: 'createdAt',
    header: 'Booked',
    className: NOWRAP,
    // The day only; the booking's page has the time.
    render: (booking) => formatDate(booking.createdAt),
  },
];

const WITH_CUSTOMER = [BOOKING_COLUMN, CUSTOMER_COLUMN, ...TRIP_COLUMNS];
const WITHOUT_CUSTOMER = [BOOKING_COLUMN, ...TRIP_COLUMNS];

// A list of bookings; each booking number opens its page. `showCustomer` is off where the
// customer is already known (a user's own bookings). Without `rows` it draws placeholder rows.
export function BookingsTable({
  rows,
  pagination,
  caption = 'Bookings',
  showCustomer = true,
  empty = 'No bookings match these filters.',
}) {
  return (
    <DataTable
      caption={caption}
      columns={showCustomer ? WITH_CUSTOMER : WITHOUT_CUSTOMER}
      rows={rows}
      loading={!rows}
      pagination={pagination}
      empty={empty}
    />
  );
}
