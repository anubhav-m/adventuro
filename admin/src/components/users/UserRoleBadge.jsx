import { ShieldCheck } from 'lucide-react';
import { ROLE_OPTIONS, ROLES } from '../../lib/constants.js';
import { Badge } from '../ui/Badge.jsx';

const LABELS = Object.fromEntries(ROLE_OPTIONS.map(({ value, label }) => [value, label]));

export function UserRoleBadge({ role }) {
  return role === ROLES.ADMIN ? (
    <Badge tone="info" icon={ShieldCheck}>
      {LABELS[role]}
    </Badge>
  ) : (
    <Badge>{LABELS[role]}</Badge>
  );
}
