import { Backpack, Pencil } from 'lucide-react';
import { useGearList } from '../../hooks/queries/useGear.js';
import { gearPath, LIMITS } from '../../lib/constants.js';
import { formatPrice } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Badge } from '../ui/Badge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Thumbnail } from '../ui/Thumbnail.jsx';

const COLUMNS = [
  { key: 'image', header: 'Image', render: (gear) => <Thumbnail image={gear.images[0]} /> },
  { key: 'name', header: 'Name', className: 'font-bold' },
  { key: 'category', header: 'Category', render: (gear) => gear.category?.name },
  {
    key: 'salePrice',
    header: 'Sale price',
    align: 'right',
    render: (gear) => formatPrice(gear.salePrice),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (gear) =>
      gear.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>,
  },
];

const editAction = (gear) => [
  { key: 'edit', label: `Edit ${gear.name}`, icon: Pencil, to: gearPath(gear.id) },
];

const NOTE = 'Gear is linked to tours from each gear item’s own page.';

// The Gear tab: what is linked to this tour, read-only. A tour that is not saved yet has none.
export function TourLinkedGear({ tourId }) {
  const gear = useGearList(
    { tour: tourId, limit: LIMITS.PAGE_LIMIT_MAX },
    { enabled: Boolean(tourId) },
  );

  if (!tourId) {
    return <EmptyState icon={Backpack} title="Save the tour first." description={NOTE} />;
  }

  return (
    <div className="flex max-w-4xl flex-col gap-3">
      <p className="text-sm text-text-muted">{NOTE}</p>
      <QueryBoundary
        query={gear}
        skeleton={<DataTable caption="Linked gear" columns={COLUMNS} loading />}
        isEmpty={() => false}
      >
        {({ gear: items }) => (
          <DataTable
            caption="Linked gear"
            columns={COLUMNS}
            rows={items}
            rowActions={editAction}
            empty="No gear is linked to this tour yet."
          />
        )}
      </QueryBoundary>
    </div>
  );
}
