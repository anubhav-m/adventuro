import { BookingsTable } from '../components/bookings/BookingsTable.jsx';
import { FILTER_TYPE, FilterBar } from '../components/data/FilterBar.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { useBookings } from '../hooks/queries/useBookings.js';
import { useAllTours } from '../hooks/queries/useTours.js';
import { useVerticals } from '../hooks/queries/useVerticals.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { BOOKING_STATUS_OPTIONS } from '../lib/constants.js';
import { toListParams } from '../lib/listParams.js';

const DEFAULTS = Object.freeze({
  q: '',
  status: '',
  vertical: '',
  tour: '',
  from: '',
  to: '',
  page: '1',
});

const RANGE_MESSAGE = 'Pick a “Booked from” day on or before the “Booked to” day.';

export function BookingsPage() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  // The server refuses a range that ends before it starts, so it is not asked.
  const rangeIsValid = !filters.from || !filters.to || filters.from <= filters.to;
  const bookings = useBookings(toListParams(filters), { enabled: rangeIsValid });
  const verticals = useVerticals();
  const tours = useAllTours();

  const fields = [
    {
      key: 'q',
      label: 'Search',
      type: FILTER_TYPE.SEARCH,
      placeholder: 'No., name, phone, email',
    },
    { key: 'status', label: 'Status', type: FILTER_TYPE.SELECT, options: BOOKING_STATUS_OPTIONS },
    {
      key: 'vertical',
      label: 'Vertical',
      type: FILTER_TYPE.SELECT,
      options: (verticals.data ?? []).map(({ key, name }) => ({ value: key, label: name })),
    },
    {
      key: 'tour',
      label: 'Tour',
      type: FILTER_TYPE.SELECT,
      options: (tours.data ?? []).map(({ id, title }) => ({ value: id, label: title })),
    },
    { key: 'from', label: 'Booked from', type: FILTER_TYPE.DATE },
    { key: 'to', label: 'Booked to', type: FILTER_TYPE.DATE },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every booking, newest first. Booked days are Indian time."
      />
      <FilterBar label="Booking filters" defaults={DEFAULTS} fields={fields} />
      {rangeIsValid ? (
        <QueryBoundary query={bookings} skeleton={<BookingsTable />} isEmpty={() => false}>
          {({ bookings: rows, meta }) => (
            <BookingsTable
              rows={rows}
              pagination={{ ...meta, onPageChange: (page) => setFilters({ page }) }}
            />
          )}
        </QueryBoundary>
      ) : (
        <p role="alert" className="text-sm font-bold text-danger">
          {RANGE_MESSAGE}
        </p>
      )}
    </>
  );
}
