import { useAllTours } from '../../hooks/queries/useTours.js';
import { InlineError } from '../ui/InlineError.jsx';
import { MultiSelect } from '../ui/MultiSelect.jsx';

const optionFor = ({ id, title, vertical, isPublished }) => ({
  value: id,
  label: `${title} · ${vertical.name}${isPublished ? '' : ' (draft)'}`,
});

// Choose any tours, from every vertical, published or not. `value` is an array of tour ids.
// Typing narrows the list by title or vertical. Spread a Field's control props on it.
export function TourMultiSelect({ value, onChange, ...control }) {
  const tours = useAllTours();

  return (
    <>
      <MultiSelect
        {...control}
        options={(tours.data ?? []).map(optionFor)}
        value={value}
        onChange={onChange}
        placeholder={tours.isPending ? 'Loading tours…' : 'Choose tours'}
        searchable
      />
      {tours.isError && <InlineError error={tours.error} />}
    </>
  );
}
