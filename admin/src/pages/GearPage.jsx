import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FILTER_TYPE, FilterBar } from '../components/data/FilterBar.jsx';
import { GearDeleteDialog } from '../components/gear/GearDeleteDialog.jsx';
import { GearTable } from '../components/gear/GearTable.jsx';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { QueryBoundary } from '../components/QueryBoundary.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useGearList } from '../hooks/queries/useGear.js';
import { useTaxonomies } from '../hooks/queries/useTaxonomies.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { ACTIVE_OPTIONS, ROUTES } from '../lib/constants.js';
import { toListParams } from '../lib/listParams.js';

const DEFAULTS = Object.freeze({
  q: '',
  category: '',
  climate: '',
  tag: '',
  isActive: '',
  page: '1',
});

const toOptions = (query) => (query.data ?? []).map(({ id, name }) => ({ value: id, label: name }));

export function GearPage() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  const gear = useGearList(toListParams(filters));
  const categories = useTaxonomies('category');
  const climates = useTaxonomies('climate');
  const tags = useTaxonomies('tag');
  const [deleting, setDeleting] = useState(null);

  const fields = [
    { key: 'q', label: 'Search', type: FILTER_TYPE.SEARCH, placeholder: 'Name' },
    {
      key: 'category',
      label: 'Category',
      type: FILTER_TYPE.SELECT,
      options: toOptions(categories),
    },
    { key: 'climate', label: 'Climate', type: FILTER_TYPE.SELECT, options: toOptions(climates) },
    { key: 'tag', label: 'Tag', type: FILTER_TYPE.SELECT, options: toOptions(tags) },
    { key: 'isActive', label: 'Status', type: FILTER_TYPE.SELECT, options: ACTIVE_OPTIONS },
  ];

  return (
    <>
      <PageHeader
        title="Gear"
        description="Affiliate products, active or not, newest first."
        actions={
          <Button to={ROUTES.NEW_GEAR} icon={Plus}>
            New gear
          </Button>
        }
      />
      <FilterBar label="Gear filters" defaults={DEFAULTS} fields={fields} />
      <QueryBoundary query={gear} skeleton={<GearTable />} isEmpty={() => false}>
        {({ gear: rows, meta }) => (
          <GearTable
            rows={rows}
            pagination={{ ...meta, onPageChange: (page) => setFilters({ page }) }}
            onDelete={setDeleting}
          />
        )}
      </QueryBoundary>
      {deleting && (
        <GearDeleteDialog key={deleting.id} gear={deleting} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
