import { useTaxonomies } from '../../hooks/queries/useTaxonomies.js';
import { InlineError } from '../ui/InlineError.jsx';
import { MultiSelect } from '../ui/MultiSelect.jsx';
import { Select } from '../ui/Select.jsx';

// Choose from one taxonomy list ('category', 'climate' or 'tag'). Single: `value` is an id and
// `onChange` receives the chosen id. `multiple`: `value` is an array of ids. Spread a Field's
// control props on it.
export function TaxonomySelect({
  type,
  multiple = false,
  value,
  onChange,
  placeholder,
  ...control
}) {
  const taxonomies = useTaxonomies(type);
  const options = (taxonomies.data ?? []).map(({ id, name }) => ({ value: id, label: name }));
  const loading = taxonomies.isPending;

  return (
    <>
      {multiple ? (
        <MultiSelect
          {...control}
          options={options}
          value={value}
          onChange={onChange}
          placeholder={loading ? 'Loading…' : (placeholder ?? 'Choose any')}
          searchable
        />
      ) : (
        <Select
          {...control}
          options={options}
          placeholder={loading ? 'Loading…' : (placeholder ?? 'Choose one')}
          disabled={loading}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {taxonomies.isError && <InlineError error={taxonomies.error} />}
    </>
  );
}
