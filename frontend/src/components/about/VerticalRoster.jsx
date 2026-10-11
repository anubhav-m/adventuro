import { Link } from 'react-router';
import { VERTICAL_STORIES } from '../../lib/aboutContent.js';
import { VERTICALS } from '../../lib/constants.js';

// The five verticals and Grand India Tour, each in its own ink. On the light sheet the ink
// plate keeps a dark edge (DESIGN.md, the Light Field Rule).
export function VerticalRoster() {
  return (
    <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {VERTICALS.map(({ key, name, icon: Icon, route }) => (
        <li key={key} data-vertical={key} className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-plate border-(length:--border-ink) border-text bg-accent text-on-accent dark:border-accent"
          >
            <Icon size={22} strokeWidth={1.75} />
          </span>
          <p className="flex flex-col gap-1">
            <Link to={route} className="font-extrabold underline underline-offset-4">
              {name}
            </Link>
            <span className="text-text-muted">{VERTICAL_STORIES[key]}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
