import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useGearList } from '../../hooks/queries/useGearList.js';
import { useTaxonomies } from '../../hooks/queries/useTaxonomies.js';
import { ROUTES, TAXONOMY_TYPE } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Button } from '../ui/Button.jsx';
import { ChipGroup } from '../ui/ChipGroup.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { SectionHeader } from '../ui/SectionHeader.jsx';
import { AffiliateDisclosure } from './AffiliateDisclosure.jsx';
import { getCategoryIcon } from './categoryIcons.js';
import { GearGrid } from './GearGrid.jsx';

const LIMIT = 8;

const toOption = ({ slug, name }) => ({ value: slug, label: name, icon: getCategoryIcon(slug) });

// Gear picked for a vertical's trips (`scope={{ vertical: key }}`) or for one tour
// (`scope={{ tour: slug }}`). `withCategories` adds the category chips.
export function SuggestedGear({ title, lead, scope, withCategories = false }) {
  const [category, setCategory] = useState(null);
  const categories = useTaxonomies(TAXONOMY_TYPE.CATEGORY, { enabled: withCategories });
  const gear = useGearList({ ...scope, ...(category && { category }), limit: LIMIT });
  // A disabled query still hands back what the cache holds, so the flag decides here too.
  const options = withCategories ? (categories.data ?? []).map(toOption) : [];

  return (
    <section
      aria-labelledby="suggested-gear"
      className="mx-auto max-w-content px-(--space-gutter) pt-(--space-section)"
    >
      <SectionHeader
        id="suggested-gear"
        title={title}
        lead={lead}
        action={
          <Button to={ROUTES.GEAR} variant="secondary" size="sm" iconRight={ArrowRight}>
            Shop all gear
          </Button>
        }
      />
      {options.length > 0 && (
        <ChipGroup
          label="Gear category"
          options={options}
          value={category}
          onChange={setCategory}
          className="mt-8"
        />
      )}
      <div className="mt-8">
        <QueryBoundary
          query={gear}
          isEmpty={(data) => data.gear.length === 0}
          skeleton={<GearGrid loading={LIMIT / 2} />}
          empty={
            <EmptyState
              title={category ? 'Nothing in this category yet.' : 'No gear picked for this yet.'}
              description="The gear store has everything we recommend, for every kind of trip."
            />
          }
        >
          {(data) => <GearGrid gear={data.gear} stale={gear.isPlaceholderData} />}
        </QueryBoundary>
      </div>
      <AffiliateDisclosure className="mt-8" />
    </section>
  );
}
