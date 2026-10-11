import { getVerticalMeta } from '../../lib/constants.js';
import { FieldBand } from '../layout/FieldBand.jsx';
import { TerrainLine } from '../layout/TerrainLine.jsx';
import { Badge } from '../ui/Badge.jsx';

// The vertical as a whole field of its ink: its pattern across the top, and a terrain line as
// its bottom edge. Rendered inside the page's `data-vertical` wrapper.
export function VerticalHero({ vertical }) {
  const { icon } = getVerticalMeta(vertical.key);

  return (
    <header>
      <div aria-hidden="true" className="h-12 bg-accent bg-(image:--pattern-accent) sm:h-20" />
      <FieldBand
        image={vertical.heroImage}
        alt={vertical.name}
        lazy={false}
        plateClassName="lg:aspect-4/5"
      >
        <h1 className="type-display text-h1">{vertical.name}</h1>
        <Badge tone="outline" icon={icon}>
          Ecosystem Vertical
        </Badge>
        <p className="type-lead">{vertical.subtitle}</p>
        <p className="max-w-prose font-medium">{vertical.description}</p>
      </FieldBand>
      <TerrainLine className="-mt-px rotate-180" />
    </header>
  );
}
