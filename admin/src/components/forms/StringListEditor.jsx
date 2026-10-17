import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useListKeys } from '../../hooks/useListKeys.js';
import { LIMITS } from '../../lib/constants.js';
import { moveItem, removeAt } from '../../lib/list.js';
import { Button } from '../ui/Button.jsx';
import { Field, FieldError } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';
import { ListRowActions } from './ListRowActions.jsx';

// An ordered list of short lines (top activities, inclusions, exclusions). `value` is the array
// of strings and `onChange` receives the next one. `error` is the form's error for the list:
// its own `message`, and one per line at its position. Enter in a line adds one below it.
export function StringListEditor({
  label,
  itemLabel,
  value,
  onChange,
  error,
  addLabel = 'Add a line',
  placeholder,
  max = LIMITS.LIST_ITEMS_MAX,
}) {
  const { keys, add, remove, move } = useListKeys(value.length);
  const inputs = useRef(new Map());
  const focusNext = useRef(null);

  useEffect(() => {
    if (focusNext.current === null) return;
    inputs.current.get(keys[focusNext.current])?.focus();
    focusNext.current = null;
  });

  const addLine = () => {
    focusNext.current = value.length;
    add();
    onChange([...value, '']);
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (index === value.length - 1 && value.length < max) addLine();
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-bold">{label}</legend>
      {value.length === 0 && <p className="text-sm text-text-muted">Nothing added yet.</p>}
      {value.length > 0 && (
        <ol className="flex flex-col gap-2">
          {value.map((line, index) => {
            const name = `${itemLabel} ${index + 1}`;
            return (
              <li key={keys[index]} className="flex items-start gap-2">
                <Field label={name} hideLabel error={error?.[index]?.message} className="flex-1">
                  {(control) => (
                    <Input
                      {...control}
                      ref={(node) => {
                        if (node) inputs.current.set(keys[index], node);
                        else inputs.current.delete(keys[index]);
                      }}
                      value={line}
                      placeholder={placeholder}
                      maxLength={LIMITS.SHORT_TEXT_MAX}
                      onChange={(event) =>
                        onChange(
                          value.map((item, at) => (at === index ? event.target.value : item)),
                        )
                      }
                      onKeyDown={(event) => handleKeyDown(event, index)}
                    />
                  )}
                </Field>
                <ListRowActions
                  index={index}
                  count={value.length}
                  itemName={name}
                  onMove={(from, to) => {
                    move(from, to);
                    onChange(moveItem(value, from, to));
                  }}
                  onRemove={(at) => {
                    remove(at);
                    onChange(removeAt(value, at));
                  }}
                />
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
        disabled={value.length >= max}
        onClick={addLine}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
}
