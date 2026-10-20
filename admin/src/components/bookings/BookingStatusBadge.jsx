import { BOOKING_STATUS } from '../../lib/constants.js';
import { Badge } from '../ui/Badge.jsx';

export function BookingStatusBadge({ status }) {
  const { label, tone } = BOOKING_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
