import { X } from 'lucide-react';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { cn } from '../../lib/cn.js';
import { Button } from '../ui/Button.jsx';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { SearchField } from './SearchField.jsx';

export const FILTER_TYPE = Object.freeze({ SEARCH: 'search', SELECT: 'select', DATE: 'date' });

const WIDTHS = {
  [FILTER_TYPE.SEARCH]: 'min-w-56 flex-1',
  [FILTER_TYPE.SELECT]: 'w-44',
  [FILTER_TYPE.DATE]: 'w-40',
};

// The filters above a list, kept in the URL by `useUrlFilters`: the list's page reads the same
// params with the same `defaults` (a module-level constant mapping each param to the value it
// has when absent). Changing a filter returns the list to its first page.
// `fields`: [{ key, label, type, options?, placeholder? }]
// - search: typing is debounced and replaces the history entry instead of adding to it
// - select: `options` are { value, label }; `placeholder` names the unfiltered choice ("All")
// - date: a 'YYYY-MM-DD' day
export function FilterBar({ label = 'Filters', defaults, fields, className }) {
  const { filters, setFilters, clearFilters } = useUrlFilters(defaults);
  const isFiltered = fields.some(({ key }) => filters[key] !== defaults[key]);

  const renderControl = (field, control) => {
    const value = filters[field.key];
    if (field.type === FILTER_TYPE.SEARCH) {
      return (
        <SearchField
          {...control}
          value={value}
          placeholder={field.placeholder}
          onChange={(term) => setFilters({ [field.key]: term }, { replace: true })}
        />
      );
    }
    const onChange = (event) => setFilters({ [field.key]: event.target.value });
    if (field.type === FILTER_TYPE.SELECT) {
      return (
        <Select
          {...control}
          options={field.options}
          placeholder={field.placeholder ?? 'All'}
          value={value}
          onChange={onChange}
        />
      );
    }
    return <Input {...control} type="date" value={value} onChange={onChange} />;
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex flex-wrap items-end gap-3', className)}
    >
      {fields.map((field) => (
        <Field key={field.key} label={field.label} className={WIDTHS[field.type]}>
          {(control) => renderControl(field, control)}
        </Field>
      ))}
      {isFiltered && (
        <Button variant="ghost" icon={X} onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
