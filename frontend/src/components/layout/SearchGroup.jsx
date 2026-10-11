import { useId } from 'react';
import { Link } from 'react-router';
import { Photo } from '../ui/Photo.jsx';
import { Price } from '../ui/Price.jsx';

// One kind of search result. Each item is { key, to, image, title, detail?, amount, mrp?, prefix? };
// `icon` stands in for a result without a photo.
export function SearchGroup({ label, icon: Icon, items }) {
  const headingId = useId();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="px-2 text-sm font-bold text-text-muted">
        {label}
      </h3>
      <ul className="mt-1">
        {items.map(({ key, to, image, title, detail, amount, mrp, prefix }) => (
          <li key={key}>
            <Link
              to={to}
              className="flex min-h-14 items-center gap-3 rounded-field p-2 hover:bg-surface focus-visible:bg-surface"
            >
              <Photo
                image={image}
                alt=""
                lazy={false}
                className="size-12 shrink-0"
                fallback={
                  <span className="flex size-full items-center justify-center text-text-muted">
                    <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                }
              />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 leading-snug font-bold">{title}</span>
                {detail && <span className="block truncate text-sm text-text-muted">{detail}</span>}
              </span>
              <Price amount={amount} mrp={mrp} prefix={prefix} className="shrink-0 text-sm" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
