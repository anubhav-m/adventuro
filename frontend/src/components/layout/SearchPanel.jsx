import { MapPinned, Package } from 'lucide-react';
import { useRef, useState } from 'react';
import { useSearch } from '../../hooks/queries/useSearch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { LIMITS, ROUTES, SEARCH_DEBOUNCE_MS } from '../../lib/constants.js';
import { QueryBoundary } from '../QueryBoundary.jsx';
import { Input } from '../ui/Input.jsx';
import { SearchGroup } from './SearchGroup.jsx';

const toTourItem = (tour) => ({
  key: tour.id,
  to: ROUTES.tour(tour.slug),
  image: tour.coverImage,
  title: tour.title,
  detail: `${tour.destination}, ${tour.state}`,
  amount: tour.startingPrice,
  prefix: 'from',
});

// Gear has no page of its own: a gear result opens the store searched for it.
const toGearItem = (gear) => ({
  key: gear.id,
  to: ROUTES.gearSearch(gear.name),
  image: gear.images[0],
  title: gear.name,
  amount: gear.salePrice,
  mrp: gear.mrp,
});

const hasNoResults = ({ tours, gear }) => tours.length + gear.length === 0;

// The search box and its grouped results. Results are links, so arrow keys move real focus:
// down from the box into the results, up from the first result back to the box. Enter in the
// box opens the first result.
export function SearchPanel({ inputRef }) {
  const [text, setText] = useState('');
  const term = useDebounce(text.trim(), SEARCH_DEBOUNCE_MS);
  const results = useSearch(term);
  const resultsRef = useRef(null);

  const handleKeyDown = (event) => {
    const links = [...resultsRef.current.querySelectorAll('a')];
    const current = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      (links[current + 1] ?? links.at(-1))?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      (current <= 0 ? inputRef.current : links[current - 1]).focus();
    } else if (event.key === 'Enter' && current === -1) {
      // Handled here in full: the rest of the key press must not land on whatever has focus
      // once the panel has closed.
      event.preventDefault();
      links[0]?.click();
    }
  };

  return (
    // The padding leaves room for the box's focus ring inside the panel's scroll area.
    <div onKeyDown={handleKeyDown} className="pt-3">
      <Input
        ref={inputRef}
        type="search"
        aria-label="Search tours and gear"
        placeholder="Goa, Ladakh, dry bag…"
        autoComplete="off"
        maxLength={LIMITS.SEARCH_MAX}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div ref={resultsRef} className="mt-4 flex min-h-20 flex-col gap-4">
        {term.length < LIMITS.SEARCH_MIN ? (
          <p className="px-2 text-sm text-text-muted">
            Type at least {LIMITS.SEARCH_MIN} characters to search tours and gear.
          </p>
        ) : (
          <QueryBoundary
            query={results}
            isEmpty={hasNoResults}
            stateClassName="px-2"
            empty={
              <p role="status" className="text-sm text-text-muted">
                No tours or gear match “{term}”.
              </p>
            }
          >
            {({ tours, gear }) => (
              <>
                <SearchGroup label="Tours" icon={MapPinned} items={tours.map(toTourItem)} />
                <SearchGroup label="Gear" icon={Package} items={gear.map(toGearItem)} />
              </>
            )}
          </QueryBoundary>
        )}
      </div>
    </div>
  );
}
