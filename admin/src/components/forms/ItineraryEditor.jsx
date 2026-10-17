import { Plus } from 'lucide-react';
import { useListKeys } from '../../hooks/useListKeys.js';
import { LIMITS } from '../../lib/constants.js';
import { moveItem, removeAt } from '../../lib/list.js';
import { Button } from '../ui/Button.jsx';
import { Field, FieldError } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { ListRowActions } from './ListRowActions.jsx';

// Day numbers always follow the order on screen, from day 1.
const renumber = (days) => days.map((day, index) => ({ ...day, day: index + 1 }));

// The day-by-day plan. `value` is [{ day, title, description }] and `onChange` receives the
// next list, already renumbered. `error` is the form's error for the itinerary.
export function ItineraryEditor({ value, onChange, error }) {
  const { keys, add, remove, move } = useListKeys(value.length);

  const update = (index, changes) =>
    onChange(value.map((day, at) => (at === index ? { ...day, ...changes } : day)));

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 && (
        <p className="text-sm text-text-muted">No days yet. Add the first day of the trip.</p>
      )}
      {value.length > 0 && (
        <ol className="flex flex-col gap-3">
          {value.map((day, index) => {
            const dayName = `Day ${day.day}`;
            return (
              <li key={keys[index]}>
                <fieldset className="relative flex flex-col gap-3 rounded-plate border border-border bg-surface p-4">
                  {/* Floated, the legend is an ordinary box: it lines up with the row's buttons. */}
                  <legend className="float-left flex min-h-10 items-center text-sm font-extrabold">
                    {dayName}
                  </legend>
                  <div className="absolute top-4 right-4">
                    <ListRowActions
                      index={index}
                      count={value.length}
                      itemName={dayName}
                      onMove={(from, to) => {
                        move(from, to);
                        onChange(renumber(moveItem(value, from, to)));
                      }}
                      onRemove={(at) => {
                        remove(at);
                        onChange(renumber(removeAt(value, at)));
                      }}
                    />
                  </div>
                  <Field label="Title" error={error?.[index]?.title?.message}>
                    {(control) => (
                      <Input
                        {...control}
                        value={day.title}
                        maxLength={LIMITS.SHORT_TEXT_MAX}
                        onChange={(event) => update(index, { title: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Plan for the day" error={error?.[index]?.description?.message}>
                    {(control) => (
                      <Textarea
                        {...control}
                        rows={3}
                        value={day.description}
                        maxLength={LIMITS.LONG_TEXT_MAX}
                        onChange={(event) => update(index, { description: event.target.value })}
                      />
                    )}
                  </Field>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}
      {error?.message && <FieldError>{error.message}</FieldError>}
      <Button
        variant="secondary"
        size="sm"
        icon={Plus}
        className="self-start"
        disabled={value.length >= LIMITS.ITINERARY_MAX}
        onClick={() => {
          add();
          onChange([...value, { day: value.length + 1, title: '', description: '' }]);
        }}
      >
        Add day
      </Button>
    </div>
  );
}
