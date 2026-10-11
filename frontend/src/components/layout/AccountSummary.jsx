import { Avatar } from '../ui/Avatar.jsx';

const ROW = 'flex items-baseline justify-between gap-4';
const TERM = 'shrink-0 text-xs font-medium text-text-muted';
const VALUE = 'truncate text-xs font-semibold tabular-nums';

// Who is signed in: the head of the account menu.
export function AccountSummary({ user }) {
  return (
    <div className="mb-2 flex w-64 flex-col gap-3 border-b border-border px-3 pt-2 pb-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name || user.email} src={user.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user.name || 'New traveler'}</p>
          <p className="truncate text-xs font-medium text-text-muted">{user.email}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-1">
        <div className={ROW}>
          <dt className={TERM}>Phone</dt>
          <dd className={VALUE}>{user.phone ? `+91 ${user.phone}` : 'Not added yet'}</dd>
        </div>
        <div className={ROW}>
          <dt className={TERM}>User ID</dt>
          <dd className={VALUE}>{user.id}</dd>
        </div>
      </dl>
    </div>
  );
}
