import { Link } from 'react-router';

const LINK =
  'inline-flex min-h-11 items-center text-text-muted underline-offset-4 hover:text-text hover:underline sm:min-h-8';

// One titled column of footer links. A link has `to` (in-app) or `href` (external or mailto).
export function FooterLinks({ title, links }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <ul className="text-sm font-medium">
        {links.map(({ label, to, href }) => (
          <li key={label}>
            {to ? (
              <Link to={to} className={LINK}>
                {label}
              </Link>
            ) : (
              <a
                href={href}
                className={LINK}
                {...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
