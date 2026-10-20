import { userPath } from '../../lib/constants.js';
import { formatDateTime } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { TextLink } from '../ui/TextLink.jsx';
import { UserRoleBadge } from './UserRoleBadge.jsx';

const NOWRAP = 'whitespace-nowrap tabular-nums';

const COLUMNS = [
  {
    key: 'avatar',
    header: 'Photo',
    render: (user) => <Avatar name={user.name} src={user.avatarUrl} className="size-8" />,
  },
  {
    key: 'name',
    header: 'Name',
    className: 'min-w-44',
    render: (user) => <TextLink to={userPath(user.id)}>{user.name}</TextLink>,
  },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone', className: NOWRAP, render: (user) => user.phone ?? '—' },
  { key: 'role', header: 'Role', render: (user) => <UserRoleBadge role={user.role} /> },
  {
    key: 'createdAt',
    header: 'Joined',
    className: NOWRAP,
    render: (user) => formatDateTime(user.createdAt),
  },
  {
    key: 'lastLoginAt',
    header: 'Last sign-in',
    className: NOWRAP,
    render: (user) => (user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'),
  },
];

// One page of users; each name opens the user's page. Without `rows` it draws placeholders.
export function UsersTable({ rows, pagination }) {
  return (
    <DataTable
      caption="Users"
      columns={COLUMNS}
      rows={rows}
      loading={!rows}
      pagination={pagination}
      empty="No users match these filters."
    />
  );
}
