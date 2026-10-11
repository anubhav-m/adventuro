import { Clock, MapPin } from 'lucide-react';
import { formatTime } from '../../lib/format.js';
import { Card } from '../ui/Card.jsx';
import { TourSection } from './TourSection.jsx';

const ICON = { size: 22, strokeWidth: 1.75, 'aria-hidden': true };
const ROW = 'flex items-start gap-3';
const TERM = 'text-sm font-bold text-text-muted';
const VALUE = 'text-h4 leading-tight font-extrabold';

// Where and when the group meets on the first day.
export function ReportingInfo({ reporting }) {
  return (
    <TourSection title="Where and when to report">
      <Card as="dl" className="grid gap-6 sm:grid-cols-2">
        <div className={ROW}>
          <MapPin {...ICON} className="mt-0.5 shrink-0 text-accent-text" />
          <div>
            <dt className={TERM}>Reporting location</dt>
            <dd className={VALUE}>{reporting.location}</dd>
            {reporting.address && <dd className="mt-1 text-text-muted">{reporting.address}</dd>}
          </div>
        </div>
        <div className={ROW}>
          <Clock {...ICON} className="mt-0.5 shrink-0 text-accent-text" />
          <div>
            <dt className={TERM}>Reporting time</dt>
            <dd className={`${VALUE} tabular-nums`}>{formatTime(reporting.time)}</dd>
            <dd className="mt-1 text-text-muted">On the start date of your trip</dd>
          </div>
        </div>
      </Card>
    </TourSection>
  );
}
