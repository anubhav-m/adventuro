import { useSearchParams } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { TaxonomyPanel } from '../components/taxonomies/TaxonomyPanel.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { TAXONOMY_TYPES } from '../lib/constants.js';

const [FIRST_TYPE] = TAXONOMY_TYPES;

// The three lists gear is sorted by. The open list is in the URL (`?type=climate`).
export function TaxonomiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('type');
  const open = TAXONOMY_TYPES.some(({ value }) => value === requested)
    ? requested
    : FIRST_TYPE.value;

  return (
    <>
      <PageHeader
        title="Taxonomies"
        description="The categories, climates and tags that sort gear in the store."
      />
      <Tabs
        label="Taxonomy lists"
        value={open}
        onChange={(value) =>
          setSearchParams(value === FIRST_TYPE.value ? {} : { type: value }, { replace: true })
        }
        tabs={TAXONOMY_TYPES.map((type) => ({
          id: type.value,
          label: type.plural,
          content: <TaxonomyPanel type={type} />,
        }))}
      />
    </>
  );
}
