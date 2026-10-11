import { FilePen } from 'lucide-react';
import { useLocation } from 'react-router';
import { ContentSection } from '../components/layout/ContentSection.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { BRAND, CONTACT_EMAIL } from '../lib/constants.js';
import { REVIEW_NOTICE, STATIC_PAGES } from '../lib/staticContent.js';

const TEXT_LINK = 'font-bold text-brand-text underline underline-offset-[0.2em]';

// The policy pages. Each is routed at its own path, which is also its key in STATIC_PAGES.
export function StaticPage() {
  const { pathname } = useLocation();
  const { title, lead, sections } = STATIC_PAGES[pathname];

  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-(--space-gutter) pt-12">
      <title>{`${title} · ${BRAND.NAME}`}</title>
      <header className="flex flex-col items-start gap-5">
        <h1 className="type-display text-h1">{title}</h1>
        <p className="type-lead text-text-muted">{lead}</p>
        <Badge tone="warning" icon={FilePen}>
          {REVIEW_NOTICE}
        </Badge>
      </header>
      {sections.map((section) => (
        <ContentSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.items && (
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </ContentSection>
      ))}
      <ContentSection title="Contact">
        <p>
          Questions about this page? Write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={TEXT_LINK}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </ContentSection>
    </div>
  );
}
