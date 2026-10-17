import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateGear } from '../../hooks/mutations/useGearMutations.js';
import { gearPath } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { formatNumber, formatPrice } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { Switch } from '../ui/Switch.jsx';
import { Thumbnail } from '../ui/Thumbnail.jsx';

// The sale price, with the MRP struck through beside it when the item is discounted.
const renderPrice = (gear) => (
  <span className="whitespace-nowrap">
    {formatPrice(gear.salePrice)}
    {gear.salePrice < gear.mrp && (
      <span className="ml-1.5 text-text-muted">
        <span className="sr-only">MRP </span>
        <s>{formatPrice(gear.mrp)}</s>
      </span>
    )}
  </span>
);

// One page of gear. Active applies as it is pressed and shows the new state while it saves;
// `onDelete(gear)` asks before deleting. Without `rows` it draws placeholder rows.
export function GearTable({ rows, pagination, onDelete }) {
  const updateGear = useUpdateGear();
  const pendingId = updateGear.isPending ? updateGear.variables.id : null;

  const setActive = (gear, isActive) =>
    updateGear.mutate(
      { id: gear.id, changes: { isActive } },
      {
        onSuccess: () =>
          toast.success(`${gear.name} is ${isActive ? 'active' : 'hidden from the store'}.`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );

  const columns = [
    { key: 'image', header: 'Image', render: (gear) => <Thumbnail image={gear.images[0]} /> },
    { key: 'name', header: 'Name', className: 'min-w-56 font-bold' },
    { key: 'category', header: 'Category', render: (gear) => gear.category?.name },
    { key: 'price', header: 'Sale price / MRP', render: renderPrice },
    {
      key: 'clickCount',
      header: 'Clicks',
      align: 'right',
      render: (gear) => formatNumber(gear.clickCount),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (gear) => {
        const pending = gear.id === pendingId;
        return (
          <Switch
            hideLabel
            label={`Active: ${gear.name}`}
            checked={pending ? updateGear.variables.changes.isActive : gear.isActive}
            disabled={pending}
            onChange={(isActive) => setActive(gear, isActive)}
          />
        );
      },
    },
  ];

  const rowActions = (gear) => [
    { key: 'edit', label: `Edit ${gear.name}`, icon: Pencil, to: gearPath(gear.id) },
    {
      key: 'delete',
      label: `Delete ${gear.name}`,
      icon: Trash2,
      variant: 'danger',
      onSelect: () => onDelete(gear),
    },
  ];

  return (
    <DataTable
      caption="Gear"
      columns={columns}
      rows={rows}
      loading={!rows}
      rowActions={rowActions}
      pagination={pagination}
      empty="No gear matches these filters."
    />
  );
}
