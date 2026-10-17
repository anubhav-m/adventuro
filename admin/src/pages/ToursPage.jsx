import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FILTER_TYPE, FilterBar } from '../components/data/FilterBar.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { TourDeleteDialog } from '../components/tours/TourDeleteDialog.jsx';
import { ToursTable } from '../components/tours/ToursTable.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useTours } from '../hooks/queries/useTours.js';
import { useVerticals } from '../hooks/queries/useVerticals.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { PUBLISHED_OPTIONS, ROUTES } from '../lib/constants.js';
import { toListParams } from '../lib/listParams.js';

const DEFAULTS = Object.freeze({ q: '', vertical: '', isPublished: '', page: '1' });

export function ToursPage() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  const tours = useTours(toListParams(filters));
  const verticals = useVerticals();
  const [deleting, setDeleting] = useState(null);

  const fields = [
    { key: 'q', label: 'Search', type: FILTER_TYPE.SEARCH, placeholder: 'Title, state or place' },
    {
      key: 'vertical',
      label: 'Vertical',
      type: FILTER_TYPE.SELECT,
      options: (verticals.data ?? []).map(({ key, name }) => ({ value: key, label: name })),
    },
    { key: 'isPublished', label: 'Status', type: FILTER_TYPE.SELECT, options: PUBLISHED_OPTIONS },
  ];

  return (
    <>
      <PageHeader
        title="Tours"
        description="Every tour, published or draft, newest first."
        actions={
          <Button to={ROUTES.NEW_TOUR} icon={Plus}>
            New tour
          </Button>
        }
      />
      <FilterBar label="Tour filters" defaults={DEFAULTS} fields={fields} />
      <QueryBoundary query={tours} skeleton={<ToursTable />} isEmpty={() => false}>
        {({ tours: rows, meta }) => (
          <ToursTable
            rows={rows}
            pagination={{ ...meta, onPageChange: (page) => setFilters({ page }) }}
            onDelete={setDeleting}
          />
        )}
      </QueryBoundary>
      {deleting && (
        <TourDeleteDialog key={deleting.id} tour={deleting} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
