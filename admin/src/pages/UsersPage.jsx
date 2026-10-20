import { FILTER_TYPE, FilterBar } from '../components/data/FilterBar.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { UsersTable } from '../components/users/UsersTable.jsx';
import { useUsers } from '../hooks/queries/useUsers.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { ROLE_OPTIONS } from '../lib/constants.js';
import { toListParams } from '../lib/listParams.js';

const DEFAULTS = Object.freeze({ q: '', role: '', page: '1' });

const FIELDS = [
  { key: 'q', label: 'Search', type: FILTER_TYPE.SEARCH, placeholder: 'Name, email or phone' },
  { key: 'role', label: 'Role', type: FILTER_TYPE.SELECT, options: ROLE_OPTIONS },
];

// Read-only: roles come from the server's admin list at sign-in.
export function UsersPage() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  const users = useUsers(toListParams(filters));

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has signed in, newest first. Admins are set on the server."
      />
      <FilterBar label="User filters" defaults={DEFAULTS} fields={FIELDS} />
      <QueryBoundary query={users} skeleton={<UsersTable />} isEmpty={() => false}>
        {({ users: rows, meta }) => (
          <UsersTable
            rows={rows}
            pagination={{ ...meta, onPageChange: (page) => setFilters({ page }) }}
          />
        )}
      </QueryBoundary>
    </>
  );
}
