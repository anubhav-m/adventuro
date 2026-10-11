import { Clock, MapPin } from 'lucide-react';
import { formatTime } from '../../lib/format.js';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true, className: 'text-accent-text' };
const TERM = 'mb-1 flex items-center gap-2 text-sm font-bold text-text-muted';
const VALUE = 'text-h4 leading-tight font-extrabold';

// Where and when the group meets on the first day: on the tour page and on the ticket.
export function ReportingDetails({ reporting }) {
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      <div>
        <dt className={TERM}>
          <MapPin {...ICON} />
          Reporting location
        </dt>
        <dd className={VALUE}>{reporting.location}</dd>
        {reporting.address && <dd className="mt-1 text-text-muted">{reporting.address}</dd>}
      </div>
      <div>
        <dt className={TERM}>
          <Clock {...ICON} />
          Reporting time
        </dt>
        <dd className={`${VALUE} tabular-nums`}>{formatTime(reporting.time)}</dd>
        <dd className="mt-1 text-text-muted">On the start date of your trip</dd>
      </div>
    </dl>
  );
}
