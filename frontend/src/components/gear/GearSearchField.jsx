import { useEffect, useEffectEvent, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce.js';
import { LIMITS, SEARCH_DEBOUNCE_MS } from '../../lib/constants.js';
import { Field } from '../ui/Field.jsx';
import { Input } from '../ui/Input.jsx';

// The store's search box. `value` is the term in the URL; typing reaches `onChange` once it
// pauses, and a term that changes elsewhere (the back button, Clear filters) replaces the text.
export function GearSearchField({ value, onChange }) {
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  const debounced = useDebounce(text.trim(), SEARCH_DEBOUNCE_MS);

  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== text.trim()) setText(value);
  }

  const commit = useEffectEvent((term) => {
    if (term !== value) onChange(term);
  });
  useEffect(() => commit(debounced), [debounced]);

  return (
    <Field label="Search gear">
      {(control) => (
        <Input
          {...control}
          type="search"
          placeholder="Dry bag, trekking boots…"
          autoComplete="off"
          maxLength={LIMITS.SEARCH_MAX}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      )}
    </Field>
  );
}
