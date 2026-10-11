import { BOOKING_STATUS } from '../../lib/constants.js';
import { Badge } from '../ui/Badge.jsx';

// A status this app has no label for is shown as the API has it.
export function BookingStatusBadge({ status, className }) {
  const { label, tone } = BOOKING_STATUS[status] ?? { label: status };
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
