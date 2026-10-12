import { CalendarRange } from 'lucide-react';
import { BreakdownCharts } from '../components/dashboard/BreakdownCharts.jsx';
import { DailyCharts } from '../components/dashboard/DailyCharts.jsx';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton.jsx';
import { DashboardStats } from '../components/dashboard/DashboardStats.jsx';
import { DashboardTables } from '../components/dashboard/DashboardTables.jsx';
import { DateRangePicker } from '../components/dashboard/DateRangePicker.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useDashboard } from '../hooks/queries/useDashboard.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { DASHBOARD_FILTER_DEFAULTS, resolveDashboardRange } from '../lib/dashboardRange.js';
import { formatDate } from '../lib/format.js';

// The response always has every section, zero-filled, so there is no empty state to show.
const neverEmpty = () => false;

export function DashboardPage() {
  const { filters, setFilters } = useUrlFilters(DASHBOARD_FILTER_DEFAULTS);
  const range = resolveDashboardRange(filters);
  const isValid = Object.keys(range.errors).length === 0;
  const dashboard = useDashboard(range, { enabled: isValid });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          isValid
            ? `${formatDate(range.from)} to ${formatDate(range.to)}, by Indian time.`
            : 'Choose a range to see its figures.'
        }
        actions={<DateRangePicker filters={filters} range={range} onChange={setFilters} />}
      />
      {isValid ? (
        <QueryBoundary query={dashboard} skeleton={<DashboardSkeleton />} isEmpty={neverEmpty}>
          {(data) => (
            <>
              <DashboardStats totals={data.totals} />
              <DailyCharts
                newUsersPerDay={data.newUsersPerDay}
                bookingsPerDay={data.bookingsPerDay}
              />
              <BreakdownCharts
                bookingsByVertical={data.bookingsByVertical}
                bookingsByStatus={data.bookingsByStatus}
              />
              <DashboardTables
                topTours={data.topTours}
                topGear={data.topGear}
                recentBookings={data.recentBookings}
              />
            </>
          )}
        </QueryBoundary>
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="That range can’t be shown."
          description="Fix the dates above, or pick one of the preset ranges."
        />
      )}
    </>
  );
}
