import { ListField } from '../forms/ListField.jsx';
import { StringListEditor } from '../forms/StringListEditor.jsx';

const LISTS = [
  { name: 'inclusions', label: 'Included', itemLabel: 'Inclusion', addLabel: 'Add inclusion' },
  { name: 'exclusions', label: 'Not included', itemLabel: 'Exclusion', addLabel: 'Add exclusion' },
];

// The Inclusions / Exclusions tab.
export function TourListsFields() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      {LISTS.map(({ name, ...labels }) => (
        <ListField
          key={name}
          name={name}
          render={(field, error) => (
            <StringListEditor
              {...labels}
              value={field.value}
              onChange={field.onChange}
              error={error}
            />
          )}
        />
      ))}
    </div>
  );
}
