import { THEME_OPTIONS } from '../../lib/constants.js';
import { formatDateTime } from '../../lib/format.js';
import { DetailCard } from '../data/DetailCard.jsx';
import { TextLink } from '../ui/TextLink.jsx';
import { UserRoleBadge } from './UserRoleBadge.jsx';

const THEME_LABELS = Object.fromEntries(THEME_OPTIONS.map(({ value, label }) => [value, label]));

// A user's account as the server keeps it. Read-only.
export function UserProfile({ user }) {
  const account = [
    { label: 'Email', value: <TextLink href={`mailto:${user.email}`}>{user.email}</TextLink> },
    {
      label: 'Phone',
      value: user.phone && <TextLink href={`tel:+91${user.phone}`}>{user.phone}</TextLink>,
    },
    { label: 'Role', value: <UserRoleBadge role={user.role} /> },
    {
      label: 'Profile',
      value: user.profileComplete ? 'Complete' : 'Incomplete: needs a name and phone to book',
    },
  ];

  const activity = [
    { label: 'Joined', value: formatDateTime(user.createdAt) },
    {
      label: 'Last sign-in',
      value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never',
    },
    { label: 'Theme', value: THEME_LABELS[user.themePreference] },
    { label: 'User ID', value: user.id },
  ];

  return (
    <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
      <DetailCard title="Account" items={account} />
      <DetailCard title="Activity" items={activity} />
    </div>
  );
}
