import { useTaxonomies } from '../../hooks/queries/useTaxonomies.js';
import { GEAR_SORT_OPTIONS, TAXONOMY_TYPE } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { ChipGroup } from '../ui/ChipGroup.jsx';
import { Field } from '../ui/Field.jsx';
import { Select } from '../ui/Select.jsx';
import { getCategoryIcon } from './categoryIcons.js';
import { GearFiltersSkeleton } from './GearFiltersSkeleton.jsx';
import { GearSearchField } from './GearSearchField.jsx';

const GROUP_LABEL = 'text-sm font-bold';

const toOption = ({ slug, name }) => ({ value: slug, label: name });
const toCategoryOption = (category) => ({
  ...toOption(category),
  icon: getCategoryIcon(category.slug),
});

// Every control writes to the URL through `onChange(changes, options)`. The category, climate
// and tag lists are the admin's, so a list with nothing in it is left out.
export function GearFilters({ filters, onChange }) {
  const taxonomies = useTaxonomies();

  return (
    <section aria-label="Filters" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <GearSearchField value={filters.q} onChange={(q) => onChange({ q }, { replace: true })} />
        <Field label="Sort by">
          {(control) => (
            <Select
              {...control}
              options={GEAR_SORT_OPTIONS}
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value })}
            />
          )}
        </Field>
      </div>
      <QueryBoundary query={taxonomies} skeleton={<GearFiltersSkeleton />} isEmpty={() => false}>
        {(list) => {
          const byType = Object.groupBy(list, ({ type }) => type);
          const categories = byType[TAXONOMY_TYPE.CATEGORY] ?? [];
          const climates = byType[TAXONOMY_TYPE.CLIMATE] ?? [];
          const tags = byType[TAXONOMY_TYPE.TAG] ?? [];
          return (
            <>
              {categories.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className={GROUP_LABEL}>Category</p>
                  <ChipGroup
                    label="Category"
                    options={categories.map(toCategoryOption)}
                    value={filters.category}
                    onChange={(category) => onChange({ category })}
                  />
                </div>
              )}
              {climates.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className={GROUP_LABEL}>Climate</p>
                  <ChipGroup
                    label="Climate"
                    options={climates.map(toOption)}
                    value={filters.climate}
                    onChange={(climate) => onChange({ climate })}
                  />
                </div>
              )}
              {tags.length > 0 && (
                <Field label="Tag" className="sm:max-w-64">
                  {(control) => (
                    <Select
                      {...control}
                      placeholder="Any tag"
                      options={tags.map(toOption)}
                      value={filters.tag}
                      onChange={(event) => onChange({ tag: event.target.value })}
                    />
                  )}
                </Field>
              )}
            </>
          );
        }}
      </QueryBoundary>
    </section>
  );
}
