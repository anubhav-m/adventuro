import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateTour } from '../../hooks/mutations/useTourMutations.js';
import { tourPath } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { formatDate, formatPrice } from '../../lib/format.js';
import { DataTable } from '../data/DataTable.jsx';
import { Switch } from '../ui/Switch.jsx';
import { Thumbnail } from '../ui/Thumbnail.jsx';
import { VerticalChip } from '../ui/VerticalChip.jsx';

// One page of tours. Published applies as it is pressed and shows the new state while it
// saves; `onDelete(tour)` asks before deleting. Without `rows` it draws placeholder rows.
export function ToursTable({ rows, pagination, onDelete }) {
  const updateTour = useUpdateTour();
  const pendingId = updateTour.isPending ? updateTour.variables.id : null;

  const setPublished = (tour, isPublished) =>
    updateTour.mutate(
      { id: tour.id, changes: { isPublished } },
      {
        onSuccess: () =>
          toast.success(`${tour.title} is ${isPublished ? 'published' : 'now a draft'}.`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );

  const columns = [
    { key: 'cover', header: 'Cover', render: (tour) => <Thumbnail image={tour.coverImage} /> },
    { key: 'title', header: 'Title', className: 'min-w-56 font-bold' },
    {
      key: 'vertical',
      header: 'Vertical',
      render: (tour) => <VerticalChip vertical={tour.vertical} />,
    },
    { key: 'state', header: 'State', className: 'whitespace-nowrap' },
    {
      key: 'startingPrice',
      header: 'From',
      align: 'right',
      render: (tour) => formatPrice(tour.startingPrice),
    },
    {
      key: 'isPublished',
      header: 'Published',
      render: (tour) => {
        const pending = tour.id === pendingId;
        return (
          <Switch
            hideLabel
            label={`Published: ${tour.title}`}
            checked={pending ? updateTour.variables.changes.isPublished : tour.isPublished}
            disabled={pending}
            onChange={(isPublished) => setPublished(tour, isPublished)}
          />
        );
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      className: 'whitespace-nowrap text-text-muted',
      render: (tour) => formatDate(tour.updatedAt),
    },
  ];

  const rowActions = (tour) => [
    { key: 'edit', label: `Edit ${tour.title}`, icon: Pencil, to: tourPath(tour.id) },
    {
      key: 'delete',
      label: `Delete ${tour.title}`,
      icon: Trash2,
      variant: 'danger',
      onSelect: () => onDelete(tour),
    },
  ];

  return (
    <DataTable
      caption="Tours"
      columns={columns}
      rows={rows}
      loading={!rows}
      rowActions={rowActions}
      pagination={pagination}
      empty="No tours match these filters."
    />
  );
}
