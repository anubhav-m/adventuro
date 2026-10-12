import { Search } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce.js';
import { LIMITS, SEARCH_DEBOUNCE_MS } from '../../lib/constants.js';
import { Input } from '../ui/Input.jsx';

// A filter bar's search box. `value` is the term in the URL; typing reaches `onChange` once it
// pauses, and a term that changes elsewhere (the back button, Clear filters) replaces the text.
// Spread a Field's control props onto it.
export function SearchField({ value, onChange, placeholder, ...control }) {
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
    <span className="relative block">
      <Search
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
      />
      <Input
        {...control}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        maxLength={LIMITS.SEARCH_MAX}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="pl-9"
      />
    </span>
  );
}
