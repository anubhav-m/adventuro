import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '../../lib/constants.js';
import { Card } from '../ui/Card.jsx';
import { getCategoryIcon } from './categoryIcons.js';

// A gear category that opens the store filtered to it.
export function GearCategoryCard({ category }) {
  const Icon = getCategoryIcon(category.slug);

  return (
    <Card
      as={Link}
      to={ROUTES.gearCategory(category.slug)}
      interactive
      className="flex h-full min-h-32 flex-col justify-between gap-6"
    >
      <Icon size={28} strokeWidth={1.75} aria-hidden="true" className="text-accent-text" />
      <span className="flex items-end justify-between gap-2">
        <span className="text-h4 font-extrabold">{category.name}</span>
        <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
      </span>
    </Card>
  );
}
