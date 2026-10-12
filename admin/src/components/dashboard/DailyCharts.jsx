import { formatDate, formatNumber, formatPrice } from '../../lib/format.js';
import { ChartCard } from '../data/ChartCard.jsx';
import { TREND_KIND, TrendChart } from '../data/TrendChart.jsx';

const userLines = (row) => [{ label: 'New users', value: formatNumber(row.count) }];

const bookingLines = (row) => [
  { label: 'Bookings', value: formatNumber(row.bookings) },
  { label: 'Booking value', value: formatPrice(row.value) },
];

const isFlat = (days, key) => days.every((day) => day[key] === 0);

// The two day-by-day charts: sign-ups as a line, bookings as bars.
export function DailyCharts({ newUsersPerDay, bookingsPerDay }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="New users per day"
        columns={['Date', 'New users']}
        rows={newUsersPerDay.map((day) => [formatDate(day.date), formatNumber(day.count)])}
        empty={isFlat(newUsersPerDay, 'count')}
      >
        <TrendChart data={newUsersPerDay} dataKey="count" tooltipLines={userLines} />
      </ChartCard>
      <ChartCard
        title="Bookings per day"
        description="Hover a day for its booking value."
        columns={['Date', 'Bookings', 'Booking value']}
        rows={bookingsPerDay.map((day) => [
          formatDate(day.date),
          formatNumber(day.bookings),
          formatPrice(day.value),
        ])}
        empty={isFlat(bookingsPerDay, 'bookings')}
      >
        <TrendChart
          data={bookingsPerDay}
          dataKey="bookings"
          kind={TREND_KIND.BAR}
          tooltipLines={bookingLines}
        />
      </ChartCard>
    </div>
  );
}
