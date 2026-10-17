import { Controller, useFormContext } from 'react-hook-form';
import { FormSection } from '../forms/FormSection.jsx';
import { TaxonomySelect } from '../forms/TaxonomySelect.jsx';
import { TourMultiSelect } from '../forms/TourMultiSelect.jsx';
import { Field } from '../ui/Field.jsx';

const TAXONOMY_FIELDS = [
  { name: 'category', type: 'category', label: 'Category', multiple: false },
  { name: 'climates', type: 'climate', label: 'Climates', multiple: true },
  { name: 'tags', type: 'tag', label: 'Tags', multiple: true },
];

// Where the item shows up: its category, climates and tags (store filters) and the tours it
// is suggested for.
export function GearGroupingFields() {
  const { control } = useFormContext();

  return (
    <FormSection title="Where it shows">
      {TAXONOMY_FIELDS.map(({ name, type, label, multiple }) => (
        <Controller
          key={name}
          name={name}
          control={control}
          render={({ field, fieldState }) => (
            <Field label={label} error={fieldState.error?.message}>
              {(controlProps) => (
                <TaxonomySelect
                  {...controlProps}
                  type={type}
                  multiple={multiple}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            </Field>
          )}
        />
      ))}
      <Controller
        name="tours"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            label="Linked tours"
            hint="Suggested on these tours’ pages."
            error={fieldState.error?.message}
          >
            {(controlProps) => (
              <TourMultiSelect {...controlProps} value={field.value} onChange={field.onChange} />
            )}
          </Field>
        )}
      />
    </FormSection>
  );
}
