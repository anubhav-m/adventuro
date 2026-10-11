import { ExternalLink } from 'lucide-react';
import { gearGoUrl } from '../../api/gear.api.js';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { Photo } from '../ui/Photo.jsx';
import { Price } from '../ui/Price.jsx';
import { getCategoryIcon } from './categoryIcons.js';

// An affiliate product. Buy goes through the backend, which logs the click and redirects to
// the seller, so the link opens in a new tab and is marked as sponsored.
export function GearCard({ gear }) {
  const { category } = gear;
  const CategoryIcon = getCategoryIcon(category?.slug);

  return (
    <Card as="article" flush className="flex h-full flex-col overflow-hidden">
      <Photo
        image={gear.images[0]}
        alt={gear.name}
        className="aspect-square rounded-none"
        fallback={
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center text-text-muted"
          >
            <CategoryIcon size={48} strokeWidth={1.75} />
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && <p className="text-xs font-medium text-text-muted">{category.name}</p>}
        <h3 className="leading-snug font-extrabold">{gear.name}</h3>
        {gear.shortDescription && (
          <p className="line-clamp-2 text-sm text-text-muted">{gear.shortDescription}</p>
        )}
        <Price amount={gear.salePrice} mrp={gear.mrp} className="mt-auto flex-wrap pt-2" />
        <Button
          href={gearGoUrl(gear.id)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          variant="secondary"
          size="sm"
          iconRight={ExternalLink}
          aria-label={`Buy ${gear.name} (opens in a new tab)`}
          className="mt-2"
        >
          Buy
        </Button>
      </div>
    </Card>
  );
}
