import { ArrowRight } from 'lucide-react';
import { PromiseSteps } from '../components/about/PromiseSteps.jsx';
import { VerticalRoster } from '../components/about/VerticalRoster.jsx';
import { ContentSection } from '../components/layout/ContentSection.jsx';
import { Button } from '../components/ui/Button.jsx';
import { STORY_SECTIONS } from '../lib/aboutContent.js';
import { BRAND, ROUTES } from '../lib/constants.js';

export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-(--space-gutter) pt-12">
      <title>{`Our story · ${BRAND.NAME}`}</title>
      <header className="flex max-w-4xl flex-col gap-5">
        <h1 className="type-display text-h1">Our story</h1>
        <p className="type-lead">{BRAND.PHILOSOPHY}</p>
      </header>
      {STORY_SECTIONS.map(({ title, paragraphs }) => (
        <ContentSection key={title} title={title}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body-lg">
              {paragraph}
            </p>
          ))}
        </ContentSection>
      ))}
      <ContentSection title="Five verticals and one grand tour">
        <p className="text-body-lg">
          Each vertical is its own style of travel. Grand India Tour is the one journey that crosses
          all of them.
        </p>
        <VerticalRoster />
      </ContentSection>
      <ContentSection title="Our promise">
        <PromiseSteps />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button to={ROUTES.ADVENTURES} iconRight={ArrowRight}>
            Choose your adventure
          </Button>
          <Button to={ROUTES.GEAR} variant="secondary">
            Explore the gear store
          </Button>
        </div>
      </ContentSection>
    </div>
  );
}
