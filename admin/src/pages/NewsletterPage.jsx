import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../components/data/DataTable.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useExportSubscribers } from '../hooks/mutations/useExportSubscribers.js';
import { useSubscribers } from '../hooks/queries/useSubscribers.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { getErrorMessage } from '../lib/errors.js';
import { formatDateTime, formatNumber } from '../lib/format.js';
import { toListParams } from '../lib/listParams.js';

const DEFAULTS = Object.freeze({ page: '1' });

const COLUMNS = [
  { key: 'email', header: 'Email', className: 'min-w-64' },
  {
    key: 'createdAt',
    header: 'Subscribed',
    className: 'whitespace-nowrap tabular-nums',
    render: (subscriber) => formatDateTime(subscriber.createdAt),
  },
];

const table = (props) => (
  <DataTable caption="Subscribers" columns={COLUMNS} empty="No subscribers yet." {...props} />
);

export function NewsletterPage() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  const subscribers = useSubscribers(toListParams(filters));
  const exportCsv = useExportSubscribers();

  const download = () =>
    exportCsv.mutate(undefined, {
      onSuccess: (count) => toast.success(`Exported ${formatNumber(count)} subscribers.`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="Emails from the footer sign-up, newest first."
        actions={
          <Button icon={Download} loading={exportCsv.isPending} onClick={download}>
            Export CSV
          </Button>
        }
      />
      <QueryBoundary query={subscribers} skeleton={table({ loading: true })} isEmpty={() => false}>
        {({ subscribers: rows, meta }) =>
          table({ rows, pagination: { ...meta, onPageChange: (page) => setFilters({ page }) } })
        }
      </QueryBoundary>
    </>
  );
}
