import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';

// Shown on every surface that lists gear.
export function AffiliateDisclosure({ className }) {
  return (
    <p className={cn('max-w-prose text-sm text-text-muted', className)}>
      Gear is sold by other stores. Buy opens the seller’s site, and Adventuro may earn a commission
      on what you buy there, at no extra cost to you.{' '}
      <Link
        to={ROUTES.AFFILIATE_DISCLOSURE}
        className="font-bold text-brand-text underline underline-offset-[0.2em]"
      >
        Affiliate disclosure
      </Link>
    </p>
  );
}
