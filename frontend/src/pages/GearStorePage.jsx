import { AffiliateDisclosure } from '../components/gear/AffiliateDisclosure.jsx';
import { GearFilters } from '../components/gear/GearFilters.jsx';
import { GearResults } from '../components/gear/GearResults.jsx';
import { useGearList } from '../hooks/queries/useGearList.js';
import { useUrlFilters } from '../hooks/useUrlFilters.js';
import { BRAND, GEAR_SORT_OPTIONS, LIMITS } from '../lib/constants.js';

const PAGE_SIZE = 12;

const FILTER_DEFAULTS = Object.freeze({
  q: '',
  category: '',
  climate: '',
  tag: '',
  sort: GEAR_SORT_OPTIONS[0].value,
  page: '1',
});

// The URL's filters as the API takes them. The API rejects a search term outside its length
// bounds, so a shorter one is not sent and a longer one is cut.
const toListParams = ({ q, page, ...filters }) => ({
  ...filters,
  q: q.length >= LIMITS.SEARCH_MIN ? q.slice(0, LIMITS.SEARCH_MAX) : '',
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: PAGE_SIZE,
});

export function GearStorePage() {
  const { filters, setFilters, clearFilters } = useUrlFilters(FILTER_DEFAULTS);
  const gear = useGearList(toListParams(filters));

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-(--space-gutter) pt-12">
      <title>{`Gear store · ${BRAND.NAME}`}</title>
      <header className="flex flex-col gap-3">
        <h1 className="type-display text-h1">Gear store</h1>
        <p className="type-lead text-text-muted">What each trip needs, picked by terrain.</p>
        <AffiliateDisclosure className="mt-2" />
      </header>
      <GearFilters filters={filters} onChange={setFilters} />
      <GearResults
        query={gear}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setFilters({ page })}
        onClear={clearFilters}
      />
    </div>
  );
}
