import { Plus } from 'lucide-react';
import { useListKeys } from '../../hooks/useListKeys.js';
import { LIMITS } from '../../lib/constants.js';
import { moveItem, removeAt } from '../../lib/list.js';
import { EMPTY_TIER } from '../../lib/tourForm.js';
import { Button } from '../ui/Button.jsx';
import { Field, FieldError } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { MoneyInput } from '../ui/MoneyInput.jsx';
import { ListRowActions } from './ListRowActions.jsx';

const toPrice = (input) => (Number.isNaN(input.valueAsNumber) ? '' : input.valueAsNumber);

// A tour's packages, 1 to 5. `value` is [{ id?, name, description, pricePerPerson }] and
// `onChange` receives the next list. A package that was saved keeps its `id`, which keeps a
// booking form opened before the edit valid. `error` is the form's error for the packages.
export function TierEditor({ value, onChange, error }) {
  const { keys, add, remove, move } = useListKeys(value.length);
  const isFull = value.length >= LIMITS.TIERS_MAX;

  const update = (index, changes) =>
    onChange(value.map((tier, at) => (at === index ? { ...tier, ...changes } : tier)));

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {value.map((tier, index) => {
          const tierName = `Package ${index + 1}`;
          const errors = error?.[index];
          return (
            <li key={keys[index]}>
              <fieldset className="relative flex flex-col gap-3 rounded-plate border border-border bg-surface p-4">
                {/* Floated, the legend is an ordinary box: it lines up with the row's buttons. */}
                <legend className="float-left flex min-h-10 items-center text-sm font-extrabold">
                  {tierName}
                </legend>
                <div className="absolute top-4 right-4">
                  <ListRowActions
                    index={index}
                    count={value.length}
                    itemName={tierName}
                    removeDisabled={value.length <= LIMITS.TIERS_MIN}
                    onMove={(from, to) => {
                      move(from, to);
                      onChange(moveItem(value, from, to));
                    }}
                    onRemove={(at) => {
                      remove(at);
                      onChange(removeAt(value, at));
                    }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                  <Field label="Name" error={errors?.name?.message}>
                    {(control) => (
                      <Input
                        {...control}
                        value={tier.name}
                        placeholder="Explorer"
                        maxLength={LIMITS.NAME_MAX}
                        onChange={(event) => update(index, { name: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Price per person" error={errors?.pricePerPerson?.message}>
                    {(control) => (
                      <MoneyInput
                        {...control}
                        value={tier.pricePerPerson}
                        max={LIMITS.PRICE_MAX}
                        onChange={(event) =>
                          update(index, { pricePerPerson: toPrice(event.target) })
                        }
                      />
                    )}
                  </Field>
                </div>
                <Field label="What it includes" error={errors?.description?.message}>
                  {(control) => (
                    <Input
                      {...control}
                      value={tier.description}
                      placeholder="Shared stay, breakfast, guided activities"
                      maxLength={LIMITS.SHORT_TEXT_MAX}
                      onChange={(event) => update(index, { description: event.target.value })}
                    />
                  )}
                </Field>
              </fieldset>
            </li>
          );
        })}
      </ol>
      {error?.message && <FieldError>{error.message}</FieldError>}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          disabled={isFull}
          onClick={() => {
            add();
            onChange([...value, { ...EMPTY_TIER }]);
          }}
        >
          Add package
        </Button>
        <p className="text-xs text-text-muted">
          {isFull
            ? `That’s the most a tour can have (${LIMITS.TIERS_MAX}).`
            : `${LIMITS.TIERS_MIN} to ${LIMITS.TIERS_MAX} packages, each with its own name. The lowest price is the tour’s “from” price.`}
        </p>
      </div>
    </div>
  );
}
