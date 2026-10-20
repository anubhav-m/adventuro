import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';

const LINK = 'font-bold text-brand-text underline underline-offset-[0.2em] hover:decoration-2';

// A link in text or in a table cell: link-coloured and underlined, so it reads as one without
// colour alone. A router link with `to`, a plain anchor with `href` (mailto:, tel:).
export function TextLink({ to, href, className, children, ...rest }) {
  if (href !== undefined) {
    return (
      <a href={href} className={cn(LINK, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={cn(LINK, className)} {...rest}>
      {children}
    </Link>
  );
}
