import { BOOKING_STATUS } from '../../lib/constants.js';
import { formatDateTime, formatNumber, formatPrice } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { Badge } from '../ui/Badge.jsx';
import { VerticalChip } from '../ui/VerticalChip.jsx';
import { DashboardSection } from './DashboardSection.jsx';

const NOWRAP = 'whitespace-nowrap';

const TOP_TOUR_COLUMNS = [
  { key: 'title', header: 'Tour' },
  {
    key: 'bookings',
    header: 'Bookings',
    align: 'right',
    render: (row) => formatNumber(row.bookings),
  },
  {
    key: 'value',
    header: 'Booking value',
    align: 'right',
    render: (row) => formatPrice(row.value),
  },
];

const TOP_GEAR_COLUMNS = [
  { key: 'name', header: 'Gear' },
  { key: 'clicks', header: 'Clicks', align: 'right', render: (row) => formatNumber(row.clicks) },
];

const RECENT_BOOKING_COLUMNS = [
  {
    key: 'bookingNumber',
    header: 'Booking',
    className: `${NOWRAP} font-bold tabular-nums`,
  },
  { key: 'customer', header: 'Customer', className: NOWRAP, render: (row) => row.contact.name },
  { key: 'tour', header: 'Tour', className: 'min-w-44', render: (row) => row.snapshot.tourTitle },
  {
    key: 'vertical',
    header: 'Vertical',
    render: (row) => <VerticalChip vertical={row.vertical} />,
  },
  { key: 'travelers', header: 'Travelers', align: 'right' },
  {
    key: 'totalAmount',
    header: 'Booking value',
    align: 'right',
    render: (row) => formatPrice(row.totalAmount),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={BOOKING_STATUS[row.status].tone}>{BOOKING_STATUS[row.status].label}</Badge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Booked',
    className: `${NOWRAP} tabular-nums`,
    render: (row) => formatDateTime(row.createdAt),
  },
];

// The dashboard's three lists: top tours, top gear, and the latest bookings.
export function DashboardTables({ topTours, topGear, recentBookings }) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection title="Top tours by bookings">
          <DataTable
            caption="Top tours by bookings"
            columns={TOP_TOUR_COLUMNS}
            rows={topTours}
            getRowKey={(row) => row.tourId}
            empty="No bookings in this range."
          />
        </DashboardSection>
        <DashboardSection title="Top gear by affiliate clicks">
          <DataTable
            caption="Top gear by affiliate clicks"
            columns={TOP_GEAR_COLUMNS}
            rows={topGear}
            getRowKey={(row) => row.gearId}
            empty="No affiliate clicks in this range."
          />
        </DashboardSection>
      </div>
      <DashboardSection title="Recent bookings">
        <DataTable
          caption="Recent bookings"
          columns={RECENT_BOOKING_COLUMNS}
          rows={recentBookings}
          empty="No bookings in this range."
        />
      </DashboardSection>
    </>
  );
}
