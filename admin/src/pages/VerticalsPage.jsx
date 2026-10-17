import { Pencil } from 'lucide-react';
import { DataTable } from '../components/data/DataTable.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { Thumbnail } from '../components/ui/Thumbnail.jsx';
import { VerticalChip } from '../components/ui/VerticalChip.jsx';
import { useVerticals } from '../hooks/queries/useVerticals.js';
import { verticalPath } from '../lib/constants.js';

const COLUMNS = [
  { key: 'hero', header: 'Hero', render: (vertical) => <Thumbnail image={vertical.heroImage} /> },
  {
    key: 'name',
    header: 'Vertical',
    className: 'font-bold',
    render: (vertical) => <VerticalChip vertical={vertical} />,
  },
  { key: 'code', header: 'Code', className: 'text-text-muted' },
  {
    key: 'subtitle',
    header: 'Subtitle',
    className: 'min-w-64',
    render: (vertical) => vertical.subtitle || <span className="text-text-subtle">None yet</span>,
  },
];

const rowActions = (vertical) => [
  { key: 'edit', label: `Edit ${vertical.name}`, icon: Pencil, to: verticalPath(vertical.id) },
];

// The six verticals are fixed: they are edited here, never added or removed.
export function VerticalsPage() {
  const verticals = useVerticals();

  return (
    <>
      <PageHeader
        title="Verticals"
        description="The six fixed verticals. Edit the words and hero image customers see."
      />
      <QueryBoundary
        query={verticals}
        skeleton={<DataTable caption="Verticals" columns={COLUMNS} loading skeletonRows={6} />}
        isEmpty={() => false}
      >
        {(rows) => (
          <DataTable caption="Verticals" columns={COLUMNS} rows={rows} rowActions={rowActions} />
        )}
      </QueryBoundary>
    </>
  );
}
