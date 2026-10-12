import { BOOKING_STATUS, VERTICAL_INKS } from '../../lib/constants.js';
import { formatCompactPrice, formatNumber, formatPrice } from '../../lib/format.js';
import { CategoryChart } from '../data/CategoryChart.jsx';
import { ChartCard } from '../data/ChartCard.jsx';

const countLines = (row) => [{ label: 'Bookings', value: formatNumber(row.value) }];
const valueLines = (row) => [{ label: 'Booking value', value: formatPrice(row.value) }];

const isFlat = (bars) => bars.every((bar) => bar.value === 0);

// Where the range's bookings came from: by vertical (count, then value) and by status.
// Every bar is in its vertical's or its status's ink, and named on the axis.
export function BreakdownCharts({ bookingsByVertical, bookingsByStatus }) {
  const verticalBars = (figure) =>
    bookingsByVertical.map((row) => ({
      label: row.vertical.name,
      value: row[figure],
      ink: VERTICAL_INKS[row.vertical.key],
    }));
  const bookingBars = verticalBars('bookings');
  const valueBars = verticalBars('value');
  const statusBars = Object.entries(BOOKING_STATUS).map(([status, { label, ink }]) => ({
    label,
    value: bookingsByStatus[status],
    ink,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ChartCard
        title="Bookings by vertical"
        columns={['Vertical', 'Bookings']}
        rows={bookingBars.map((bar) => [bar.label, formatNumber(bar.value)])}
        empty={isFlat(bookingBars)}
      >
        <CategoryChart data={bookingBars} formatValue={formatNumber} tooltipLines={countLines} />
      </ChartCard>
      <ChartCard
        title="Booking value by vertical"
        description="Confirmed and completed bookings."
        columns={['Vertical', 'Booking value']}
        rows={valueBars.map((bar) => [bar.label, formatPrice(bar.value)])}
        empty={isFlat(valueBars)}
      >
        <CategoryChart
          data={valueBars}
          formatValue={formatCompactPrice}
          tooltipLines={valueLines}
        />
      </ChartCard>
      <ChartCard
        title="Bookings by status"
        columns={['Status', 'Bookings']}
        rows={statusBars.map((bar) => [bar.label, formatNumber(bar.value)])}
        empty={isFlat(statusBars)}
        className="md:col-span-2 xl:col-span-1"
      >
        <CategoryChart data={statusBars} formatValue={formatNumber} tooltipLines={countLines} />
      </ChartCard>
    </div>
  );
}
