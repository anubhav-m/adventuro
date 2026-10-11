import { Check, X } from 'lucide-react';
import { TourSection } from './TourSection.jsx';

// What the price covers and what it does not, side by side. A list with nothing in it is left out.
export function InclusionList({ inclusions, exclusions }) {
  const lists = [
    { title: 'Included', items: inclusions, icon: Check, iconClassName: 'text-success' },
    { title: 'Not included', items: exclusions, icon: X, iconClassName: 'text-text-muted' },
  ].filter(({ items }) => items.length > 0);

  if (lists.length === 0) return null;

  return (
    <TourSection title="What the price covers">
      <div className="grid gap-8 sm:grid-cols-2">
        {lists.map(({ title, items, icon: Icon, iconClassName }) => (
          <div key={title}>
            <h3 className="text-sm font-bold">{title}</h3>
            <ul aria-label={title} className="mt-3 flex flex-col gap-2.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={`mt-1 shrink-0 ${iconClassName}`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </TourSection>
  );
}
