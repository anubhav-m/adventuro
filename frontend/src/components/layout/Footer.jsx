import { useMatch } from 'react-router';
import {
  BRAND,
  CONTACT_EMAIL,
  getVerticalMeta,
  ROUTES,
  SOCIAL_LINKS,
  VERTICALS,
} from '../../lib/constants.js';
import { FooterLinks } from './FooterLinks.jsx';
import { NewsletterForm } from './NewsletterForm.jsx';
import { TerrainLine } from './TerrainLine.jsx';
import { Wordmark } from './Wordmark.jsx';

const VERTICAL_LINKS = VERTICALS.map(({ name, route }) => ({ label: name, to: route }));

const EXPLORE_LINKS = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Gear Store', to: ROUTES.GEAR },
  { label: 'About Us', to: ROUTES.ABOUT },
  { label: 'My Bookings', to: ROUTES.MY_BOOKINGS },
];

const SUPPORT_LINKS = [
  { label: 'Privacy & Terms', to: ROUTES.PRIVACY_TERMS },
  { label: 'Cancellation & Refund', to: ROUTES.CANCELLATION_REFUND },
  { label: 'Affiliate Disclosure', to: ROUTES.AFFILIATE_DISCLOSURE },
];

const CONTACT_LINKS = [{ label: 'Email us', href: `mailto:${CONTACT_EMAIL}` }, ...SOCIAL_LINKS];

// On a vertical's page the terrain line above the footer is drawn in that vertical's ink;
// everywhere else it is route orange.
export function Footer() {
  const match = useMatch(ROUTES.vertical(':verticalKey'));
  const verticalKey = getVerticalMeta(match?.params.verticalKey)?.key;

  return (
    <footer className="mt-(--space-section)">
      <div data-vertical={verticalKey}>
        <TerrainLine />
      </div>
      <div className="bg-surface-sunken">
        <div className="mx-auto grid max-w-content gap-x-8 gap-y-12 px-(--space-gutter) py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col items-start gap-4">
            <Wordmark />
            <p className="type-lead">{BRAND.TAGLINE}</p>
            <p className="max-w-md text-text-muted">{BRAND.DESCRIPTION}</p>
            <div className="mt-4 w-full">
              <NewsletterForm />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            <FooterLinks title="Verticals" links={VERTICAL_LINKS} />
            <FooterLinks title="Explore" links={EXPLORE_LINKS} />
            <FooterLinks title="Support & safety" links={SUPPORT_LINKS} />
            <FooterLinks title="Contact" links={CONTACT_LINKS} />
          </div>
        </div>
        <div className="mx-auto max-w-content px-(--space-gutter)">
          <p className="border-t border-border py-6 text-xs font-medium text-text-muted">
            © {new Date().getFullYear()} {BRAND.NAME}. Gear links are affiliate links.
          </p>
        </div>
      </div>
    </footer>
  );
}
