import { IndianRupee, Mail, Ticket, UserPlus, Users } from 'lucide-react';
import { formatNumber, formatPrice } from '../../lib/format.js';
import { StatCard } from '../data/StatCard.jsx';

const IN_RANGE = 'In this range';
const ALL_TIME = 'All time';

export function DashboardStats({ totals }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Total users"
        value={formatNumber(totals.users)}
        hint={ALL_TIME}
        icon={Users}
      />
      <StatCard
        label="New users"
        value={formatNumber(totals.newUsers)}
        hint={IN_RANGE}
        icon={UserPlus}
      />
      <StatCard
        label="Bookings"
        value={formatNumber(totals.bookings)}
        hint={IN_RANGE}
        icon={Ticket}
      />
      <StatCard
        label="Booking value"
        value={formatPrice(totals.bookingValue)}
        hint="Confirmed and completed, in this range"
        icon={IndianRupee}
      />
      <StatCard
        label="Newsletter subscribers"
        value={formatNumber(totals.newsletterSubscribers)}
        hint={ALL_TIME}
        icon={Mail}
      />
    </div>
  );
}
