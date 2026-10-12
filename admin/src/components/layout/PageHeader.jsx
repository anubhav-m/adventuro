import { BRAND } from '../../lib/constants.js';

// The top of every page: its title (also the document title), a line about it, and its
// actions on the right.
export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <title>{`${title} · ${BRAND.APP}`}</title>
      <div className="flex flex-col gap-1">
        <h1 className="type-display text-h3">{title}</h1>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
