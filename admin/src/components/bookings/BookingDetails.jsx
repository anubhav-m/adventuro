import { tourPath, userPath } from '../../lib/constants.js';
import { formatDate, formatDateTime, formatPrice } from '../../lib/format.js';
import { DetailCard } from '../data/DetailCard.jsx';
import { TextLink } from '../ui/TextLink.jsx';
import { VerticalChip } from '../ui/VerticalChip.jsx';
import { BookingStatusBadge } from './BookingStatusBadge.jsx';

const days = (count) => `${count} ${count === 1 ? 'day' : 'days'}`;

// The tour as booked; it links to the tour's editor while that tour still exists.
const tourTitle = ({ tour, snapshot }) =>
  tour ? <TextLink to={tourPath(tour.id)}>{snapshot.tourTitle}</TextLink> : snapshot.tourTitle;

// Everything about one booking, in four plates. The package and price are as booked; the
// reporting details are the tour's current ones.
export function BookingDetails({ booking }) {
  const { snapshot, contact, reporting } = booking;

  const trip = [
    { label: 'Tour', value: tourTitle(booking) },
    { label: 'Vertical', value: <VerticalChip vertical={booking.vertical} /> },
    { label: 'Package', value: snapshot.tierName },
    { label: 'Start date', value: formatDate(booking.startDate) },
    { label: 'Duration', value: days(snapshot.durationDays) },
    { label: 'Travelers', value: booking.travelers },
    {
      label: 'Total',
      value: `${formatPrice(booking.totalAmount)} (${formatPrice(snapshot.pricePerPerson)} × ${booking.travelers})`,
    },
  ];

  const reportingItems = reporting
    ? [
        { label: 'Time', value: reporting.time },
        { label: 'Location', value: reporting.location },
        { label: 'Address', value: reporting.address },
      ]
    : [{ label: 'Reporting', value: 'The tour no longer exists, so there are no details.' }];

  const customer = [
    { label: 'Name', value: <TextLink to={userPath(booking.user)}>{contact.name}</TextLink> },
    {
      label: 'Phone',
      value: <TextLink href={`tel:+91${contact.phone}`}>{contact.phone}</TextLink>,
    },
    {
      label: 'Email',
      value: <TextLink href={`mailto:${contact.email}`}>{contact.email}</TextLink>,
    },
  ];

  const record = [
    { label: 'Status', value: <BookingStatusBadge status={booking.status} /> },
    { label: 'Booked', value: formatDateTime(booking.createdAt) },
    {
      label: 'Status changed',
      value: booking.statusUpdatedAt ? formatDateTime(booking.statusUpdatedAt) : 'Never',
    },
  ];

  return (
    <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
      <DetailCard title="Trip" items={trip} />
      <div className="flex flex-col gap-6">
        <DetailCard title="Customer" items={customer} />
        <DetailCard title="Reporting" items={reportingItems} />
        <DetailCard title="Record" items={record} />
      </div>
    </div>
  );
}
